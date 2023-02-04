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
import { CollectionEvent } from "./CollectionEvent";

@Entity()
export class IncompleteEventError {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  @ManyToOne(() => Collection, (collection) => collection.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "collectionId", referencedColumnName: "id" })
  collectionId: number;

  @Column({ type: "int", nullable: true })
  @ManyToOne(() => CollectionEvent, (collectionEvent) => collectionEvent.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "collectionEventId", referencedColumnName: "id" })
  collectionEventId: number;

  @Column({ type: String })
  errorType: "nft" | "event";

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
