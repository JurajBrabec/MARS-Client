const dotenv = require('dotenv').config();
const debug = require('debug')('Database');
const mariadb = require('mariadb');

const params = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 1,
  namedPlaceholders: true,
  queryTimeout: 300000,
  socketTimeout: 300000,
  acquireTimeout: 300000,
};

function batch(objects) {
  debug('batch', objects);
  if (!_pool) return Promise.reject(_error);
  return Promise.all(
    Object.values(objects).map((table) => _pool.batch(table.sql, table.rows))
  );
}
function debugEnabled(enabled = true) {
  debug.enabled = enabled;
  return this;
}
async function end() {
  if (!_pool) return;
  if (_pool.taskQueueSize()) return setTimeout(end, 250);
  debug('end');
  await release();
  await _pool.end();
}
async function init() {
  if (_pool) return _pool;
  _pool = mariadb
    .createPool(params)
    .on('acquire', () => debug(`connection acquired`))
    .on('connection', (conn) => debug(`connection ${conn.threadId} created`))
    .on('enqueue', () => debug(`command enqueued (Q=${_pool.taskQueueSize()})`))
    .on('error', (err) => debug(`error ${err.message || err}`))
    .on('release', (conn) =>
      debug(`connection ${conn.threadId} released (Q=${_pool.taskQueueSize()})`)
    );
  try {
    const _conn = await _pool.getConnection();
    await _conn.release();
  } catch (error) {
    _pool = null;
    _error = error.message || error;
  }
  return _pool;
}
function query(sql, args) {
  if (!_pool) return Promise.reject(_error);
  debug('query', sql, args);
  return _pool.query(sql, args);
}
function queryStream(sql, args) {
  debug('queryStream', sql, args);
  return new Promise((resolve, reject) => {
    if (!_pool) return reject(_error);
    _pool
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

let _connection = null;
let _error = null;
let _pool = null;

module.exports = {
  batch,
  debug: debugEnabled,
  end,
  init,
  query,
  queryStream,
  release,
};
