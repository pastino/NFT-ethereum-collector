import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Collection } from "../entities/Collection";
import { OpenSea } from "../modules/requestAPI";
import moment from "moment";
import { addHours } from "../commons/utils";
import { Event } from "../service/event";
import { SendMessage } from "../modules/kakaoMessage";
import { createCollection } from "../service/collection";
import { NFT } from "../service/nft";

// TODO 절대경로 생성
// TODO 오픈시 리턴 값 중 key값 변화가 있는지 확인
const sendMessage = new SendMessage();

export const createCollectionAndNFTAndEvent = async (
  collectionList: string[]
) => {
  try {
    for (let i = 0; i < collectionList.length; i++) {
      const contractAddress: string = collectionList[i];
      const openSeaAPI = new OpenSea();

      // Collection 데이터 생성
      const { isSuccess: isCollectionSuccess, collectionData } =
        await createCollection(contractAddress, openSeaAPI);
      if (!isCollectionSuccess || !collectionData) {
        // TODO 해당 컬랙션 생략한다는 메세지 보내기
        continue;
      }

      // NFT 데이터 생성
      const createNFT = new NFT({ collectionData, openSeaAPI });
      await createNFT.createNFT();

      const isAddress = contractAddress.substring(0, 1) === "0x";

      let collection;

      if (isAddress) {
        collection = await getRepository(Collection).findOne({
          where: {
            address: contractAddress,
          },
        });
      } else {
        collection = await getRepository(Collection).findOne({
          where: {
            slug: contractAddress,
          },
        });
      }

      if (!collection) continue;

      // Event 데이터 생성
      const event = new Event({
        collectionData: collection,
        openSeaAPI,
      });
      await event.createEventList();

      await sendMessage.sendKakaoMessage({
        object_type: "text",
        text: `${moment(addHours(new Date(), 9)).format(
          "MM/DD HH:mm"
        )}\n\n<컬랙션 생성 완료 - ${i + 1}/${collectionList.length}>\n\n${
          collectionData.name
        } 컬랙션 데이터 생성이 완료되었습니다`,
        link: { mobile_web_url: "", web_url: "" },
      });
    }
  } catch (e: any) {
    throw new Error(e.message);
  }
};

const createCollectionData = async (req: Request, res: Response) => {
  try {
    // TODO 생성 중간 단계에 계속 카톡을 준다.
    // TODO 생성이 완료되면 카톡을 준다.
    const {
      body: { collectionList },
    }: { body: { collectionList: string[] } } = req;

    await createCollectionAndNFTAndEvent(collectionList);

    return res.status(200).json({ success: true });
  } catch (e: any) {
    sendMessage.sendKakaoMessage({
      object_type: "text",
      text: e.message,
      link: {
        mobile_web_url: "",
        web_url: "",
      },
    });
    res.status(400).send({ success: false, message: e.message });
  }
};

export default createCollectionData;

