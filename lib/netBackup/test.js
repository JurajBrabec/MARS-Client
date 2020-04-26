const { EventEmitter } = require("events");
const { execFile } = require("child_process");
const bbPromise = require("bluebird");

const stream = process.stdout;
const path = "D:/Veritas/NetBackup/bin/admincmd";
const binary = "bpflist.exe";
const args = ["-l"];

class Cmd extends EventEmitter {
  startProgress() {
    if (this.progress) this.stopProgress();
    this.progress = setInterval(() => {
      this.emit("progress", this.progressValue());
    }, 1000);
  }
  progressValue() {
    return 1;
  }
  stopProgress() {
    if (this.progress) clearInterval(this.progress);
  }
  runOnce() {
    return this.run();
  }
  runMany(count, concurrency) {
    this.count = count;
    this.done = 0;
    this.progressValue = () => Math.ceil((100 * this.done) / this.count);
    this.on("exit", () => this.done++);
    this.startProgress();
    return bbPromise.map(
      Array(count),
      (index) => {
        return this.run();
      },
      { concurrency }
    );
  }
  run() {
    return new bbPromise((resolve, reject) => {
      const cmd = path + "/" + binary;
      this.emit("start", [cmd, ...args].join(" "));
      const proc = execFile(path + "/" + binary, args, {
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
      })
        .on("error", (err) => {
          this.emit("error", err);
          reject(err);
        })
        .on("exit", (code) => {
          this.emit("exit", code);
          resolve(code);
        });
      proc.stderr.pipe(stream);
      proc.stdout.pipe(stream);
    });
  }
}
const p = new Cmd()
  .on("start", (msg) => console.log(`Start: ${msg}`))
  .on("progress", (msg) => {
    console.log(`Progress: ${msg}%`);
  })
  .on("error", (msg) => console.log(`Error: ${msg}`))
  .on("exit", (msg) => console.log(`Exit: ${msg}`));
p.runMany(200, 2)
  .then((res) => console.log(`Done (E: ${res})`))
  .catch((err) => console.log(err))
  .finally(() => p.stopProgress());
