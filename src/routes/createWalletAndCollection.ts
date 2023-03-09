import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { SendMessage } from "../modules/kakaoMessage";
import { OpenSea } from "../modules/requestAPI";
import { createCollectionAndNFTAndEvent } from "./createCollectionData";
import { Wallet } from "../entities/Wallet";
import { sleep } from "../commons/utils";

const sendMessage = new SendMessage();
const openSea = new OpenSea();

const createWalletData = async (walletAddress: string) => {
  try {
    const existingWallet = await getRepository(Wallet).findOne({
      where: {
        address: walletAddress,
      },
    });

    if (existingWallet) return existingWallet;

    const res: any = await openSea.getUser(walletAddress);

    const username = res?.data?.username || "Unnamed";
    const profileImage = res?.data?.account?.profile_img_url || "";

    return getRepository(Wallet).save({
      address: walletAddress,
      username,
      profileImgUrl: profileImage,
    });
  } catch (e: any) {
    console.log(e);
  }
};

const createWalletAndCollection = async (req: Request, res: Response) => {
  try {
    const {
      body: { walletList },
    }: { body: { walletList: string[] } } = req;

    for (let i = 0; i < walletList.length; i++) {
      const walletAddress = walletList[i];

      let offset = 0;
      const walletData = await createWalletData(walletAddress);

      if (!walletData) return;

      while (true) {
        // 컬렉션 리스트 가져오기

        const res = await openSea.getCollectionList({
          assetOwner: walletAddress,
          offset,
        });

        if (!res?.data) return;

        const collectionList = res?.data.map((item: any) => item.slug);

        if (collectionList.length === 0) return;

        await createCollectionAndNFTAndEvent({ collectionList, walletData });

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
