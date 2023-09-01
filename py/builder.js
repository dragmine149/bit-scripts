import { setCSS, tailWindow, terminalInsert } from 'py/console-doc.js';

/** @type {Document} */
const doc = eval("document");

let terminalTO = 5 * 1000;

/** @param {NS} ns */
export async function main(ns) {
  if (doc.getElementById('pyns2js') != null) {
    let terminal = doc.createElement('py-terminal');
    terminal.classList.add('pycss');
    terminal.id = 'py-terminal-id';
    ns.tprint('READY!');
    // to do, assign to tail window.
    return;
  }

  let css = `<style id="pycss">
    .py-css-main {white-space:pre; color:#ccc; font:14px monospace; line-height: 16px; }
  </style>`

  // set up log window so we have it ready.
  let logArea = tailWindow(ns, ns.pid, {
    'bc': '#000',
    'c': '#fff',
    'font': '14px Courier',
    'x': 1267.6,
    'y': -1.7,
    'width': 1275,
    'height': 360
  }, '', 'PYTHON!');


  // these are all data transfer hidden elements.
  let elements = `<div id="pyns2Data"><div id="py-output" hidden></div><div id="pytns2"></div><div id="ns2tpy"></div><div id="ns2Die"></div></div>`;
  terminalInsert(elements); // shove them in the terminal.

  // this controlls information for js functions that py-script can communicate with.
  var functions = doc.createElement('script');
  functions.innerHTML = ns.read('py/script.js');
  functions.id = 'pyns2js';

  // add both to the log area to keep them always loaded and out of the way.
  logArea.appendChild(doc.getElementById('pyns2Data'));
  logArea.appendChild(functions);

  // Create the script information
  var script = doc.createElement("script");
  script.defer = true;
  script.setAttribute("src", "https://pyscript.net/releases/2023.05.1/pyscript.js");
  doc.getElementsByTagName("head")[0].appendChild(script); // append it to head, so that it can always be loaded. (Also makes it work)

  // get the terminal auto generated by the above script.
  ns.tprint("Waiting for terminal to be initiated!");
  let terminal = await getTerminal(ns);
  await ns.sleep(1); // more sleep just to make sure some extra stuff loads.
  ns.tprint("Checking and continuing...");

  // finally, set the css of the terminal.
  // and add the terminal to the log area.
  setCSS('pycss', css);
  terminal.classList.add('pycss');
  terminal.id = "py-terminal-id";

  logArea.appendChild(terminal);

  ns.tprint('READY!');
}

async function getTerminal(ns) {
  let terminal = null;
  while (terminal == null) {
    terminal = doc.getElementsByTagName('py-terminal').item(0);
    await ns.sleep(1);
  }
  return terminal;
}