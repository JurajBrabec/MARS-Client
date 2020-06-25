const debug = require("debug")("ReadableSql");
const ReadableFile = require("./ReadableFile");

class ReadableSql extends ReadableFile {
  constructor(options = {}) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ database: null, sql: null },
      ...options,
    };
    super(options);
    return this;
  }

  _read(args) {
    if (this._source) return;
    debug("_read", args);
    this._source = this.database;
    this.database
      .queryStream(this.sql, args)
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
      .finally(() => this.database.release());
  }
}
module.exports = ReadableSql;
