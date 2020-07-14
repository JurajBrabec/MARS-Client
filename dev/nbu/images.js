const { Nbu } = require('./nbu');

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.images({ all: true });
    //    const stream = await nbu.images({client:"test"});
    //    const stream = await nbu.images({daysBack:1});
    await stream
      .asBatch()
      .on('data', (data) => console.log(data))
      .on('progress', (progress) => console.log(progress))
      .run();
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    console.log('Done');
  }
}

main();
