/** @param {NS} ns */
export async function main(ns) {
    let ri = ns.getResetInfo();
    let resetInfo = `${ri.lastAugReset}
${ri.lastNodeReset}`

    ns.write(`HTOP/reset-info.txt`, resetInfo, 'w');
}