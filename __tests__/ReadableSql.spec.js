const ReadableSql = require("../dev/ReadableSql");
const database = require("../dev/Database");

describe("Readable process class", () => {
  test("Minimal configuration", () => {
    const input = { database, sql: "show grants;" };
    return new ReadableSql(input).run();
  });
  test("Pipe", () => {
    const input = { database, sql: "show grants;" };
    const sql = new ReadableSql(input);
    sql.pipe(process.stdout);
    return sql.run();
  });
  test("Event handlers", () => {
    database.debug();
    const input = {
      debug: true,
      database,
      sql: "show grants;",
    };
    return new ReadableSql(input)
      .on("data", () => {})
      .once("end", () => {})
      .once("error", () => {})
      .on("progress", () => {})
      .run()
      .then((result) => expect(result).toBeUndefined());
  });
  test("Pool end", () => {
    const input = { database, sql: "show grants;" };
    return new ReadableSql(input).run().finally(() => database.end());
  });
});
