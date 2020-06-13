module.exports = ({ nbu, target }) => ({
  Media: {
    binary: {
      file: [nbu.bin, "admincmd/bpimmedia.exe"].join("/"),
      args: ["-l"],
    },
    structure: {
      delimiter: /\r?\n(?=IMAGE)/m,
      chain: (source, target) =>
        source
          .expect(/^IMAGE/m)
          .split()
          .split(/\r?\n/m)
          .filter()
          .separate(" ")
          .filter("IMAGE")
          .filter("FRAG")
          .replace("*NULL*", null)
          .unpivot()
          .expect(34)
          .assign(target),
      flush: (target) => target.end(),
      target,
    },
    data: {
      bpimmedia: [
        { masterServer: nbu.masterServer, key: true },
        { name: "string" },
        { version: "number" },
        { backupId: "string", key: true },
        { policy_name: "string" },
        { policy_type: "number" },
        { sched_label: "string" },
        { sched_type: "number" },
        { retention: "number" },
        { num_files: "number" },
        { expiration: "number" },
        { compression: "number" },
        { encryption: "number" },
        { hold: "number" },
      ],
      bpimmedia_frags: [
        { masterServer: nbu.masterServer, key: true },
        { backupId: "string", key: true },
        { copy_number: "number", key: true },
        { fragment_number: "number", key: true },
        { kilobytes: "number" },
        { remainder: "number" },
        { media_type: "number" },
        { density: "number" },
        { file_number: "number" },
        { id_path: "string" },
        { host: "string" },
        { block_size: "number" },
        { offset: "number" },
        { media_date: "number" },
        { device_written_on: "number" },
        { f_flags: "number" },
        { media_descriptor: "string" },
        { expiration: "number" },
        { mpx: "number" },
        { retention_level: "number" },
        { checkpoint: "number" },
        { copy_on_hold: "number" },
      ],
    },
  },
});
