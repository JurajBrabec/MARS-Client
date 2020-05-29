const dotenv = require("dotenv").config();

class NetBackup {
  constructor(options) {
    this.bin = options.data;
    this.data = options.data || options.path;
    this.masterServer = null;
  }
  dateTime(value) {
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      //  timeZone: "America/Los_Angeles",
    };
    return new Intl.DateTimeFormat("en-US", options)
      .format(value)
      .replace(",", "");
  }
  dateDiff(diffDays = 0) {
    return this.dateTime(new Date().setDate(new Date().getDate() + diffDays));
  }
}

var nbu = new NetBackup({
  bin: process.env.NBU_BIN,
  data: process.env.NBU_DATA,
});
module.exports = { nbu };
