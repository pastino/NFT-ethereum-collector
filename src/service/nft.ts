import { getRepository } from "typeorm";
import { sleep } from "../commons/utils";
import { IncompleteEventError } from "../entities/ IncompleteEventError";
import { Collection } from "../entities/Collection";
import { NFT as NFTEntity } from "../entities/NFT";
import { User } from "../entities/User";
import { Message } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";

export class NFT {
  private collectionData: Collection;
  private openSeaAPI: OpenSea;
  private incompleteEventError: IncompleteEventError | undefined;

  constructor({
    collectionData,
    openSeaAPI,
    incompleteEventError,
  }: {
    collectionData: Collection;
    openSeaAPI: OpenSea;
    incompleteEventError?: IncompleteEventError;
  }) {
    this.collectionData = collectionData;
    this.openSeaAPI = openSeaAPI;
    this.incompleteEventError = incompleteEventError;
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
      const { hasiIcompleteError, incompleteError } =
        await this.getIsExistingNFTError(this.collectionData.id);

      let cursor = "";
      let page = 1;

      console.log("collectionData", this.collectionData);

      while (true) {
        if (cursor === null) {
          if (hasiIcompleteError && incompleteError) {
            await getRepository(IncompleteEventError).findOne({
              where: {
                collectionId: incompleteError.collectionId,
                errorType: "nft",
              },
            });
          }
          return { isSuccess: true };
        }

        const {
          data: { next, assets },
        } = await this.openSeaAPI.getNFTList(this.collectionData, cursor);

        cursor = next;

        // assets(NFT) 데이터들을 저장한다
        for (let i = 0; i < assets.length; i++) {
          console.log(
            `<NFT 생성> ${page}번째 페이지의 ${i + 1}번째 NFT 입니다`
          );

          const asset = assets[i];

          if (hasiIcompleteError) {
            const existingNFTdata = await getRepository(NFTEntity).findOne({
              where: {
                tokenId: asset.token_id,
                collectionId: this.collectionData.id,
              },
            });
            if (existingNFTdata) continue;
          }

          // 첫 번째 데이터에서 컬랙션 Creator 정보를 생성한다.
          if (page === 1 && i === 0) {
            const { user, profile_img_url, address, config } = asset?.creator;

            const existingUser = await getRepository(User).findOne({
              where: {
                address,
              },
            });

            if (!existingUser) {
              await getRepository(User).save({
                username: user?.username || "",
                profileImgUrl: profile_img_url || "",
                address,
                config,
              });
            }
          }

          // NFT 데이터 객체 생성
          const createEntityData = new CreateEntityData({
            snakeObject: asset,
            entity: NFT,
            filterList: ["id"],
          });

          // NFT 데이터 Insert
          await getRepository(NFTEntity).save({
            ...createEntityData.createTableRowData(),
            collectionId: this.collectionData.id,
          });
        }

        page += 1;
      }
    } catch (e: any) {
      const message = new Message();
      // message.deleteColectedData(this.collectionData.address);
      // throw new Error(e.message);
      await sleep(60 * 10);
      this.createNFT();
    }
  };
}
