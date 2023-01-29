import { Request, Response } from "express";
import { getRepository } from "typeorm";
import axios from "axios";
import { Collection } from "../entities/Collection";
import { NFT } from "../entities/NFT";
import { CollectionEvent } from "../entities/CollectionEvent";
import { User } from "../entities/User";
import { Message } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";

// TODO 절대경로 생성
// TODO 오픈시 리턴 값 중 key값 변화가 있는지 확인

const headerConfig = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY as string,
  },
};
const sendMessage = new Message();

const createCollection = async (contractAddress: string) => {
  try {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`,
      headerConfig
    );

    const { status, data } = response;

    // request 오류 시 오류 리턴, 카카오톡으로 에러정보 전달
    if (status !== 200) {
      sendMessage.collection(contractAddress);
      return { isSuccess: false, collectionData: null };
    }

    // 컬랙션 데이터 객체 생성
    const createEntityData = new CreateEntityData({
      snakeObject: {
        ...data?.collection,
        address: data?.address,
      },
      entity: Collection,
    });

    // 컬랙션 데이터 Insert
    const collectionData = await getRepository(Collection).save(
      createEntityData.createTableRowData()
    );

    return { isSuccess: true, collectionData };
  } catch (e) {
    sendMessage.collection(contractAddress);
    return { isSuccess: false, collectionData: null };
  }
};

const createNFT = async (collectionData: Collection) => {
  try {
    let cursor = "";
    let page = 1;

    while (true) {
      if (cursor === null) {
        return { isSuccess: true };
      }
      const response = await axios.get(
        `https://api.opensea.io/api/v1/assets?collection_slug=${collectionData.slug}&cursor=${cursor}`,
        headerConfig
      );

      const {
        status,
        data: { next, assets },
      } = response;

      if (status !== 200) {
        sendMessage.nft(collectionData.address);
        return { isSuccess: false };
      }

      cursor = next;

      // assets(NFT) 데이터들을 저장한다
      for (let i = 0; i < assets.length; i++) {
        console.log(`<NFT 생성> ${page}번째 페이지의 ${i + 1}번째 NFT 입니다`);

        const asset = assets[i];

        // 첫 번째 데이터에서 컬랙션 Creator 정보를 생성한다.
        if (page === 1 && i === 0) {
          const {
            user: { username },
            profile_img_url,
            address,
            config,
          } = asset?.creator;

          const existingUser = await getRepository(User).findOne({
            where: {
              address,
            },
          });

          if (!existingUser) {
            await getRepository(User).save({
              username,
              profileImgUrl: profile_img_url,
              address,
              config,
            });
          }
        }

        // NFT 데이터 객체 생성
        const createEntityData = new CreateEntityData({
          snakeObject: asset,
          entity: NFT,
        });

        // NFT 데이터 Insert
        await getRepository(NFT).save({
          ...createEntityData.createTableRowData(),
          collectionId: collectionData.id,
        });
      }

      page += 1;
    }
  } catch (e) {
    sendMessage.nft(collectionData.address);
    return { isSuccess: false };
  }
};

const createEvent = async (collectionData: Collection) => {
  try {
    let cursor = "";
    let page = 1;

    while (true) {
      if (cursor === null) {
        return { isSuccess: true };
      }

      const response = await axios.get(
        `https://api.opensea.io/api/v1/events?collection_slug=${collectionData.slug}&cursor=${cursor}`,
        headerConfig
      );
      const {
        status,
        data: { next, asset_events },
      } = response;

      // TODO request 오류 시 오류 내용 저장 필요
      // TODO request 오류 시 카톡으로 내용 알리기
      if (status !== 200) {
        return { isSuccess: false };
      }

      cursor = next;

      // Event 데이터들을 저장한다
      for (let i = 0; i < asset_events.length; i++) {
        console.log(
          `<Event 생성> ${page}번째 페이지의 ${i + 1}/${
            asset_events.length
          } Event 입니다`
        );
        const event = asset_events[i];
        let nftData = await getRepository(NFT).findOne({
          where: {
            collectionId: collectionData.id,
            tokenId: event?.asset?.token_id,
          },
        });

        if (event?.asset?.token_id && !nftData) {
          // TODO NFT DATA 생성
          console.log("NFT data 생성해야함.");
        } else if (!event?.asset?.token_id) {
          // event_type이 collection_offer인 경우
          // TODO nft id 없이 저장하기
        }

        // NFT Entity 키값 리스트 얻기
        const filterList = [
          "approvedAccount",
          "ownerAccount",
          "fromAccount",
          "seller",
          "toAccount",
          "winnerAccount",
        ];

        // 이벤트 데이터 객체 생성
        const createEntityData = new CreateEntityData({
          snakeObject: event,
          entity: CollectionEvent,
        });
        const data = createEntityData.createTableRowData();

        const hasDataListOfAccountData: { accountType: string; user: User }[] =
          [];

        for (let j = 0; j < filterList.length; j++) {
          const accountType = filterList[j];
          const accountData =
            createEntityData.createTableRowData()[accountType];
          if (accountData) {
            let user = null;

            user = await getRepository(User).findOne({
              where: {
                address: accountData?.address,
              },
            });

            if (user) {
              hasDataListOfAccountData.push({ accountType, user });
              continue;
            }

            user = await getRepository(User).save({
              user: accountData?.user?.username || "",
              profileImgUrl: accountData?.profile_img_url || "",
              address: accountData?.address || "",
              config: accountData?.config || "",
            });
            hasDataListOfAccountData.push({ accountType, user });
          }
        }

        const getUserId = (targetKey: string) => {
          const isInclude = hasDataListOfAccountData
            .map((item) => item.accountType)
            .includes(targetKey);
          if (!isInclude) return null;

          return hasDataListOfAccountData.find(
            (item) => item.accountType === targetKey
          )?.user.id;
        };

        await getRepository(CollectionEvent).save({
          ...createEntityData.createTableRowData(),
          collectionId: collectionData.id,
          nftId: nftData ? nftData.id : null,
          approvedAccount: getUserId("approvedAccount"),
          ownerAccount: getUserId("ownerAccount"),
          fromAccount: getUserId("fromAccount"),
          seller: getUserId("seller"),
          toAccount: getUserId("toAccount"),
          winnerAccount: getUserId("winnerAccount"),
        });
      }
      page += 1;
    }
  } catch (e) {
    return { isSuccess: false };
  }
};

const CreateCollectionData = async (req: Request, res: Response) => {
  try {
    // TODO 생성 중간 단계에 계속 카톡을 준다.
    // TODO 생성이 완료되면 카톡을 준다.
    const {
      body: { collectionList },
    }: { body: { collectionList: string[] } } = req;

    for (let i = 0; i < collectionList.length; i++) {
      const contractAddress = collectionList[i];

      // 이미 수집된 컬랙션이 존재하면 카톡으로 알리고, 해당 컬랙션 수집 생략
      const existingCollectionData = (await getRepository(Collection).findOne({
        where: {
          address: contractAddress,
        },
      })) as Collection;

      if (existingCollectionData) {
        sendMessage.alreadyCollected(contractAddress);
        continue;
      }

      // Collection 데이터 생성
      const { isSuccess: isCollectionSuccess, collectionData } =
        await createCollection(contractAddress);
      if (!isCollectionSuccess) continue;

      // NFT 데이터 생성
      const { isSuccess: isNFTSuccess } = await createNFT(collectionData);
      if (!isNFTSuccess) return res.status(200).send({ success: false });

      // Event 데이터 생성
      const { isSuccess: isEventSuccess } = await createEvent(collectionData);
      if (!isEventSuccess) return res.status(200).send({ success: false });
    }

    return res.status(200).send({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
    throw new Error(e);
  }
};

export default CreateCollectionData;
