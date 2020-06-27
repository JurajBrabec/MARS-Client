const { Nbu } = require("./nbu");

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.files({ all: true });
    //    const stream = await nbu.files({backupId:1});
    //    const stream = await nbu.files({client:"test"});
    await stream.on("data", (data) => console.log(data)).run();
  } catch (error) {
    console.log("Error: ", error);
  } finally {
    console.log("Done");
  }
}

main();
