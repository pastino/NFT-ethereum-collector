import "./env";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createConnection, getRepository } from "typeorm";
import connectionOptions from "./ormconfig";
import collector from "./routes/collector";
import { Contract } from "./entities/Contract";
import kakaoAuthorization from "./routes/kakaoAuthorization";
import axios from "axios";
import { Configuration, OpenAIApi } from "openai";
import { Alchemy, Network } from "alchemy-sdk";
import { Transfer } from "./entities/Transfer";
import Web3 from "web3";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PORT = IS_PRODUCTION ? process.env.PORT : 4002;

const app = express();
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

app.post("/nft/collect", collector);
app.post("/kakao/auth", kakaoAuthorization);

const deleteNotCompleteContract = async () => {
  try {
    await getRepository(Contract)
      .createQueryBuilder("contract")
      .delete()
      .where(
        "contract.isCompletedInitialUpdate = :isCompletedInitialUpdate OR contract.isCompletedUpdate = :isCompletedUpdate",
        { isCompletedInitialUpdate: false, isCompletedUpdate: false }
      )
      .execute();
  } catch (e) {
    console.log(e);
  }
};

const apiKey = process.env.OPENAI_API_KEY;
const apiUrl = "https://api.openai.com/v1/chat/completions";

const generateNames = async (): Promise<string[]> => {
  const params = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "ConiunPass 콜랙션의 베네핏을 구체적으로 알려주세요",
      },
    ],
    temperature: 0.7,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    const response = await axios.post(apiUrl, params, { headers });

    console.log("response", response?.data?.choices);

    return ["1231"];
  } catch (error: any) {
    console.error("error", error);
    return [];
  }
};

const test = async () => {
  // await getRepository(Transfer).delete({});
  // console.log("완료");
  const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  // const alchemy = new Alchemy(config);
  // const data = await alchemy.core.getBlock(
  //   "0xf8fc162909c508c2ba357267da41c87f3fea22d132a7d792fd1762dbbf4ca376"
  // );
  // console.log("data", data);

  const alchemy = new Alchemy(config);

  // Subscription for new blocks on Eth Mainnet.
  alchemy.ws.on("block", async (blockNumber) => {
    console.log("The latest block number is", blockNumber);

    const data = await alchemy.core.getBlock(blockNumber);

    // const transaction = await alchemy.transact.getTransaction(
    //   data?.transactions?.[0]
    // );

    const transactions = data?.transactions;

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      const transactionReceipt = await alchemy.core.getTransactionReceipt(
        transaction
      );

      if (transactionReceipt?.logs) {
        for (let i = 0; i < transactionReceipt?.logs?.length; i++) {
          const log = transactionReceipt?.logs[i];

          const web3 = new Web3();

          const nftTransferEventAbi: any = {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
              },
              {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
              },
              {
                indexed: true,
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
              },
            ],
            name: "Transfer",
            type: "event",
          };

          const nftTransferEventSignature =
            web3.eth.abi.encodeEventSignature(nftTransferEventAbi);

          try {
            if (log.topics[0] === nftTransferEventSignature) {
              const decodedLog = web3.eth.abi.decodeLog(
                nftTransferEventAbi.inputs,
                log.data,
                log.topics.slice(1)
              );

              console.log(decodedLog);
            } else {
              console.log("This log is not an NFT Transfer event.");
            }
          } catch (e) {
            console.log("pass");
          }
        }
      }
    }
  });
};

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, async () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);
      test();
      if (IS_PRODUCTION) {
        await deleteNotCompleteContract();
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
