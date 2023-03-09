import { getRepository } from "typeorm";
import { RETURN_CODE_ENUM, RETURN_CODE_ENUM_TYPE } from "../commons/return";
import { sleep } from "../commons/utils";
import { Collection as CollectionEntity } from "../entities/Collection";
import { Wallet } from "../entities/Wallet";
import { WalletHasCollection } from "../entities/WalletHasCollection";
import { SendMessage } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";

const sendMessage = new SendMessage();
export class Collection {
  private targetData: string;
  private openSeaAPI: OpenSea;

  constructor({
    targetData,
    openSeaAPI,
  }: {
    targetData: string;
    openSeaAPI: OpenSea;
  }) {
    this.targetData = targetData;
    this.openSeaAPI = openSeaAPI;
  }

  createCollection = async (walletData: Wallet, uuid: string) => {
    try {
      // 이미 수집된 컬랙션이 존재하면 해당 컬랙션 수집 생략
      const hasCollection = await this.alreadyCollected(walletData);
      if (hasCollection)
        return {
          isSuccess: false,
          code: RETURN_CODE_ENUM["이미 생성된 컬랙션"],
          message: "이미 생성된 컬랙션입니다.",
          collectionData: null,
        };
      const { data }: any = await this.openSeaAPI.getCollection(
        this.targetData
      );
      const collection = data?.collection;
      const address = data?.address;

      // 컬랙션 데이터 객체 생성

      const createEntityData = new CreateEntityData({
        snakeObject: {
          ...collection,
          address,
        },
        entity: CollectionEntity,
        filterList: ["id"],
      });
      // 컬랙션 데이터 Insert
      const collectionData = await getRepository(CollectionEntity).save({
        ...createEntityData.createTableRowData(),
        sessionUUID: uuid,
        isCompletedInitialUpdate: false,
        isCompletedUpdate: false,
      });

      await getRepository(WalletHasCollection).save({
        walletId: walletData.id,
        collectionId: collectionData.id,
      });

      return {
        isSuccess: true,
        collectionData,
        code: "0",
        message: "",
      };
    } catch (e: any) {
      console.log(e);
    }
  };

  alreadyCollected = async (walletData: Wallet): Promise<boolean> => {
    const isAddress = this.targetData.substring(0, 1) === "0x";

    const where = isAddress
      ? {
          address: this.targetData,
        }
      : {
          slug: this.targetData,
        };
    const existingCollectionData = (await getRepository(
      CollectionEntity
    ).findOne({
      where,
    })) as CollectionEntity;

    if (existingCollectionData) {
      // 이미 수집된 컬랙션이면 Wallet 연결만 하고 return
      const existingWalletHasCollection = await getRepository(
        WalletHasCollection
      ).findOne({
        where: {
          walletId: walletData.id,
          collectionId: existingCollectionData.id,
        },
      });

      if (!existingWalletHasCollection) {
        await getRepository(WalletHasCollection).save({
          walletId: walletData.id,
          collectionId: existingCollectionData.id,
        });
      }
      return true;
    }

    return false;
  };
}
