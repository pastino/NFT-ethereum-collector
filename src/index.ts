import "./env";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createConnection, getRepository } from "typeorm";
import connectionOptions from "./ormconfig";
import CreateCollectionData from "./routes/CreateCollectionData";
import { CollectionEvent } from "./entities/CollectionEvent";
import KakaoAuthorization from "./routes/KakaoAuthorization";
import DeleteCollectionData from "./routes/DeleteCollectionData";

const app = express();
const PORT = 5002;

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

app.post("/collection", CreateCollectionData);
app.delete("/collection", DeleteCollectionData);
app.post("/kakao/auth", KakaoAuthorization);

// const sampleTest = async () => {
//   const count = await getRepository(CollectionEvent).count();
//   console.log("count", count);
// };

// 133060

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);
      // sampleTest();
    });
  })
  .catch((error) => {
    console.log(error);
  });
