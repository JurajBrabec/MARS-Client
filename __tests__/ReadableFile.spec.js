const ReadableFile = require("../dev/ReadableFile");

describe("Readable file class", () => {
  test("Minimal configuration", () => {
    const input = { path: "./package.json" };
    expect(new ReadableFile(input).run()).resolves;
  });
  test("Pipe", () => {
    const input = { path: "./package.json" };
    const proc = new ReadableFile(input);
    proc.pipe(process.stdout);
    expect(proc.run()).resolves;
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      path: "./package.json",
    };
    expect(
      new ReadableFile(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run()
    ).resolves;
  });
});
