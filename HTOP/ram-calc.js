import {getRam} from 'HTOP/utils.js';

/** @param {NS} ns */
export async function main(ns) {
  let mainCost = ns.getScriptRam("HTOP/htop.js");
  let runnerCost = ns.getScriptRam("HTOP/htop-process-info-runner.js");
  let serverRam = getRam(ns, 'home');

  if (serverRam.max - serverRam.used <= Math.ceil(mainCost + runnerCost)) {
    ns.tprint("WARNING: LOW RAM DETECTED. SOME SCRIPTS MIGHT NOT BE ABLE TO RUN (Recommended, at least more than 20gb)")
  }

  ns.tprint(`INFO:
  Ram Requirements:

  Main Script: ${ns.formatRam(mainCost)}
  Runner Script: ${ns.formatRam(runnerCost)}

  TOTAL: ${ns.formatRam(mainCost + runnerCost)}
  Recommended in server: At least ${ns.formatRam(Math.pow(2, Math.ceil(Math.log2(mainCost + runnerCost))))}

  Current Server Ram: ${ns.formatRam(serverRam.max)}
  `)
}