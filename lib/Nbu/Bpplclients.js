module.exports = ({ nbu, target }) => ({
  Clients: {
    binary: {
      file: [nbu.bin, "/admincmd/bpplclients.exe"].join("/"),
      args: ["-allunique", "-l"],
    },
    structure: {
      delimiter: /\r?\n(?=CLIENT)/m,
      chain: (source, target) =>
        source
          .expect(/^CLIENT/m)
          .split()
          .trim()
          .separate(" ")
          .filter("CLIENT")
          .replace("*NULL*", null)
          .expect(7)
          .assign(target),
      flush: (target) => target.end(),
      target,
    },
    data: {
      bpplclients: [
        { masterServer: nbu.masterServer, key: true },
        { name: "string", key: true },
        { architecture: "string" },
        { os: "string" },
        { priority: "number" },
        { u1: "number" },
        { u2: "number" },
        { u3: "number" },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    },
  },
});
