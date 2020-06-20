const debug = require("debug")("emitterSql");
const EmitterFile = require("./EmitterFile");

class EmitterSql extends EmitterFile {
  constructor(options) {
    if (options.debug) debug.enabled = true;
    options = {
      ...{ database: null, sql: null },
      ...options,
    };
    super(options);
    return this;
  }
  _run(...args) {
    debug("_run", args);
    this.database
      .query(this.sql, args)
      .then((rows) => this._callback(null, JSON.stringify(rows)))
      .catch((error) => this._callback(error));
  }
}

module.exports = EmitterSql;
