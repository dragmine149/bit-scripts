/** @param {NS} ns */
export async function main(ns) {
  // temp;
  if (ns.args[0] == '--builder') {
    ns.run('py/builder.js');
    ns.exit();
  }

  ns.run('py/runner.js', {temporary:true});
  ns.exit();
}