const { Nbu } = require("./nbu");

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.retlevels();
    const objects = await stream
      //      .on("data", (data) => console.log(data))
      .asBatch()
      .run();
    console.log(objects);
  } catch (error) {
    console.log("Error: ", error);
  } finally {
    console.log("Done");
  }
}

main();
