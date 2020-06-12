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
        params.command = function (emit, args) {
          emit.success(args);
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
function testArgs({ arg1 = 1, arg2 = 2 } = {}) {
  console.log(arg1, arg2);
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

const nbu = require("./lib/Nbu");
async function test({
  stream = false,
  pipe = false,
  bufferUntil = 0,
  rowsPerBatch = 0,
}) {
  const Tables = require("./lib/Tables");
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
    write(chunk, encoding, callback) {
      //if (chunk && chunk.length)  console.log(chunk);
      if (!Array.isArray(chunk)) chunk = [chunk];
      onBatch(Array.isArray(chunk) ? chunk : [chunk]);
      callback();
    },
  });
  await nbu.masterServer;
  console.log(nbu.masterServer);

  const binary = {
    file: [nbu.bin, "admincmd/bpflist.exe"].join("/"),
    args: ["-l"],
  };
  const structure = {
    delimiter: /^FILES /m,
    chain: (source, target) =>
      source
        .split()
        .trim()
        .replace(/\*NULL\*/g, "")
        .replace(/\r?\n/g, " ")
        .expect(/^\d+/)
        .quoted("/")
        .separate(" ")
        .expect(43)
        .assign(target),
    target: Tables,
  };
  const data = {
    bpflist_backupid: [
      { masterServer: nbu.masterServer, key: true },
      { image_version: "number" },
      { client_type: "number" },
      { dummy1: "string", ignore: true },
      { dummy2: "string", ignore: true },
      { dummy3: "string", ignore: true },
      { dummy4: "string", ignore: true },
      { dummy5: "string", ignore: true },
      { dummy6: "string", ignore: true },
      { dummy7: "string", ignore: true },
      { dummy8: "string", ignore: true },
      { dummy9: "string", ignore: true },
      { start_time: "number" },
      { timeStamp: "number" },
      { schedule_type: "number" },
      { client: "string" },
      { policy_name: "string" },
      { backupId: "string", key: true },
      { dummy10: "string", ignore: true },
      { peer_name: "string" },
      { lines: "number" },
      { options: "number" },
      { user_name: "string" },
      { group_name: "string" },
      { dummy11: "string", ignore: true },
      { raw_partition_id: "number" },
      { jobid: "number" },
      { file_number: "number", key: true },
      { compressed_size: "number" },
      { path_length: "number" },
      { data_length: "number" },
      { block: "number" },
      { in_image: "number" },
      { raw_size: "number" },
      { gb: "number" },
      { device_number: "number" },
      { path: "string" },
      { directory_bits: "number" },
      { owner: "string" },
      { group: "string" },
      { bytes: "number" },
      { access_time: "number" },
      { modification_time: "number" },
      { inode_time: "number" },
    ],
  };
  function onBatch(batch) {
    console.log("Batch:", batch);
    console.log("Batch length:", batch.length);
    console.log(
      "Rows:",
      batch.reduce(
        (rows, item) =>
          rows + Object.keys(item).reduce((r, t) => r + item[t].rows.length, 0),
        0
      )
    );
  }
  function onData(data) {
    const buffer = parser.buffer(data);
    if (buffer) writable.write(buffer);
  }
  function onClose() {
    writable.end(parser.end());
  }

  Tables.create(data).asBatch(rowsPerBatch);
  const parser = new Parser(structure);
  let proc;
  try {
    if (stream) {
      // Stream
      proc = new ReadableProcess(binary);
      if (pipe) {
        // Stream pipe
        console.log("Stream (pipe)");
        proc.pipe(new TransformParser({ parser })).pipe(writable);
        await proc.execute();
      } else {
        // Stream event
        console.log("Stream (event)");
        await proc.on("data", onData).once("close", onClose).execute();
      }
    } else {
      // Emitter
      console.log("Emitter");
      proc = new EmitterProcess(binary);
      let batch = parser.parse(await proc.execute()) || [];
      if (Tables.dirty()) batch.push(Tables.flush());
      onBatch(batch);
    }
  } catch (error) {
    console.log("Error:", error);
  } finally {
    console.log("Status:", proc.status.get());
  }
}
//test({ rowsPerBatch: 2048, stream: false, pipe: true, bufferUntil: 1024 });

const { Writable } = require("./lib/TextParsers");
const destination = new Writable({
  defaultEncoding: "utf8",
  objectMode: true,
  write(chunk, encoding, callback) {
    console.log(chunk);
    callback();
  },
});

async function masterServer() {
  console.log("Master Server:", await nbu.masterServer);
}
function nbuPromise(params) {
  nbu.masterServer
    .then(() => nbu.summary(params))
    .then((batch) => console.log("Batch:", batch))
    .catch((error) => console.log("Error:", error));
}
function nbuPromiseStream(params) {
  nbu.masterServer
    .then(() => nbu.pipe(destination).files(params))
    .then(() => console.log("Done"))
    .catch((error) => console.log("Error:", error));
}

async function nbuAsync(params) {
  try {
    await nbu.masterServer;
    const batch = await nbu.summary(params);
    console.log("Batch:", batch);
  } catch (error) {
    console.log("Error:", error);
  }
}
async function nbuAsyncStream(params) {
  try {
    await nbu.masterServer;
    await nbu.pipe(destination).files(params);
  } catch (error) {
    console.log("Error:", error);
  }
}

nbuAsync({ jobId: 2 });

/* 
RowArray=[value,...]
RowArrays=[RowArray,...]

nullRow=null
EmptyRow={}
RowObject={field:value,...}
nullRows=null
EmptyRows=[]
RowObjects=[RowObject,...]

nullTable = null;
emptyTable={}
BatchTable={table:{sqlQuery,RowObjects}}
nullTables=null
emptyTables=[]
BatchTables=[BatchTable]


Database.batchWrite(BatchTable).fromObjects(BatchTables)
<-Tables.asBatchTables().fromArray(RowObjects)
<-Parser.asArray({delimiter=\n,parserChain:{}}).fromText({text})
<-Command.asText({path})

Database.batchWrite(BatchTable).fromObjects(BatchTables)
<-Tables.asBatchTables().buffered({bufferSize:1024}).fromArray(RowObjects)
<-Parser.asArray({delimiter=\n,parserChain:{},parserEnd:{}}).buffered({bufferSize:1024}).fromText({text})
<-Command.outputStream({path})

Database.batchWrite(BatchTable).fromPipe(Readable)
<-Tables.asBatchTables().buffered({bufferSize:1024}).fromPipe(Readable)
<-Parser.asArray({delimiter=\n,parserChain:{},parserEnd:{}}).buffered({bufferSize:1024}).fromPipe(Readable)
<-Command.outputStream({path})

database.endBatch(BatchTables|null)<-Tables.endBuffer(RowObjects|null)<-parser.endBuffer(text|null)<-command.endStream()

 */
