import axios from "axios";

// TODO return 데이터 OpenSea 리턴데이터 확인 후 Type 지정

export const headerConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

export class Opensea {
  constructor() {}

  public getUser = async (walletAddress: string) => {
    try {
      const response = await axios.get(
        `https://api.opensea.io/user/${walletAddress}`,
        headerConfig
      );

      return response;
    } catch (e: any) {
      throw new Error(e);
    }
  };
}
