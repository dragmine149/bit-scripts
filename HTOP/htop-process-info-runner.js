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

function routeDirect(ns, cmd, server) {
  let route = getRoute(ns, server) + `;`;
  route += cmd;
  return route
}

/** @param {NS} ns */
export async function main(ns) {
  // the first paramater will be the server name.
  const doc = eval('document');

  while (ns.scriptRunning('HTOP/htop.js', 'home')) {
    if (doc.getElementById("P_HID_INFO") != null) {
      let server = doc.getElementById("P_HID_SERVER").innerText;
      if (server == '') {
        // assume home if no server.
        server = 'home';
      }

      doc.getElementById("Process-Info").innerHTML = generateProcessInfo(ns, Number(doc.getElementById("P_HID_INFO").innerText));

      // don't add listener if we aren't in terminal.
      if (doc.getElementById("terminal") != undefined) { 
        doc.querySelectorAll(".P-nano").forEach((button) => {
          button.addEventListener('click', setNavCommand.bind(null, routeDirect(ns, 'nano ' + doc.getElementById("p-filename-n").innerText, server)));
        })
      }

      doc.querySelectorAll(".P-tail").forEach((button) => {
        button.addEventListener('click', () => {
          doc.getElementById("P_HID_ACTION").firstElementChild.textContent = "tail";
          doc.getElementById("P_HID_ACTION").lastElementChild.textContent = button.parentNode.id.split('-')[1];
        });
      })
      doc.querySelectorAll(".P-restart").forEach((button) => {
        button.addEventListener('click', () => {
          doc.getElementById("P_HID_ACTION").firstElementChild.textContent = "restart";
          doc.getElementById("P_HID_ACTION").lastElementChild.textContent = button.parentNode.id.split('-')[1];
        });
      })
      doc.querySelectorAll(".P-kill").forEach((button) => {
        button.addEventListener('click', () => {
          doc.getElementById("P_HID_ACTION").firstElementChild.textContent = "kill";
          doc.getElementById("P_HID_ACTION").lastElementChild.textContent = button.parentNode.id.split('-')[1];
        });
      })

      let acTC = doc.getElementById("P_HID_ACTION").firstElementChild.textContent;
      let acPID = Number(doc.getElementById("P_HID_ACTION").lastElementChild.textContent);
      if (acTC != '') {
        switch (acTC) {
          case 'kill':
            ns.kill(acPID);
            doc.getElementById("P_HID_INFO").innerHTML = ns.pid;
            doc.getElementById("P_HID_SERVER").innerText = 'home';
            break;
          
          case 'tail':
            ns.tail(acPID, ns.args[0]);
            break;
          
          case 'restart':
            ns.run('HTOP/rs.js', 1, acPID);
            doc.getElementById("P_HID_INFO").innerHTML = ns.pid;
            doc.getElementById("P_HID_SERVER").innerText = 'home';
            break;
        }

        doc.getElementById("P_HID_ACTION").innerHTML = `<span></span><span></span>`;
      }
    }
    await ns.sleep(250);
  }

  ns.tprint('Stopped htop-process-info-runner.js due to htop.js being stopped.');
}