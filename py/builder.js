import { setCSS, tailWindow, terminalInsert } from 'py/console-doc.js';

/** @type {Document} */
const doc = eval("document");

/** @param {NS} ns */
export async function main(ns) {
  let css = `
  <style id="pycss">
    .py-css-main {white-space:pre; color:#ccc; font:14px monospace; line-height: 16px; }
  `
  let logArea = tailWindow(ns, ns.pid, {
    'bc': '#000',
    'c': '#fff',
    'font': '14px Courier',
    'x': 1267.6,
    'y': -1.7,
    'width': 1275,
    'height': 360
  }, '', 'PYTHON!');

  let elements = `<div id="pytns2"></div><div id="ns2tpy"></div><div id="ns2Die"></div>`;

  var functions = doc.createElement('script');
  functions.innerHTML = ns.read('py/script.js');
  functions.id = 'pyns2js';

  terminalInsert(elements);
  logArea.appendChild(doc.getElementById('pytns2'));
  logArea.appendChild(doc.getElementById('ns2tpy'));
  logArea.appendChild(functions);


  var script = doc.createElement("script");
  // script.setAttribute("type", "text/javascript");
  script.defer = true;
  script.setAttribute("src", "https://pyscript.net/releases/2023.05.1/pyscript.js");
  doc.getElementsByTagName("head")[0].appendChild(script);


  ns.tprint("Waiting for terminal to be initiated!");
  await ns.sleep(5000);
  ns.tprint("Checking and continuing...");

  let terminal = doc.getElementsByClassName('py-terminal').item(0); // it should only be the first item

  setCSS('pycss', css);
  terminal.classList.add('pycss');
  terminal.id = "py-terminal-id";


  logArea.appendChild(terminal);
}