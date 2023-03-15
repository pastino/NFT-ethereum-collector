import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { NFT } from "./NFT";

@Entity()
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  totalSupply: string;

  @Column({ nullable: true })
  isSpam: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true, length: 5000 })
  description: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true })
  contractDeployer: string;

  @Column({ nullable: true })
  deployedBlockNumber: number;

  @OneToMany(() => NFT, (nft) => nft.contractId, {
    onDelete: "CASCADE",
  })
  nft: NFT[];

  @Column({ default: false })
  isCompletedInitialUpdate: boolean;

  @Column({ default: true })
  isCompletedUpdate: boolean;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
