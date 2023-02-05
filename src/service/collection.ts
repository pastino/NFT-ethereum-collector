import { getRepository } from "typeorm";
import { sleep } from "../commons/utils";
import { Collection as CollectionEntity } from "../entities/Collection";
import { SendMessage } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";

const sendMessage = new SendMessage();
export class Collection {
  private contractAddress: string;
  private openSeaAPI: OpenSea;

  constructor({
    contractAddress,
    openSeaAPI,
  }: {
    contractAddress: string;
    openSeaAPI: OpenSea;
  }) {
    this.contractAddress = contractAddress;
    this.openSeaAPI = openSeaAPI;
  }

  createCollection = async () => {
    try {
      // 이미 수집된 컬랙션이 존재하면 카톡으로 알리고, 해당 컬랙션 수집 생략
      const { isHas, existingCollectionData } = await this.alreadyCollected();
      if (isHas && existingCollectionData)
        return { isSuccess: false, collectionData: existingCollectionData };

      const {
        data: { collection, address },
      } = await this.openSeaAPI.getCollection(this.contractAddress);

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
      const collectionData = await getRepository(CollectionEntity).save(
        createEntityData.createTableRowData()
      );

      return { isSuccess: true, collectionData };
    } catch (e: any) {
      await sendMessage.sendKakaoMessage({
        object_type: "text",
        text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 오픈시 서버에러(500번대)로 10분간 정지 후 컬랙션을 다시 저장합니다.`,
        link: { mobile_web_url: "", web_url: "" },
      });
      await sleep(60 * 10);
      await this.createCollection();
    }
  };

  alreadyCollected = async (): Promise<{
    isHas: boolean;
    existingCollectionData: CollectionEntity | null;
  }> => {
    const isAddress = this.contractAddress.substring(0, 1) === "0x";

    let existingCollectionData;
    if (isAddress) {
      existingCollectionData = (await getRepository(CollectionEntity).findOne({
        where: {
          address: this.contractAddress,
        },
      })) as CollectionEntity;
    } else {
      existingCollectionData = (await getRepository(CollectionEntity).findOne({
        where: {
          slug: this.contractAddress,
        },
      })) as CollectionEntity;
    }

    if (existingCollectionData) {
      return { isHas: true, existingCollectionData };
    }

    return { isHas: false, existingCollectionData: null };
  };
}
