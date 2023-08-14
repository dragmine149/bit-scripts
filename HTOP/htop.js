import { terminalInsert, setCSS, tailWindow, removeElement } from 'HTOP/console-doc.js';
import { secondsToDhms, getRam, progressBar2, getConfiguration, DFS, getResetTime, getServerFromHTML, getRamAllServers, getServerColour } from 'HTOP/utils.js';

const doc = eval('document');
const process_title = `<thead><tr id="Info" class="Info"><th>PID</th><th>SERVER</th><th>MEM</th><th>UPTIME</th><th>COMMAND</th><th>ARGS</th><th>THREADS</th></tr></thead>`;

function getProcesses(ns, runOptions) {
  if (runOptions.all_servers) {
    return DFS(ns, runOptions.server)[0];
  }

  return ns.ps(runOptions.server);
}

/**
 * @param {NS} ns
 */
function generateProgressBar(ns, runOptions) {
  let getRamText = (ram) => `${ns.formatRam(ram.used)}/${ns.formatRam(ram.max)}`;

  if (runOptions.all_servers) {
    let ram = getRamAllServers(ns, runOptions.server);
    let servers = DFS(ns, runOptions.server)[1];
    let pbData = {};

    for (let server of servers) {
      let sRam = getRam(ns, server);
      pbData[server] = {
        'sym': `<span style="${getServerFromHTML(runOptions.server) == server ? 'background:' + getServerColour(ns, server) + '; color:#fff;' : ''}">|</span>`,
        'percent': sRam.used / ram.max,
        'hex': getServerColour(ns, server)
      };
    }
    pbData['empty'] = {
      'sym': ' ',
      'percent': 1 - (ram.used / ram.max),
      'hex': '000'
    };

    return progressBar2(pbData, getRamText(ram), 50, true, {
      'cls': 'ram',
      'id': 'ram'
    });
  }

  let ram = getRam(ns, getServerFromHTML(runOptions.server));
  return progressBar2({
    'filled': {'sym': '|', 'percent': ram.used / ram.max, 'hex': getServerColour(ns, getServerFromHTML(runOptions.server))},
    'empty': {'sym': ' ', 'percent': 1 - (ram.used / ram.max), 'hex': '000'}
  }, getRamText(ram), 50, true, {'cls': 'ram', 'id': 'ram'}
  );
}

/**
 * @param {NS} ns
 */
export function generateProcesses(ns, runOptions) {
  let processes = getProcesses(ns, runOptions);
  let html = '<tbody>';
  for (let p of processes) {
    let script = ns.getRunningScript(p.pid);
    html += `<tr id="htop-${p.pid}" class="mProcess"><td id="PID">${p.pid}</td>`;
    html += `<td ${runOptions.colour ? 'style="color:' + getServerColour(ns, script.server) + ';"' : ''}>${script.server}</td>`;
    html += `<td>${ns.formatRam(script.ramUsage * p.threads)} ${p.threads > 1 ? `(${ns.formatRam(script.ramUsage)}/thread)` : ``}</td>`;
    html += `<td>${secondsToDhms(script.onlineRunningTime, true)}</td>`;
    html += `<td class="Command Process-Click"><a id="p-${p.pid}">${p.filename}</a></td>`;
    html += `<td class="Command">${p.args}</td><td>${p.threads}</td></tr>`;
  }
  html += `</tbody>`;

  return html;
}

/**
 * @param {NS} ns
 * @param {number} id
 */
export function generateProcessInfo(ns, id) {
  let script = ns.getRunningScript(id);
  let ram = getRam(ns, "home");

  let html = `<td>${script.pid}</td><td id="p-filename-n">${script.filename}</td>`;
  html += `<td>${ns.formatRam(script.ramUsage * script.threads)} (${ns.formatRam(script.ramUsage)}/t)</td><td>${script.threads}</td>`;
  html += `<td>${script.args}</td><td>${script.temporary}</td>`;
  html += `<td><span class="P-online">${secondsToDhms(script.onlineRunningTime, true)} </span><span class="P-offline">${secondsToDhms(script.offlineRunningTime, true)}</span></td>`;
  html += `<td><span class="P-online">${ns.formatNumber(script.offlineExpGained)} </span><span class="P-offline">${ns.formatNumber(script.onlineExpGained)}</span></td>`;
  html += `<td><span class="P-online">${ns.formatNumber(script.offlineMoneyMade)} </span><span class="P-offline">${ns.formatNumber(script.offlineMoneyMade)}</span></td>`;
  html += `<td id="p-${script.pid}">`;
  html += `<a class="P-nano" id="P-nano" ${doc.getElementById("terminal") == undefined ? 'hidden' : ''}>[Edit]</a>`
  html += `<a class="P-tail" id="P-tail">[Tail]</a>`
  html += `<a class="P-restart" id="P-restart" ${ram.free >= 4.2 ? '' : 'hidden'}>[Restart]</a>`
  html += `<a class="P-kill" id="P-kill">[Kill]</a></td>`;      // Hex colour code generator: https://stackoverflow.com/a/5365036/14621075

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
    .htop-mini {cursor:pointer; text-decoration:underline; color:#fca;}
    .htop-restore {cursor:pointer; text-decoration:underline; color:#fca;}
    .htop-hidden {display:none;}
    .tableFixHead { overflow: auto; height: 150px; }
    .tableFixHead thead th { position: sticky; top: 0; z-index: 1; background:#0f0;}
  </style>
  `;

  setCSS("htopcss", css);

  let cores = ns.read("HTOP/cores.txt");
  let uptime = getResetTime(ns);

  let html = `<span id="htop" class="htop-main"><span id="P_HID_INFO" hidden>${ns.pid}</span><span id="P_HID_ACTION" hidden><span id="action"></span><span id="pid"></span></span><span id="P_HID_SERVER" hidden></span>`;
  html += `<table><tr><td>`;
  html += `${generateProgressBar(ns, runOptions)}`;
  html += `</td><td id="Tasks" class="Tasks">Tasks: ${getProcesses(ns, runOptions).length}</td><td><a class="htop-mini collaspe" ${runOptions.use_tail ? '' : 'hidden'}>[Minimise]</a><a class="htop-quit">[Quit]</a></td></tr>`;
  html += `<tr><td><table><tr><td><span id="Cores" class="Cores">Cores: ${cores}\nServer: ${runOptions.server}</span></td></tr></table></td>`;
  html += `<td id="Uptime" class="Uptime">Uptime: ${uptime.augment} ${uptime.node}\n${uptime.total}</td></tr></table>`;
  html += `<span>\n</span>`;
  html += `<table><tr class="Process-Main"><td>Process</td><td>Filename</td><td>Memory</td><td>Threads</td><td>Args</td><td>Temporary</td><td>Runtime</td><td>Exp gained</td><td>Money Made</td><td>Options</td></tr>`;
  html += `<tr id="Process-Info" class="Process-Info">${generateProcessInfo(ns, ns.pid)}</tr></table>`;
  html += `<span>\n</span>`;
  html += `<div class="tableFixHead"><table id="htop-Process" class="htop-Process">${process_title}${generateProcesses(ns, runOptions)}</table></div></span>`;
  html += `<span id="htop-restore" class="htop-restore htop-hidden collaspe">[Restore Window]</span>`

  if (runOptions.use_tail) {
    tailWindow(ns, ns.pid, {
      'bc': '#505',
      'c': '#20AB20',
      'font': '32px Courier',
      'x': 1267.6,
      'y': -1.7,
      'width': 1275,
      'height': 360
    }, html, 'htop');
  } else {
    terminalInsert(html);
  }
}


/**
 * @param {NS} ns
 */
export async function updateUI(ns, runOptions) {
  let oldServer = runOptions.server;
  while (true) {
    if (!ns.scriptRunning('HTOP/htop-process-info-runner.js', 'home')) {
      ns.run('HTOP/htop-process-info-runner.js', 1, ns.pid);
    }

    if (oldServer != getServerFromHTML(oldServer)) {
      ns.run("HTOP/cpu.js", 1, getServerFromHTML(runOptions.server));
      oldServer = getServerFromHTML(oldServer);
    }

    try {
      let cores = ns.read("HTOP/cores.txt");
      let uptime = getResetTime(ns);

      // update parts of the ui.
      doc.getElementById("ram").innerHTML = generateProgressBar(ns, runOptions);
      doc.getElementById("Tasks").innerHTML = `Tasks: ${getProcesses(ns, runOptions).length}`;
      doc.getElementById("Cores").innerHTML = `Cores: ${cores}\nServer: ${getServerFromHTML(runOptions.server)}`;
      doc.getElementById("Uptime").innerHTML = `Uptime: ${uptime.augment}${uptime.node}\n${uptime.total}`;
      doc.getElementById("htop-Process").innerHTML = `${process_title}${generateProcesses(ns, runOptions)}`;

      // click detection for the command and quit buttons
      doc.querySelectorAll(".htop-Process .Process-Click").forEach(button => button
        .addEventListener('click', (e) => {
          let serverText = e.target.parentNode.parentNode.children[1].innerText;
          if (serverText.split(' ').length > 1) {
            return;
          }

          doc.getElementById("P_HID_INFO").innerHTML = e.target.id.split('-')[1];
          doc.getElementById("P_HID_SERVER").innerHTML = e.target.parentNode.parentNode.children[1].innerText;
        })
      );
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
  ['fquit', false], // Force quit all previous ui elements.
  ['colour', true], // Whever to have the servers their set colour
];


/**
 * @param {{
*      servers: string[];
*      txts: string[];
*      scripts: string[];
*      flags: (schema: [string, string | number | boolean | string[]][]) => { [key: string]: string[] | ScriptArg; }
* }} data
* @param {string[]} args
*/
export function autocomplete(data, args) {
 data.flags(argsSchema);
 if (args.slice(args.length - 2).includes("--server")) {
   return [...data.servers];
 }

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
  if (ns.fileExists('Git/git.js')) {
    ns.run('Git/git.js', 1, '--ver', 'HTOP');
  } else {
    ns.print("Failed to check for new version due to missing Git module");
  }

  const runOptions = getConfiguration(ns, argsSchema);
  if (!runOptions) return; // Invalid options, or ran in --help mode.

  if (runOptions.fquit) {
    // if not running on home then well...
    ns.scriptKill('HTOP/htop.js', 'home');
    if (doc.getElementById("htop") != null) {
      removeElement("htop");
    }
  }

  if (doc.getElementById("htop") != undefined) {
    ns.tprint(`WARN: htop is already running in some way, shape or form. To force quit, use '--fquit'`);
    ns.exit();
  }

  ns.disableLog("ALL");
  ns.atExit(() => die(ns));
  await generateUI(ns, runOptions);

  // the main "loop". with the double scripts.
  ns.run('HTOP/htop-process-info-runner.js', 1, ns.pid);
  ns.run("HTOP/cpu.js", 1, runOptions.server);

  await updateUI(ns, runOptions);
}
