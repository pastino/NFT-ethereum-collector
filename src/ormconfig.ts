import { ConnectionOptions } from "typeorm";

const ormconfig: ConnectionOptions = {
  type: "mysql",
  host: process.env.HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  synchronize: true,
  logging: ["warn", "error"],
  entities: ["./entities/**/*.ts"],
  migrations: ["./migrations/**/*.ts"],
  subscribers: ["./subscribers/**/*.ts"],
  cli: {
    entitiesDir: "./entities",
    migrationsDir: "./migrations",
    subscribersDir: "./subscribers",
  },
};

export default ormconfig;
