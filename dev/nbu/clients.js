const { Nbu } = require('./nbu');
const Database = require('../Database');

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.clients();
    await stream
      .on('data', async (data) => console.log(await Database.batch(data)))
      .run();
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    Database.end();
  }
}

main();
