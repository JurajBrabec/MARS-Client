const { Nbu } = require('./nbu');

const nbu = new Nbu();
nbu
  .vaults()
  .then((command) =>
    command
      .asBatch()
      //  .on("data", (data) => console.log(data))
      .run()
  )
  .then((objects) => console.log(objects))
  .catch((error) => console.log(error))
  .finally(() => console.log('Done'));
