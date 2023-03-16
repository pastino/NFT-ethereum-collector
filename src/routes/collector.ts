import { Request, Response } from "express";
import {
  Alchemy,
  ContractForOwner,
  GetContractsForOwnerResponse,
  Network,
} from "alchemy-sdk";
import { getRepository } from "typeorm";
import { Contract } from "../entities/Contract";
import { Wallet } from "../entities/Wallet";
import { WalletContractConnection } from "../entities/WalletContractConnection";
import { NFT } from "../entities/NFT";
import { addHours, sleep } from "../utils";
import { SendMessage } from "../module/kakao";
import { Opensea } from "../module/opensea";
import moment from "moment";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);
const opensea = new Opensea();
const sendMessage = new SendMessage();

const createWallet = async (walletAddress: string) => {
  const existingWallet = await getRepository(Wallet).findOne({
    where: { address: walletAddress },
  });
  if (existingWallet) return existingWallet;

  let username = "Unnamed";
  let profileImage = "";

  try {
    const res = await opensea.getUser(walletAddress);
    username = res?.data?.username || "Unnamed";
    profileImage = res?.data?.account?.profile_img_url || "";
  } catch (e) {
    console.log(e);
  }

  return getRepository(Wallet).save({
    address: walletAddress,
    username,
    profileImgUrl: profileImage,
  });
};

const createNFT = async (contractAddress: string, contractId: number) => {
  // NFT 저장
  let cursor;
  let page = 1;

  while (true) {
    const { nfts, pageKey } = await alchemy.nft.getNftsForContract(
      contractAddress
    );

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      console.log(`<NFT 생성> ${page}번째 페이지의 ${i + 1}번째 NFT 입니다`);

      await getRepository(NFT).save({
        ...nft,
        mediaGateway: nft?.media?.[0]?.gateway,
        mediaThumbnail: nft?.media?.[0]?.thumbnail,
        mediaRaw: nft?.media?.[0]?.raw,
        rawMetadataImage: nft?.rawMetadata?.image,
        contractId,
      });
    }

    cursor = pageKey;
    page += 1;
    if (!pageKey) return;
  }
};

const getContractsForOwnerHandler = async (
  walletAddress: string,
  cursor: string | undefined
): Promise<GetContractsForOwnerResponse> => {
  const option: {} = cursor ? { pageKey: cursor } : {};
  try {
    const data = await alchemy.nft.getContractsForOwner(walletAddress, option);
    return data;
  } catch (e: any) {
    await sendMessage.sendKakaoMessage({
      object_type: "text",
      text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 10분간 정지 후 콜랙션 가져오기를 다시 실행합니다. (에러 위치 - getContractsForOwnerHandler 함수)`,
      link: { mobile_web_url: "", web_url: "" },
    });
    await sleep(60 * 10);
    return getContractsForOwnerHandler(walletAddress, cursor);
  }
};

const create = async (walletAddress: string, index: number) => {
  const walletData = await createWallet(walletAddress);

  let cursor = null;
  let page = 1;
  const contractList = [];
  while (cursor !== undefined) {
    // 컬렉션 리스트 가져오기
    const {
      contracts,
      pageKey,
    }: { contracts: ContractForOwner[]; pageKey: any } | any =
      await getContractsForOwnerHandler(walletAddress, cursor);

    contractList.push(...contracts);
    page += 1;
    cursor = pageKey;
  }

  interface _ContractForOwner extends Omit<ContractForOwner, "media"> {
    media?: any;
    openSea?: any;
    [key: string]: any;
  }

  for (let i = 0; i < contractList.length; i++) {
    const contract: _ContractForOwner = contractList[i];

    // 이미 존재하는 contract라면 생략
    const existingContract = await getRepository(Contract).findOne({
      where: {
        address: contract.address,
      },
    });
    if (existingContract) continue;

    const newContract: _ContractForOwner = {
      ...contract,
      ...contract.openSea,
      isCompletedInitialUpdate: false,
      isCompletedUpdate: false,
    };
    delete contract.media;
    delete contract.openSea;

    const contractData = await getRepository(Contract).save(newContract);
    const existingConnection = await getRepository(
      WalletContractConnection
    ).findOne({
      where: {
        walletId: walletData.id,
        contractId: contractData?.id,
      },
    });
    if (!existingConnection) {
      await getRepository(WalletContractConnection).save({
        walletId: walletData.id,
        contractId: contractData?.id,
      });
    }

    // await createNFT(contractData.address, contractData.id);

    await getRepository(Contract).update(
      { id: contractData.id },
      { isCompletedInitialUpdate: true, isCompletedUpdate: true }
    );
  }

  await sendMessage.sendKakaoMessage({
    object_type: "text",
    text: `${moment(addHours(new Date(), 9)).format(
      "MM/DD HH:mm"
    )}\n\n<wallet data 생성 완료> ${walletAddress}(${index}번째)의 contract 데이터 생성이 완료되었습니다`,
    link: { mobile_web_url: "", web_url: "" },
  });
};

const collector = async (req: Request, res: Response) => {
  try {
    const {
      body: { walletAddressList },
    }: { body: { walletAddressList: string[] } } = req;

    for (let i = 0; i < walletAddressList.length; i++) {
      await create(walletAddressList[i], i);
    }
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.log(e.message);
    return res.status(400).send({ success: false, message: e.message });
  }
};

export default collector;
