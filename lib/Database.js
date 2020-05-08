const dotenv = require("dotenv").config();
const debug = require("debug");
const mariadb = require("mariadb");

class Database {
  params = {
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

  constructor() {
    this.pool = mariadb.createPool(this.params);
    this.dbg = debug("database");
    if (this.dbg.enabled) {
      this.pool
        .on("acquire", () => this.dbg(`connection acquired`))
        .on("connection", (conn) =>
          this.dbg(`connection ${conn.threadId} created`)
        )
        .on("enqueue", () => this.dbg(`command enqueued`))
        .on("error", (err) => this.dbg(`error ${err.message}`))
        .on("release", (conn) =>
          this.dbg(`connection ${conn.threadId} released`)
        );
    }
  }
  dateTime(value) {
    return value.toISOString().slice(0, 19).replace("T", " ");
  }
  test() {
    const result = {
      source: this.constructor.name,
      status: undefined,
    };
    let connection;
    return new Promise((resolve, reject) => {
      this.pool
        .getConnection()
        .then((conn) => {
          connection = conn;
          return conn.ping();
        })
        .then(() => {
          result.status = "OK";
          resolve(result);
        })
        .catch((err) => {
          result.error = err.code;
          result.status = err.message;
          reject(result);
        })
        .finally(() => {
          if (connection) connection.release();
        });
    });
  }
  sqlErrorHandler(err, rows) {
    let match = err.message.match(/INSERT INTO (\w+)/);
    const table = match ? match[1] : null;
    const result = { error: err.code, message: err.message, row: [] };
    switch (err.errno) {
      case 1048:
        match = err.message.match(/Column '(\w+)'/);
        result.message = `Column '${table}.${match[1]}' cannot be null.`;
        break;
      case 1054:
        match = err.message.match(/column '(\w+)'/);
        result.message = `Unknown column '${table}.${match[1]}'`;
        break;
      case 1406:
      case 1264:
        match = err.message.match(/column '(\w+)' at row (\d+)/);
        result.row = rows[match[2] - 1];
        const key = Object.keys(result.row).find(
          (key) => key.toLowerCase() === match[1].toLowerCase()
        );
        result.message = `'${table}.${match[1]}'='${result.row[key]}'`;
        break;
      case 1366:
        match = err.message.match(
          /Incorrect (\w+) value: (\S+) for column (\S+) at row (\d+)/
        );
        result.row = rows[match[4] - 1];
        result.message = `'${table}.${match[3]}'='${match[2]}'`;
        break;
    }
    if (!result.row.length) delete result.row;
    return result;
  }
}
module.exports = { Database };
