const debug = require("debug")("ReadableSql");
const ReadableFile = require("./ReadableFile");

class ReadableSql extends ReadableFile {
  constructor(options) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ pool: null, sql: null },
      ...options,
    };
    super(options);
    return this;
  }

  _read(args) {
    if (this._source) return;
    debug("_read", args);
    this.pool
      .getConnection()
      .then((connection) => {
        debug("connection", connection.threadId);
        connection.on("error", (error) => debug("error", error));
        this._source = connection;
        return connection.queryStream(this.sql, args);
      })
      .then((query) => {
        debug("query");
        query
          //          .on("data", (row) => debug("row", row))
          .once("end", () => debug("ending"))
          .once("error", (error) => debug("error", error))
          .on("fields", (fields) => debug("fields", fields))
          .on("data", (row) => this.push(JSON.stringify(row)))
          .once("end", () => this.end())
          .once("error", (error) => this.error(error))
          .on("fields", (fields) =>
            this.emit("fields", JSON.stringify(fields))
          );
      })
      .catch((error) => this.error(error))
      .finally(() => this._source.release());
  }
}
module.exports = ReadableSql;
