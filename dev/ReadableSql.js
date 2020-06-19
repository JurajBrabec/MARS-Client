const debug = require("debug")("readableSql");
const ReadableFile = require("./ReadableFile");

class ReadableSql extends ReadableFile {
  constructor(options) {
    options = {
      ...{ database: null, sql: null },
      ...options,
    };
    super(options);
    this.database.pool
      .on("acquire", (conn) => debug("acquired", conn.threadId))
      .on("connection", (conn) => debug("connection", conn.threadId))
      .on("enqueue", () => debug("enqueued"))
      .on("error", (error) => debug("error", error))
      .on("release", (conn) => debug("released", conn));
    return this;
  }

  async _read(args) {
    let connection;
    try {
      connection = await this.database.pool
        .getConnection()
        .on("error", (error) => debug("error", error));
      const query = await connection
        .queryStream(this.sql, args)
        .on("fields", (fields) => debug("fields", fields))
        .on("data", (row) => debug("row", row))
        .once("end", () => debug("ending"))
        .once("error", (error) => debug("error", error))
        .on("data", (row) => this.push(row))
        .once("end", () => this.end())
        .once("error", (error) => this.error(error));
    } catch (error) {
      this.error(error);
    } finally {
      connection.release();
    }
  }
}

module.exports = ReadableSql;
