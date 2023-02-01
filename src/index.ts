import "./env";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createConnection } from "typeorm";
import connectionOptions from "./ormconfig";
import createCollectionData from "./routes/createCollectionData";
import kakaoAuthorization from "./routes/kakaoAuthorization";
import deleteCollectionData from "./routes/deleteCollectionData";

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

app.post("/collection", createCollectionData);
app.delete("/collection", deleteCollectionData);
app.post("/kakao/auth", kakaoAuthorization);

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
