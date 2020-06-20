const dotenv = require("dotenv").config();
const debug = require("debug")("Database");
const mariadb = require("mariadb");

params = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 1,
  namedPlaceholders: true,
  socketTimeout: 300000,
  acquireTimeout: 300000,
};

module.exports = mariadb
  .createPool(params)
  .on("acquire", () => debug(`connection acquired`))
  .on("connection", (conn) => debug(`connection ${conn.threadId} created`))
  .on("enqueue", () => debug(`command enqueued`))
  .on("error", (err) => debug(`error ${err.message}`))
  .on("release", (conn) => debug(`connection ${conn.threadId} released`));
