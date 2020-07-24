const { NetBackup } = require('./lib/NetBackup');

const netBackup = new NetBackup();
netBackup
  .clients()
  //  .files()
  //  .files({ all: true })
  //  .files({ backupId: 1 })
  //  .files({ client: 'hostname' })
  //  .images()
  //  .images({ all: true })
  //  .images({ client: 'hostname' })
  //  .images({ daysBack: 3 })
  // .jobs()
  //  .jobs({ all: true })
  //  .jobs({ daysBack: 1 })
  //  .policies()
  //  .pureDisks()
  //  .retlevels()
  //  .slps()
  //  .summary()
  //  .vaults()
  .then((result) => result && console.log('Result:', result))
  .catch((error) => console.log('Error: ', error))
  .finally(() => netBackup.end());
