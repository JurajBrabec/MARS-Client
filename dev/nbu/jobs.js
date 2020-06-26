const bpdbjobs = require("./bpdbjobs");

bpdbjobs
  .jobsDaysBack(3)
  .on("data", (data) => console.log(data))
  .run()
  .then(() => console.log("Done"))
  .catch((error) => console.log(error));
