import { OpenSea } from "../modules/requestAPI";
import moment from "moment";
import { addHours } from "../commons/utils";
import { Event } from "../service/event";
import { SendMessage } from "../modules/kakaoMessage";
import { Collection } from "../service/collection";
import { NFT } from "../service/nft";
import { RETURN_CODE_ENUM } from "../commons/return";
import { Wallet } from "../entities/Wallet";

// TODO 절대경로 생성
// TODO 오픈시 리턴 값 중 key값 변화가 있는지 확인
const sendMessage = new SendMessage();

export const createCollectionAndNFTAndEvent = async ({
  collectionList,
  walletData,
}: {
  collectionList: string[];
  walletData: Wallet;
}) => {
  try {
    for (let i = 0; i < collectionList.length; i++) {
      const targetData: string = collectionList[i];
      const openSeaAPI = new OpenSea();
      const collectionClass = new Collection({ targetData, openSeaAPI });
      const { collectionData, code } = await collectionClass.createCollection(
        walletData
      );
      console.log(2);
      // 이미 생성된 컬랙션이라면 다음 컬랙션 생성으로 넘어감
      if (!collectionData || code === RETURN_CODE_ENUM["이미 생성된 컬랙션"])
        continue;
      // NFT 데이터 생성
      const createNFT = new NFT({ collectionData, openSeaAPI });
      await createNFT.createNFT();
      // Event 데이터 생성
      const event = new Event({
        collectionData: collectionData,
        openSeaAPI,
      });
      await event.createEventList();

      // 컬랙션 데이터 생성 완료 메세지 보내기
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

// const createCollectionData = async (req: Request, res: Response) => {
//   try {
//     const {
//       body: { collectionList },
//     }: { body: { collectionList: string[] } } = req;

//     await createCollectionAndNFTAndEvent(collectionList);
//     return res.status(200).json({ success: true });
//   } catch (e: any) {
//     sendMessage.sendKakaoMessage({
//       object_type: "text",
//       text: e.message,
//       link: {
//         mobile_web_url: "",
//         web_url: "",
//       },
//     });
//     res.status(400).send({ success: false, message: e.message });
//   }
// };

// export default createCollectionData;

