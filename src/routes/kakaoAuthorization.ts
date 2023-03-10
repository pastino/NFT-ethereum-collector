import { Request, Response } from "express";
import { getRepository } from "typeorm";
import axios from "axios";
import { CreateEntityData } from "../modules/manufactureData";
import { KakaoAccessToken } from "../entities/KakaoAccessToken";
import { isAxiosError } from "../commons/utils";
import { SendMessage } from "../modules/kakaoMessage";
import { HttpsProxyAgent } from "https-proxy-agent";

const kakaoAuthorization = async (req: Request, res: Response) => {
  try {
    const {
      body: { code, redirectUri },
    }: any = req;

    const response = await axios({
      method: "post",
      url: `https://kauth.kakao.com/oauth/token`,
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: redirectUri,
        code,
      },
      headers: {
        "Content-Type": "application/json",
      },
      // httpsAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
      // httpAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
      // proxy: false,
      // timeout: 8000,
    });

    const createEntityData = new CreateEntityData({
      snakeObject: response?.data,
      entity: KakaoAccessToken,
      filterList: ["id"],
    });

    const repository = await getRepository(KakaoAccessToken);
    await repository.delete({});
    await repository.save(createEntityData.createTableRowData());
    return res.status(200).send({ success: true });
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      // TODO 카카오 Error 정리해서 넣기
      if (e.response?.data?.error_code === "KOE320") {
        const tokenList = await getRepository(KakaoAccessToken).find({});
        const tokenData = tokenList?.[0];

        if (tokenData) {
          const sendMessge = new SendMessage();
          sendMessge.sendKakaoMessage({
            object_type: "text",
            text: e.response?.data?.error_description,
            link: {
              mobile_web_url: "",
              web_url: "",
            },
          });
        }

        return res.status(200).json({ success: false });
      }
    }
  }
};

export default kakaoAuthorization;
