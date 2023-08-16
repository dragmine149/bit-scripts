import {getRam} from 'HTOP/utils.js';

/** @param {NS} ns */
export async function main(ns) {
  let mainCost = ns.getScriptRam("HTOP/htop.js");
  let runnerCost = ns.getScriptRam("HTOP/htop-process-info-runner.js");
  let restartCost = ns.getScriptRam("HTOP/rs.js");
  let serverRam = getRam(ns, 'home');

  if (serverRam.max - serverRam.used <= Math.ceil(mainCost + runnerCost + restartCost)) {
    ns.tprint("WARNING: LOW RAM DETECTED. SOME SCRIPTS MIGHT NOT BE ABLE TO RUN (Recommended, at least more than 20gb)")
  }

  ns.tprint(`INFO:
  Ram Requirements:
  
  MINIMUM:
  Main Script: ${ns.formatRam(mainCost)}
  Runner Script: ${ns.formatRam(runnerCost)}

  Optional:
  Restart Script: ${ns.formatRam(restartCost)}

  TOTAL:
  minimum: ${ns.formatRam(mainCost + runnerCost)}
  optional: ${ns.formatRam(restartCost)}

  Total: ${ns.formatRam(mainCost + runnerCost + restartCost)}
  Recommended: At least ${ns.formatRam(Math.ceil(mainCost + runnerCost + restartCost))}


  Server Ram: ${ns.formatRam(serverRam.max)}
  `)
}