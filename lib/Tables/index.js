const Table = require('./Table');

let = _tables = null;

function create(props) {
  _tables = Object.entries(props).map((table) =>
    Table.create(Object.fromEntries([table])).get()
  );
  return this;
}
function asArray() {
  check();
  _tables.map((table) => Table.use(table).asArray());
  return this;
}
function asBatch(rows) {
  check();
  _tables.map((table) => Table.use(table).asBatch(rows));
  return this;
}
function asObject() {
  check();
  _tables.map((table) => Table.use(table).asObject());
  return this;
}
function assign(array) {
  check();
  if (!Array.isArray(array[0])) array = [array];
  const rows = {};
  array.map((array) => {
    const assigned = _tables.reduce((row, table) => {
      const newRow = Table.use(table).assign(array);
      if (newRow) row[table.name] = newRow;
      return row;
    }, {});
    merge(rows, assigned);
  });
  return Object.keys(rows).length > 0 ? rows : null;
}
function fromParser(text) {
  check();
  const array = JSON.parse(text);
  const rows = {};
  array.map((group, index) => {
    const table = _tables[index];
    group.map((row) => {
      const newRow = Table.use(table).assign(row);
      if (newRow) {
        const added = {};
        added[table.name] = newRow;
        merge(rows, added);
      }
    });
  });
  return Object.keys(rows).length > 0 ? rows : null;
}
function batch(rows) {
  check();
  if (rows === null) return rows;
  return _tables.reduce((row, table) => {
    const batched = Table.use(table).batch(rows[table.name]);
    if (batched) row[table.name] = batched;
    return row;
  }, {});
}
function buffer(size) {
  check();
  if (size === undefined) {
    return _tables.reduce((rows, table) => {
      const buffered = Table.use(table).buffer();
      if (buffered) rows[table.name] = buffered;
      return rows;
    }, {});
  } else {
    _tables.map((table) => Table.use(table).buffer(size));
    return this;
  }
}
function check() {
  if (!_tables) throw new Error('Tables are not created yet.');
}
function clear(size) {
  check();
  _tables.map((table) => Table.use(table).clear(size));
  return this;
}
function dirty() {
  check();
  result = 0;
  _tables.map((table) => (result += Table.use(table).dirty()));
  return result;
}
function end() {
  return dirty() ? flush() : null;
}
function fields() {
  check();
  return _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).fields();
    return row;
  }, []);
}
function flush() {
  check();
  return _tables.reduce((rows, table) => {
    const flushed = Table.use(table).flush();
    if (flushed) rows[table.name] = flushed;
    return rows;
  }, {});
}
function get() {
  return _tables;
}
function match(text) {
  check();
  const matched = _tables.reduce((row, table) => {
    const matched = Table.use(table).match(text);
    if (matched) row[table.name] = matched;
    return row;
  }, {});
  return Object.keys(matched).length > 0 ? matched : null;
}
function merge(rows, added) {
  Object.keys(added).map((table) => {
    if (!rows[table]) {
      rows[table] = added[table];
    } else {
      const tableMode = rows[table].rows ? 'batch' : 'object';
      if (tableMode === 'batch')
        rows[table].rows = rows[table].rows.concat(added[table].rows);
      if (tableMode === 'object')
        rows[table] = rows[table].concat(added[table]);
    }
  });
  return rows;
}
function row() {
  check();
  return _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).row();
    return row;
  }, {});
}
function use(tables) {
  if (tables) _tables = tables;
  return this;
}
module.exports = {
  asArray,
  asBatch,
  asObject,
  assign,
  batch,
  buffer,
  create,
  clear,
  dirty,
  end,
  fields,
  flush,
  fromParser,
  get,
  match,
  merge,
  row,
  use,
};
