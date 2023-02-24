import "./env";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createConnection, getRepository } from "typeorm";
import connectionOptions from "./ormconfig";
// import createCollectionData from "./routes/createCollectionData";
import kakaoAuthorization from "./routes/kakaoAuthorization";
import deleteCollectionData from "./routes/deleteCollectionData";
import createWalletAndCollection from "./routes/createWalletAndCollection";
import { sleep } from "./commons/utils";
import { CollectionEvent } from "./entities/CollectionEvent";
import { Collection } from "./entities/Collection";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT;

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
// app.post("/collection", createCollectionData);
app.delete("/collection", deleteCollectionData);
app.post("/kakao/auth", kakaoAuthorization);

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, async () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);

      const collectionList = await getRepository(Collection).find();

      for (let i = 0; i < collectionList.length; i++) {
        const collection = collectionList[i];
        const uuid = uuidv4();

        await getRepository(Collection).update(
          { id: collection.id },
          {
            sessionUUID: uuid,
            isCompletedInitialUpdate: true,
            isCompletedUpdate: true,
          }
        );

        const eventList = await getRepository(CollectionEvent).find({
          where: {
            collectionId: collection.id,
          },
        });

        for (let j = 0; j < eventList.length; j++) {
          console.log(
            `${i} / ${collectionList.length}, ${j} / ${eventList.length}`
          );
          const event = eventList[j];
          await getRepository(CollectionEvent).update(
            {
              id: event.id,
            },
            {
              sessionUUID: uuid,
            }
          );
        }
        console.log("완료");
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
