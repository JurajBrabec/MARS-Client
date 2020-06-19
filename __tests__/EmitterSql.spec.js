const EmitterSql = require("../dev/EmitterSql");
const pool = require("../dev/Database");

describe("Emitter class for SQL commands", () => {
  test("Minimal configuration", () => {
    const input = { pool, sql: "show tables;" };
    return expect(new EmitterSql(input).run()).resolves.toMatch("Tables");
  });
  test("Successful run", () => {
    const input = { pool, sql: "show tables;" };
    return expect(new EmitterSql(input).run(["%xml"])).resolves.toMatch(
      "Tables"
    );
  });
  test("Unsuccessful run", () => {
    const input = { pool, sql: "badSql;" };
    return expect(new EmitterSql(input).run()).rejects.toMatch("1064");
  });
  test("Event handlers", () => {
    const input = {
      debug: true,
      pool,
      sql: "show tables;",
    };
    return expect(
      new EmitterSql(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run("OK")
    ).resolves.toMatch("Tables");
  });
});
