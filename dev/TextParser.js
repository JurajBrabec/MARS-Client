const debug = require("debug")("TextParser");

const asArray = (input) => (Array.isArray(input) ? input : [input]);

class Action {
  constructor(parser, params) {
    this.parser = parser;
    this.params =
      params && typeof params.prototype === "object" ? null : params;
  }
}

// CONFIG actions
class EndOfBuffer extends Action {
  config = () => (this.parser.eob = this.params);
}
class DelimitedBy extends Action {
  config = () => (this.parser.delimiter = this.params);
}
class SeparatedBy extends Action {
  config = () => (this.parser.separator = this.params);
}
class QuotedBy extends Action {
  config = () => (this.parser.quoteChar = this.params);
}
class EscapedBy extends Action {
  config = () => (this.parser.escapeChar = this.params);
}
class InGroups extends Action {
  config = () => (this.parser.inGroups = asArray(this.params));
}
class InRows extends Action {
  config = () => (this.parser.inRows = asArray(this.params));
}
class InColumns extends Action {
  config = () => (this.parser.inColumns = asArray(this.params));
}

// COLUMN actions
class Expect extends Action {
  column = (text) =>
    (
      this.params instanceof RegExp
        ? this.params.test(text)
        : text === this.params
    )
      ? text
      : this.parser.error(`Expected "${this.params}" got "${text}"`);
}
class LowerCase extends Action {
  column = (text) => text.toLowerCase();
}
class Quote extends Action {
  config = () => (this.quoteChar = this.params || this.parser.quoteChar);
  column = (text) => {
    const q = this.quoteChar;
    return (
      (new RegExp(`^${q}`).test(text) ? "" : q) +
      text +
      (new RegExp(`${q}$`).test(text) ? "" : q)
    );
  };
}
class Reject extends Action {
  column = (text) =>
    (
      this.params instanceof RegExp
        ? this.params.test(text)
        : text === this.params
    )
      ? this.parser.error(`Rejecting "${text}" because of "${this.params}"`)
      : text;
}
class Replace extends Action {
  config = () => {
    const [what, withText = ""] = asArray(this.params);
    this.regExp =
      what instanceof RegExp
        ? what
        : new RegExp(`^${what.replace(/(?=\W)/g, "\\")}$`, "gm");
    this.withText = withText;
  };
  column = (text) => {
    let result = text.replace(this.regExp, this.withText);
    if (result === "null") result = null;
    return result;
  };
}
class Separate extends Action {
  config = () => {
    const e = this.parser.escapeChar;
    const q = this.parser.quoteChar;
    const s = this.params || this.parser.separator;
    const pattern = `(${q}.*?${q}|(?:\\${e + s}|[^${
      q + s
    }])+|(?<=${s}))(?=${s}|$)`;
    this.regExp = new RegExp(pattern, "gm");
  };
  column = (text) => text.match(this.regExp);
}
class SplitColumns extends Action {
  config = () => (this.delimiter = this.params || this.parser.delimiter);
  column = (text) => text.split(this.delimiter);
}
class Trim extends Action {
  config = () => {
    const pattern = `^${this.params || "s"}+|${this.params || "s"}+$`;
    this.regExp = new RegExp(pattern, "gm");
  };
  column = (text) =>
    this.params ? text.replace(this.regExp, "") : text.trim();
}
class UnQuote extends Action {
  config = () => (this.quoteChar = this.params || this.parser.quoteChar);
  column = (text) =>
    text.replace(new RegExp(`^${this.quoteChar}|${this.quoteChar}$`, "g"), "");
}
class UpperCase extends Action {
  column = (text) => text.toUpperCase();
}

// ROW actions
class CopyColumns extends Action {
  config = () => (this.params = asArray(this.params));
  row = (array) => {
    this.parser.remember({
      columns: array.filter((column, index) => this.params.includes(index - 1)),
    });
    return array;
  };
}
class ExpectColumns extends Action {
  row = (array) =>
    array.length === this.params
      ? array
      : this.parser.error(
          `Expected ${this.params} columns got ${array.length} (${array})`
        );
}
class Filter extends Action {
  row = (array) =>
    array.filter((column) =>
      this.params instanceof RegExp
        ? !this.params.test(column)
        : column !== this.params
    );
}
class PopColumns extends Action {
  config = () => (this.columns = this.params || 1);
  row = (array) => array.slice(0, array.length - this.columns);
}
class PushColumns extends Action {
  config = () =>
    (this.texts = this.params || this.parser.recall("columns") || []);
  row = (array) => {
    this.texts.slice().forEach((text) => array.push(text));
    return array;
  };
}
class ShiftColumns extends Action {
  config = () => (this.length = this.params || 1);
  row = (array) => array.slice(this.length);
}
class SplitRows extends Action {
  config = () => (this.delimiter = this.params || this.parser.delimiter);
  row = (array) =>
    array
      .join(this.delimiter)
      .split(this.delimiter)
      .map((column) => [column]);
}
class UnPivotColumns extends Action {
  config = () => (this.columns = this.params || 1);
  row = (array) => {
    const columns = asArray(array.splice(0, this.columns));
    return array.map((column) =>
      [...columns, column].join(this.parser.separator)
    );
  };
}
class UnShiftColumns extends Action {
  config = () =>
    (this.texts = this.params || this.parser.recall("columns") || []);
  row = (array) => {
    this.texts
      .slice()
      .reverse()
      .forEach((text) => array.unshift(text));
    return array;
  };
}

//GROUP actions
class SplitGroups extends Action {
  config = () => (this.delimiter = this.params || this.parser.delimiter);
  group = (array) =>
    array
      .join(this.delimiter)
      .split(this.delimiter)
      .map((row) => [[row]]);
}
class UnPivotRow extends Action {
  group = (array) => {
    const rows = array.shift();
    return array.map((row) => [...rows, ...row]);
  };
}

class External extends Action {
  config = () => (this.external = this.params);
}

const Actions = {
  EndOfBuffer,
  DelimitedBy,
  SeparatedBy,
  QuotedBy,
  EscapedBy,
  InGroups,
  InRows,
  InColumns,
  Expect,
  LowerCase,
  Quote,
  Reject,
  Replace,
  Separate,
  SplitColumns,
  Trim,
  UnQuote,
  UpperCase,
  CopyColumns,
  ExpectColumns,
  Filter,
  PopColumns,
  PushColumns,
  ShiftColumns,
  SplitRows,
  UnPivotColumns,
  UnShiftColumns,
  SplitGroups,
  UnPivotRow,
  External,
};

const Set = {
  endOfBuffer: (eob) => ({ EndOfBuffer: eob }),
  delimiter: (delimiter) => ({ DelimitedBy: delimiter }),
  separator: (separator) => ({ SeparatedBy: separator }),
  quoteChar: (char) => ({ QuotedBy: char }),
  escapeChar: (char) => ({ EcapedBy: char }),
  external: (func) => ({ External: func }),
};
const Column = {
  expect: (match) => ({ Expect: match }),
  filter: (match) => ({ Filter: match }),
  in: (array) => ({ InColumns: array }),
  lowerCase: () => ({ LowerCase }),
  quote: (char) => ({ Quote: char }),
  reject: (match) => ({ Reject: match }),
  replace: (array) => ({ Replace: array }),
  separate: (separator) => ({ Separate: separator }),
  split: (delimiter) => ({ SplitColumns: delimiter }),
  trim: (char) => ({ Trim: char }),
  unQuote: (char) => ({ UnQuote: char }),
  upperCase: () => ({ UpperCase }),
};
const Row = {
  copy: (array) => ({ CopyColumns: array }),
  expect: (count) => ({ ExpectColumns: count }),
  in: (array) => ({ InRows: array }),
  pop: (count = 1) => ({ PopColumns: count }),
  push: (array) => ({ PushColumns: array }),
  shift: (count = 1) => ({ ShiftColumns: count }),
  split: (delimiter) => ({ SplitRows: delimiter }),
  unPivot: (count = 1) => ({ UnPivotColumns: count }),
  unShift: (array) => ({ UnShiftColumns: array }),
};
const Group = {
  in: (array) => ({ InGroups: array }),
  split: (delimiter) => ({ SplitGroups: delimiter }),
  unPivot: () => ({ UnPivotRow }),
};

class Parser {
  constructor(options = []) {
    return this.create(options);
  }
  action(action, index) {
    debug("action", index + 1, action);
    this.inGroups = null;
    this.inRows = null;
    this.inColumns = null;
    Object.entries(action).map(([name, params], index) => {
      debug("part", index + 1, name);
      const action = new Actions[name](this, params);
      if (action.config) action.config();
      if (action.external)
        this.contents = action.external(this.contents.join());
      if (action.group || action.row || action.column)
        this.contents = this.iterate(this.contents, action);
      debug("result", this.contents);
    });
  }
  asRow = asArray;
  asGroup = (input) =>
    Array.isArray(input)
      ? Array.isArray(input[0])
        ? input
        : [input]
      : [[input]];
  asContents = (input) =>
    Array.isArray(input)
      ? Array.isArray(input[0])
        ? Array.isArray(input[0][0])
          ? input
          : [input]
        : [[input]]
      : [[[input]]];
  bufferText(text, eob = this.eob) {
    this.buffer += text;
    if (!eob) {
      const firstAction = this.actions.find(
        (action) =>
          action.DelimitedBy ||
          action.SplitGroup ||
          action.SplitRows ||
          action.SeparatedBy ||
          action.Separate ||
          action.SplitColumns
      );
      eob = Object.values(firstAction)[0];
      if (typeof eob === "function") eob = this.delimiter || this.separator;
    }
    if (typeof eob === "string") eob = new RegExp(eob, "g");
    if (!eob.test(this.buffer)) return;
    const buffer = this.buffer.split(eob).pop();
    text = buffer.length ? this.buffer.slice(0, -buffer.length) : this.buffer;
    this.buffer = buffer;
    return this.parseText(text);
  }
  clear() {
    this.actions = [];
    this.buffer = "";
    this.delimiter = "\n";
    this.escapeChar = "\\";
    this.quoteChar = '"';
    this.separator = ",";
    this.memory = [];
    return this.setText("");
  }
  create(actions) {
    this.clear();
    this.actions = actions;
    return this;
  }
  debug(enabled = true) {
    debug.enabled = !!enabled;
    return this;
  }
  end() {
    return this.buffer.length ? this.parseText(this.buffer) : undefined;
  }
  endOfBuffer(eob) {
    this.eob = eob;
    return this;
  }
  error(error) {
    throw error;
  }
  iterateDebug(contents, action = {}) {
    debug("Iterator start:", JSON.stringify(contents));
    let result = contents.reduce((contents, group, index) => {
      debug(`Group#${index + 1} start:`, JSON.stringify(group));
      let result = group;
      if (!this.inGroups || this.inGroups.includes(index + 1)) {
        result = group.reduce((group, row, index) => {
          debug(`Row#${index + 1} start:`, JSON.stringify(row));
          let result = row;
          if (!this.inRows || this.inRows.includes(index + 1)) {
            result = row.reduce((row, column, index) => {
              let result = column;
              if (
                (!this.inColumns || this.inColumns.includes(index + 1)) &&
                action.column
              ) {
                debug(`Column#${index + 1} start:`, JSON.stringify(column));
                result = action.column(column);
                debug(`Column#${index + 1} action:`, JSON.stringify(result));
              }
              result = [].concat(row, this.asRow(result));
              debug(`Column#${index + 1} result:`, JSON.stringify(result));
              return result;
            }, []);
            if (action.row) {
              result = action.row(result);
              debug(`Row#${index + 1} action:`, JSON.stringify(result));
            }
          }
          result = []
            .concat(group, this.asGroup(result))
            .filter((row) => row.length);
          debug(`Row#${index + 1} result:`, JSON.stringify(result));
          return result;
        }, []);
        if (action.group) {
          result = action.group(result);
          debug(`Group#${index + 1} action:`, JSON.stringify(result));
        }
      }
      result = []
        .concat(contents, this.asContents(result))
        .filter((group) => group.length);
      debug(`Group#${index + 1} result:`, JSON.stringify(result));
      return result;
    }, []);
    debug("Iterator result:", JSON.stringify(result));
    return result;
  }
  iterate(contents, action = {}) {
    return contents.reduce((contents, group, index) => {
      let result = group;
      if (!this.inGroups || this.inGroups.includes(index + 1)) {
        result = group.reduce((group, row, index) => {
          let result = row;
          if (!this.inRows || this.inRows.includes(index + 1)) {
            result = row.reduce((row, column, index) => {
              let result = column;
              if (
                (!this.inColumns || this.inColumns.includes(index + 1)) &&
                action.column
              )
                result = action.column(column);
              return [].concat(row, this.asRow(result));
            }, []);
            if (action.row) result = action.row(result);
          }
          return []
            .concat(group, this.asGroup(result))
            .filter((row) => row.length);
        }, []);
        if (action.group) result = action.group(result);
      }
      return []
        .concat(contents, this.asContents(result))
        .filter((group) => group.length);
    }, []);
  }
  parseText(text = "") {
    this.setText(text);
    this.actions.map(this.action.bind(this));
    //    return this.contents;
    return JSON.stringify(this.contents);
  }
  remember(memory = {}) {
    Object.entries(memory).map(([key, value]) => (this.memory[key] = value));
    return this;
  }
  recall(memory = "") {
    return this.memory[memory];
  }
  setText(text) {
    this.contents = [[[text]]];
    return this;
  }
}

module.exports = { Actions: { Column, Group, Row, Set }, Parser };
