const ReadableProcess = require("../dev/ReadableProcess");

describe("Readable process class", () => {
  test("Minimal configuration", () => {
    const input = { args: ["--version"], file: "git.exe" };
    return new ReadableProcess(input).run();
  });
  test("Pipe", () => {
    const input = { args: ["--version"], file: "git.exe" };
    const proc = new ReadableProcess(input);
    proc.pipe(process.stdout);
    return proc.run();
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      args: ["--version"],
      file: "git.exe",
    };
    return new ReadableProcess(input)
      .on("data", () => {})
      .once("end", () => {})
      .once("error", () => {})
      .on("progress", () => {})
      .run();
  });
});
