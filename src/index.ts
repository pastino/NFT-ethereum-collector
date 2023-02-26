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

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

const app = express();
const PORT = IS_PRODUCTION ? process.env.PORT : 4000;
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

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, async () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);

      if (IS_PRODUCTION) {
        await deleteNotCompleteCollection();
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });