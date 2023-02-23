import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class WalletHasCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletId: Number;

  @Column()
  collectionId: Number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
