import { KakaoAccessToken } from "../entities/KakaoAccessToken";
import axios from "axios";
import { getRepository } from "typeorm";
import { FeedTypeKakaoTemplate, TextTypeKakaoTemplate } from "./types";
import { Collection } from "../entities/Collection";
import moment from "moment";
import { isAxiosError } from "../commons/utils";
import { HttpsProxyAgent } from "https-proxy-agent";

export class Message {
  constructor() {}

  private sendMessage = (text: string) => {
    const sendMessge = new SendMessage();
    sendMessge.sendKakaoMessage({
      object_type: "text",
      text,
      link: {
        mobile_web_url: "",
        web_url: "",
      },
    });
  };

  public alreadyCollected = (contractAddress: string) => {
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\n이미 수집된 컬랙션이 존재합니다.\n해당 컬랙션은 수집 생략하였습니다.\n\n주소 - ${contractAddress}`
    );
  };

  public deleteColectedData = async (contractAddress: string) => {
    await getRepository(Collection).delete({ address: contractAddress });
  };
}

export class SendMessage {
  constructor() {}

  private getKakaoToken = async (): Promise<KakaoAccessToken | null> => {
    const kakao = await getRepository(KakaoAccessToken).findOne({
      order: { id: "DESC" },
    });
    if (!kakao) return null;

    return kakao;
  };

  private isTokenExpired = (tokenData: KakaoAccessToken) => {
    const createdTimeStamp = new Date(tokenData?.createAt).getTime();
    const currentTimeStamp = new Date().getTime();

    const passedTimeSecond = (currentTimeStamp - createdTimeStamp) / 1000;
    const expiredTimeSecond = tokenData?.expiresIn;
    const safetyMarginSecond = 60 * 10;

    const isExpired = passedTimeSecond > expiredTimeSecond - safetyMarginSecond;

    if (isExpired) return true;
    return false;
  };

  private createNewToken = async (tokenData: KakaoAccessToken) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://kauth.kakao.com/oauth/token`,
        params: {
          grant_type: "refresh_token",
          client_id: process.env.KAKAO_CLIENT_ID,
          refresh_token: tokenData.refreshToken,
        },
        // httpsAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
        // httpAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
        // proxy: false,
        // timeout: 8000,
      });

      const data = response?.data;

      await getRepository(KakaoAccessToken).save({
        accessToken: data?.access_token,
        expiresIn: data?.expires_in,
        refreshToken: data?.refresh_token || tokenData?.refreshToken,
        refreshTokenExpiresIn:
          data?.refresh_token_expires_in || tokenData?.refreshTokenExpiresIn,
        scope: tokenData?.scope,
        tokenType: data?.token_type,
      });
    } catch (e) {
      console.log(e);
    }
  };

  public sendKakaoMessage = async (
    kakaoTemplateObject: TextTypeKakaoTemplate
    //  | FeedTypeKakaoTemplate
  ) => {
    let tokenData = await this.getKakaoToken();

    // TODO 카카오 메세지 전송이 불가피한 경우 이메일 전송하도록 처리
    if (!tokenData) return;
    const isExpired = this.isTokenExpired(tokenData);
    if (isExpired) {
      await this.createNewToken(tokenData);
      tokenData = await this.getKakaoToken();
      // TODO 이메일 전송
      if (!tokenData) return;
    }
    try {
      const { accessToken } = tokenData;
      const response = await axios({
        method: "post",
        url: `https://kapi.kakao.com/v2/api/talk/memo/default/send`,
        params: {
          template_object: {
            ...kakaoTemplateObject,
            text: `${kakaoTemplateObject?.text}  PORT - ${process.env.PORT}}`,
          },
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        // httpsAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
        // httpAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
        // proxy: false,
        // timeout: 8000,
      });

      const resultCode = response?.data?.result_code;

      if (resultCode === 0) {
        console.log("카카오 메세지 전송");
      }
    } catch (e: any) {
      console.log("e", e?.message);
      if (isAxiosError(e)) {
        if (e?.response?.data?.code === -401) {
          console.log("토큰 만료 유효성 검사 수정");
        }
      }
    }
  };
}
