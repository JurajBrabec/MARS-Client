const debug = require("debug")("Parser");

delimiter = "\n";
escapeChar = "\\";
quoteChar = '"';
separator = ",";

_actions = [];
_buffer = "";
_items = [];

function _iterate(item, func = {}) {
  func = { ...{ text: (t) => t, row: (r) => r }, ...func };
  let result;
  if (_isText(item)) {
    result = func.text(item);
  } else if (_hasText(item)) {
    result = item.map((item) => _iterate(item, func));
    result = func.row(result);
  } else {
    result = item
      .map((item) => _iterate(item, func))
      .filter((row) => row && row.length);
  }
  return result;
}
function _action(result, action, index) {
  debug("action", index + 1, action);
  return Object.entries(action).reduce((result, [name, param], index) => {
    debug("part", index + 1, name);
    let e;
    let p;
    let q;
    let r1;
    let r2;
    let s;
    const func = {};
    switch (name) {
      case "expect":
        if (typeof param === "number") {
          func.row = (row) =>
            row.length === param
              ? row
              : _error(`Expected ${param} strings got ${row.length}`);
        } else {
          func.text = (text) =>
            _match(text, param)
              ? text
              : _error(`Expected text "${param}" got "${text}"`);
        }
        break;
      case "external":
        func.text = param;
        break;
      case "filter":
        func.row = (row) => row.filter((text) => !_match(param, text));
        break;
      case "lcase":
        func.text = (text) => text.toLowerCase();
        break;
      case "pop":
        func.row = (row) => {
          //          row.pop();
          row.splice(-param, param);
          return row.length === 1 ? row[0] : row;
        };
        break;
      case "quote":
        q = param;
        r1 = new RegExp(`^${q}`);
        r2 = new RegExp(`${q}$`);
        func.text = (text) =>
          (r1.test(text) ? "" : q) + text + (r2.test(text) ? "" : q);
        break;
      case "reject":
        func.text = (text) =>
          _match(text, param)
            ? _error(`Rejecting text "${param}" found`)
            : text;
        break;
      case "replace":
        func.text = (text) =>
          text === param[0] ? param[1] : text.replace(...param);
        break;
      case "separate":
        e = escapeChar;
        q = quoteChar;
        s = param;
        p = `(${q}.*?${q}|(?:\\${e + s}|[^${q + s}])+|(?<=${s}))(?=${s}|$)`;
        r1 = new RegExp(p, "gm");
        func.text = (text) => text.match(r1);
        break;
      case "shift":
        func.row = (row) => {
          //          row.shift();
          row.splice(0, param);
          return row.length === 1 ? row[0] : row;
        };
        break;
      case "split":
        func.text = (text) => text.split(param);
        break;
      case "ucase":
        func.text = (text) => text.toUpperCase();
        break;
      case "unpivot":
        func.row = (row) => {
          firstText = row.shift();
          return row.map((text) => firstText + separator + text);
        };
        break;
      case "unquote":
        q = param;
        r1 = new RegExp(`^${q}|${q}$`, "g");
        func.text = (text) => text.replace(r1, "");
        break;
      case "trim":
        r1 = undefined;
        if (param instanceof RegExp) param = param.source;
        if (param) r1 = new RegExp(`^${param}+|${param}+$`, "gm");
        func.text = r1 ? (text) => text.replace(r1, "") : (text) => text.trim();
        break;
      default:
        break;
    }
    result = _flatten(_iterate(result, func));
    debug(result);
    return result;
  }, result);
}
function _addAction(action) {
  debug("addAction", _actions.length, action);
  _actions.push(action);
}
function _flatten(items) {
  if (
    !Array.isArray(items) ||
    !Array.isArray(items[0]) ||
    !Array.isArray(items[0][0])
  )
    return items;
  const flattened = [];
  items.map((item) => item.map((subItem) => flattened.push(subItem)));
  return flattened;
}
_hasText = (v) => _isText(v[0]);
_isText = (v) => !Array.isArray(v);
_match = (v, m) => (m instanceof RegExp ? m.test(v) : v === m);
function _error(error) {
  throw error;
}
function buffer(text) {
  debug("buffer", text);
  _buffer += text;
  action1 = _actions.find((action) => action.split || action.separate);
  const r = action1.split || action1.separate;
  if (!r.test(_buffer)) return;
  const newBuffer = _buffer.split(r).pop();
  text = newBuffer.length ? _buffer.slice(0, -newBuffer.length) : _buffer;
  _buffer = newBuffer;
  return JSON.stringify(_actions.reduce(_action, text));
}
function clear() {
  _actions = [];
  return this;
}
function create(actions) {
  debug("create", actions);
  clear();
  actions.map((action) =>
    Object.entries(action).map((item) => {
      const [key, value] = item;
      switch (key) {
        case "debug":
          debugEnabled(value);
          break;
        case "delimited":
          delimited(value);
          break;
        case "escaped":
          escaped(value);
          break;
        case "expect":
          expect(value);
          break;
        case "external":
          external(value);
          break;
        case "filter":
          filter(value);
          break;
        case "lcase":
          lcase();
          break;
        case "pop":
          pop(value);
          break;
        case "quoted":
          quoted(value);
          break;
        case "quote":
          quote(value);
          break;
        case "reject":
          reject(value);
          break;
        case "replace":
          replace(...value);
          break;
        case "shift":
          shift(value);
          break;
        case "separate":
          separate(value);
          break;
        case "separated":
          separated(value);
          break;
        case "split":
          split(value);
          break;
        case "ucase":
          ucase();
          break;
        case "unpivot":
          unpivot();
          break;
        case "unquote":
          unquote(value);
          break;
        case "trim":
          trim(value);
          break;
        default:
          _error(`Unknown action ${key}`);
          break;
      }
    })
  );
  return this;
}
function debugEnabled(enabled = true) {
  debug.enabled = enabled;
  return this;
}
function delimited(delimited = delimiter) {
  delimiter = delimited;
  return this;
}
function end() {
  debug("end");
  if (!_buffer.length) return;
  return JSON.stringify(_actions.reduce(_action, _buffer));
}
function escaped(escaped = escapeChar) {
  escapeChar = escaped;
  return this;
}
function expect(expected) {
  _addAction({ expect: expected });
  return this;
}
function external(func) {
  _addAction({ external: func });
  return this;
}
function filter(filtered = "") {
  _addAction({ filter: filtered });
  return this;
}
function lcase() {
  _addAction({ lcase: null });
  return this;
}
function parse(text) {
  debug("parse", text);
  return JSON.stringify(_actions.reduce(_action, text));
}
function pop(rows = 1) {
  _addAction({ pop: rows });
  return this;
}
function quoted(quoted = quoteChar) {
  quoteChar = quoted;
  return this;
}
function quote(quoted = quoteChar) {
  _addAction({ quote: quoted });
  return this;
}
function reject(rejected) {
  _addAction({ reject: rejected });
  return this;
}
function replace(found, replaced = "") {
  _addAction({ replace: [found, replaced] });
  return this;
}
function shift(rows = 1) {
  _addAction({ shift: rows });
  return this;
}
function separate(separated = separator) {
  _addAction({ separate: separated, filter: null, trim: null });
  return this;
}
function separated(separated = separator) {
  separator = separated;
  return this;
}
function split(delimited = delimiter) {
  _addAction({ split: delimited, filter: null, trim: null });
  return this;
}
function ucase() {
  _addAction({ ucase: null });
  return this;
}
function unpivot() {
  _addAction({ unpivot: null });
  return this;
}
function unquote(quoted = quoteChar) {
  quoteChar = quoted;
  _addAction({ unquote: quoted, trim: null });
  return this;
}
function trim(trimmed) {
  _addAction({ trim: trimmed });
  return this;
}

module.exports = {
  buffer,
  clear,
  create,
  debug: debugEnabled,
  delimited,
  end,
  escaped,
  expect,
  external,
  filter,
  lcase,
  parse,
  pop,
  quote,
  quoted,
  reject,
  replace,
  separate,
  separated,
  shift,
  split,
  ucase,
  unpivot,
  unquote,
  trim,
};
