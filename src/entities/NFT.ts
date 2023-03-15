import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./Contract";

@Entity()
export class NFT {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  @ManyToOne(() => Contract, (contract) => contract.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contractId: number;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  mediaGateway: string;

  @Column({ nullable: true })
  mediaThumbnail: string;

  @Column({ nullable: true })
  mediaRaw: string;

  @Column({ nullable: true })
  rawMetadataImage: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
