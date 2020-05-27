isDate = (value) => !isNaN(Date.parse(value));
isFloat = (value) => Number(value) === value;
isNumber = (value) => isFloat(value) && value % 1 === 0;
isString = (value) => typeof value === "string";
isType = (value) => ["string", "number", "float", "date"].includes(value);

create = (props) => {
  props = { ...{ ignore: false, key: false }, ...props };
  const name = Object.keys(props).find(
    (key) => !["ignore", "key"].includes(key)
  );
  if (!name) throw new Error("Field name not provided.");
  const definition = props[name];
  let type = "string";
  let regExp;
  let value;
  if (definition instanceof RegExp) {
    const string = definition.source;
    regExp = definition;
    if (/\\d\+[\:|\-|\/]\\d\+/.test(string)) type = "date";
    if (/\(\\d\+\.\\d\+\)/.test(string)) type = "float";
    if (/\(\\d\+\)/.test(string)) type = "number";
  } else {
    if (isType(definition)) {
      type = definition;
    } else {
      value = definition;
      if (isDate(definition)) type = "date";
      if (isFloat(definition)) type = "float";
      if (isNumber(definition)) type = "number";
    }
  }
  const ignore = props.ignore;
  const update = !props.key;
  return new Field({ name, type, regExp, value, update, ignore });
};
set = (field, value) => {
  const result = {};
  const name = field.name;
  if (value === undefined) {
    value = field.value;
  } else {
    if (field.regExp) {
      let match = value.match(field.regExp);
      if (match) {
        field.regExp.global || match.shift();
        value = match.join("\n").trim();
      } else {
        value = undefined;
      }
    }
  }
  if (value === "" || value === "null") value = null;
  if ((value !== null) & (value !== undefined)) {
    const err = `field "${name}" value "${value}"`;
    switch (field.type) {
      case "number":
        value = Number(value);
        if (!isNumber(value)) throw new Error(`${err} not a number.`);
        break;
      case "float":
        value = Number(value);
        if (!isFloat(value)) throw new Error(`${err} not a float.`);
        break;
      case "string":
        value = String(value);
        if (!isString(value)) throw new Error(`${err} not a string.`);
        break;
      case "date":
        value = new Date(value);
        if (!isDate(value)) throw new Error(`${err} not a date.`);
        break;
    }
  }
  result[name] = value;
  return result;
};

class Field {
  constructor({ name, type, regExp, value, update, ignore }) {
    Object.assign(this, { name, type, regExp, value, update, ignore });
  }
}

module.exports = { Field, create, set };
