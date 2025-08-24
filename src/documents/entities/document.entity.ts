import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum DOC_TYPE {
  'rental_agreement' = 'rental_agreement',
  'base_contract' = 'base_contract',
  'base_contract_without_pricing' = 'base_contract_without_pricing',
  'merged_contract' = 'merged_contract',
  'agreement' = 'agreement',
  'base_agreement' = 'base_agreement',
  'reliance_agreement' = 'reliance_agreement',
  'referral_agreement' = 'referral_agreement',
  'additional_document' = 'additional_document',
  'customer_document' = 'customer_document',
}

@Entity('documents')
export class DocumentEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  document_id: string;

  @Column({ type: 'varchar', length: 64 })
  property_id: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 50 })
  file_type: string;

  @Column({ type: 'varchar', length: 255 })
  descriptor: string;

  @Column({ type: 'boolean' })
  is_signature_required: boolean;

  @Column({ type: 'boolean', nullable: true })
  is_signed?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  signed_at?: Date;

  @Column({ type: 'varchar', length: 50 })
  doc_type: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  download_url?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  document_path?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  upload_url?: string;

  @Column({ type: 'timestamp', nullable: true })
  upload_url_expire_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  download_url_expire_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at?: Date;
}
