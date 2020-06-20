const Readable = require("../dev/Readable");

describe("Readable class with `read` function", () => {
  test("Minimal configuration", () => {
    const input = {};
    expect(new Readable(input).run()).resolves;
  });
  test("Successful run", () => {
    const input = {
      read(size) {
        this.push("success");
        this.end();
      },
    };
    expect(new Readable(input).run()).resolves;
  });
  test("Raising error", () => {
    const input = {
      read(size) {
        this.error("error");
      },
    };
    expect(new Readable(input).run()).rejects;
  });
  test("Throwing error", () => {
    const input = {
      read(size) {
        this.error(new Error("error"));
      },
    };
    expect(new Readable(input).run()).rejects;
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
    expect(
      new Readable(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run()
    ).resolves;
  });
});
