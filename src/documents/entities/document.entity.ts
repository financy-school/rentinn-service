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

  @Column({ type: 'varchar', length: 255, default: null })
  file_name: string;

  @Column({ type: 'varchar', length: 50, default: null })
  file_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  descriptor: string;

  @Column({ type: 'boolean', nullable: true, default: null })
  is_signature_required: boolean;

  @Column({ type: 'boolean', nullable: true, default: null })
  is_signed: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  signed_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  doc_type: string;

  @Column({ type: 'varchar', length: 512, nullable: true, default: null })
  download_url: string;

  @Column({ type: 'varchar', length: 512, nullable: true, default: null })
  document_path: string;

  @Column({ type: 'varchar', length: 512, nullable: true, default: null })
  upload_url: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  upload_url_expire_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  download_url_expire_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  updated_at: Date;

  @Column({ type: 'json', nullable: true, default: null })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date;
}
