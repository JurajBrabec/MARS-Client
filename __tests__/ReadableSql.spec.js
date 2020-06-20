const ReadableSql = require("../dev/ReadableSql");
const pool = require("../dev/Database");

describe("Readable process class", () => {
  test("Minimal configuration", () => {
    const input = { pool, sql: "show tables;" };
    expect(new ReadableSql(input).run()).resolves;
  });
  test("Pipe", () => {
    const input = { pool, sql: "show tables;" };
    const sql = new ReadableSql(input);
    sql.pipe(process.stdout);
    expect(sql.run()).resolves;
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      pool,
      sql: "show tables;",
    };
    expect(
      new ReadableSql(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run()
    ).resolves;
  });
  test("Pool end", () => {
    const input = { pool, sql: "show tables;" };
    new ReadableSql(input).run().then(() => pool.end()).resolves;
  });
});
