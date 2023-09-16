import { generateProcessInfo } from 'HTOP/htop.js';
import { setNavCommand } from 'HTOP/console-doc.js';
import { getRoute } from 'HTOP/utils.js';

/**
 * This is a whole different script meant to run along side the main `htop.js`
 * This script is automatically started from `htop.js`
 * 
 * The purpose of the script is to make sure that the process ui is updating at a set speed no matter the length of time it takes for the other ui elements
 * to update.
 * 
 * This script is also home to the other options that can be clicked on.
 */

/** @param {NS} ns */
export async function main(ns) {
  // NS arg[0] = htop PID
  const doc = eval('document');
  const routeDirect = (ns, cmd, server) => getRoute(ns, server) + ';' + cmd;

  if (ns.args[0] == -1) {
    // wait 1 second, it shouldn't take long to process
    await ns.sleep(1000);
    ns.exit();
  }

  while (ns.getRunningScript(ns.args[0]) != null) {
    if (ns.getRunningScript(ns.args[0]).filename != "HTOP/htop.js") {
      ns.exit();
    }

    if (doc.getElementById("P_HID_INFO") != null) {
      let server = doc.getElementById("P_HID_SERVER").innerText;
      if (server == '') {
        // assume home if no server.
        server = 'home';
      }
      let acPID = Number(doc.getElementById("P_HID_ACTION").lastElementChild.textContent);

      // generate row UI
      let processHTML = generateProcessInfo(ns, Number(doc.getElementById("P_HID_INFO").innerText));
      if (processHTML == undefined) {
        // fallback if the ui is undefined, aka not generated because no pid exists.
        doc.getElementById("P_HID_INFO").innerText = ns.pid;
        doc.getElementById("P_HID_SERVER").innerText = 'home';

        if (acPID == ns.pid) {
          doc.getElementById("P_HID_INFO").innerText = doc.getElementById("PH_D_INF").innerText;
        }
        processHTML = generateProcessInfo(ns, Number(doc.getElementById("P_HID_INFO").innerText));
      }
      // show ui
      doc.getElementById("Process-Info").innerHTML = processHTML

      // Pretty simple selectors
      // Changes the hidden action information based on what button is clicked.

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
            // make sure its trusted so that we don't get random events that could break this.
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
      if (acTC != '') {
        switch (acTC) {
          case 'kill':
            // update ui to display home server (and this script)
            doc.getElementById("P_HID_INFO").innerText = ns.pid;
            doc.getElementById("P_HID_SERVER").innerText = 'home';

            if (acPID == ns.pid) {
              doc.getElementById("P_HID_INFO").innerText = doc.getElementById("PH_D_INF").innerText;
            }

            ns.toast(`Killed ${acPID}`);
            ns.kill(acPID);
            break;

          case 'tail':
            // simple tail
            ns.tail(acPID);
            ns.toast(`Tailed ${acPID}`);
            break;

          case 'restart':
            // get script to restart information
            let scriptInfo = ns.getRunningScript(acPID);
            if (scriptInfo == null) {
              ns.tprint("Somehow this script died before it could be restart as the provided pid is null.");
              return false;
            }
            let scriptArgs = scriptInfo.args;
            let scriptThreads = scriptInfo.threads;
            let scriptTitle = scriptInfo.title;
            let scriptFile = scriptInfo.filename;

            // kill old script and start new script with EXACT SAME THINGS
            ns.kill(scriptFile, scriptInfo.server, ...scriptArgs);
            let id = ns.exec(scriptFile, scriptInfo.server, scriptThreads, ...scriptArgs);

            // output, also update the UI to show the new script
            ns.toast("Restarted " + scriptTitle + `(${id})`);
            doc.getElementById("P_HID_INFO").innerHTML = id;
            doc.getElementById("P_HID_SERVER").innerText = scriptInfo.server;
            break;

          case 'exit':
            ns.kill(ns.args[0]);
            ns.toast(`Exited htop.js`);
            ns.exit();
        }

        doc.getElementById("P_HID_ACTION").innerHTML = `<span></span><span></span>`;
      }

      // As clicking the normal minimise button doesn't do much, offer our own built in one.
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
        ns.resizeTail(1275, 400, ns.args[0]);
      }
    }
    await ns.sleep(250);
  }

  ns.tprint('Stopped htop-process-info-runner.js due to htop.js being stopped.');
}