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
    console.log(util.inspect(source.status(), false, null, true));
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

const dotenv = require("dotenv").config();
const { emitter, readable, writable, parser } = require("./lib/TextParsers");
const { Tables } = require("./lib/Tables");
const { Database } = require("./lib/Database");

function testSync(Object, params, callback) {
  const object = new Object(params.options, params.func);
  if (params.pipe) {
    object.pipe(params.pipe);
  } else if (params.onData) object.on("data", params.onData);
  object
    .execute(params.args)
    .then(params.onResult)
    .catch(params.onError)
    .finally(() => {
      params.onStatus(object.status());
      if (callback) callback();
    });
}
async function testAsync(Object, params, callback) {
  const object = new Object(params.options, params.func);
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
    params.onStatus(object.status());
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
    options: {},
    pipe: undefined,
    onData,
    onResult,
    onError,
    onStatus,
  };
  let options;
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
      case emitter.Emitter:
        params.command = function (success, failure, args) {
          success(args);
        };
        break;
      case readable.Function:
        params.read = function () {
          for (let i = 1; i < 3; i++) this.push(args + i);
          this.push(null);
        };
        break;
      case emitter.File:
      case readable.File:
        params.options.path = "./package.json";
        break;
      case emitter.Process:
      case readable.Process:
        params.options.file = "dir";
        params.options.args = ["-s"];
        break;
      case emitter.Sql:
      case readable.Sql:
        params.options.database = new Database();
        params.options.sql = "select * from bpdbjobs_summary;";
        endFunc = () => params.options.database.pool.end();
        break;
    }
    switch (DestinationClass) {
      case undefined:
      case process.stdout:
      case writable.Writable:
        write = function (chunk, encoding, callback) {
          console.log(encoding, chunk);
          callback();
        };
        break;
      case writable.File:
        options.path = "./test.txt";
        break;
      case writable.Sql:
        options.database = new Database();
        options.sql = "insert into test (name) values (:name);";
        endFunc = () => options.database.pool.end();
        break;
    }
    switch (SourceClass) {
      case readable.Readable:
      case readable.File:
      case readable.Process:
      case readable.Sql:
        let destination;
        switch (DestinationClass) {
          case undefined:
          case process.stdout:
            destination = DestinationClass;
            break;
          case writable.Writable:
          case writable.File:
          case writable.Sql:
            destination = new DestinationClass(options, func);
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
  [emitter.Emitter, emitter.File, emitter.Process, emitter.Sql].forEach(
    (Source) => {
      //      test(aSync, true, Source);
      //      test(aSync, false, Source);
    }
  );
  [readable.Readable, readable.File, readable.Process, readable.Sql].forEach(
    (Source) => {
      [undefined, process.stdout, writable.Writable, writable.Sql].forEach(
        (Destination) => {
          test(aSync, true, Source, Destination);
          //        test(aSync, false, Source, Destination);
        }
      );
    }
  );
  console.log("\nDone.\n");
}

const aSync = true;
//const aSync = true;
const objectMode = true;
//const objectMode = true;

//test(aSync, objectMode, Readable.Readable, Writable.Sql);
//allTests(aSync);

function testLiteralStrings() {
  function literalString(strings, ...params) {
    return { strings, params };
  }
  const p1 = "p1";
  const p2 = "p2";
  const s = literalString`s1 ${p1} s2 ${p2} s3`;
  console.log({ s });
}

function parserExample() {
  let text = `#name,age,points
John,33,145
Peter,25,29`;

  console.log(text);

  let result = new parser.Parser(text)
    .split("\n")
    .filter(/#/)
    .separate(",")
    .expect(3)
    .get();

  console.log(result);
}

async function test() {
  const { Tables } = require("./lib/Tables");
  const {
    EmitterProcess,
    ReadableProcess,
    Parser,
    TransformParser,
    Writable,
  } = require("./lib/TextParsers");

  const writable = new Writable({
    defaultEncoding: "utf8",
    objectMode: true,
    write: (data, encoding, success, failure) => {
      if (data) console.log(data);
      success();
    },
  });
  const nbu = { bin: process.env.NBU_BIN };
  // SUMMARY

  const tables = new Tables({
    bpdbjobs_summary: [
      { masterServer: /^Summary of jobs on (\S+)/m, key: true },
      { queued: /^Queued:\s+(\d+)/m },
      { waiting: /^Waiting-to-Retry:\s+(\d+)/m },
      { active: /^Active:\s+(\d+)/m },
      { successful: /^Successful:\s+(\d+)/m },
      { partial: /^Partially Successful:\s+(\d+)/m },
      { failed: /^Failed:\s+(\d+)/m },
      { incomplete: /^Incomplete:\s+(\d+)/m },
      { suspended: /^Suspended:\s+(\d+)/m },
      { total: /^Total:\s+(\d+)/m },
    ],
  });

  const processDefinition = {
    file: [nbu.bin, "bin/admincmd/bpdbjobs.exe"].join("/"),
    args: ["-summary", "-l"],
  };
  const parserDefinition = {
    actionChain: (source) => source.expect(/^Summary/).match(tables),
    splitBuffer: /(\r?\n){2}/m,
  };
  let proc;
  try {
    // Emitter
    proc = new EmitterProcess(processDefinition);
    const result = new Parser(parserDefinition).parse(await proc.execute());
    console.log(result);
    // Stream
    //    const parser = new Parser(parserDefinition);
    //  proc = new ReadableProcess(processDefinition);
    // Stream onData
    //    await proc
    //      .on("data", (data) => writable.write(parser.buffer(data)))
    //      .on("exit", () => writable.write(parser.flush()))
    //      .execute();
    // Stream pipe
    //proc.pipe(new TransformParser({ parser })).pipe(writable);
    //await proc.execute();
  } catch (error) {
    console.log("E:", error);
  } finally {
    console.log(proc.status());
  }
}
test();
