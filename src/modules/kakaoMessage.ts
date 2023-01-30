import { KakaoAccessToken } from "../entities/KakaoAccessToken";
import axios from "axios";
import { getRepository } from "typeorm";
import { FeedTypeKakaoTemplate, TextTypeKakaoTemplate } from "./types";
import { Collection } from "../entities/Collection";
import moment from "moment";
import { isAxiosError } from "../commons/utils";

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

  public collection = (contractAddress: string) => {
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\nError - 오픈시 API 전송에 실파하였습니다.\nn컬랙션 데이터 get 전송에 실파하였습니다.\n\n해당 컬랙션 데이터 수집은 생략하였습니다.\n\n주소 - ${contractAddress}`
    );
  };
  public nft = (contractAddress: string) => {
    this.deleteColectedData(contractAddress);
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\nError - 오픈시 API 전송에 실파하였습니다.\n\nNFT 데이터 get 전송에 실파하였습니다.\n\n해당 컬랙션에 대한 데이터는 모두 삭제 및 수집 생락하였습니다.\n\n주소 - ${contractAddress}`
    );
  };
  public event = (contractAddress: string) => {
    this.deleteColectedData(contractAddress);
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\nError - 오픈시 API 전송에 실파하였습니다.\nn이벤트 데이터 get 전송에 실파하였습니다.\n\n해당 컬랙션에 대한 데이터는 모두 삭제 및 수집 생락하였습니다.\n\n주소 - ${contractAddress}`
    );
  };
  private deleteColectedData = async (contractAddress: string) => {
    await getRepository(Collection).delete({ address: contractAddress });
  };

  public createNftError = (contractAddress: string, errorMessage: string) => {
    this.deleteColectedData(contractAddress);
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\nError - ${errorMessage}\n\n해당 컬랙션에 대한 데이터는 모두 삭제 및 수집 생락하였습니다.\n\n주소 - ${contractAddress}`
    );
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

    const isExpired = passedTimeSecond > expiredTimeSecond;

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
    kakaoTemplateObject: TextTypeKakaoTemplate | FeedTypeKakaoTemplate
  ) => {
    const tokenData = await this.getKakaoToken();
    if (!tokenData) return;
    const isExpired = this.isTokenExpired(tokenData);

    if (isExpired) {
      this.createNewToken(tokenData);
    }

    try {
      const { accessToken } = (await this.getKakaoToken()) as KakaoAccessToken;

      const response = await axios({
        method: "post",
        url: `https://kapi.kakao.com/v2/api/talk/memo/default/send`,
        params: {
          template_object: kakaoTemplateObject,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const resultCode = response?.data?.result_code;

      if (resultCode === 0) {
        console.log("성공");
      }
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        if (e?.response?.data?.code === -401) {
          console.log("토큰 만료 유효성 검사 수정");
        }
      }
    }
  };
}
