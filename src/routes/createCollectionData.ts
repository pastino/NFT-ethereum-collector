import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Collection } from "../entities/Collection";
import { NFT } from "../entities/NFT";
import { CollectionEvent } from "../entities/CollectionEvent";
import { User } from "../entities/User";
import { Message, SendMessage } from "../modules/kakaoMessage";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";
import moment from "moment";
import { IncompleteEventError } from "../entities/ IncompleteEventError";
import { addHours, isAxiosError, sleep, subtractHours } from "../commons/utils";
import { makeAxiosErrorText } from "../commons/error";

// TODO 절대경로 생성
// TODO 오픈시 리턴 값 중 key값 변화가 있는지 확인

const message = new Message();
const sendMessage = new SendMessage();

const createCollection = async (
  openSeaAPI: OpenSea
): Promise<{
  isSuccess: boolean;
  collectionData: Collection | null;
}> => {
  try {
    const {
      data: { collection, address },
    } = await openSeaAPI.getCollection();

    // 컬랙션 데이터 객체 생성
    const createEntityData = new CreateEntityData({
      snakeObject: {
        ...collection,
        address: address,
      },
      entity: Collection,
      filterList: ["id"],
    });

    // 컬랙션 데이터 Insert
    const collectionData = await getRepository(Collection).save(
      createEntityData.createTableRowData()
    );

    return { isSuccess: true, collectionData };
  } catch (e: any) {
    throw new Error(e.message);
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

      const {
        data: { next, assets },
      } = await openSeaAPI.getNFTList(collectionData, cursor);

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
          filterList: ["id"],
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
    message.deleteColectedData(collectionData.address);
    throw new Error(e.message);
  }
};

class Event {
  private cursor: string = "";
  private page: number = 1;
  private occurredBefore: Date | null = null;
  private collectionData: Collection;
  private openSeaAPI: OpenSea;
  private incompleteEventError: IncompleteEventError | undefined;
  private retryCount = 0;
  private MAX_RETRY_COUNT = 5;

  constructor({
    collectionData,
    openSeaAPI,
    incompleteEventError,
  }: {
    collectionData: Collection;
    openSeaAPI: OpenSea;
    incompleteEventError?: IncompleteEventError;
  }) {
    this.collectionData = collectionData;
    this.openSeaAPI = openSeaAPI;
    this.incompleteEventError = incompleteEventError;
  }

  private checkDiscontinuedHistory = async () => {
    if (this.incompleteEventError) {
      const lastSavedEvent = await getRepository(CollectionEvent).findOne({
        where: {
          id: this.incompleteEventError.collectionEventId,
        },
      });

      if (!lastSavedEvent) return { isSuccess: false };

      this.occurredBefore = addHours(
        new Date(lastSavedEvent?.eventTimestamp),
        3
      );
    }
  };

  private getEventList = async () => {
    try {
      const {
        data: { next, asset_events },
      } = await this.openSeaAPI.getEventList({
        collectionData: this.collectionData,
        cursor: this.cursor,
        occurredBefore: this.occurredBefore
          ? this.occurredBefore
          : addHours(new Date(), 1),
      });
      this.cursor = next;
      return asset_events;
    } catch (e: any) {
      throw new Error(e);
    }
  };

  private checkHasNFTAndCreate = async (event: any) => {
    let nftData = await getRepository(NFT).findOne({
      where: {
        collectionId: this.collectionData.id,
        tokenId: event?.asset?.token_id,
      },
    });

    if (event?.asset?.token_id && !nftData) {
      // NFT DATA 생성
      try {
        const res = await this.openSeaAPI.getNFT(
          this.collectionData,
          event?.asset?.token_id
        );

        const createEntityData = new CreateEntityData({
          snakeObject: res.data,
          entity: NFT,
          filterList: ["id"],
        });

        nftData = await getRepository(NFT).save(
          createEntityData.createTableRowData()
        );
      } catch (e: unknown) {
        if (isAxiosError(e)) {
          throw new Error(makeAxiosErrorText(e));
        }
      }
    }
    return nftData;
  };

  private makeDataForInsertToDB = async (event: any) => {
    // 이벤트 데이터 객체 생성
    const createEntityData = new CreateEntityData({
      snakeObject: event,
      entity: CollectionEvent,
    });
    const makedDataForInsert = createEntityData.createTableRowData();
    return makedDataForInsert;
  };

  private getUserData = async (
    data: any
  ): Promise<{ accountType: string; user: User }[]> => {
    try {
      const hasDataListOfAccountData: { accountType: string; user: User }[] =
        [];

      // NFT Entity 키값 리스트 얻기
      const filterList = [
        "approvedAccount",
        "ownerAccount",
        "fromAccount",
        "seller",
        "toAccount",
        "winnerAccount",
      ];

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

      return hasDataListOfAccountData;
    } catch (e) {
      if (isAxiosError(e)) {
        throw new Error(makeAxiosErrorText(e));
      }
      return [];
    }
  };

  private insertEventList = async (assetEvents: any[]) => {
    for (let i = 0; i < assetEvents.length; i++) {
      console.log(
        `<Event 생성> ${this.page}번째 페이지의 ${i + 1}/${
          assetEvents.length
        } Event 입니다`
      );
      this.page += 1;
      const event = assetEvents[i];

      if (this.occurredBefore) {
        const existingEvent = await getRepository(CollectionEvent).findOne({
          where: {
            eventId: event.id,
          },
        });

        // 종료되었던 이벤트 데이터 저장 중 - 이미 저장된 이벤트는 생략
        if (existingEvent) {
          continue;
        }
      }

      const nftData = await this.checkHasNFTAndCreate(event);
      const makedDataForInsert = await this.makeDataForInsertToDB(event);

      const hasDataListOfAccountData = await this.getUserData(
        makedDataForInsert
      );

      const getUserId = (targetKey: string) => {
        const isInclude = hasDataListOfAccountData
          .map((item) => item.accountType)
          .includes(targetKey);
        if (!isInclude) return null;

        return hasDataListOfAccountData.find(
          (item) => item.accountType === targetKey
        )?.user.id;
      };
      const eventId = makedDataForInsert.id;
      delete makedDataForInsert.id;

      await getRepository(CollectionEvent).save({
        ...makedDataForInsert,
        eventId: eventId,
        collectionId: this.collectionData.id,
        nftId: nftData ? nftData.id : null,
        approvedAccount: getUserId("approvedAccount"),
        ownerAccount: getUserId("ownerAccount"),
        fromAccount: getUserId("fromAccount"),
        seller: getUserId("seller"),
        toAccount: getUserId("toAccount"),
        winnerAccount: getUserId("winnerAccount"),
      });
    }
  };

  public createEventList = async () => {
    try {
      // 이전에 이벤트 데이터 쌓는 도중 오류로 인해 중단된 기록있는지 확인.
      // 있다면 occurredBefore 상태값 업데이트

      await this.checkDiscontinuedHistory();
      // 이벤트 데이터 쌓기 시작
      while (true) {
        // cursor가 null이면 다음 페이지 없음 - while문 종료.
        if (this.cursor === null) {
          return { isSuccess: true };
        }
        // 이벤트 데이터 리스트 가져오기
        const assetEvents = await this.getEventList();
        // 이벤트 데이터 저장
        await this.insertEventList(assetEvents);
      }
    } catch (e: any) {
      console.log("error 발생");
      const response = JSON.parse(JSON.stringify(e));
      if (typeof response === "object") {
        const code = response?.status;
        console.log(code);
        console.log(this.retryCount, this.MAX_RETRY_COUNT);
        if (
          typeof code === "number" &&
          code >= 500 &&
          this.retryCount < this.MAX_RETRY_COUNT
        ) {
          this.retryCount++;
          // 10분간 정지 - opensea api 오버 트래픽 방지
          await sleep(60 * 10);
          console.log("send message");
          await sendMessage.sendKakaoMessage({
            object_type: "text",
            text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 오픈시 서버에러(500번대)로 10분간 정지 후 종료된 이벤트 시점부터 다시 수집을 시작합니다. (${this.retryCount}/${this.MAX_RETRY_COUNT})`,
            link: { mobile_web_url: "", web_url: "" },
          });
          await this.createEventList();
        } else {
          console.log("그냥 에러");
          throw new Error(e.message);
        }
      }
      throw new Error(e);
    }
  };
}

const alreadyCollected = async (
  contractAddress: string,
  openSeaAPI: OpenSea
) => {
  const existingCollectionData = (await getRepository(Collection).findOne({
    where: {
      address: contractAddress,
    },
  })) as Collection;

  if (existingCollectionData) {
    // Data 수집 중 에러로 인하여 종료된 컬랙션인지 확인
    const incompleteEventError = await getRepository(
      IncompleteEventError
    ).findOne({
      where: {
        collectionId: existingCollectionData.id,
      },
      order: {
        createAt: "DESC",
      },
    });

    if (incompleteEventError) {
      const event = new Event({
        collectionData: existingCollectionData,
        openSeaAPI,
        incompleteEventError,
      });
      await event.createEventList();
    }

    message.alreadyCollected(contractAddress);

    return true;
  }
  return false;
};

const createCollectionData = async (req: Request, res: Response) => {
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
      const isAlreadyCollected = await alreadyCollected(
        contractAddress,
        openSeaAPI
      );
      if (isAlreadyCollected) continue;

      // Collection 데이터 생성
      const { isSuccess: isCollectionSuccess, collectionData } =
        await createCollection(openSeaAPI);
      if (!isCollectionSuccess || !collectionData) {
        // TODO 해당 컬랙션 생략한다는 메세지 보내기
        continue;
      }

      // NFT 데이터 생성
      const { isSuccess: isNFTSuccess } = await createNFT(
        collectionData,
        openSeaAPI
      );
      if (!isNFTSuccess) return res.status(200).send({ success: false });

      const collection = await getRepository(Collection).findOne({
        where: {
          address: "0x764aeebcf425d56800ef2c84f2578689415a2daa",
        },
      });
      if (!collection) return;

      // Event 데이터 생성
      const event = new Event({
        collectionData: collection,
        openSeaAPI,
      });
      await event.createEventList();

      await sendMessage.sendKakaoMessage({
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

