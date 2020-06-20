const Readable = require("./dev/Readable");

const command = new Readable({
  debug: true,
  read(size) {
    this.push("data");
    this.push(null);
  },
});
command
  .on("data", (data) => console.log(">Data:", data))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress));
//  .pipe(process.stdout);
command
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());
