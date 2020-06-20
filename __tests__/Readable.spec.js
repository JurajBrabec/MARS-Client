const Readable = require("../dev/Readable");

describe("Readable class with `read` function", () => {
  test("Minimal configuration", () => {
    const input = {};
    return new Readable(input).run();
  });
  test("Successful run", () => {
    const input = {
      read(size) {
        this.push("success");
        this.end();
      },
    };
    return new Readable(input).run();
  });
  test("Raising error", () => {
    const input = {
      read(size) {
        this.error("error");
      },
    };
    return expect(new Readable(input).run()).rejects.toMatch("error");
  });
  test("Throwing error", () => {
    const input = {
      read(size) {
        this.error(new Error("error"));
      },
    };
    return expect(new Readable(input).run()).rejects.toMatch("error");
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      read(size) {
        this.progress(1, 2);
        this.push("success");
        this.push(null);
      },
    };
    return new Readable(input)
      .on("data", () => {})
      .once("end", () => {})
      .once("error", () => {})
      .on("progress", () => {})
      .run();
  });
});
