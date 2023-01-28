import { KakaoAccessToken } from "../entities/KakaoAccessToken";
import axios from "axios";
import { getRepository } from "typeorm";
import { FeedTypeKakaoTemplate, TextTypeKakaoTemplate } from "./types";
import { Collection } from "../entities/Collection";
import moment from "moment";

export class Message {
  constructor() {}

  private sendMessage = (text: string) =>
    sendKakaoMessage({
      object_type: "text",
      text,
      link: {
        mobile_web_url: "",
        web_url: "",
      },
    });

  alreadyCollected = (contractAddress: string) => {
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\n이미 수집된 컬랙션이 존재합니다.\n해당 컬랙션은 수집 생략하였습니다.\n\n주소 - ${contractAddress}`
    );
  };

  collection = (contractAddress: string) => {
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\nError - 오픈시 API 전송에 실파하였습니다.\nn컬랙션 데이터 get 전송에 실파하였습니다.\n\n해당 컬랙션 데이터 수집은 생략하였습니다.\n\n주소 - ${contractAddress}`
    );
  };
  nft = (contractAddress: string) => {
    this.deleteColectedData(contractAddress);
    this.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n<컬랙션 수집>\n\nError - 오픈시 API 전송에 실파하였습니다.\n\nNFT 데이터 get 전송에 실파하였습니다.\n\n해당 컬랙션에 대한 데이터는 모두 삭제 및 수집 생락하였습니다.\n\n주소 - ${contractAddress}`
    );
  };
  event = (contractAddress: string) => {
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
}

export const sendKakaoMessage = async (
  kakaoTemplateObject: TextTypeKakaoTemplate | FeedTypeKakaoTemplate
) => {
  const kakao = await getRepository(KakaoAccessToken).find();
  if (kakao.length === 0) return;
  const { accessToken, refreshToken } = kakao?.[0];

  try {
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

    // access token 만료 시 재발급 후 다시 전송하기
    if (resultCode === 0) {
      console.log("성공");
    }
  } catch (e: any) {
    // TODO axios interceptor 적용 필요

    // e?.response?.data
    // { msg: 'this access token is already expired', code: -401 }
    // 여기서 재전송??
    // axios 인터셉터를 한번 사용해봐야 겠음.
    console.log(e?.response?.data);
  }
};
