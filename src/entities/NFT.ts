import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Collection } from "./Collection";
import { CollectionEvent } from "./CollectionEvent";

@Entity()
export class NFT {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  @ManyToOne(() => Collection, (collection) => collection.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "collectionId", referencedColumnName: "id" })
  collectionId: number;

  @Column({ nullable: true })
  tokenId: string;
  // '2361'

  @Column({ nullable: true })
  numSales: number;
  // 4

  @Column({ nullable: true })
  backgroundColor: string;

  @Column({ nullable: true })
  imageUrl: string;
  // "https://i.seadn.io/gcs/files/18fbc0955c653778af479d84edfe94c0.png?w=500&auto=format"

  @Column({ nullable: true })
  imagePreviewUrl: string;
  // "https://i.seadn.io/gcs/files/18fbc0955c653778af479d84edfe94c0.png?w=500&auto=format"

  @Column({ nullable: true })
  imageThumbnailUrl: string;
  // "https://i.seadn.io/gcs/files/18fbc0955c653778af479d84edfe94c0.png?w=500&auto=format"

  @Column({ nullable: true })
  imageOriginalUrl: string;
  // "ipfs://QmWc74BGzge9ARuUTt4jRTdVbtKQqACDpdHNcWXHwRpVbB"

  @Column({ nullable: true })
  animationUrl: string;

  @Column({ nullable: true })
  animationOriginalUrl: string;

  @Column({ nullable: true })
  name: string;
  // "PORSCHΞ 911 4726"

  @Column({ nullable: true, length: 10000 })
  description: string;
  // "Embark on a journey that merges the physical and digital world of Porsche. Holding your virtual PORSCHΞ 911 with the unique license plate 4726 is your key to co-create the future of Porsche on Web3 and get connected to a global community of pioneers. What do you get? Exclusive benefits money can’t buy."

  @Column({ nullable: true })
  externalLink: string;
  // "https://nft.porsche.com"

  @Column({ nullable: true })
  permalink: string;
  // "https://opensea.io/assets/ethereum/0xccdf1373040d9ca4b5be1392d1945c1dae4a862c/2361"

  @OneToMany(
    () => CollectionEvent,
    (collectionEvent) => collectionEvent.nftId,
    {
      onDelete: "CASCADE",
    }
  )
  collectionEvent: CollectionEvent[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
