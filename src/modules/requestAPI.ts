import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getRepository } from "typeorm";
import { makeAxiosErrorText } from "../commons/error";
import { ERROR_STATUS_CODE } from "../commons/error";
import { isAxiosError, sleep } from "../commons/utils";
import { IncompleteEventError } from "../entities/ IncompleteEventError";
import { Collection } from "../entities/Collection";
import { CollectionEvent } from "../entities/CollectionEvent";
import { SendMessage } from "./kakaoMessage";

// TODO return 데이터 OpenSea 리턴데이터 확인 후 Type 지정

export const headerConfig: any = {
  httpsAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
  httpAgent: new HttpsProxyAgent(process.env.PROXY_URL as string),
  proxy: false,
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY as string,
    // "user-agent":
    //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
  },
};

export class OpenSea {
  constructor() {}

  public getUser = async (walletAddress: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/user/${walletAddress}`,
        headerConfig
      );

      return response;
    } catch (e: any) {
      throw new Error(e);
    }
  };

  public getCollection = async (contractAddress: string) => {
    try {
      const isAddress = contractAddress.substring(0, 1) === "0x";

      let response;

      if (isAddress) {
        response = await axios.get(
          `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`,
          headerConfig
        );
      } else {
        response = await axios.get(
          `https://api.opensea.io/api/v1/collection/${contractAddress}`,
          headerConfig
        );
        await sleep(1);
        const nftList = await this.getNFTList(response.data?.collection, "");
        response.data.address =
          nftList.data.assets?.[0]?.asset_contract?.address;
      }

      return response as {
        status: number;
        data: { collection: {}; address: string };
      };
    } catch (e: any) {
      throw new Error(e);
    }
  };

  public getCollectionBySlug = async (collectionSlug: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/collection/${collectionSlug}`,
        headerConfig
      );

      return response as {
        status: number;
        data: { collection: {}; address: string };
      };
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        throw new Error(
          `<Error>\n\n*status*\n${e.response?.status}\n\n*data*\n${
            e.response?.data
          }\n\n*statusText*\n${
            ERROR_STATUS_CODE[e.response?.status as number].statusText
          }\n\n*statusDescription*\n${
            ERROR_STATUS_CODE[e.response?.status as number].description
          }`
        );
      }
    }
    throw new Error(
      "getCollection 함수를 실행하는 중 런타임 에러가 발생하였습니다."
    );
  };

  public getCollectionList = async ({
    assetOwner,
    offset,
  }: {
    assetOwner: string;
    offset: number;
  }) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/collections?asset_owner=${assetOwner}&offset=${offset}&limit=300`,
        headerConfig
      );
      return response as {
        status: number;
        data: {}[];
      };
    } catch (e: any) {
      const sendMessage = new SendMessage();
      await sendMessage.sendKakaoMessage({
        object_type: "text",
        text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 오픈시 서버에러(500번대)로 10분간 정지 후 콜랙션 리스트 가져오기를 다시 실행합니다.`,
        link: { mobile_web_url: "", web_url: "" },
      });

      if (
        e.message !==
          "Client network socket disconnected before secure TLS connection was established" &&
        e.message !== "socket hang up"
      ) {
        await sleep(60 * 10);
      }

      await this.getCollectionList({ assetOwner, offset });
    }
  };

  public getNFTList = async (collectionData: any, cursor: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/assets?collection_slug=${collectionData.slug}&cursor=${cursor}`,
        headerConfig
      );
      return response as {
        status: number;
        data: { assets: any[]; next: string };
      };
    } catch (e: any) {
      throw new Error(e);
    }
  };

  public getNFT = async (collectionData: any, tokenId: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/asset/${collectionData.address}/${tokenId}`,
        headerConfig
      );

      return response as {
        status: number;
        data: any;
      };
    } catch (e) {
      if (isAxiosError(e)) {
        throw new Error(makeAxiosErrorText(e));
      }
    }
    throw new Error("getNFT 함수를 실행하는 중 런타임 에러가 발생하였습니다.");
  };

  private makeEventErrorRecord = async (collectionId: number) => {
    const lastEventData = await getRepository(CollectionEvent).findOne({
      where: {
        collectionId: collectionId,
      },
      order: {
        createAt: "DESC",
      },
    });

    if (lastEventData) {
      await getRepository(IncompleteEventError).save({
        collectionId: collectionId,
        collectionEventId: lastEventData.id,
      });
    }
  };

  public getEventList = async ({
    collectionData,
    cursor,
    occurredBefore,
  }: {
    collectionData: Collection;
    cursor: string;
    occurredBefore: Date;
  }) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/events?collection_slug=${
          collectionData.slug
        }&event_type=successful&occurred_before=${new Date(
          occurredBefore
        ).getTime()}&cursor=${cursor}`,
        headerConfig
      );

      return response as {
        status: number;
        data: { asset_events: any[]; next: string };
      };
    } catch (e: any) {
      throw new Error(e);
      // await this.makeEventErrorRecord(collectionData.id);
      // if (isAxiosError(e)) {
      //   if (e.code === "ECONNRESET") {
      //     /*
      //     현재 서버를 집에 서버 컴퓨터를 두고 인터넷 연결하여 사용중
      //     따라서 인터넷 연결이 불안정하여 끊길 경우가 있음. 해당 경우 에러처리
      //     */
      //     throw new Error(
      //       JSON.stringify(
      //         makeAxiosErrorJson({
      //           response: {
      //             status: 599,
      //             data: "서버 네트워크 에러가 발생하였습니다.",
      //             statusText: "ECONNRESET",
      //           },
      //         } as never)
      //       )
      //     );
      //   }

      //   throw new Error(JSON.stringify(makeAxiosErrorJson(e)));
      // }
      // throw new Error(
      //   "getEventList 함수를 실행하는 중 런타임 에러가 발생하였습니다."
      // );
    }
  };
}
