const EmitterProcess = require("../dev/EmitterProcess");

describe("Emitter class for process execution", () => {
  test("Minimal configuration", () => {
    const input = {};
    return expect(new EmitterProcess(input).run()).rejects.toMatch("null");
  });
  test("Successful run", () => {
    const input = { args: ["--version"], file: "git.exe" };
    return expect(new EmitterProcess(input).run()).resolves.toMatch(
      "git version"
    );
  });
  test("Unsuccessful run", () => {
    const input = { file: "./nonexistent.file" };
    return expect(new EmitterProcess(input).run()).rejects.toMatch("ENOENT");
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      args: ["--version"],
      file: "git.exe",
    };
    return expect(
      new EmitterProcess(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run("OK")
    ).resolves.toMatch("git version");
  });
});
