const mariadb = require("mariadb");

class Database {
  constructor(config) {
    mariadb
      .createConnection(config)
      .then(connection => {
        this.connection = connection;
      })
      .catch(err => {
        throw err;
      });
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
module.exports = Database;
