import axios from "axios";

// TODO return 데이터 OpenSea 리턴데이터 확인 후 Type 지정
export class OpenSea {
  private contractAddress = "";
  collectionData = {};

  private headerConfig = {
    headers: {
      "X-API-KEY": process.env.OPENSEA_API_KEY as string,
    },
  };

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  public getCollection = async () => {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/asset_contract/${this.contractAddress}`,
      this.headerConfig
    );

    this.collectionData = response?.data?.collection;

    return response as {
      status: number;
      data: { collection: {}; address: string };
    };
  };

  public getNFTList = async (collectionData: any, cursor: string) => {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/assets?collection_slug=${collectionData.slug}&cursor=${cursor}`,
      this.headerConfig
    );

    return response as {
      status: number;
      data: { assets: any[]; next: string };
    };
  };

  public getNFT = async (collectionData: any, tokenId: string) => {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/asset/${collectionData.address}/${tokenId}`,
      this.headerConfig
    );

    return response as {
      status: number;
      data: any;
    };
  };

  public getEventList = async (collectionData: any, cursor: string) => {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/events?collection_slug=${collectionData.slug}&cursor=${cursor}`,
      this.headerConfig
    );

    return response as {
      status: number;
      data: { asset_events: any[]; next: string };
    };
  };
}
