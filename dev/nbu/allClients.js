const { Nbu } = require('./nbu');

const nbu = new Nbu();
nbu
  .allClients()
  .then((objects) => console.log(objects))
  .catch((error) => console.log(error));
