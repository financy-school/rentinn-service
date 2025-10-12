import * as AWS from 'aws-sdk';

import { Injectable } from '@nestjs/common';

@Injectable()
export class PresignedUrlService {
  private S3: AWS.S3;
  private bucketName: string;
  constructor() {
    (async () => {
      this.S3 = new AWS.S3();
      this.bucketName = 'bucketName';
      const credentials = {
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      };
      this.S3.config.update({
        credentials,
        region: 'region',
      });
    })();
  }

  async uploadUrl(
    id: string = '',
    fileName: string,
    fileType: string,
    overWrite: boolean = false,
  ) {
    let key: string = fileName;

    if (!overWrite) {
      key = key.replace(/(\.[\w\d_-]+)$/i, `${Date.now()}$1`);
    }
    if (id.length) {
      key = `${id}/${key}`;
    }
    console.log(key);

    const presignedUPLOADURL = await this.S3.getSignedUrlPromise('putObject', {
      Bucket: this.bucketName,
      ContentType: fileType,
      Key: key,
      Expires: 100000, //time to expire in seconds
    });
    console.log(presignedUPLOADURL);
    return presignedUPLOADURL;
  }

  async downloadUrl(id: string = '', fileKey: string) {
    const presignedDownloadURL = await this.S3.getSignedUrlPromise(
      'getObject',
      {
        Bucket: this.bucketName,
        Key: fileKey,
        Expires: 1000,
      },
    );
    return presignedDownloadURL;
  }
}
