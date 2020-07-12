const fs = require('fs');
const { Nbu } = require('./dev/nbu/nbu');
const { Policies } = require('./dev/nbu/bppllist');
const { Actions, Parser } = require('./dev/TextParser');
const tables = require('./lib/Tables');

const nbu = new Nbu();
const command = new Policies(nbu);
tables.create(command.tables);

let text = fs.readFileSync(
  'D:\\Veritas\\Netbackup\\bin\\admincmd\\bppllist\\allpolicies.txt',
  { encoding: 'utf8' }
);
const parser = new Parser(command.parser).debug();
const result = parser.parseText(text);
console.log(tables.fromParser(result));

//command
//  .asBatch()
//  .on("data", (data) => console.log(data))
//  .run()
//  .then((objects) => console.log(objects))
//  .catch((error) => console.log(error));
