import {getRam} from 'HTOP/utils.js';

/** @param {NS} ns */
export async function main(ns) {
  let ramCost = ns.getScriptRam('HTOP/htop.js', 'home') + ns.getScriptRam('HTOP/htop-process-info-runner.js', 'home');
  let ramOptional = ns.getScriptRam('HTOP/rs.js', 'home');
  let serverRam = getRam(ns, 'home');

  if (serverRam.max - serverRam.used <= 20) {
    ns.tprint("WARNING: LOW RAM DETECTED. SOME SCRIPTS MIGHT NOT BE ABLE TO RUN (Recommended, at least more than 20gb)")
  }

  ns.tprint(`INFO:
  Ram Requirements:
  
  minimul: ${ns.formatRam(ramCost)} (Main htop script + runner)
  optional: ${ns.formatRam(ramOptional)} (Restart script)

  Total: ${ns.formatRam(ramCost + ramOptional)}
  Recommended: At least 20GB.

  Server Ram: ${ns.formatRam(serverRam.max)}
  `)
}