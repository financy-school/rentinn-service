import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';

import { customHttpError } from '../core/custom-error/error-service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './entities/document.entity';
import { v7 as uuidv7 } from 'uuid';
import { DOCUMENT_ID_PREFIX, ORG_DOC_EXPIRY } from '../config/config';
import {
  DATA_VALIDATION_ERROR,
  DOC_CREATE_FAILED,
  DOC_NOT_FOUND,
  INVALID_FILE_TYPE,
} from '../core/custom-error/error-constant';
import { validate } from 'class-validator';
import { UploadDocumentDto } from './dto/upload-document-dto';
import { DownloadDocumentDto } from './dto/download-document-dto';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { addQueryFilterToSqlQuery } from '../core/helpers/sqlHelper/sqlHelper';

@Injectable()
export class DocumentsService {
  private valid_file_types = [
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/svg+xml',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
    'text/csv',
    'text/xml',
    'application/vnd.ms-excel',
    'text/rtf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
  ];
  private readonly org_docs_bucket_name: string;
  private s3_client: AWS.S3;

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly document_repository: Repository<DocumentEntity>,
    private readonly config: ConfigService,
  ) {
    this.org_docs_bucket_name = this.config.get('DOCS_BUCKET_NAME');
    if (
      this.config.get(`AWS_DOCS_ACCESS_KEY`) &&
      this.config.get(`AWS_DOCS_SECRET_ACCESS_KEY`)
    ) {
      const aws_credentials: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
      } = {
        accessKeyId: this.config.get(`AWS_DOCS_ACCESS_KEY`),
        secretAccessKey: this.config.get(`AWS_DOCS_SECRET_ACCESS_KEY`),
      };

      AWS.config.credentials = new AWS.Credentials(aws_credentials);
    }

    AWS.config.region = this.config.get(`AWS_DOCS_REGION`);
    this.s3_client = new AWS.S3({ signatureVersion: 'v4' });
  }

  async create(
    property_id: string,
    document_dto: CreateDocumentDto,
    expire_in?: number,
  ) {
    const {
      file_type,
      descriptor,
      metadata,
      is_signature_required,
      is_signed,
      signed_at,
      doc_type,
      download_url,
    } = document_dto;

    let { file_name } = document_dto;

    file_name = file_name.replace(/ /g, '_');

    const file_type_lowercase = file_type.toLowerCase();
    if (!this.valid_file_types.includes(file_type_lowercase)) {
      throw customHttpError(
        INVALID_FILE_TYPE,
        'FILE_TYPE_VALIDATION_ERROR',
        `File type ${file_type} is not supported `,
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      // create new document
      const new_document = new DocumentEntity();
      const uuid = uuidv7().replace(/-/g, '');
      new_document.document_id = `${DOCUMENT_ID_PREFIX}${uuid}`;
      new_document.property_id = property_id;
      new_document.file_name = file_name;
      new_document.file_type = file_type;
      new_document.descriptor = descriptor;
      new_document.is_signature_required = is_signature_required;
      new_document.is_signed = is_signed;
      new_document.signed_at = signed_at;
      new_document.doc_type = doc_type;
      new_document.download_url = download_url;

      new_document.metadata = metadata;

      const new_filename = `${property_id}${'_'}${file_name}`;

      new_document.document_path = new_filename;

      new_document.upload_url = await this.fetchS3UploadPath({
        file_name: new_filename,
        file_type,
        expire_in,
      });

      new_document.upload_url_expire_at = new Date(
        Date.now() + (expire_in || ORG_DOC_EXPIRY) * 1000,
      );

      const errors = await validate(new_document);
      if (errors.length > 0) {
        throw customHttpError(
          DATA_VALIDATION_ERROR,
          'DOC_CREATE_ERROR',
          `Input data validation failed`,
          HttpStatus.BAD_REQUEST,
        );
      } else {
        await this.document_repository.save(new_document);

        return new_document;
      }
    } catch (e) {
      throw customHttpError(
        DOC_CREATE_FAILED,
        'DOC_CREATE_FAILED',
        `Failed to generate upload URL`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(property_id: string, query: any) {
    const limit = +query.limit || 10;
    const page = +query.page || 1;
    const offset = (page - 1) * limit;

    let sql_query = await this.document_repository
      .createQueryBuilder('document')
      .where('is_deleted=:is_deleted', {
        is_deleted: 0, // false
      })
      .andWhere(`property_id = :property_id`, { property_id });

    // todo: use http_encode / http_decode
    const res = await addQueryFilterToSqlQuery('document', query, sql_query);

    sql_query = res.sql_query;

    // execute the query to get result count
    const total = await sql_query.getCount();

    // append `offset` and `limit` filters to the query
    sql_query.orderBy('created_at', 'DESC').offset(offset).limit(limit);

    // execute the query to get result
    const result = await sql_query.getMany();

    return {
      result,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async update(
    property_id: string,
    document_id: string,
    update_document_dto: UpdateDocumentDto,
  ) {
    const existing_document = await this.document_repository.findOne({
      where: {
        property_id,
        document_id,
        is_deleted: false,
      },
    });
    if (!existing_document) {
      throw customHttpError(
        DOC_NOT_FOUND,
        'ORG_DOC_NOT_FOUND_ERROR',
        ` Document with Id[${document_id}] doesn't exist.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.document_repository.update(document_id, update_document_dto);
    const result = await this.document_repository.findOne({
      where: {
        document_id,
        is_deleted: false,
      },
    });

    return result;
  }

  async findAllByQuery(query: any) {
    const documents = await this.document_repository.find(query);
    return documents;
  }

  async delete(
    property_id: string,
    document_id: string,
    deleteDocumentFlag = false,
  ) {
    if (deleteDocumentFlag) {
      const document = await this.document_repository.findOne({
        where: {
          document_id: document_id,
          is_deleted: false,
        },
      });
      if (!document) {
        throw customHttpError(
          DOC_NOT_FOUND,
          'DOC_NOT_FOUND_ERROR',
          `Document with ID[${document_id}] not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      await this.s3_client.deleteObjects(
        {
          Bucket: this.org_docs_bucket_name,
          Delete: { Objects: [{ Key: document.document_path }] },
        },
        (err, data) => {
          if (err) {
            console.error('Error deleting S3 objects:', err);
          } else {
            console.log('Successfully deleted S3 objects:', data);
          }
        },
      );
    }

    const existing_document = await this.document_repository.findOne({
      where: {
        document_id: document_id,
        is_deleted: false,
      },
    });
    if (!existing_document) {
      throw customHttpError(
        DOC_NOT_FOUND,
        'DOC_NOT_FOUND_ERROR',
        `Document with Id[${document_id}] doesn't exist.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const to_update = {
      is_deleted: true,
      deleted_at: new Date(new Date().toUTCString()),
    };

    await this.document_repository.update(document_id, to_update);
    const result = await this.document_repository.findOne({
      where: {
        document_id: document_id,
        is_deleted: false,
      },
    });

    return result;
  }

  async findOne(property_id: string, document_id: string, expire_in?: number) {
    const organizationDocument = await this.document_repository.findOne({
      where: {
        property_id,
        document_id,
        is_deleted: false,
      },
    });

    if (!organizationDocument) {
      throw customHttpError(
        DOC_NOT_FOUND,
        'DOC_NOT_FOUND_ERROR',
        `Document with ID[${document_id}] not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!organizationDocument.download_url) {
      organizationDocument.download_url = await this.fetchS3DownloadPath({
        document_path: organizationDocument.document_path,
        expire_in: expire_in || 3600, // 10 seconds
      });
      organizationDocument.download_url_expire_at = new Date(
        Date.now() + expire_in * 1000,
      );
    }

    return organizationDocument;
  }

  async findOneById(
    correlation_id: string,
    document_id: string,
    expire_in: number,
  ) {
    const organizationDocument = await this.document_repository.findOne({
      where: {
        document_id,
        is_deleted: false,
      },
    });

    if (!organizationDocument) {
      throw customHttpError(
        DOC_NOT_FOUND,
        'DOC_NOT_FOUND_ERROR',
        `Document with ID[${document_id}] not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!organizationDocument.download_url) {
      organizationDocument.download_url = await this.fetchS3DownloadPath({
        document_path: organizationDocument.document_path,
        expire_in: expire_in || 10, // 10 seconds
      });
    }

    return organizationDocument;
  }

  async removeDocument(property_id: string, org_document_id: string) {
    await this.delete(property_id, org_document_id);
  }

  async fetchS3UploadPath(uploadDocumentDto: UploadDocumentDto) {
    const { file_name, file_type, expire_in } = uploadDocumentDto;

    const url = await this.s3_client.getSignedUrlPromise('putObject', {
      Bucket: this.org_docs_bucket_name,
      ContentType: file_type,
      Key: file_name,
      Expires: expire_in || ORG_DOC_EXPIRY, //time to expire in seconds
    });

    return url;
  }

  async fetchS3DownloadPath(downloadDocumentDto: DownloadDocumentDto) {
    const { document_path, expire_in } = downloadDocumentDto;
    let url;

    try {
      url = await this.s3_client.getSignedUrlPromise('getObject', {
        Bucket: this.org_docs_bucket_name,
        Key: document_path,
        Expires: expire_in, //time to expire in seconds
      });
    } catch (error) {
      throw new Error(String(error));
    }

    return url;
  }
}
