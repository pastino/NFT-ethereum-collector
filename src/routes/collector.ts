import { Request, Response } from "express";
import {
  Alchemy,
  GetContractsForOwnerResponse,
  Network,
  SortingOrder,
  GetTransfersForContractOptions,
  Block,
} from "alchemy-sdk";
import { getRepository } from "typeorm";
import { Contract } from "../entities/Contract";
import { Opensea } from "../module/opensea";
import { Wallet } from "../entities/Wallet";
import { NFT } from "../entities/NFT";
import { sleep } from "../utils";
import { SendMessage } from "../module/kakao";
import { Transfer } from "../entities/Transfer";
import { Transaction } from "../entities/Transaction";

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

const createNFT = async (contractAddress: string, contract: Contract) => {
  const nftCount = await getRepository(NFT).count({
    where: {
      contract,
    },
  });
  if (nftCount > 0) return;

  // NFT 저장
  let cursor;
  let page = 1;

  while (true) {
    const { nfts, pageKey }: any = await alchemy.nft.getNftsForContract(
      contractAddress,
      {
        pageKey: cursor,
      }
    );

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      console.log(`<NFT 생성> ${page}번째 페이지의 ${i + 1}번째 NFT 입니다`);

      await getRepository(NFT).save({
        ...nft,
        mediaThumbnail: nft?.media?.[0]?.thumbnail,
        contract,
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
    return alchemy.nft.getContractsForOwner(walletAddress, option);
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

const createContract = async (
  contractAddress: string
): Promise<Contract | null> => {
  try {
    const contract = await alchemy.nft.getContractMetadata(contractAddress);

    const existingContract = await getRepository(Contract).findOne({
      where: {
        address: contract.address,
      },
    });
    if (existingContract) return existingContract;

    const newContract = {
      ...contract,
      ...contract.openSea,
      isCompletedInitialUpdate: false,
      isCompletedUpdate: false,
    };
    delete contract.openSea;
    return getRepository(Contract).save(newContract);
  } catch (e: any) {
    throw new Error(e.message);
  }
};

const hexToDecimal = (hexValue: string) => {
  return parseInt(hexValue, 16);
};

const createTransaction = async (
  contractAddress: string,
  contract: Contract
) => {
  try {
    const latestTransaction = await getRepository(Transfer).findOne({
      where: {
        contract,
      },
      order: { createAt: "DESC" },
    });

    let page = 1;

    let transferOption: GetTransfersForContractOptions = {
      order: SortingOrder.ASCENDING,
      pageKey: undefined,
    };

    if (latestTransaction && page === 1) {
      transferOption = {
        fromBlock: latestTransaction.blockNumber,
        order: SortingOrder.ASCENDING,
        pageKey: undefined,
      };
    }

    while (true) {
      const { nfts, pageKey } = await alchemy.nft.getTransfersForContract(
        contractAddress,
        transferOption
      );

      for (let i = 0; i < nfts?.length; i++) {
        const transfer = nfts[i];

        if (latestTransaction && page === 1) {
          if (transfer.transactionHash === latestTransaction.transactionHash) {
            continue;
          }
        }

        const transaction = await alchemy.transact.getTransaction(
          transfer.transactionHash
        );

        const nft = await getRepository(NFT).findOne({
          where: {
            contract,
            tokenId: transfer?.tokenId,
          },
        });

        const transferData = await getRepository(Transfer).save({
          ...transfer,
          contract,
          nft,
        });

        let timeOption = {};

        if (transaction?.blockHash) {
          const blockData: Block = await alchemy.core.getBlock(
            transaction?.blockHash
          );

          const timestamp = blockData.timestamp;
          const eventTime = new Date(timestamp * 1000);

          timeOption = {
            timestamp,
            eventTime,
          };
        }

        const transactionData = await getRepository(Transaction).save({
          ...transaction,
          transfer: transferData,
          gasPrice: String(hexToDecimal(transaction?.gasPrice?._hex || "0")),
          gasLimit: String(hexToDecimal(transaction?.gasLimit?._hex || "0")),
          value: String(hexToDecimal(transaction?.value?._hex || "0")),
          ...timeOption,
        });

        await getRepository(Transfer).update(
          {
            id: transferData.id,
          },
          {
            transaction: transactionData,
          }
        );
      }

      transferOption.pageKey = pageKey;
      page += 1;
    }
  } catch (e) {
    console.log(e);
  }
};

const collector = async (req: Request, res: Response) => {
  try {
    const {
      body: { contractAddress },
    }: { body: { contractAddress: string } } = req;

    const contract = await createContract(contractAddress);
    if (!contract) return res.status(400).send({ success: false, message: "" });

    await createNFT(contract.address, contract);
    await createTransaction(contractAddress, contract);
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).send({ success: false, message: e.message });
  }
};

export default collector;
