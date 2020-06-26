const Emitter = require("./Emitter");
const Stream = require("./Stream");

function dateTime(value) {
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
function dateDiff(diffDays = 0) {
  return dateTime(new Date().setDate(new Date().getDate() + diffDays));
}

module.exports = { Emitter, Stream, dateDiff, dateTime };
