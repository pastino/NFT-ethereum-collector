import * as _ from "lodash";
import { getConnection } from "typeorm";

export const snakeToCamelObject = (collectionData: {}) => {
  return _.mapKeys(collectionData, (value, key) => _.camelCase(key));
};

export const getEntityKeyList = ({
  entity,
  filterList,
}: {
  entity: any;
  filterList?: string[];
}) => {
  const keyList = Object.keys(
    getConnection().getRepository(entity).metadata.propertiesMap
  );

  const basicFilterList = ["id", "createAt", "updateAt"];

  return keyList.filter(
    (key) => ![...basicFilterList, ...(filterList || [])]?.includes(key)
  );
};
