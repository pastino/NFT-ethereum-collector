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

export const sleep = (sec: number) => {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
};

export const subtractHours = (date: Date, hours: number) => {
  date.setHours(date.getHours() - hours);
  return date;
};

export const addHours = (date: Date, hours: number) => {
  date.setHours(date.getHours() + hours);
  return date;
};
