const ReadableProcess = require("../dev/ReadableProcess");

describe("Readable process class", () => {
  test("Minimal configuration", () => {
    const input = { args: ["--version"], file: "git.exe" };
    expect(new ReadableProcess(input).run()).resolves;
  });
  test("Pipe", () => {
    const input = { args: ["--version"], file: "git.exe" };
    const proc = new ReadableProcess(input);
    proc.pipe(process.stdout);
    expect(proc.run()).resolves;
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      args: ["--version"],
      file: "git.exe",
    };
    expect(
      new ReadableProcess(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run()
    ).resolves;
  });
});
