const Emitter = require("../dev/Emitter");

describe("Emitter class with `run` function", () => {
  test("Minimal configuration", () => {
    const input = {};
    return expect(new Emitter(input).run()).resolves.toBe("test");
  });
  test("Successful run with multiple arguments", () => {
    const input = {
      run(args) {
        this.data("Run", args);
        this.end();
      },
    };
    return expect(new Emitter(input).run("OK")).resolves.toBe("RunOK");
  });
  test("Raising error", () => {
    const input = {
      run(args) {
        this.error(args);
      },
    };
    return expect(new Emitter(input).run("Error")).rejects.toBe("Error");
  });
  test("Throwing error", () => {
    const input = {
      run(args) {
        throw new Error(args);
      },
    };
    return expect(new Emitter(input).run("Error")).rejects.toBe("Error");
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      run(args) {
        this.progress(1, 2);
        this.data(args);
        this.end();
      },
    };
    return expect(
      new Emitter(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run("OK")
    ).resolves.toBe("OK");
  });
});
