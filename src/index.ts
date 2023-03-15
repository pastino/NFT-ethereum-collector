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

createConnection(connectionOptions)
  .then(() => {
    console.log("DB CONNECTION!");
    app.listen(PORT, async () => {
      console.log(`Listening on port: "http://localhost:${PORT}"`);
      // chatGPTTest();
      // const test = await generateNames();
      // console.log("test", test);
      if (IS_PRODUCTION) {
        await deleteNotCompleteContract();
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
