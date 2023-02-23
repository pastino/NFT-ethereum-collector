import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Collection } from "./Collection";
import { Wallet } from "./Wallet";

@Entity()
export class WalletHasCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  @ManyToOne(() => Wallet, (wallet) => wallet.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "walletId", referencedColumnName: "id" })
  walletId: number;

  @Column({ type: "int" })
  @ManyToOne(() => Collection, (collection) => collection.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "collectionId", referencedColumnName: "id" })
  collectionId: number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
