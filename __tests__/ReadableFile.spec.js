const ReadableFile = require("../dev/ReadableFile");

describe("Readable file class", () => {
  test("Minimal configuration", () => {
    const input = { path: "./package.json" };
    return new ReadableFile(input).run();
  });
  test("Pipe", () => {
    const input = { path: "./package.json" };
    const proc = new ReadableFile(input);
    proc.pipe(process.stdout);
    return proc.run();
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      path: "./package.json",
    };
    return new ReadableFile(input)
      .on("data", () => {})
      .once("end", () => {})
      .once("error", () => {})
      .on("progress", () => {})
      .run();
  });
});
