const { action } = require("commander");
const { clear } = require("../lib/Tables/Table");

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
      case "filter":
        func.row = (row) => row.filter((text) => !_match(param, text));
        break;
      case "lcase":
        func.text = (text) => text.toLowerCase();
        break;
      case "pop":
        func.row = (row) => {
          row.pop();
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
        func.text = (text) => text.replace(...param);
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
          row.shift();
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
    result = _iterate(result, func);
    debug(result);
    return result;
  }, result);
}
function _addAction(action) {
  debug("addAction", _actions.length, action);
  _actions.push(action);
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
          shift();
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
function delimited(delimited) {
  delimiter = delimited;
  return this;
}
function end() {
  debug("end");
  if (!_buffer.length) return;
  return JSON.stringify(_actions.reduce(_action, _buffer));
}
function escaped(escaped) {
  escapeChar = escaped;
  return this;
}
function expect(expected) {
  _addAction({ expect: expected });
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
function pop() {
  _addAction({ pop: null });
  return this;
}
function quoted(quoted) {
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
function shift() {
  _addAction({ shift: null });
  return this;
}
function separate(separated = separator) {
  _addAction({ separate: separated, filter: null, trim: null });
  return this;
}
function separated(separated) {
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
