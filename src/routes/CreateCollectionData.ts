import { Request, Response } from "express";
import { getRepository } from "typeorm";
import axios from "axios";
import { Collection } from "../entities/Collection";
import { NFT } from "../entities/NFT";
import { CollectionEvent } from "../entities/CollectionEvent";
import { User } from "../entities/User";
import { Message, SendMessage } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";
import moment from "moment";

// TODO 절대경로 생성
// TODO 오픈시 리턴 값 중 key값 변화가 있는지 확인

const message = new Message();

const createCollection = async (
  contractAddress: string,
  openSeaAPI: OpenSea
): Promise<{
  isSuccess: boolean;
  collectionData: Collection | null;
}> => {
  try {
    const { status, data } = await openSeaAPI.getCollection();

    // request 오류 시 오류 리턴, 카카오톡으로 에러정보 전달
    if (status !== 200) {
      message.collection(contractAddress);
      return { isSuccess: false, collectionData: null };
    }

    const { collection, address } = data;

    // 컬랙션 데이터 객체 생성
    const createEntityData = new CreateEntityData({
      snakeObject: {
        ...collection,
        address: address,
      },
      entity: Collection,
    });

    // 컬랙션 데이터 Insert
    const collectionData = await getRepository(Collection).save(
      createEntityData.createTableRowData()
    );

    return { isSuccess: true, collectionData };
  } catch (e) {
    message.collection(contractAddress);
    return { isSuccess: false, collectionData: null };
  }
};

const createNFT = async (collectionData: Collection, openSeaAPI: OpenSea) => {
  try {
    let cursor = "";
    let page = 1;

    while (true) {
      if (cursor === null) {
        return { isSuccess: true };
      }

      const { status, data } = await openSeaAPI.getNFTList(
        collectionData,
        cursor
      );

      if (status !== 200) {
        message.nft(collectionData.address);
        return { isSuccess: false };
      }

      const { next, assets } = data;

      cursor = next;

      // assets(NFT) 데이터들을 저장한다
      for (let i = 0; i < assets.length; i++) {
        console.log(`<NFT 생성> ${page}번째 페이지의 ${i + 1}번째 NFT 입니다`);

        const asset = assets[i];

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
        });

        // NFT 데이터 Insert
        await getRepository(NFT).save({
          ...createEntityData.createTableRowData(),
          collectionId: collectionData.id,
        });
      }

      page += 1;
    }
  } catch (e: any) {
    message.createNftError(collectionData.address, e?.message);
    return { isSuccess: false };
  }
};

const createEvent = async (collectionData: Collection, openSeaAPI: OpenSea) => {
  try {
    let cursor = "";
    let page = 1;

    while (true) {
      if (cursor === null) {
        return { isSuccess: true };
      }

      const { status, data } = await openSeaAPI.getEventList(
        collectionData,
        cursor
      );

      if (status !== 200) {
        message.event(collectionData.address);
        return { isSuccess: false };
      }

      const { next, asset_events } = data;

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

          const res = await openSeaAPI.getNFT(
            collectionData,
            event?.asset?.token_id
          );

          if (res.status === 200) {
            const createEntityData = new CreateEntityData({
              snakeObject: res.data,
              entity: NFT,
            });
            const nftData = createEntityData.createTableRowData();
            await getRepository(NFT).save(nftData);
          }
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
          const accountData = data[accountType];
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
          ...data,
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
    message.event(collectionData.address);
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

      const openSeaAPI = new OpenSea(contractAddress);

      // 이미 수집된 컬랙션이 존재하면 카톡으로 알리고, 해당 컬랙션 수집 생략
      const existingCollectionData = (await getRepository(Collection).findOne({
        where: {
          address: contractAddress,
        },
      })) as Collection;

      if (existingCollectionData) {
        message.alreadyCollected(contractAddress);
        continue;
      }

      // Collection 데이터 생성
      const { isSuccess: isCollectionSuccess, collectionData } =
        await createCollection(contractAddress, openSeaAPI);
      if (!isCollectionSuccess || !collectionData) continue;

      // NFT 데이터 생성
      const { isSuccess: isNFTSuccess } = await createNFT(
        collectionData,
        openSeaAPI
      );
      if (!isNFTSuccess) return res.status(200).send({ success: false });

      // Event 데이터 생성
      const { isSuccess: isEventSuccess } = await createEvent(
        collectionData,
        openSeaAPI
      );
      if (!isEventSuccess) return res.status(200).send({ success: false });

      const sendMessage = new SendMessage();

      sendMessage.sendKakaoMessage({
        object_type: "text",
        text: `${moment(new Date()).format(
          "MM/DD HH:mm"
        )}\n\n<컬랙션 생성 완료 - ${i + 1}/${collectionList.length}>\n\n${
          collectionData.name
        } 컬랙션 데이터 생성이 완료되었습니다`,
        link: { mobile_web_url: "", web_url: "" },
      });
    }

    return res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(400).send({ success: false, message: e.message });
    throw new Error(e);
  }
};

export default CreateCollectionData;
