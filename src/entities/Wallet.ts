import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { WalletHasCollection } from "./WalletHasCollection";

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  profileImgUrl: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(
    () => WalletHasCollection,
    (walletHasCollection) => walletHasCollection.walletId,
    {
      onDelete: "CASCADE",
    }
  )
  walletHasCollection: WalletHasCollection[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
