const { Nbu } = require('./nbu');
const Database = require('../Database');

const nbu = new Nbu();
nbu
  .jobs()
  //  .jobs({all:true})
  //  .jobs({daysBack:1})
  .on('data', async (data) => console.log(await Database.batch(data)))
  .run()
  .catch((error) => console.log('Error:', error))
  .finally(() => Database.end());
