const { Nbu } = require('./nbu');

const nbu = new Nbu();

async function main() {
  try {
    const stream = await nbu.files({ all: true });
    //    const stream = await nbu.files({ backupId: 1 });
    //    const stream = await nbu.files({client:"test"});
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
