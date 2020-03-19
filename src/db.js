const Database = require("./database");
const dotenv = require("dotenv");

dotenv.config();
const params = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 10
};
let query = "select now();";

function dbInline() {
  try {
    const mariadb = require("mariadb");
    console.log("Connecting...");
    mariadb
      .createConnection(params)
      .then(conn => {
        console.log("Querying...");
        conn
          .query("select now(?);", [2])
          .then(rows => {
            console.log("Rows#1:");
            console.log(rows);
            console.log("Querying again...");
            return conn.query(query);
          })
          .then(
            rows => {
              console.log("Rows#2:");
              console.log(rows);
              console.log("Closing...");
              return conn.end();
            },
            err => {
              return conn.end().then(() => {
                console.log("Query error: " + err.message);
                //              throw err;
              });
            }
          )
          .catch(err => {
            console.log("Connection error: " + err.message);
          });
      })
      .catch(err => {
        console.log(err);
      });
  } catch (err) {
    console.log("Catch error: " + err.message);
  } finally {
    console.log("Finally.");
  }
}
function dbClass() {
  try {
    const database = new Database(params);
    console.log("Querying...");
    database
      .query("show users;")
      .then(rows => {
        console.log("Users:");
        console.log(rows);
        return database.query(query);
      })
      .then(
        rows => {
          console.log("Rows:");
          console.log(rows);
          console.log("Closing...");
          return database.close();
        },
        err => {
          return database.close().then(() => {
            console.log("Query error:");
            console.error(err);
            throw err;
          });
        }
      )
      .catch(err => {
        console.log("Database error:");
        console.error(err);
      });
  } catch (err) {
    console.log("Catch error:");
    console.error(err);
  } finally {
    console.log("Finally.");
  }
}

async function asyncFunction(pool, query) {
  let rows;
  try {
    console.log("Connecting...");
    const conn = await pool.getConnection();
    try {
      console.log("Querying...");
      rows = await conn.query(query);
      console.log(rows);
    } finally {
      console.log("Releasing...");
      conn.release();
    }
  } catch (err) {
    console.log("Error: " + err.message);
  } finally {
    console.log("Leaving...");
    pool.end();
  }
}

function dbAsync() {
  const mariadb = require("mariadb");
  let pool;
  try {
    console.log("Starting...");
    pool = mariadb.createPool(params);
    asyncFunction(pool, query);
  } catch (err) {
    console.log("Connection error:" + err.message);
  } finally {
    console.log("Ending...");
  }
}
dbAsync();
//dbClass();
//dbInline();
