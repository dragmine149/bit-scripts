import {generateProcessInfo} from 'HTOP/htop.js';
import {setNavCommand} from 'HTOP/console-doc.js';
import {getRoute} from 'HTOP/utils.js';

/**
 * This is a whole different script meant to run along side the main `htop.js`
 * This script is automatically started from `htop.js`
 * 
 * The purpose of the script is to make sure that the process ui is updating at a set speed no matter the length of time it takes for the other ui elements
 * to update.
 * 
 * This script is also home to the other options that can be clicked on.
 */

function routeDirect(ns, cmd) {
  let route = getRoute(ns, ns.args[0]) + `;`;
  route += cmd;
  route += `;home`;
  return route
}

/** @param {NS} ns */
export async function main(ns) {
  // the first paramater will be the server name.
  const doc = eval('document');

  while (ns.scriptRunning('HTOP/htop.js', 'home')) {
    if (doc.getElementById("P_HID_INFO") != null) {
      doc.getElementById("Process-Info").innerHTML = generateProcessInfo(ns, Number(doc.getElementById("P_HID_INFO").innerText));

      doc.querySelectorAll(".P-nano").forEach((button) => {
        button.addEventListener('click', setNavCommand.bind(null, routeDirect(ns, 'nano ' + doc.getElementById("p-filename-n").innerText)));
      })
      doc.querySelectorAll(".P-tail").forEach((button) => {
        button.addEventListener('click', setNavCommand.bind(null, routeDirect(ns, 'tail ' + button.parentNode.id.split('-')[1])));
      })
      doc.querySelectorAll(".P-restart").forEach((button) => {
        button.addEventListener('click', () => {
          setNavCommand(routeDirect(ns, 'run HTOP/rs.js ' + button.parentNode.id.split('-')[1]));
          doc.getElementById("P_HID_INFO").innerHTML = ns.pid;
        });
      })
      doc.querySelectorAll(".P-kill").forEach((button) => {
        button.addEventListener('click', () => {
          setNavCommand(routeDirect(ns, 'kill ' + button.parentNode.id.split('-')[1]));
          doc.getElementById("P_HID_INFO").innerHTML = ns.pid;
        });
      })
    }
    await ns.sleep(250);
  }

  ns.tprint('Stopped htop-process-info-runner.js due to htop.js being stopped.');
}