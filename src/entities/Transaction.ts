import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Transfer } from "./Transfer";

@Entity({ name: "transaction" })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  hash: string;

  @OneToOne(() => Transfer, (transfer) => transfer.transaction, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transactionId", referencedColumnName: "id" })
  transfer: Transfer;

  @Column({ nullable: true })
  timestamp: number;

  @Column({ nullable: true })
  eventTime: Date;

  @Column({ nullable: true })
  blockHash: string;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ nullable: true })
  transactionIndex: number;

  @Column({ nullable: true })
  confirmations: number;

  @Column({ nullable: true })
  to: string;

  @Column({ nullable: true })
  from: string;

  @Column({ nullable: true })
  gasPrice: string;

  @Column({ nullable: true })
  gasLimit: string;

  @Column({ nullable: true })
  value: string;

  @Column({ nullable: true })
  nonce: number;

  @Column({ nullable: true, length: 8000 })
  data: string;

  @Column({ nullable: true })
  chainId: number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
