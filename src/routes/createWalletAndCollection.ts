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
    await sendMessage.sendKakaoMessage({
      object_type: "text",
      text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 오픈시 서버에러(500번대)로 10분간 정지 후 지갑 데이터를 다시 저장합니다.`,
      link: { mobile_web_url: "", web_url: "" },
    });
    if (
      e.message !==
        "Client network socket disconnected before secure TLS connection was established" ||
      e.message !== "socket hang up"
    ) {
      await sleep(60 * 10);
    }
    await createWalletData(walletAddress);
  }
};

const createWalletAndCollection = async (req: Request, res: Response) => {
  console.log(process.env.PROXY_URL);
  try {
    const {
      body: { walletList },
    }: { body: { walletList: string[] } } = req;

    for (let i = 0; i < walletList.length; i++) {
      const walletAddress = walletList[i];

      let offset = 0;
      const walletData = await createWalletData(walletAddress);

      if (!walletData) return;

      console.log("walletData", walletData);
      while (true) {
        // 컬렉션 리스트 가져오기

        console.log("컬렉션 리스트 가져오기");
        const res = await openSea.getCollectionList({
          assetOwner: walletAddress,
          offset,
        });

        console.log(res);

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
