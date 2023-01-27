import { join } from "path";
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
  entities: [__dirname + "/entities/*.*"],
  migrations: [__dirname + "/migrations/*.*"],
  subscribers: [__dirname + "/subscribers/*.*"],
  cli: {
    entitiesDir: __dirname + "/entities",
    migrationsDir: __dirname + "/migrations",
    subscribersDir: __dirname + "/subscribers",
  },
};

export default ormconfig;
