const dotenv = require('dotenv').config();
const debug = require('debug')('Database');
const mariadb = require('mariadb');

params = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 1,
  namedPlaceholders: true,
  socketTimeout: 300000,
  acquireTimeout: 300000,
};

function batch(objects) {
  debug('batch', objects);
  return Promise.all(
    Object.values(objects).map((table) => pool.batch(table.sql, table.rows))
  );
}
function debugEnabled(enabled = true) {
  debug.enabled = enabled;
  return this;
}
async function end() {
  if (pool.taskQueueSize()) return setTimeout(end, 250);
  debug('end');
  await release();
  await pool.end();
}
function query(sql, args) {
  debug('query', sql, args);
  return pool.query(sql, args);
}
function queryStream(sql, args) {
  debug('queryStream', sql, args);
  return new Promise((resolve, reject) => {
    pool
      .getConnection()
      .then((connection) => {
        debug('connection', connection.threadId);
        connection.on('error', (error) => debug('error', error));
        _connection = connection;
        resolve(connection.queryStream(sql, args));
      })
      .catch((error) => reject(error));
  });
}
function release() {
  debug('release');
  return _connection ? _connection.release() : Promise.resolve();
}
_connection = null;
pool = mariadb
  .createPool(params)
  .on('acquire', () => debug(`connection acquired`))
  .on('connection', (conn) => debug(`connection ${conn.threadId} created`))
  .on('enqueue', () => debug(`command enqueued (Q=${pool.taskQueueSize()})`))
  .on('error', (err) => debug(`error ${err.message}`))
  .on('release', (conn) =>
    debug(`connection ${conn.threadId} released (Q=${pool.taskQueueSize()})`)
  );

module.exports = {
  batch,
  debug: debugEnabled,
  end,
  query,
  queryStream,
  release,
};
