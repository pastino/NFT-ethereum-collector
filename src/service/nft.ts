import { getRepository } from "typeorm";
import { sleep } from "../commons/utils";
import { IncompleteEventError } from "../entities/ IncompleteEventError";
import { Collection } from "../entities/Collection";
import { NFT as NFTEntity } from "../entities/NFT";
import { SendMessage } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";
const sendMessage = new SendMessage();
export class NFT {
  private collectionData: Collection;
  private openSeaAPI: OpenSea;
  private cursor: string = "";
  private page: number = 1;

  constructor({
    collectionData,
    openSeaAPI,
  }: {
    collectionData: Collection;
    openSeaAPI: OpenSea;
  }) {
    this.collectionData = collectionData;
    this.openSeaAPI = openSeaAPI;
  }

  getIsExistingNFTError = async (
    collectionId: number
  ): Promise<{
    hasiIcompleteError: boolean;
    incompleteError: IncompleteEventError | null;
  }> => {
    try {
      const incompleteError = await getRepository(IncompleteEventError).findOne(
        {
          where: {
            collectionId,
          },
          order: {
            createAt: "DESC",
          },
        }
      );

      if (incompleteError?.errorType === "nft") {
        return { hasiIcompleteError: true, incompleteError };
      }

      return { hasiIcompleteError: false, incompleteError: null };
    } catch (e) {
      return { hasiIcompleteError: false, incompleteError: null };
    }
  };

  createNFT = async () => {
    try {
      while (true) {
        if (this.cursor === null) {
          return { isSuccess: true };
        }

        const {
          data: { next, assets },
        } = await this.openSeaAPI.getNFTList(this.collectionData, this.cursor);

        this.cursor = next;

        // assets(NFT) 데이터들을 저장한다
        for (let i = 0; i < assets.length; i++) {
          console.log(
            `<NFT 생성> ${this.page}번째 페이지의 ${i + 1}번째 NFT 입니다`
          );

          const asset = assets[i];

          // NFT 데이터 객체 생성
          const createEntityData = new CreateEntityData({
            snakeObject: asset,
            entity: NFTEntity,
            filterList: ["id"],
          });

          // NFT 데이터 Insert
          await getRepository(NFTEntity).save({
            ...createEntityData.createTableRowData(),
            collectionId: this.collectionData.id,
          });
        }

        this.page += 1;
      }
    } catch (e: any) {
      if (
        e.message !==
          "Error: Client network socket disconnected before secure TLS connection was established" &&
        e.message !== "Error: socket hang up" &&
        e.message !== "Error: timeout of 8000ms exceeded" &&
        e.message !== "Error: aborted" &&
        e.message !== "Error: Request failed with status code 403"
      ) {
        await sendMessage.sendKakaoMessage({
          object_type: "text",
          text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 오픈시 서버에러(500번대)로 10분간 정지 후 종료된 NFT 시점부터 다시 수집을 시작합니다.`,
          link: { mobile_web_url: "", web_url: "" },
        });

        await sleep(60 * 10);

        await sendMessage.sendKakaoMessage({
          object_type: "text",
          text: `NFT 재수집 시작`,
          link: { mobile_web_url: "", web_url: "" },
        });
      }

      await this.createNFT();
    }
  };
}
