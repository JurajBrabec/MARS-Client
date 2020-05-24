//if (require.main === module) testMars();

async function testMars() {
  const { nbu } = require("./lib/netBackup");
  const util = require("util");
  const { Database } = require("./lib/Database");
  const database = new Database();
  try {
    console.log(await database.test());
    await nbu.init();
    const source = nbu.vaults();
    console.log(await source.test());
    source.on("progress", console.log);
    //const result = await source.asObjects();
    const result = await source.toDatabase(database);
    console.log("Result:");
    console.log(util.inspect(result, false, null, true));
    console.log("Status:");
    console.log(util.inspect(source.status, false, null, true));
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log("Error: " + err.message);
  } finally {
    await database.pool.end();
  }
}

const Emitter = require("./lib/Emitter");
const Readable = require("./lib/Readable");
const Writable = require("./lib/Writable");
const Transform = require("./lib/Transform");
const { Database } = require("./lib/Database");

function testSync(Object, params, callback) {
  const object = new Object(params.options, params.func);
  if (params.debugEvents) {
    object.debugEvents();
  } else if (params.debug) object.debug();
  if (params.pipe) {
    object.pipe(params.pipe);
  } else if (params.onData) object.on("data", params.onData);
  object
    .execute(params.args)
    .then(params.onResult)
    .catch(params.onError)
    .finally(() => {
      params.onStatus(object.status);
      if (callback) callback();
    });
}
async function testAsync(Object, params, callback) {
  const object = new Object(params.options, params.func);
  if (params.debugEvents) {
    object.debugEvents();
  } else if (params.debug) object.debug();
  if (params.pipe) {
    object.pipe(params.pipe);
  } else if (params.onData) {
    object.on("data", params.onData);
  }
  try {
    const result = await object.execute(params.args);
    params.onResult(result);
  } catch (error) {
    params.onError(error);
  } finally {
    params.onStatus(object.status);
    if (callback) callback();
  }
}
function onData(data) {
  console.log(data);
}
function onResult(result) {
  console.log("Result:");
  console.log(result);
}
function onError(error) {
  console.log("Error:");
  console.log(error);
}
function onStatus(status) {
  console.log("Status:");
  console.log(status);
}

function test(aSync, objectMode, SourceClass, DestinationClass) {
  console.log(
    `\nTesting ${aSync ? "a" : ""}sync ${objectMode ? "object" : "string"} '${
      SourceClass.name
    }'${
      DestinationClass
        ? ` piped to '${
            DestinationClass === process.stdout
              ? "stdout"
              : DestinationClass.name
          }'`
        : ""
    }...`
  );
  let endFunc;
  const params = {
    debug: true,
    debugEvents: true,
    options: {},
    pipe: undefined,
    onData,
    onResult,
    onError,
    onStatus,
  };
  let options;
  let func;
  if (objectMode) {
    params.options = { objectMode };
    params.args = { name: "John" };
    options = { objectMode };
  } else {
    params.options = { encoding: "utf8" };
    params.args = "John";
    options = { defaultEncoding: "utf8", decodeStrings: false };
  }
  try {
    switch (SourceClass) {
      case Emitter.Command:
      case Emitter.Function:
      case Readable.Readable:
      case Readable.Function:
        break;
      case Emitter.File:
      case Emitter.Process:
      case Emitter.File:
      case Readable.Process:
        if (objectMode) throw `'${SourceClass.name}' in object mode!`;
        break;
      case Emitter.Sql:
      case Readable.Sql:
        if (!objectMode) throw `'${SourceClass.name}' not in object mode!`;
        break;
      default:
        throw `Unknown source class '${SourceClass.name}'!`;
    }
    switch (DestinationClass) {
      case undefined:
        break;
      case process.stdout:
      case Writable.File:
        if (objectMode)
          throw `'${SourceClass.name}' requires a destination in object mode!`;
        break;
      case Writable.Writable:
      case Writable.Function:
        break;
      case Writable.Sql:
        if (
          SourceClass !== Readable.Readable &&
          SourceClass !== Readable.Function
        )
          throw `Destination '${DestinationClass.name}' not supported for source '${SourceClass.name}'`;
        break;
      default:
        throw `Unknown destination class '${DestinationClass.name}'!`;
    }
    switch (SourceClass) {
      case Emitter.Command:
        break;
      case Emitter.Function:
        params.func = function (success, failure, args) {
          success(args);
        };
        break;
      case Readable.Function:
        params.func = function (push, success, failure, args) {
          for (let i = 1; i < 3; i++) push(args);
          success();
        };
        break;
      case Emitter.File:
      case Readable.File:
        params.options.fileName = "./package.json";
        break;
      case Emitter.Process:
      case Readable.Process:
        params.options.command = "dir";
        params.options.args = ["-s"];
        break;
      case Emitter.Sql:
      case Readable.Sql:
        params.options.database = new Database();
        params.options.sql = "select * from bpdbjobs_summary;";
        endFunc = () => params.options.database.pool.end();
        break;
    }
    switch (DestinationClass) {
      case undefined:
      case process.stdout:
      case Writable.Writable:
        break;
      case Writable.Function:
        func = function (chunk, encoding, success, failure) {
          console.log(encoding, chunk);
          return success();
        };
        break;
      case Writable.File:
        options.fileName = "./test.txt";
        break;
      case Writable.Sql:
        options.database = new Database();
        options.sql = "insert into test (name) values (:name);";
        endFunc = () => options.database.pool.end();
        break;
    }
    switch (SourceClass) {
      case Readable.Readable:
      case Readable.Function:
      case Readable.File:
      case Readable.Process:
      case Readable.Sql:
        let destination;
        switch (DestinationClass) {
          case undefined:
          case process.stdout:
            destination = DestinationClass;
            break;
          case Writable.Writable:
          case Writable.Function:
          case Writable.File:
          case Writable.Sql:
            destination = new DestinationClass(options, func).debugEvents();
            break;
        }
        if (destination) params.pipe = destination;
        break;
    }
    const testFunc = aSync ? testAsync : testSync;
    return testFunc(SourceClass, params, endFunc);
  } catch (error) {
    console.log("Error:", error);
  }
}

function allTests(aSync) {
  [
    Emitter.Command,
    Emitter.Function,
    Emitter.File,
    Emitter.Process,
    Emitter.Sql,
  ].forEach((Source) => {
    //      test(aSync, true, Source);
    //      test(aSync, false, Source);
  });
  [
    Readable.Readable,
    Readable.Function,
    Readable.File,
    Readable.Process,
    Readable.Sql,
  ].forEach((Source) => {
    [
      undefined,
      process.stdout,
      Writable.Writable,
      Writable.Function,
      Writable.Sql,
    ].forEach((Destination) => {
      test(aSync, true, Source, Destination);
      //        test(aSync, false, Source, Destination);
    });
  });
  console.log("\nDone.\n");
}

const aSync = true;
//const aSync = true;
const objectMode = true;
//const objectMode = true;

//test(aSync, objectMode, Readable.Function, Writable.Sql);
allTests(aSync);

function testTransform() {
  class CT1 extends Transform.Transform {
    _transform = () =>
      this.expect(/^ITEM/)
        .split(/^(?:ITEM)/m)
        .trim()
        .split(/(?:\nSUBITEM)/m)
        .trim()
        .separate(" ")
        .unpivot()
        .ucase()
        .get();
  }
  let text = `ITEM a0 b0 c0\n`;
  text += `SUBITEM d e f\n`;
  text += `SUBITEM g h i\n`;
  text += `ITEM a1 b1 c1\n`;
  text += `SUBITEM d e f\n`;
  text += `SUBITEM g h i\n`;

  const ct = new CT1();

  let result;
  try {
    result = ct.transform(text);
  } catch (error) {
    result = error;
  }
  console.log(result);
  console.log(
    `Level:${ct.level} Groups:${ct.groups} Rows:${ct.rowsTotal} (${ct.rows}/group) Fields:${ct.fields} Duration:${ct.elapsed}ms`
  );
}
testTransform();
