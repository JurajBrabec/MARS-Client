const dbg = require("debug")("db");
const mariadb = require("mariadb");

const params = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 1,
  namedPlaceholders: true,
  socketTimeout: 5000,
  acquireTimeout: 300000,
};

pool = mariadb.createPool(params);
if (dbg.enabled) {
  pool.on("acquire", () => dbg(`connection acquired`));
  pool.on("connection", (conn) => dbg(`connection ${conn.threadId} created`));
  pool.on("enqueue", () => dbg(`command enqueued`));
  pool.on("error", (err) => dbg(`error ${err.message}`));
  pool.on("release", (conn) => dbg(`connection ${conn.threadId} released`));
}
module.exports = { pool };
