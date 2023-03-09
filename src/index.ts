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
import axios from "axios";
import { PROXY_LIST_2 } from "./commons/proxyList";
import { sleep } from "./commons/utils";
import { HttpsProxyAgent } from "https-proxy-agent";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
// export const HTTPS_PROXY = IS_PRODUCTION
//   ? process.env.HTTPS_PROXY
//   : `http://${PROXY_LIST[0].port}:${PROXY_LIST[0].protocol}`;

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

const proxyTest = async () => {
  const successProxyList: any = [];

  for (let i = 0; i < PROXY_LIST_2.length; i++) {
    const headerConfig: any = {
      httpsAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
      headers: {
        "X-API-KEY": process.env.OPENSEA_API_KEY as string,
      },
    };
    try {
      const result = await axios.get(
        `https://api.opensea.io/api/v1/collections?asset_owner=0x7ef61cacd0c785eacdfe17649d1c5bcba676a858&offset=0&limit=300`,
        headerConfig
      );

      delete result.data;
      console.log("result", result?.config?.httpsAgent);

      if (typeof result?.data === "string") {
        throw new Error("에러");
      }
      successProxyList.push(PROXY_LIST_2?.[i]?.host, PROXY_LIST_2?.[i]?.pory);
      console.log("성공~!", PROXY_LIST_2?.[i]?.host, PROXY_LIST_2?.[i]?.pory);
      await sleep(1.5);
    } catch (e: any) {
      console.log("e", e.message);
      await sleep(1.5);
      console.log("에라이~!");
    }
  }
  console.log("successProxyList", successProxyList);
};

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, async () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);
      // proxyTest();
      if (IS_PRODUCTION) {
        await deleteNotCompleteCollection();
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
