import "./env";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createConnection, getRepository } from "typeorm";
import connectionOptions from "./ormconfig";
import kakaoAuthorization from "./routes/kakaoAuthorization";
import deleteCollectionData from "./routes/deleteCollectionData";
import createWalletAndCollection from "./routes/createWalletAndCollection";
import { Collection } from "./entities/Collection";

import { Alchemy, Network } from "alchemy-sdk";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import axios from "axios";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

const app = express();
const PORT = IS_PRODUCTION ? process.env.PORT : 4002;
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true,
  })
);

app.post("/wallet", createWalletAndCollection);
app.delete("/collection", deleteCollectionData);
app.post("/kakao/auth", kakaoAuthorization);

const deleteNotCompleteCollection = async () => {
  try {
    await getRepository(Collection)
      .createQueryBuilder("collection")
      .delete()
      .where(
        "collection.isCompletedInitialUpdate = :isCompletedInitialUpdate OR collection.isCompletedUpdate = :isCompletedUpdate",
        { isCompletedInitialUpdate: false, isCompletedUpdate: false }
      )
      .execute();
  } catch (e) {
    console.log(e);
  }
};
const collectionAbi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const proxyTest = async () => {
  const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(config);

  //0x6c5407d1c272436a66ecbc6a8110f790d5821606
  // const data = await alchemy.nft.getContractsForOwner(
  //   "0x7ef61cacd0c785eacdfe17649d1c5bcba676a858"
  // );
  const data = await alchemy.nft.getContractMetadata(
    "0xabe9d0e4ad08e605d57a0c10f9d13e0e7283ea50"
  );
  console.log("data", data);

  // const apiKey = "izPO5-h0NhIZdoCTq3sHPQWCNnGKEUbq";
  // const walletAddress = "0x7ef61cacd0c785eacdfe17649d1c5bcba676a858";

  // const options = {
  //   url: `https://api.algorithmia.com/v1/web3/${walletAddress}/collections`,
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${apiKey}`,
  //   },
  // };

  // const response = await axios.get(
  //   `https://api.algorithmia.com/v1/web3/${walletAddress}/collections`,
  //   {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${apiKey}`,
  //   } as any
  // );

  // console.log("response", response);
};

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, async () => {
      proxyTest();
      console.log(`Listening on port: "http://localhost:${PORT}"`);
      if (IS_PRODUCTION) {
        await deleteNotCompleteCollection();
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
