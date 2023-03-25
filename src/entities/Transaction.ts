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

  @OneToOne(() => Transfer, (transfer) => transfer.transaction)
  @JoinColumn({ name: "transactionId", referencedColumnName: "id" })
  transfer: Transfer;

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

  @Column({ nullable: true })
  data: string;

  @Column({ nullable: true })
  chainId: number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}

// {
//     hash: '0x65579455ac3227e7b3db72b4e359e988bb16cae6d26c88818d1a6991b478b274',
//     type: 0,
//     accessList: null,
//     blockHash: '0xc2d61bdefce88a4db47c4f9687a903f4dd552f23266359c49f46dd965c0c2e53',
//     blockNumber: 3919721,
//     transactionIndex: 39,
//     confirmations: 12973702,
//     from: '0xC352B534e8b987e036A93539Fd6897F53488e56a',
//     gasPrice: BigNumber { _hex: '0x0ba43b7400', _isBigNumber: true },
//     gasLimit: BigNumber { _hex: '0x02f1ba', _isBigNumber: true },
//     to: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
//     value: BigNumber { _hex: '0x2386f26fc10000', _isBigNumber: true },
//     nonce: 253,
//     data: '0x8264fe980000000000000000000000000000000000000000000000000000000000000c3e',
//     r: '0xefa4d38bb59e3aed21bbc2086056da4836e058f7371730471c42c7d1b7cc7a37',
//     s: '0x2b1194517f0c0cfbaf884841f0de07a28d768b6608cf12b8bda3b8c0c078ce3a',
//     v: 37,
//     creates: null,
//     chainId: 1,
//     wait: [Function (anonymous)]
//   }
