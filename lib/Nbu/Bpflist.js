module.exports = ({ nbu, target }) => ({
  Files: {
    binary: {
      file: [nbu.bin, "/admincmd/bpflist.exe"].join("/"),
      args: ["-l"],
    },
    structure: {
      delimiter: /\r?\n(?=FILES)/m,
      chain: (source, target) =>
        source
          .expect(/^FILES/m)
          .split()
          .trim()
          .replace(/\r?\n/g, " ")
          .quoted("/")
          .separate(" ")
          .filter("FILES")
          .replace("*NULL*", null)
          .debug()
          .expect(34)
          .assign(target),
      flush: (target) => target.end(),
      target,
    },
    data: {
      bpflist_backupid: [
        { masterServer: nbu.masterServer, key: true },
        { image_version: "number" },
        { client_type: "number" },
        /*         { dummy1: "string", ignore: true },
        { dummy2: "string", ignore: true },
        { dummy3: "string", ignore: true },
        { dummy4: "string", ignore: true },
        { dummy5: "string", ignore: true },
        { dummy6: "string", ignore: true },
        { dummy7: "string", ignore: true },
        { dummy8: "string", ignore: true },
        { dummy9: "string", ignore: true },
 */
        { start_time: "number" },
        { timeStamp: "number" },
        { schedule_type: "number" },
        { client: "string" },
        { policy_name: "string" },
        { backupId: "string", key: true },
        { dummy10: "string", ignore: true },
        { peer_name: "string" },
        { lines: "number" },
        { options: "number" },
        { user_name: "string" },
        { group_name: "string" },
        { dummy11: "string", ignore: true },
        { raw_partition_id: "number" },
        { jobid: "number" },
        { file_number: "number", key: true },
        { compressed_size: "number" },
        { path_length: "number" },
        { data_length: "number" },
        { block: "number" },
        { in_image: "number" },
        { raw_size: "number" },
        { gb: "number" },
        { device_number: "number" },
        { path: "string" },
        { directory_bits: "number" },
        { owner: "string" },
        { group: "string" },
        { bytes: "number" },
        { access_time: "number" },
        { modification_time: "number" },
        { inode_time: "number" },
      ],
    },
  },
});
