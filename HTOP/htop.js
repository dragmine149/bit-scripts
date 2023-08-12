import { terminalInsert, setCSS, tailWindow, removeElement } from 'HTOP/console-doc.js';
import { secondsToDhms, getRam, progressBar, getConfiguration, DFS } from 'HTOP/utils.js';

const doc = eval('document');
const process_title = `<tr id="Info" class="Info"><td>PID</td><td>SERVER</td><td>MEM</td><td>UPTIME</td><td>COMMAND</td><td>ARGS</td><td>THREADS</td></tr>`;

function getProcesses(ns, runOptions) {
  if (runOptions.all_servers) {
    return DFS(ns, runOptions.server);
  }

  return ns.ps(runOptions.server);
}

/**
 * @param {NS} ns
 */
export function generateProcesses(ns, runOptions) {
  let processes = getProcesses(ns, runOptions);
  let html = '';
  for (let p of processes) {
    let script = ns.getRunningScript(p.pid);
    html += `<tr id="htop-${p.pid}" class="mProcess"><td id="PID">${p.pid}</td>`;
    html += `<td>${script.server}</td>`;
    html += `<td>${ns.formatRam(script.ramUsage * p.threads)} ${p.threads > 1 ? `(${ns.formatRam(script.ramUsage)}/thread)` : ``}</td>`;
    html += `<td>${secondsToDhms(script.onlineRunningTime, true)}</td>`;
    html += `<td class="Command Process-Click"><a id="p-${p.pid}">${p.filename}</a></td>`;
    html += `<td class="Command">${p.args}</td><td>${p.threads}</td></tr>`;
  }

  return html;
}

/**
 * @param {NS} ns
 * @param {number} id
 */
export function generateProcessInfo(ns, id) {
  let script = ns.getRunningScript(id);

  let html = `<td>${script.pid}</td><td id="p-filename-n">${script.filename}</td>`;
  html += `<td>${ns.formatRam(script.ramUsage * script.threads)} (${ns.formatRam(script.ramUsage)}/t)</td><td>${script.threads}</td>`;
  html += `<td>${script.args}</td><td>${script.temporary}</td>`;
  html += `<td><span class="P-online">${secondsToDhms(script.onlineRunningTime, true)} </span><span class="P-offline">${secondsToDhms(script.offlineRunningTime, true)}</span></td>`;
  html += `<td><span class="P-online">${ns.formatNumber(script.offlineExpGained)} </span><span class="P-offline">${ns.formatNumber(script.onlineExpGained)}</span></td>`;
  html += `<td><span class="P-online">${ns.formatNumber(script.offlineMoneyMade)} </span><span class="P-offline">${ns.formatNumber(script.offlineMoneyMade)}</span></td>`;
  html += `<td id="p-${script.pid}"><a class="P-nano" id="P-nano" ${doc.getElementById("terminal") == undefined ? 'hidden' : ''}>[Edit]</a><a class="P-tail" id="P-tail">[Tail]</a><a class="P-restart" id="P-restart">[Restart]</a><a class="P-kill" id="P-kill">[Kill]</a></td>`;

  return html;
}

/**
 * @param {NS} ns
 */
export async function generateUI(ns, runOptions) {
  // return if the ui already exists.
  if (doc.getElementById("htop") != null) {
    ns.tprint("WARNING: htop ui already generated!");
    return;
  }

  let css = `
  <style id="htopcss">
    .htop-main {white-space:pre; color:#ccc; font:14px monospace; line-height: 16px; }
    .ram .used {color:#0f0;}
    .ram .free {color:#fff;}
    .Tasks {color:#00ff5c;}
    .Cores {color:#00ff5c;}
    .Uptime {color:#00ff5c;}
    .Info {background:#0f0; color:#000;}
    .htop-Process {color:#fff; text-align: right;}
    .htop-Process .PID {color: #f10;}
    .htop-Process .Command {color: #0ff; text-align: left;}
    .mProcess .Command > a {cursor:pointer; text-decoration:underline}
    .Process-Info {color:#fff; text-align:right;}
    .Process-Main {background:#0ff; color:#000; text-align:right;}
    .P-online {color:#0f0;}
    .P-offline {color:#ff0f00;}
    .P-nano {cursor:pointer; text-decoration:underline; color:#bc4e1f;}
    .P-restart {cursor:pointer; text-decoration:underline; color:#0ff;}
    .P-kill {cursor:pointer; text-decoration:underline; color:#f10;}
    .P-tail {cursor:pointer; text-decoration:underline; color:#ff0;}
    .htop-quit {cursor:pointer; text-decoration:underline; color:#f0f;}
  </style>
  `;

  setCSS("htopcss", css);

  let ram = getRam(ns, runOptions.server);
  let server = ns.getServer(runOptions.server);
  let resetInfo = ns.getResetInfo();

  let html = `<span id="htop" class="htop-main"><span id="P_HID_INFO" hidden>${ns.pid}</span><span id="P_HID_ACTION" hidden><span id="action"></span><span id="pid"></span></span><span id="P_HID_SERVER"></span>`;
  html += `<table><tr><td>`;
  html += `${progressBar(ram.used, ram.max, ns.formatRam(ram.used), ns.formatRam(ram.max), { 'parent': 'ram', 'filled': 'used', 'empty': 'free' }, 50)}`;
  html += `</td><td id="Tasks" class="Tasks">Tasks: ${getProcesses(ns, runOptions).length}</td><td><a class="htop-quit">[Quit]</a></tr>`;
  html += `<tr><td><table><tr><td><span id="Cores" class="Cores">Cores: ${server.cpuCores}</span></td></tr></table></td>`;
  html += `<td id="Uptime" class="Uptime">Uptime: ${secondsToDhms((Date.now() - (resetInfo.lastAugReset + resetInfo.lastNodeReset)) / 1000)}</td></tr></table>`;
  html += `<span>\n</span>`;
  html += `<table><tr class="Process-Main"><td>Process</td><td>Filename</td><td>Memory</td><td>Threads</td><td>Args</td><td>Temporary</td><td>Runtime</td><td>Exp gained</td><td>Money Made</td><td>Options</td></tr>`;
  html += `<tr id="Process-Info" class="Process-Info">${generateProcessInfo(ns, ns.pid)}</tr></table>`;
  html += `<span>\n</span>`;
  html += `<table id="htop-Process" class="htop-Process">${process_title}${generateProcesses(ns, runOptions)}</table></span>`;

  if (runOptions.use_tail) {
    tailWindow(ns, ns.pid, {
      'bc': '#505',
      'c': '#20AB20',
      'font': '32px Courier',
      'x': 1267.6,
      'y': -1.7,
      'width': 1207,
      'height': 454
    }, html);
  } else {
    terminalInsert(html);
  }
}


/**
 * @param {NS} ns
 */
export async function updateUI(ns, runOptions) {
  while (true) {
    if (!ns.scriptRunning('HTOP/htop-process-info-runner.js', 'home')) {
      ns.run('HTOP/htop-process-info-runner.js', 1, runOptions.server);
    }

    try {
      let ram = getRam(ns, runOptions.server);
      let server = ns.getServer();
      let resetInfo = ns.getResetInfo();

      // update parts of the ui.
      doc.getElementById("ram").innerHTML = progressBar(ram.used, ram.max, ns.formatRam(ram.used), ns.formatRam(ram.max), { 'parent': 'ram', 'filled': 'used', 'empty': 'free' }, 50);
      doc.getElementById("Tasks").innerHTML = `Tasks: ${getProcesses(ns, runOptions).length}`;
      doc.getElementById("Cores").innerHTML = `Cores: ${server.cpuCores}`;
      doc.getElementById("Uptime").innerHTML = `Uptime: ${secondsToDhms((Date.now() - (resetInfo.lastAugReset + resetInfo.lastNodeReset)) / 1000)}`;
      doc.getElementById("htop-Process").innerHTML = `${process_title}${generateProcesses(ns, runOptions)}`;


      // click detection for the command and quit buttons
      doc.querySelectorAll(".htop-Process .Process-Click").forEach(button => button
        .addEventListener('click', (e) => {
          doc.getElementById("P_HID_INFO").innerHTML = e.target.id.split('-')[1]
          doc.getElementById("P_HID_SERVER").innerHTML = e.target.parentNode.parentNode.children[1].innerText;
        }));

      doc.querySelectorAll(".htop-quit").forEach((button) => {
        button.addEventListener('click', () => {
          ns.exit();
        })
      })

    } catch (e) {
      ns.tprint("Stoped `htop.js` due to an error (Potentinally due to terminal not being focused).");
      ns.tprint("ERROR: \n" + e);
      ns.exit();
    }
    await ns.sleep(runOptions.delay);
  }
}

const argsSchema = [
  ['delay', 5000], // The default delay of updating the process list. (Does not effect the individual process). Note: it is not recommened to go below 250 (1/4s due to how the script works.)
  ['use_tail', false], // Use the tail UI instead of inserting it into the console.
  ['server', 'home'], // The server to query.
  ['all_servers', false], // Whever to show details for all servers.
];

export function autocomplete(data, args) {
  data.flags(argsSchema);
  return [];
}

/** @param {NS} ns */
export function die(ns) {
  if (doc.getElementById("htop") != null) {
    removeElement("htop");
  }
  ns.closeTail();
}


/** @param {NS} ns */
export async function main(ns) {
  const runOptions = getConfiguration(ns, argsSchema);
  if (!runOptions) return; // Invalid options, or ran in --help mode.

  ns.disableLog("ALL");
  ns.atExit(() => die(ns));
  await generateUI(ns, runOptions);

  // the main "loop". with the double scripts.
  ns.run('HTOP/htop-process-info-runner.js', 1, runOptions.server);

  // setNavCommand(getRoute(ns, runOptions.server));

  await updateUI(ns, runOptions);

}
