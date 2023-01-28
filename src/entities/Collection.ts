import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { CollectionEvent } from "./CollectionEvent";
import { NFT } from "./NFT";

@Entity()
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  address: string;
  // '0xccdf1373040d9ca4b5be1392d1945c1dae4a862c'

  @Column({ nullable: true })
  bannerImageUrl: string;
  // "https://i.seadn.io/gcs/files/1ba6b37ad2c5d4a7272e79cadeaa02d0.png?w=500&auto=format"

  @Column({ nullable: true })
  chatUrl: string;

  @Column({ nullable: true })
  createdDate: Date;
  // "2023-01-20T10:55:17.775009+00:00",

  @Column({ nullable: true, length: 10000 })
  description: string;
  // "**The 911.**\n**An icon turned virtual.**\nA timeless icon. A car that broke boundaries and defied convention. A car born out of a relentless pursuit of a dream.  Now, the 911 is embarking on a new journey, steered by your passions.\nOwning one of now 2,383 Porsche 911 NFTs gives you access to a new world of Porsche where the rewards are real and special to you.",

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  externalUrl: string;
  // "https://nft.porsche.com/"

  @Column({ nullable: true })
  featuredImageUrl: string;
  //  "https://i.seadn.io/gcs/files/22c28a84b9a256bd2abf1584e2c8af7b.png?w=500&auto=format"

  @Column({ nullable: true })
  safelistRequestStatus: string;

  @Column({ nullable: true })
  imageUrl: string;
  // "https://i.seadn.io/gcs/files/52104c37d3649416ff628ec0a0518493.png?w=500&auto=format",

  @Column({ nullable: true })
  largeImageUrl: string;
  // "https://i.seadn.io/gcs/files/22c28a84b9a256bd2abf1584e2c8af7b.png?w=500&auto=format"

  @Column({ nullable: true })
  mediumUsername: string;

  @Column({ nullable: true })
  name: string;
  // "PORSCHΞ 911"

  @Column({ nullable: true })
  openseaBuyerFeeBasisPoints: string;
  // "250"

  @Column({ nullable: true })
  openseaSellerFeeBasisPoints: string;
  // "250"

  @Column({ nullable: true })
  shortDescription: string;

  @Column({ nullable: true })
  slug: string;
  // "porsche-911"

  @Column({ nullable: true })
  telegramUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;
  // "eth_porsche"

  @Column({ nullable: true })
  instagramUsername: string;

  @Column({ nullable: true })
  wikiUrl: string;

  @OneToMany(() => NFT, (nft) => nft.collectionId, {
    onDelete: "CASCADE",
  })
  nft: NFT[];

  @OneToMany(() => CollectionEvent, (nft) => nft.collectionId, {
    onDelete: "CASCADE",
  })
  collectionEvent: CollectionEvent[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
