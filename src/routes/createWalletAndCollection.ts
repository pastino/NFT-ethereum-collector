import { Request, Response } from "express";

const createWalletAndCollection = async (req: Request, res: Response) => {
  try {
    const {
      body: { walletList },
    }: { body: { walletList: string[] } } = req;

    for (let i = 0; i < walletList.length; i++) {}

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.log(e.message);
  }
};

export default createWalletAndCollection;
