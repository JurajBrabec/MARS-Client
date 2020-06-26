const { Nbu } = require("./nbu");

const nbu = new Nbu();
nbu
  .summary()
  //  .asBatch()
  //  .on("data", (data) => console.log(data))
  .run()
  .then((objects) => console.log(objects))
  .catch((error) => console.log(error));
