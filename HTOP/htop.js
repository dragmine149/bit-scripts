import { terminalInsert, setCSS, tailWindow, removeElement } from 'HTOP/console-doc.js';
import { secondsToDhms, getRam, progressBar2, getConfiguration, DFS, getResetTime, getServerFromHTML, getRamAllServers, getServerColour, getScriptColour } from 'HTOP/utils.js';

/** @type {document} */
const doc = eval('document');
const process_title = `<thead><tr id="Info" class="Info"><th>PID</th><th>SERVER</th><th>MEM</th><th>UPTIME</th><th>COMMAND</th><th>ARGS</th><th>THREADS</th></tr></thead>`;
const getRamText = (ns, ram) => `${ns.formatRam(ram.used)}/${ns.formatRam(ram.max)}`;


/** @param {NS} ns
 * @returns {ProcessInfo[]}
 */
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
  if (runOptions.all_servers) {
    let ram = getRamAllServers(ns, runOptions.server);
    let servers = DFS(ns, runOptions.server)[1];
    let pbData = {};

    // loop through all servers
    // get ram
    // generate information for that server.
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

    return progressBar2(pbData, getRamText(ns, ram), 50, true, {
      'cls': 'ram',
      'id': 'ram'
    });
  }

  let pbData = {};
  // generate selected information
  let selected = 0;
  if (doc.getElementById('P_HID_INFO') != undefined) {
    selected = ns.getRunningScript(Number(doc.getElementById('P_HID_INFO').innerText)).pid;
  }

  let server = getServerFromHTML(runOptions.server)
  let ram = getRam(ns, server);

  // loop through all process on server to generate the symbol data.
  for (let p of getProcesses(ns, { 'all_servers': false, 'server': server })) {
    pbData[p.pid] = {
      'sym': `<span style="${p.pid == selected ? 'background:' + getScriptColour(ns, server, p.filename) + '; color:#fff;' : ''}">|</span>`,
      'percent': ns.getRunningScript(p.pid).ramUsage / ram.max,
      'hex': getScriptColour(ns, server, p.filename)
    }
  }

  pbData['empty'] = {
    'sym': ' ', 'percent': 1 - (ram.used / ram.max), 'hex': '000'
  }

  return progressBar2(pbData, getRamText(ns, ram), 50, true, { 'cls': 'ram', 'id': 'ram' });
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
    html += `<td ${!runOptions.no_colour ? 'style="color:' + getServerColour(ns, script.server) + ';"' : ''}>${script.server}</td>`;
    html += `<td>${ns.formatRam(script.ramUsage * p.threads)} ${p.threads > 1 ? `(${ns.formatRam(script.ramUsage)}/t)` : ``}</td>`;
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
  if (script == null) {
    ns.toast(`Invalid script ID: ${id}`, "error", 500);
    return;
  }

  let html = `<td>${script.pid}</td><td id="p-filename-n">${script.filename}</td>`;
  html += `<td>${ns.formatRam(script.ramUsage * script.threads)} (${ns.formatRam(script.ramUsage)}/t)</td><td>${script.threads}</td>`;
  html += `<td>${script.args}</td><td>${script.temporary}</td>`;
  html += `<td><span class="P-online">${secondsToDhms(script.onlineRunningTime, true)}</span>\n<span class="P-offline">${secondsToDhms(script.offlineRunningTime, true)}</span></td>`;
  html += `<td><span class="P-online">${ns.formatNumber(script.onlineExpGained)}</span>\n<span class="P-offline">${ns.formatNumber(script.offlineExpGained)}</span></td>`;
  html += `<td><span class="P-online">${ns.formatNumber(script.onlineMoneyMade)}</span>\n<span class="P-offline">${ns.formatNumber(script.offlineMoneyMade)}</span></td>`;
  html += `<td id="p-${script.pid}">`;
  html += `<a class="P-nano" id="P-nano" ${doc.getElementById("terminal") == undefined ? 'hidden' : ''}>[Edit]</a>`
  html += `<a class="P-tail" id="P-tail">[Tail]</a>\n`
  html += `<a class="P-restart" id="P-restart" ${ns.getRunningScript(ns.pid).args[0] == script.pid ? 'hidden' : ''}>[Restart]</a>` // not showing restart if own script.
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
    .ram .main {color:#00ff5c;}
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
    .P-offline {color:#ff0f5f;}
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

  let html = `<span id="htop" class="htop-main"><span id="PH_D_INF" hidden>${ns.pid}</span><span id="P_HID_INFO" hidden>${ns.pid}</span><span id="P_HID_ACTION" hidden><span id="action"></span><span id="pid"></span></span><span id="P_HID_SERVER" hidden></span>`;
  html += `<table><tr><td id="ram-main" class="ram main">`;
  html += `</td><td id="Tasks" class="Tasks"></td><td><a class="htop-mini collaspe" ${runOptions.use_tail ? '' : 'hidden'}>[Minimise]</a><a class="htop-quit">[Quit]</a></td></tr>`;
  html += `<tr><td><table><tr><td><span id="Cores" class="Cores"></span></td></tr></table></td>`;
  html += `<td id="Uptime" class="Uptime"></td></tr></table>`;
  html += `<span>\n</span>`;
  html += `<table><tr class="Process-Main"><td>Process</td><td>Filename</td><td>Memory</td><td>Threads</td><td>Args</td><td>Temporary</td><td>Runtime</td><td>Exp gained</td><td>Money Made</td><td>Options</td></tr>`;
  html += `<tr id="Process-Info" class="Process-Info">${generateProcessInfo(ns, ns.pid)}</tr></table>`;
  html += `<span>\n</span>`;
  html += `<div class="tableFixHead"><table id="htop-Process" class="htop-Process"></table></div></span>`;
  html += `<span id="htop-restore" class="htop-restore htop-hidden collaspe">[Restore Window]</span>`

  if (runOptions.use_tail) {
    // NOTE: width and height are monitored in the runner script.
    tailWindow(ns, ns.pid, {
      'bc': '#000',
      'c': '#20AB20',
      'font': '32px Courier',
      'x': 1267.6,
      'y': -1.7,
      'width': 0,
      'height': 0
    }, html, 'htop');
  } else {
    terminalInsert(html);
  }
}


/**
 * @param {NS} ns
 */
export async function updateUI(ns, runOptions) {
  while (true) {
    // so although we could use `ns.isRunning` we still use `ns.getRunningScript` as that is used elsewhere in this document.
    // as it is being used elsewhere. `ns.isRunning` would just cost more RAM. 
    // undefined here is just so we can skip the host name arg, and use the running server instead of doing `ns.getHostName()`
    if (ns.getRunningScript('HTOP/htop-process-info-runner.js', undefined, ns.pid) == null) {
      ns.run('HTOP/htop-process-info-runner.js', { temporary: true }, ns.pid);
    }

    try {
      let uptime = getResetTime(ns);
      const ram = getRam(ns, getServerFromHTML(runOptions.server));

      // update parts of the ui.
      doc.getElementById("ram-main").innerHTML = generateProgressBar(ns, runOptions);
      doc.getElementById("Tasks").innerHTML = `Tasks: ${getProcesses(ns, runOptions).length}`;
      doc.getElementById("Cores").innerHTML = `Server: ${getServerFromHTML(runOptions.server)}\nRAM: ${getRamText(ns, ram)}\n${generateProgressBar(ns, { 'all_servers': false, 'server': runOptions.server })}`;
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
  ['no_colour', false], // Whever to have the servers their set colour
  ['new_server_colours', false], // Reset the colours generated for all servers and make new ones.
  ['new_script_colours', ''], // Reset the colours generated for each script (on specified server) and make new ones.
  ['ram', false], // show information about ram cost.
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

  if (args.slice(args.length - 2).includes("--new_script_colours")) {
    return ['all', ...data.servers];
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
function ramUse(ns) {
  // this script prints off the inforamtion. We are already running this script so why not use it?
  let mainCost = ns.getRunningScript().ramUsage;
  ns.run("HTOP/htop-process-info-runner.js", 1, -1);
  let runnerCost = ns.getRunningScript("HTOP/htop-process-info-runner.js", undefined, -1).ramUsage;
  let serverRam = getRam(ns, 'home');
  // as this part is only "temparary" remove the cost of running this part.
  serverRam.used -= (runnerCost + mainCost);
  serverRam.free += (runnerCost + mainCost);

  let recommened = ns.formatRam(Math.pow(2, Math.ceil(Math.log2(mainCost + runnerCost))));

  if (serverRam.max - serverRam.used <= Math.ceil(mainCost + runnerCost)) {
    ns.tprintf(`WARNING: LOW RAM DETECTED. SOME SCRIPTS MIGHT NOT BE ABLE TO RUN (Recommended, at least ${ns.formatRam(Math.ceil(mainCost + runnerCost))} free)`);
  }
  ns.tprintf(`\x1b[1;37m  Ram Requirements:\x1b[37m

  Main Script: \x1b[38;5;33m${ns.formatRam(mainCost)}\x1b[37m    Runner Script: \x1b[38;5;33m${ns.formatRam(runnerCost)}\x1b[37m
  TOTAL: \x1b[38;5;33m${ns.formatRam(mainCost + runnerCost)}\x1b[37m
  
  Recommended in server: \x1b[38;5;33mAt least ${recommened}\x1b[37m   Current Server Ram: \x1b[38;5;33m${ns.formatRam(serverRam.max)}\x1b[37m
  Current Server Usage: \x1b[38;5;33m${ns.formatRam(serverRam.used)}\x1b[37m    Current Server Free: \x1b[38;5;33m${ns.formatRam(serverRam.free)}\x1b[37m
  `);
  ns.exit();
}


/** @param {NS} ns */
export async function main(ns) {
  if (ns.run('Git/git.js', 1, '--ver', 'HTOP') == 0) {
    // this only prints to log. It does not print to terminal.
    ns.print("Failed to check for new version due to missing Git module");
  }

  const runOptions = getConfiguration(ns, argsSchema);
  if (!runOptions) return; // Invalid options, or ran in --help mode.

  if (runOptions.new_server_colours) {
    ns.write('HTOP/server_data.json.txt', '', 'w');
    ns.tprint("Please run htop again. Server Colours will be regenerated on htop start.");
    // this is cheaper way of doing it. TODO: utils.js fix.
    ns.exit();
  }

  if (runOptions.new_script_colours) {
    let servers = runOptions.new_script_colours;
    // TODO: add option to reset all at once.
    ns.write(`HTOP/${servers}_home_data.json.txt`, '', 'w');
    ns.tprint(`Please run htop again. Script colours for ${servers} will be regenerated on htop start.`);
    ns.exit();
  }

  if (runOptions.ram) {
    ramUse(ns);
  }

  if (doc.getElementById("htop") != undefined) {
    ns.tprint(`WARN: htop is already running in some way, shape or form. (If not using tail mode. Click out and back into terminal to reset. If using tail mode, close the window. Else, 'ps' and kill the pid.)`);
    ns.exit();
  }

  ns.disableLog("ALL");
  ns.atExit(() => die(ns));
  await generateUI(ns, runOptions);

  // the main "loop". with the double scripts.
  ns.run('HTOP/htop-process-info-runner.js', { temporary: true }, ns.pid);

  await updateUI(ns, runOptions);
}
