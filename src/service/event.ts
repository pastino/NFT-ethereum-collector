import { getRepository } from "typeorm";
import { Collection } from "../entities/Collection";
import { NFT } from "../entities/NFT";
import { CollectionEvent } from "../entities/CollectionEvent";
import { User } from "../entities/User";
import { CreateEntityData } from "../modules/manufactureData";
import { OpenSea } from "../modules/requestAPI";
import { IncompleteEventError } from "../entities/ IncompleteEventError";
import { addHours, isAxiosError, sleep } from "../commons/utils";
import { makeAxiosErrorText } from "../commons/error";
import { SendMessage } from "../modules/kakaoMessage";

const sendMessage = new SendMessage();

export class Event {
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
      const { data }: any = await this.openSeaAPI.getEventList({
        collectionData: this.collectionData,
        cursor: this.cursor,
        occurredBefore: this.occurredBefore
          ? this.occurredBefore
          : addHours(new Date(), 1),
      });

      const next = data?.next;
      const asset_events = data?.asset_events;

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
        const res: any = await this.openSeaAPI.getNFT(
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

  private insertEventList = async (assetEvents: any[], uuid: string) => {
    for (let i = 0; i < assetEvents.length; i++) {
      console.log(
        `<Event 생성> ${this.page}번째 페이지의 ${i + 1}/${
          assetEvents.length
        } Event 입니다`
      );

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
        sessionUUID: uuid,
      });
    }
  };

  public createEventList = async (uuid: string) => {
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
        await this.insertEventList(assetEvents, uuid);
        this.page += 1;
      }
    } catch (e: any) {
      console.log(e);

      // const response = JSON.parse(JSON.stringify(e));
      // if (typeof response === "object") {
      //   const code = response?.status;
      //   console.log("response", response);
      //   console.log("code", code);
      //   if (
      //     typeof code === "number" &&
      //     code >= 500 &&
      //     this.retryCount < this.MAX_RETRY_COUNT
      //   ) {
      //     this.retryCount++;
      //     // 10분간 정지 - opensea api 오버 트래픽 방지
      //     await sleep(60 * 10);
      //     await sendMessage.sendKakaoMessage({
      //       object_type: "text",
      //       text: `${e.message}\n\n<필독>\n\n오류가 발생하였지만 오픈시 서버에러(500번대)로 10분간 정지 후 종료된 이벤트 시점부터 다시 수집을 시작합니다. (${this.retryCount}/${this.MAX_RETRY_COUNT})`,
      //       link: { mobile_web_url: "", web_url: "" },
      //     });
      //     await this.createEventList();
      //   } else {
      //     throw new Error(e.message);
      //   }
      // }
      // throw new Error(e);
    }
  };
}
