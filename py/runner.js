import { terminalInsert } from 'py/console-doc.js';

/** @type {Document} */
const doc = eval("document");

/** @param {NS} ns */
export async function main(ns) {
  if (ns.args.length == 0) {
    ns.tprint('No file provided!');
    ns.exit();
  }

  // kill old instances?
  doc.getElementById('ns2Die').innerHTML = '';

  // get files.
  let config = ns.read("py/files/config.py.toml.txt");
  let terminal = doc.getElementById('py-terminal-id');

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

  ns.tprint(`Running: ${ns.args[0]}`);

  let fileData = ns.read(ns.args[0]);
  // modifiy file data to make it bit more reliable and not game breaking.
  if (fileData.search('from js import Die; Die()') == -1) {
    fileData += '\nfrom js import Die; Die()\n'; // stops the script code.
    ns.tprint('Automatically added die command to end of script!');
  }
  // earily prevention with time.sleep
  if (fileData.search('time.sleep') != -1 && ns.args[1] != '--force') {
    ns.tprint('ERROR: Detected a `time.sleep` statement. Either change to use Asyncio or not include it at all. To buypass this checker, run py/main.js --force.');
    ns.exit();
  }
  // TODO: finish preventing sleep accidents.
  // fileData.replaceAll("time.sleep(", "asyncio.sleep(");
  // fileData = 'import asyncio' + fileData;

  html += `<py-script class="py-css-main" id="py-script-id" output="py-terminal-id">${fileData}</py-script>`;

  terminalInsert(html);

  let target = -1;
  let alive = true;

  while (alive) {
    alive = doc.getElementById('ns2Die').innerHTML != 'e';
    await ns.sleep(1);

    let cmd = doc.getElementById('pytns2').innerHTML;
    if (cmd != '') {
      doc.getElementById('pytns2').innerHTML = '';
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