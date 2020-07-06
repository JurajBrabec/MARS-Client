const fs = require("fs");
const { Nbu } = require("./dev/nbu/nbu");
const { Jobs } = require("./dev/nbu/bpdbjobs");
const { Actions, Parser } = require("./dev/TextParser");
const tables = require("./lib/Tables");

const nbu = new Nbu();
const command = new Jobs(nbu);
tables.create(command.tables);

const text = fs.readFileSync(
  "D:\\Veritas\\Netbackup\\bin\\admincmd\\bpdbjobs\\reportmost_columns.txt",
  { encoding: "utf8" }
);
const { Column, Row } = Actions;
const actions = [
  Column.expect(/^\d+,/),
  Row.split(/\r?\n/m),
  Column.filter(""),
  Column.separate(","),
  Row.expect(64),
];
const parser = new Parser(actions);
const result = parser.parseText(text);
console.log(tables.fromParser(result));

//command
//  .asBatch()
//  .on("data", (data) => console.log(data))
//  .run()
//  .then((objects) => console.log(objects))
//  .catch((error) => console.log(error));
