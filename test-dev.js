const fs = require('fs');
const { Nbu } = require('./dev/nbu/nbu');
const { SLPs } = require('./dev/nbu/nbstl');
const { Actions, Parser } = require('./dev/TextParser');
const tables = require('./lib/Tables');

const nbu = new Nbu();
const command = new SLPs(nbu);
tables.create(command.tables);

let text = fs.readFileSync(
  'D:\\Veritas\\Netbackup\\bin\\admincmd\\nbstl\\l.txt',
  { encoding: 'utf8' }
);
const { Row, Set } = Actions;
const actions = [
  Set.delimiter(/\r?\n(?=[A-Za-z]+)/),
  Set.separator(' '),
  Set.external((text) => [
    text.split(/\r?\n(?=[A-Za-z]+)/).reduce(
      (array, text) => [
        ...array,
        ...text
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter((item) => item.length)
          .reduce((array, line, index) => {
            if (index) {
              array.push(
                [firstLine, line]
                  .join(' ')
                  .split(' ')
                  .map((item) => (item === '*NULL*' ? null : item))
              );
            } else {
              firstLine = line;
            }
            return array;
          }, []),
      ],
      []
    ),
  ]),
  Row.expect(21),
];
const parser = new Parser(actions).debug();
const result = parser.parseText(text);
console.log(tables.fromParser(result));

//command
//  .asBatch()
//  .on("data", (data) => console.log(data))
//  .run()
//  .then((objects) => console.log(objects))
//  .catch((error) => console.log(error));
