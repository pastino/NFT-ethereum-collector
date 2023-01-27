import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { NFT } from "./NFT";

@Entity()
export class CollectionEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  @ManyToOne(() => NFT, (nft) => nft.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "nftId", referencedColumnName: "id" })
  nftId: number;

  @Column({ nullable: true })
  eventType: string;
  // 'created'

  @Column({ nullable: true })
  eventTimestamp: Date;
  // "2023-01-26T03:22:51.458654"

  @Column({ nullable: true })
  auctionType: string;

  @Column({ nullable: true })
  totalPrice: string;

  @Column({ nullable: true })
  createdDate: string;
  // "2023-01-26T03:22:51.472367"

  @Column({ nullable: true })
  quantity: string;

  @Column({ nullable: true })
  bidAmount: string;

  @Column({ nullable: true })
  collectionSlug: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  customEventName: string;

  @Column({ nullable: true })
  devFeePaymentEvent: string;

  @Column({ nullable: true })
  devSellerFeeBasisPoints: number;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  endingPrice: string;

  @Column({ nullable: true })
  startingPrice: string;

  @Column({ nullable: true })
  listingTime: Date;

  @Column({ type: "int", nullable: true })
  @JoinColumn({ name: "approvedAccount", referencedColumnName: "id" })
  approvedAccount: number;

  @Column({ type: "int", nullable: true })
  @JoinColumn({ name: "ownerAccount", referencedColumnName: "id" })
  ownerAccount: number;

  @Column({ type: "int", nullable: true })
  @JoinColumn({ name: "fromAccount", referencedColumnName: "id" })
  fromAccount: number;

  @Column({ type: "int", nullable: true })
  @JoinColumn({ name: "seller", referencedColumnName: "id" })
  seller: number;

  @Column({ type: "int", nullable: true })
  @JoinColumn({ name: "toAccount", referencedColumnName: "id" })
  toAccount: number;

  @Column({ type: "int", nullable: true })
  @JoinColumn({ name: "winnerAccount", referencedColumnName: "id" })
  winnerAccount: number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}

// asset: {
//   token_id: "1242",
// },

// from_account: {
//   user: {
//     username: "LOUPIG",
//   },
//   profile_img_url:
//     "https://storage.googleapis.com/opensea-static/opensea-profile/1.png",
//   address: "0xcafeb47ae83865142dbb895bca3b18269ea91e1e",
//   config: "",
// },
// seller: {
//   user: {
//     username: "LOUPIG",
//   },
//   profile_img_url:
//     "https://storage.googleapis.com/opensea-static/opensea-profile/1.png",
//   address: "0xcafeb47ae83865142dbb895bca3b18269ea91e1e",
//   config: "",
// },
// to_account: null,
// winner_account: null,
