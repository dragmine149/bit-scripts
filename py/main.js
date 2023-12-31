import { setCSS, tailWindow, terminalInsert } from 'py/console-doc.js';
/** @type {Document} */
const doc = eval("document");

let options;
const argsSchema = [
  ['builder', false], // Force the terminal to be rebuilt.
  ['kill', false], // remove the terminal and all pyscript refrences.
  ['force', ''], // force buypass of time.sleep checker.
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
  let pyFiles = [];
  data.txts.forEach((file) => {
    if (file.endsWith('.py.txt')) {
      pyFiles.push(file);
    }
  })

  return pyFiles;
}

/** @param {NS} ns */
export async function main(ns) {
  options = getConfiguration(ns, argsSchema);
  if (!options) return;

  if (ns.args.length == 0) {
    ns.tprint('ERROR: Please provide the file name!');
    ns.exit();
  }

  // always make sure we have a ui.
  await builder(ns, options.kill);
  options.builder ? ns.exit() : null; // quit if we force builder.

  if (options.force != '' && options.force != 'yes') {
    ns.tprint(`WARNING: running with --foce can cause the whole program to freeze up if a time.sleep statment is reached.
If you really wish to continue, rerun this program with '--force yes'. However, it is safer to replace the time.sleep with the async version.
      `)
    ns.exit();
  }

  ns.run('py/runner.js', { temporary: true }, ns.args[ns.args.length - 1], options.force == 'yes' ? '--force' : '');
  ns.exit();
}

const css = `<style id="pycss">
  .py-css-main {white-space:pre; color:#ccc; font:14px monospace; line-height: 16px; }
</style>`

/** @param {NS} ns */
async function builder(ns, remove = false) {
  let pyscriptTag = doc.getElementById('pyscript-tag-id');
  let scriptTag = doc.getElementById('pyns2js');
  let terminalTag = doc.getElementById('py-terminal-id');
  let tailTag = doc.getElementById('pytail');
  let cssTag = doc.getElementById('pycss');
  let hiddenData = doc.getElementById('pyns2Data');

  if (remove) {
    ns.closeTail(doc.getElementById('tailID').innerHTML);
    // we do not remove the pyscript tag. It will just stay and shouldn't cause any issues.
    // removing it and reinserting it later can cause issues.
    ns.exit();
  }

  let logArea;
  let terminal;

  ns.tprint('Checking terminal inisitalation status...');

  if (tailTag == null) {
    // set up log window so we have it ready.
    logArea = tailWindow(ns, ns.pid, {
      'bc': '#000',
      'c': '#fff',
      'font': '14px Courier',
      'x': 1267.6,
      'y': -1.7,
      'width': 1275,
      'height': 360
    }, '', 'PYTHON!');
    logArea.id = 'pytail';
  } else {
    logArea = tailTag;
  }

  if (hiddenData == null) {
    // these are all data transfer hidden elements.
    const elements = `<div id="pyns2Data"><div id="tailID">${ns.pid}</div><div id="py-output" hidden></div><div id="pytns2"></div><div id="ns2tpy"></div><div id="ns2Die"></div></div>`;
    terminalInsert(elements); // shove them in the terminal.
    logArea.appendChild(doc.getElementById('pyns2Data')); // add to log area, so we don't accidently clear them
  }

  if (scriptTag == null) {
    // this controlls information for js functions that py-script can communicate with.
    let functions = doc.createElement('script');
    functions.innerHTML = ```const doc = eval("document");
function SetVar(name) {
  doc.getElementById('pytns2').innerHTML = name;
}
function getResult() {
  return doc.getElementById('ns2tpy').innerHTML;
}
function Die() {
  doc.getElementById('ns2Die').innerHTML = 'e';
}
```
    functions.id = 'pyns2js';
    logArea.appendChild(functions); // add to log area, so we don't accidently clear them
  }

  if (pyscriptTag == null) {
    // Create the script information
    let script = doc.createElement("script");
    script.defer = true;
    script.setAttribute("src", "https://pyscript.net/releases/2023.05.1/pyscript.js");
    script.id = 'pyscript-tag-id';
    doc.getElementsByTagName("head")[0].appendChild(script); // append it to head, so that it can always be loaded. (Also makes it work)
  }

  if (cssTag == null) {
    // finally, set the css of the terminal.
    // and add the terminal to the log area.
    setCSS('pycss', css);
    logArea.appendChild(doc.getElementById('pycss'));
  }

  if (terminalTag == null) {
    if (pyscriptTag != null) {
      terminal = doc.createElement('py-terminal');
    } else {
      try {
        terminal = await Promise.race([wait(60000), getTerminal(ns)]);
      } catch (err) {
        ns.tprint(err);
        ns.tprint('Creating new terminal!');
        terminal = doc.createElement('py-terminal');
      }
    }
    terminal.classList.add('pycss');
    terminal.id = "py-terminal-id";
    logArea.appendChild(terminal);
  }

  ns.tprint('READY!');
}

/** @param {NS} ns */
async function getTerminal(ns) {
  let terminal = null;
  while (terminal == null) {
    terminal = doc.getElementsByTagName('py-terminal').item(0);
    await ns.sleep(1);
  }
  return terminal;
}

function wait(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout whilst waiting for terminal to load!')), ms);
  });
}


























/** 
 * SOURCE: https://github.com/alainbryden/bitburner-scripts/blob/main/helpers.js
 * 
 * Helper to log a message, and optionally also tprint it and toast it
 * @param {NS} ns - The nestcript instance passed to your script's main entry point */
export function log(ns, message = "", alsoPrintToTerminal = false, toastStyle = "", maxToastLength = Number.MAX_SAFE_INTEGER) {
  checkNsInstance(ns, '"log"');
  ns.print(message);
  if (toastStyle) ns.toast(message.length <= maxToastLength ? message : message.substring(0, maxToastLength - 3) + "...", toastStyle);
  if (alsoPrintToTerminal) {
    ns.tprint(message);
    // TODO: Find a way write things logged to the terminal to a "permanent" terminal log file, preferably without this becoming an async function.
    //       Perhaps we copy logs to a port so that a separate script can optionally pop and append them to a file.
    //ns.write("log.terminal.txt", message + '\n', 'a'); // Note: we should get away with not awaiting this promise since it's not a script file
  }
  return message;
}

/** 
 * SOURCE: https://github.com/alainbryden/bitburner-scripts/blob/main/helpers.js
 * 
 * @param {NS} ns 
 * Returns a helpful error message if we forgot to pass the ns instance to a function */
export function checkNsInstance(ns, fnName = "this function") {
  if (ns === undefined || !ns.print) throw new Error(`The first argument to ${fnName} should be a 'ns' instance.`);
  return ns;
}

/** 
 * SOURCE: https://github.com/alainbryden/bitburner-scripts/blob/main/helpers.js
 * 
 * A helper to parse the command line arguments with a bunch of extra features, such as
 * - Loading a persistent defaults override from a local config file named after the script.
 * - Rendering "--help" output without all scripts having to explicitly specify it
 * @param {NS} ns
 * @param {[string, string | number | boolean | string[]][]} argsSchema - Specification of possible command line args. **/
export function getConfiguration(ns, argsSchema) {
  checkNsInstance(ns, '"getConfig"');
  const scriptName = ns.getScriptName();
  // If the user has a local config file, override the defaults in the argsSchema
  const confName = `${scriptName}.config.txt`;
  const overrides = ns.read(confName);
  const overriddenSchema = overrides ? [...argsSchema] : argsSchema; // Clone the original args schema    
  if (overrides) {
    try {
      let parsedOverrides = JSON.parse(overrides); // Expect a parsable dict or array of 2-element arrays like args schema
      if (Array.isArray(parsedOverrides)) parsedOverrides = Object.fromEntries(parsedOverrides);
      log(ns, `INFO: Applying ${Object.keys(parsedOverrides).length} overriding default arguments from "${confName}"...`);
      for (const key in parsedOverrides) {
        const override = parsedOverrides[key];
        const matchIndex = overriddenSchema.findIndex(o => o[0] == key);
        const match = matchIndex === -1 ? null : overriddenSchema[matchIndex];
        if (!match)
          throw new Error(`Unrecognized key "${key}" does not match of this script's options: ` + JSON.stringify(argsSchema.map(a => a[0])));
        else if (override === undefined)
          throw new Error(`The key "${key}" appeared in the config with no value. Some value must be provided. Try null?`);
        else if (match && JSON.stringify(match[1]) != JSON.stringify(override)) {
          if (typeof (match[1]) !== typeof (override))
            log(ns, `WARNING: The "${confName}" overriding "${key}" value: ${JSON.stringify(override)} has a different type (${typeof override}) than the ` +
              `current default value ${JSON.stringify(match[1])} (${typeof match[1]}). The resulting behaviour may be unpredictable.`, false, 'warning');
          else
            log(ns, `INFO: Overriding "${key}" value: ${JSON.stringify(match[1])}  ->  ${JSON.stringify(override)}`);
          overriddenSchema[matchIndex] = { ...match }; // Clone the (previously shallow-copied) object at this position of the new argsSchema
          overriddenSchema[matchIndex][1] = override; // Update the value of the clone.
        }
      }
    } catch (err) {
      log(ns, `ERROR: There's something wrong with your config file "${confName}", it cannot be loaded.` +
        `\nThe error encountered was: ${(typeof err === 'string' ? err : err.message || JSON.stringify(err))}` +
        `\nYour config file should either be a dictionary e.g.: { "string-opt": "value", "num-opt": 123, "array-opt": ["one", "two"] }` +
        `\nor an array of dict entries (2-element arrays) e.g.: [ ["string-opt", "value"], ["num-opt", 123], ["array-opt", ["one", "two"]] ]` +
        `\n"${confName}" contains:\n${overrides}`, true, 'error', 80);
      return null;
    }
  }
  // Return the result of using the in-game args parser to combine the defaults with the command line args provided
  try {
    const finalOptions = ns.flags(overriddenSchema);
    log(ns, `INFO: Running ${scriptName} with the following settings:` + Object.keys(finalOptions).filter(a => a != "_").map(a =>
      `\n  ${a.length == 1 ? "-" : "--"}${a} = ${finalOptions[a] === null ? "null" : JSON.stringify(finalOptions[a])}`).join("") +
      `\nrun ${scriptName} --help  to get more information about these options.`)
    return finalOptions;
  } catch (err) { // Detect if the user passed invalid arguments, and return help text
    const error = ns.args.includes("help") || ns.args.includes("--help") ? null : // Detect if the user explictly asked for help and suppress the error
      (typeof err === 'string' ? err : err.message || JSON.stringify(err));
    // Try to parse documentation about each argument from the source code's comments
    const source = ns.read(scriptName).split("\n");
    let argsRow = 1 + source.findIndex(row => row.includes("argsSchema ="));
    const optionDescriptions = {}
    while (argsRow && argsRow < source.length) {
      const nextArgRow = source[argsRow++].trim();
      if (nextArgRow.length == 0) continue;
      if (nextArgRow[0] == "]" || nextArgRow.includes(";")) break; // We've reached the end of the args schema
      const commentSplit = nextArgRow.split("//").map(e => e.trim());
      if (commentSplit.length != 2) continue; // This row doesn't appear to be in the format: [option...], // Comment
      const optionSplit = commentSplit[0].split("'"); // Expect something like: ['name', someDefault]. All we need is the name
      if (optionSplit.length < 2) continue;
      optionDescriptions[optionSplit[1]] = commentSplit[1];
    }
    log(ns, (error ? `ERROR: There was an error parsing the script arguments provided: ${error}\n` : 'INFO: ') +
      `${scriptName} possible arguments:` + argsSchema.map(a => `\n  ${a[0].length == 1 ? " -" : "--"}${a[0].padEnd(30)} ` +
        `Default: ${(a[1] === null ? "null" : JSON.stringify(a[1])).padEnd(10)}` +
        (a[0] in optionDescriptions ? ` // ${optionDescriptions[a[0]]}` : '')).join("") + '\n' +
      `\nTip: All argument names, and some values support auto-complete. Hit the <tab> key to autocomplete or see possible options.` +
      `\nTip: Array arguments are populated by specifying the argument multiple times, e.g.:` +
      `\n       run ${scriptName} --arrayArg first --arrayArg second --arrayArg third  to run the script with arrayArg=[first, second, third]` +
      (!overrides ? `\nTip: You can override the default values by creating a config file named "${confName}" containing e.g.: { "arg-name": "preferredValue" }`
        : overrides && !error ? `\nNote: The default values are being modified by overrides in your local "${confName}":\n${overrides}`
          : `\nThis error may have been caused by your local overriding "${confName}" (especially if you changed the types of any options):\n${overrides}`), true);
    return null; // Caller should handle null and shut down elegantly.
  }
}