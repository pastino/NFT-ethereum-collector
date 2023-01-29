import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Collection } from "../entities/Collection";

const DeleteCollectionData = async (req: Request, res: Response) => {
  try {
    const {
      body: { collectionIdList },
    }: { body: { collectionIdList: number[] } } = req;

    for (let i = 0; i < collectionIdList.length; i++) {
      const collectionId = collectionIdList[i];
      await getRepository(Collection).delete({ id: collectionId });
    }

    return res.status(200).send({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
    throw new Error(e);
  }
};

export default DeleteCollectionData;
