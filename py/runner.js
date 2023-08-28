import { terminalInsert, setCSS } from 'py/console-doc.js';

/** @type {Document} */
const doc = eval("document");

/** @param {NS} ns */
export async function main(ns) {
  // get files.
  let files = ns.ls(ns.getHostname(), '.py.txt');
  let config = ns.read("py/files/config.py.toml.txt");
  let terminal = doc.getElementById('py-terminal-id');

  if (terminal == undefined) {
    ns.tprint("Invalid terminal. Please run `py --builder first!`");
    return
  }

  // clean up old stuff.
  let configElements = doc.getElementsByTagName('py-config');
  for (let i = 0; i < configElements.length; i++) {
    configElements.item(i).remove();
  }
  let scriptElements = doc.getElementsByTagName('py-script');
  for (let i = 0; i < configElements.length; i++) {
    scriptElements.item(i).remove();
  }
  terminal.innerHTML = '';

  let html = `<py-config class="py-css-main">${config}</py-config>`;

  for (let file of files) {
    ns.tprint(`Running: ${file}`);
    html += `<py-script class="py-css-main">${ns.read(file)}</py-script>`;
  }

  terminalInsert(html);

  let target = -1;
  let alive = true;

  while (alive) {
    alive = doc.getElementById('ns2Die').innerHTML != 'e';
    await ns.sleep(1);

    let cmd = doc.getElementById('pytns2').innerHTML;
    if (cmd != '') {
      doc.getElementById('pytns2').innerHTML = '';
      // let result = eval(cmd);
      cmd = `export async function main(ns) {
  ns.write('py/temp/result.txt', "" + ${cmd}, 'w');
}`

      ns.write('py/temp/py.js', cmd, 'w');
      target = ns.run('py/temp/py.js');
    }

    if (target != -1) {
      if (!ns.isRunning(target)) {
        doc.getElementById('ns2tpy').innerHTML = ns.read('py/temp/result.txt');
        target = -1;
      }
    }
  }
}