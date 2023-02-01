import axios from "axios";
import { getRepository } from "typeorm";
import { makeAxiosErrorJson, makeAxiosErrorText } from "../commons/error";
import { ERROR_STATUS_CODE } from "../commons/error";
import { isAxiosError } from "../commons/utils";
import { IncompleteEventError } from "../entities/ IncompleteEventError";
import { Collection } from "../entities/Collection";
import { CollectionEvent } from "../entities/CollectionEvent";

// TODO return 데이터 OpenSea 리턴데이터 확인 후 Type 지정
export class OpenSea {
  private contractAddress = "";
  collectionData = {};

  private headerConfig = {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY as string,
    },
  };

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  public getCollection = async () => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/asset_contract/${this.contractAddress}`,
        this.headerConfig
      );

      this.collectionData = response?.data?.collection;

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

  public getNFTList = async (collectionData: any, cursor: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/assets?collection_slug=${collectionData.slug}&cursor=${cursor}`,
        this.headerConfig
      );
      return response as {
        status: number;
        data: { assets: any[]; next: string };
      };
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        throw new Error(makeAxiosErrorText(e));
      }
    }
    throw new Error(
      "getNFTList 함수를 실행하는 중 런타임 에러가 발생하였습니다."
    );
  };

  public getNFT = async (collectionData: any, tokenId: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/asset/${collectionData.address}/${tokenId}`,
        this.headerConfig
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
        }&occurred_before=${new Date(
          occurredBefore
        ).getTime()}&cursor=${cursor}`,
        this.headerConfig
      );

      return response as {
        status: number;
        data: { asset_events: any[]; next: string };
      };
    } catch (e: any) {
      await this.makeEventErrorRecord(collectionData.id);

      if (isAxiosError(e)) {
        throw new Error(JSON.stringify(makeAxiosErrorJson(e)));
      }
      throw new Error(
        "getEventList 함수를 실행하는 중 런타임 에러가 발생하였습니다."
      );
    }
  };
}
