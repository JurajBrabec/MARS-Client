const { Nbu } = require('./nbu');
const Database = require('../Database');

const nbu = new Nbu();
nbu
  .vaults()
  .then((command) =>
    command
      .asBatch(2048)
      //  .on("data", (data) => console.log(data))
      .run()
  )
  .then((objects) => Database.batch(objects))
  .then((result) => console.log('Done:', result))
  .catch((error) => console.log('Error:', error))
  .finally(() => Database.end());
