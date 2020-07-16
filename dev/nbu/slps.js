const { Nbu } = require('./nbu');
const Database = require('../Database');

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.slps();
    const objects = await stream
      //      .on("data", (data) => console.log(data))
      .asBatch(2048)
      .run();
    console.log('Done:', await Database.batch(objects));
  } catch (error) {
    console.log('Error:', error);
  } finally {
    Database.end();
  }
}

main();
