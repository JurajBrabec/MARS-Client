const EmitterFile = require("../dev/EmitterFile");

describe("Emitter class with `run` function", () => {
  test("Minimal configuration", () => {
    const input = {};
    return expect(new EmitterFile(input).run()).rejects.toMatch("null");
  });
  test("Successful run", () => {
    const input = { path: "./package.json" };
    return expect(new EmitterFile(input).run()).resolves.toMatch("test");
  });
  test("Unsuccessful run", () => {
    const input = { path: "./nonexistent.file" };
    return expect(new EmitterFile(input).run()).rejects.toMatch("ENOENT");
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      path: "./package.json",
    };
    return expect(
      new EmitterFile(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run("OK")
    ).resolves.toMatch("test");
  });
});
