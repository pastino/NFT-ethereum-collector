import { getRepository } from "typeorm";
import { Collection } from "../entities/Collection";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";

export const createCollection = async (
  contractAddress: string,
  openSeaAPI: OpenSea
): Promise<{
  isSuccess: boolean;
  collectionData: Collection;
}> => {
  try {
    // 이미 수집된 컬랙션이 존재하면 카톡으로 알리고, 해당 컬랙션 수집 생략
    const { isHas, existingCollectionData } = await alreadyCollected(
      contractAddress
    );
    if (!isHas && existingCollectionData)
      return { isSuccess: false, collectionData: existingCollectionData };

    const {
      data: { collection, address },
    } = await openSeaAPI.getCollection(contractAddress);

    // 컬랙션 데이터 객체 생성
    const createEntityData = new CreateEntityData({
      snakeObject: {
        ...collection,
        address: address,
      },
      entity: Collection,
      filterList: ["id"],
    });

    // 컬랙션 데이터 Insert
    const collectionData = await getRepository(Collection).save(
      createEntityData.createTableRowData()
    );

    return { isSuccess: true, collectionData };
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const alreadyCollected = async (
  contractAddress: string
): Promise<{ isHas: boolean; existingCollectionData: Collection | null }> => {
  const existingCollectionData = (await getRepository(Collection).findOne({
    where: {
      address: contractAddress,
    },
  })) as Collection;
  if (existingCollectionData) {
    return { isHas: true, existingCollectionData };
  }
  return { isHas: false, existingCollectionData: null };

  // if (existingCollectionData) {
  //   // Data 수집 중 에러로 인하여 종료된 컬랙션인지 확인

  //   const incompleteError = await getRepository(IncompleteEventError).findOne({
  //     where: {
  //       collectionId: existingCollectionData.id,
  //     },
  //     order: {
  //       createAt: "DESC",
  //     },
  //   });

  //   if (incompleteError) {
  //     if (incompleteError.errorType === "nft") {
  //       // createNft에 중복체크만 추가
  //     }

  //     if (incompleteError.errorType === "event") {
  //       const event = new Event({
  //         collectionData: existingCollectionData,
  //         openSeaAPI,
  //         incompleteEventError: incompleteError,
  //       });
  //       await event.createEventList();

  //       await getRepository(IncompleteEventError).delete({
  //         collectionId: existingCollectionData.id,
  //       });
  //     }
  //   } else {
  //     const message = new Message();
  //     message.alreadyCollected(contractAddress);
  //   }

  //   return true;
  // }
};
