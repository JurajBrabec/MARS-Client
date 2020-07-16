const { Nbu } = require('./nbu');
const Database = require('../Database');

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.files({ all: true });
    //    const stream = await nbu.files({ backupId: 1 });
    //    const stream = await nbu.files({client:"test"});
    await stream
      .asBatch(2048)
      .on('data', async (data) => console.log(await Database.batch(data)))
      .on('progress', (progress) => console.log(progress))
      .run();
  } catch (error) {
    console.log('Error:', error);
  } finally {
    Database.end();
  }
}

main();
