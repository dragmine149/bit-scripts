import {getRam} from 'HTOP/utils.js';

/** @param {NS} ns */
export async function main(ns) {
  let mainCost = ns.getScriptRam("HTOP/htop.js");
  let runnerCost = ns.getScriptRam("HTOP/htop-process-info-runner.js");
  let cpuCost = ns.getScriptRam("HTOP/cpu.js");
  let restartCost = ns.getScriptRam("HTOP/rs.js");
  let serverRam = getRam(ns, 'home');

  if (serverRam.max - serverRam.used <= Math.ceil(mainCost + runnerCost + cpuCost + restartCost)) {
    ns.tprint("WARNING: LOW RAM DETECTED. SOME SCRIPTS MIGHT NOT BE ABLE TO RUN (Recommended, at least more than 20gb)")
  }

  ns.tprint(`INFO:
  Ram Requirements:
  
  MINIMUM:
  Main Script: ${ns.formatRam(mainCost)}
  Runner Script: ${ns.formatRam(runnerCost)}
  
  Sometimes:
  (Note, this is still required. but its not active 100% of the time.)
  CPU Calc Script: ${ns.formatRam(cpuCost)}

  Optional:
  Restart Script: ${ns.formatRam(restartCost)}

  TOTAL:
  minimum: ${ns.formatRam(mainCost + runnerCost + cpuCost)}
  optional: ${ns.formatRam(restartCost)}

  Total: ${ns.formatRam(mainCost + runnerCost + cpuCost + restartCost)}
  Recommended: At least ${ns.formatRam(Math.ceil(mainCost + runnerCost + cpuCost + restartCost))}


  Server Ram: ${ns.formatRam(serverRam.max)}
  `)
}