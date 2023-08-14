/** @param {NS} ns */
export async function main(ns) {
  ns.write('HTOP/cores.txt', ns.getServer(ns.args[0]).cpuCores, "w");
}