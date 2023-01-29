import { AxiosError } from "axios";

export const isAxiosError = (candidate: unknown): candidate is AxiosError => {
  if (
    candidate &&
    typeof candidate === "object" &&
    "isAxiosError" in candidate
  ) {
    return true;
  }
  return false;
};
