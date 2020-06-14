const nbu = require("./lib/Nbu");
const Tables = require("./lib/Tables");
const {
  EmitterProcess,
  ReadableProcess,
  Parser,
  TransformParser,
  Writable,
} = require("./lib/TextParsers");

const destination = new Writable({
  defaultEncoding: "utf8",
  objectMode: true,
  write(chunk, encoding, callback) {
    console.log(chunk);
    callback();
  },
});

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

async function test({
  stream = false,
  pipe = false,
  bufferUntil = 1,
  rowsPerBatch = 1,
}) {
  await nbu.masterServer;
  console.log("master Server:", nbu.masterServer);

  const { Clients } = require("./lib/Nbu/Bpplclients")({ nbu, target: Tables });
  const { binary, structure, data } = Clients;

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
    console.log("Master Server:", await nbu.masterServer);
    const batch = await nbu.clients(params);
    console.log("Batch:", batch);
  } catch (error) {
    console.log("Error:", error);
  }
}
async function nbuAsyncStream(params) {
  try {
    console.log("Master Server:", await nbu.masterServer);
    await nbu.pipe(destination).files(params);
  } catch (error) {
    console.log("Error:", error);
  }
}

nbuAsyncStream({ all: true });

//test({ rowsPerBatch: 2048, stream: true, pipe: true });

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
