const { Nbu } = require('./nbu');

const nbu = new Nbu();
nbu
  .jobs()
  //  .jobs({all:true})
  //  .jobs({daysBack:1})
  .on('data', (data) => console.log(data))
  .run()
  .then(() => console.log('Done'))
  .catch((error) => console.log(error));
