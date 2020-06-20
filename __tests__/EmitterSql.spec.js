const EmitterSql = require("../dev/EmitterSql");
const database = require("../dev/Database");

describe("Emitter class for SQL commands", () => {
  test("Minimal configuration", () => {
    const input = { database, sql: "show grants;" };
    return expect(new EmitterSql(input).run()).resolves.toMatch("Grants");
  });
  test("Successful run", () => {
    const input = { database, sql: "show grants;" };
    return expect(new EmitterSql(input).run(["%xml"])).resolves.toMatch(
      "Grants"
    );
  });
  test("Unsuccessful run", () => {
    const input = { database, sql: "badSql;" };
    return expect(new EmitterSql(input).run()).rejects.toMatch("1064");
  });
  test("Event handlers", () => {
    database.debug();
    const input = {
      debug: true,
      database,
      sql: "show grants;",
    };
    return expect(
      new EmitterSql(input)
        .on("data", () => {})
        .once("end", () => {})
        .once("error", () => {})
        .on("progress", () => {})
        .run("OK")
    ).resolves.toMatch("Grants");
  });
  test("Database end", () => {
    const input = { database, sql: "show grants;" };
    new EmitterSql(input).run().then(() => database.end()).resolves;
  });
});
