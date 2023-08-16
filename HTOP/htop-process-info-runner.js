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
// NS arg[0] = htop PID
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
        button.addEventListener('click', (e) => {
          if (e.isTrusted) {
            doc.getElementById("P_HID_ACTION").firstElementChild.textContent = "restart";
            doc.getElementById("P_HID_ACTION").lastElementChild.textContent = button.parentNode.id.split('-')[1];
          }
        });
      })
      doc.querySelectorAll(".P-kill").forEach((button) => {
        button.addEventListener('click', () => {
          doc.getElementById("P_HID_ACTION").firstElementChild.textContent = "kill";
          doc.getElementById("P_HID_ACTION").lastElementChild.textContent = button.parentNode.id.split('-')[1];
        });
      })

      doc.querySelectorAll(".htop-quit").forEach((button) => {
        button.addEventListener('click', () => {
          doc.getElementById("P_HID_ACTION").firstElementChild.textContent = "exit";
        })
      })

      let acTC = doc.getElementById("P_HID_ACTION").firstElementChild.textContent;
      let acPID = Number(doc.getElementById("P_HID_ACTION").lastElementChild.textContent);
      if (acTC != '') {
        switch (acTC) {
          case 'kill':
            doc.getElementById("P_HID_INFO").innerText = ns.pid;
            doc.getElementById("P_HID_SERVER").innerText = 'home';

            if (acPID == ns.pid) {
              doc.getElementById("P_HID_INFO").innerText = doc.getElementById("PH_D_INF").innerText;
            }

            ns.toast(`Killed ${acPID}`);
            ns.kill(acPID);
            break;
          
          case 'tail':
            ns.tail(acPID);
            ns.toast(`Tailed ${acPID}`);
            break;
          
          case 'restart':
            ns.run('HTOP/rs.js', 1, acPID);
            ns.toast(`Restarted ${acPID}`);
            doc.getElementById("P_HID_INFO").innerHTML = ns.pid;
            doc.getElementById("P_HID_SERVER").innerText = 'home';
            break;

          case 'exit':
            ns.kill(ns.args[0]);
            ns.toast(`Exited htop.js`);
            ns.exit();
        }

        doc.getElementById("P_HID_ACTION").innerHTML = `<span></span><span></span>`;
      }

      doc.querySelectorAll(".collaspe").forEach((button) => {
        button.addEventListener('click', () => {
          let classes = doc.getElementById("htop").classList;

          if (classes.contains('htop-hidden')) {
            classes.remove('htop-hidden');
            doc.getElementById("htop-restore").classList.add("htop-hidden");
          } else {
            classes.add('htop-hidden');
            doc.getElementById("htop-restore").classList.remove("htop-hidden");
          }
        })
      })

      if (doc.getElementById("htop").classList.contains("htop-hidden")) {
        ns.resizeTail(325, 75, ns.args[0]);
      } else {
        ns.resizeTail(1275, 360, ns.args[0]);
      }
    }
    await ns.sleep(250);
  }

  ns.tprint('Stopped htop-process-info-runner.js due to htop.js being stopped.');
}