const { Nbu } = require('./nbu');
const Database = require('../Database');

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.images({ all: true });
    //    const stream = await nbu.images({client:"test"});
    //    const stream = await nbu.images({daysBack:1});
    await stream
      .asBatch(2048)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .on('progress', (progress) => console.log(progress))
      .run();
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    Database.end();
  }
}

main();
