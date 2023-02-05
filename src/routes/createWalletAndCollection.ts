import { Request, Response } from "express";
import { SendMessage } from "../modules/kakaoMessage";
import { OpenSea } from "../modules/requestAPI";
import { createCollectionAndNFTAndEvent } from "./createCollectionData";

const sendMessage = new SendMessage();

const createWalletAndCollection = async (req: Request, res: Response) => {
  try {
    const {
      body: { walletList },
    }: { body: { walletList: string[] } } = req;

    const openSea = new OpenSea();

    for (let i = 0; i < walletList.length; i++) {
      const walletAddress = walletList[i];

      let offset = 0;
      while (true) {
        // 컬렉션 리스트 가져오기
        const { data } = await openSea.getCollectionList({
          assetOwner: walletAddress,
          offset,
        });

        const collectionList = data.map((item: any) => item.slug);

        if (collectionList.length === 0) return;

        console.log("collectionList", collectionList);

        await createCollectionAndNFTAndEvent(collectionList);

        offset += 300;
      }
    }

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

export default createWalletAndCollection;
