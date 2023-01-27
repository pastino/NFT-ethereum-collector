import { Request, Response } from "express";
import { getRepository } from "typeorm";
import axios from "axios";
import { Collection } from "../entities/Collection";
import { getEntityKeyList, snakeToCamelObject } from "../utils";
import { NFT } from "../entities/NFT";
import { CollectionEvent } from "../entities/CollectionEvent";
import { User } from "../entities/User";

const headerConfig = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY as string,
  },
};

const createCollection = async (contractAddress: string) => {
  try {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`,
      headerConfig
    );

    const { status, data } = response;

    // request 오류 시 오류 리턴
    if (status !== 200) return { isSuccess: false, collectionData: null };

    // response 데이터 snake case 키값을 camel case로 변경
    const createData = snakeToCamelObject({
      ...data?.collection,
      address: data?.address,
    });
    // Collection Entity 키값 리스트 얻기
    const collectionKeyList = getEntityKeyList({ entity: Collection });

    // Table Row 데이터 생성
    const createRowData: any = {};
    collectionKeyList.map(
      (key: string) => (createRowData[key] = createData[key])
    );

    const collectionData = await getRepository(Collection).save(createRowData);

    return { isSuccess: true, collectionData };
  } catch (e) {
    return { isSuccess: false, collectionData: null };
  }
};

const createNFT = async (collectionData: Collection) => {
  try {
    let cursor = "";
    const isContinue = cursor !== null;
    let page = 1;

    while (isContinue) {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/assets?collection_slug=${collectionData.slug}&cursor=${cursor}`,
        headerConfig
      );

      const {
        status,
        data: { next, assets },
      } = response;

      // TODO 1. request 오류 시 오류 내용 저장 필요
      // TODO 2. request 오류 시 카톡으로 내용 알리기
      if (status !== 200) break;

      cursor = next;

      // assets(NFT) 데이터들을 저장한다
      for (let i = 0; i < assets.length; i++) {
        console.log(`<NFT 생성> ${page}번째 페이지의 ${i}번째 NFT 입니다`);
        const asset = assets[i];
        // response 데이터 snake case 키값을 camel case로 변경
        const createData = snakeToCamelObject(asset);
        // NFT Entity 키값 리스트 얻기
        const nftKeyList = getEntityKeyList({ entity: NFT });

        // Table Row 데이터 생성
        const createRowData: any = {};
        nftKeyList.map((key: string) => (createRowData[key] = createData[key]));

        await getRepository(NFT).save({
          ...createRowData,
          collectionId: collectionData.id,
        });
      }

      page += 1;
    }

    return { isSuccess: true };
  } catch (e) {
    return { isSuccess: false };
  }
};

const createEvent = async (collectionData: Collection) => {
  try {
    let cursor = "";
    const isContinue = cursor !== null;
    let page = 1;

    while (isContinue) {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/events?collection_slug=${collectionData.slug}&cursor=${cursor}`,
        headerConfig
      );
      const {
        status,
        data: { next, asset_events },
      } = response;

      // TODO 1. request 오류 시 오류 내용 저장 필요
      // TODO 2. request 오류 시 카톡으로 내용 알리기
      if (status !== 200) break;

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

        // response 데이터 snake case 키값을 camel case로 변경
        const createData = snakeToCamelObject(event);

        // NFT Entity 키값 리스트 얻기
        const filterList = [
          "approvedAccount",
          "ownerAccount",
          "fromAccount",
          "seller",
          "toAccount",
          "winnerAccount",
        ];
        const eventKeyList = getEntityKeyList({
          entity: CollectionEvent,
        });
        // Table Row 데이터 생성
        const createRowData: any = {};
        eventKeyList.map(
          (key: string) => (createRowData[key] = createData[key])
        );

        const hasDataListOfAccountData: { accountType: string; user: User }[] =
          [];

        for (let j = 0; j < filterList.length; j++) {
          const accountType = filterList[j];
          const accountData = createRowData[accountType];
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
          ...createRowData,
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

    return { isSuccess: true };
  } catch (e) {
    return { isSuccess: false };
  }
};

const CreateCollectionData = async (req: Request, res: Response) => {
  try {
    // Creator 정보 저장
    // creator: {
    //     user: {
    //       username: "Porsche",
    //     },
    //     profile_img_url:
    //       "https://storage.googleapis.com/opensea-static/opensea-profile/11.png",
    //     address: "0xd44fbb29dcb78b560bf66544921dd22a9f650339",
    //     config: "verified",
    //   },
    // NFT 데이터 저장
    // Event 저장

    // 생성 중간 단계에 계속 카톡을 준다.
    // 생성이 완료되면 카톡을 준다.

    const {
      body: { collectionList },
    }: { body: { collectionList: string[] } } = req;

    for (let i = 0; i < collectionList.length; i++) {
      const contractAddress = collectionList[i];

      const collectionData = (await getRepository(Collection).findOne({
        where: {
          address: contractAddress,
        },
      })) as Collection;

      //   // Collection 데이터 생성
      //   const { isSuccess: isCollectionSuccess, collectionData } =
      //     await createCollection(contractAddress);
      //   if (!isCollectionSuccess) return res.status(200).send({ success: false });

      //   // NFT 데이터 생성
      //   const { isSuccess: isNFTSuccess } = await createNFT(collectionData);
      //   if (!isNFTSuccess) return res.status(200).send({ success: false });

      // Event 데이터 생성
      const { isSuccess: isEventSuccess } = await createEvent(collectionData);
      console.log("isEventSuccess", isEventSuccess);
      if (!isEventSuccess) return res.status(200).send({ success: false });
    }

    return res.status(200).send({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
    throw new Error(e);
  }
};

export default CreateCollectionData;
