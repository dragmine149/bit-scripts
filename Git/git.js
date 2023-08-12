const wget_error_msg = "Attempts to access local files outside the normal game environment will be directed to this file.";

let options;
const argsSchema = [
    ['github', 'dragmine149'],
    ['repository', 'bit-scripts'],
    ['branch', 'main'],
    ['apiLimit', false], // Instead of listing the repo. Print out information about the api and rate limit.
    ['pull', ''], // Download a module
    ['json', false], // Show the json data of the api request.
    ['remove', ''], // Remove a module. (Better than deleting all the files)
    ['setup', false], // Set up some required things. (alias)
];

export function autocomplete(data, args) {
    data.flags(argsSchema);
    const lastFlag = args.length > 1 ? args[args.length - 2] : null;
    if (["--download", "--subfolder", "--omit-folder"].includes(lastFlag))
        return data.scripts;
    return [];
}

async function generateHTMLOffListing(ns, item, url) {
    let repo = await getRepoVersion(ns, item);
    let local = getVersionFromFile(ns, 'Git/Data/local_version.txt', item);
    let html = `<tr id="${url}"><td class="name">${item}</td><td>${repo}</td><td>${local == -1 ? '' : local}</td>`;

    if (repo == '-1') {
        ns.tprint(`WARNING: ${options.github}/${options.repository} recently updated. Please check back again later.`);
    }

    let gitClass = local == '-1' ? 'git-download' : 'git-update';
    let gitMode = local == '-1' ? `[Download]` : `[Update]`;

    html += `<td>`
    html += `<span id="${gitClass}" class="${gitClass}">${gitMode}</span>`;

    if (local != '-1') {
        html += `<span id="git-remove" class="git-remove">[Remove]</span>`;
    }

    html += `</td></tr>`;

    return html;
}

/** @param {NS} ns */
export async function generateHTML(ns) {
    let html = `<table id="git" class="git-main"><tr class="git-title"><td>Module</td><td>Git version</td><td>Local Version</td><td>Options</td>`;
    let gitData = await repositoryListing(ns);

    if (options.json) {
        ns.tprint(gitData);
    }

    for (let item of gitData) {
        html += await generateHTMLOffListing(ns, item.path, item.url);
    }
    html += `</table>`;

    let css =
        `<style id="gitcss">
        .git-main {white-space:pre; color:#ccc; font:20px monospace; line-height: 16px; text-align:right;}
        .git-title {background:#0ff; color:#000;}
        .git-download {cursor:pointer; text-decoration:underline; color:#0ff;}
        .git-update {cursor:pointer; text-decoration:underline; color:#faf;}
        .git-remove {cursor:pointer; text-decoration:underline; color:#bf0a3c;}
    </style>`

    setCSS("gitcss", css);
    return html;
}

function getModuleNameFromURL(ns, url) {
    let folderName;
    try {
        folderName = doc.getElementById(url).firstElementChild.textContent;
    } catch (error) {
        ns.tprint("ERROR: GIT UI is not visible. Please run " + ns.getScriptName() + " to spawn in the ui.");
        ns.exit();
    }

    return folderName;
}

/** @param {NS} ns */
export async function pull(ns) {
    let folderName = getModuleNameFromURL(ns, options.pull);
    const files = await getModuleFiles(ns, options.pull);
    const fileURL = `https://raw.githubusercontent.com/${options.github}/${options.repository}/${options.branch}/${folderName}/`;

    // get files
    for (let file of files) {
        try {
            let response = await ns.wget(fileURL + file.path, `${folderName}/${file.path}`, 'home');
            if (!response) {
                ns.tprint(`WARNING: Failed to download '${fileURL}${file.path}'.`);
                continue;
            }

            if (ns.read(`${folderName}/${file.path}`) == wget_error_msg) {
                ns.tprint(`WARNING: Failed to download '${fileURL}${file.path}'. Most likely due to invalid URL.`);
                continue;
            }

        } catch (error) {
            ns.tprint(`ERROR occured whilst download file. More Info: ${String(error)}`);
            continue;
        }

        ns.tprint(`INFO: Downloaded ${fileURL}/${file.path}`);
    }

    updateVersionFile(ns, folderName);

    ns.tprint("Finish downloading files.");

    if (ns.fileExists(`${folderName}/AutoStart.js`)) {
        await setNavCommand(`run ${folderName}/AutoStart.js`);
    }

    doc.getElementById("git").remove();
    ns.run(ns.getScriptName());
}

/** @param {NS} ns */
export function removeModule(ns) {
    let moduleName = getModuleNameFromURL(ns, options.remove);
    let files = ns.ls('home', moduleName);
    
    for (let file of files) {
        ns.rm(file, 'home');
    }

    updateVersionFile(ns, moduleName, true);

    ns.tprint(`Removed module ` + moduleName);

    doc.getElementById("git").remove();
    ns.run(ns.getScriptName());
}

/**
 * @param {NS} ns
 * THIS IS MAIN FUNCTION
 */
export async function main(ns) {
    let name = ns.getScriptName().split('/');
        if (name[0] != 'Git' || name.length > 2) {
            ns.tprint(`WARN: 'git.js' not in the correct folder. It is recommended to put 'git.js' in 'Git/git.js' (Command: 'mv ${ns.getScriptName()} Git/git.js')`);
        }

    options = getConfiguration(ns, argsSchema);
    if (!options) return;

    if (options.apiLimit) {
        await printAPIInfo(ns);
        ns.exit();
    }

    if (options.pull) {
        await pull(ns);
        ns.exit();
    }

    if (options.remove) {
        removeModule(ns);
        ns.exit();
    }

    if (options.setup) {
        await setNavCommand(`alias git="run ${ns.getScriptName()}"`);
    }


    let limit = await getAPILimit(ns);
    if (limit.remaining < 10 && limit.remaining != -1) {
        let reset = limit.reset;
        let date = new Date(reset * 1000);

        ns.tprint(`WARNING: Running low on github API requests. (${limit.remaining} left. ${limit.used} used.)
        API limit reset happening at ${date.getDate()}/${date.getMonth()} ${date.getHours()}:${date.getMinutes()} (dd/mm hh/mm)
        
        NOTE: this does not effect downloading files. Only listing out the repo`);
    }

    terminalInsert(await generateHTML(ns));

    addCallback(".git-download", `run ${ns.getScriptName()} --pull`);
    addCallback(".git-update", `run ${ns.getScriptName()} --pull`);
    addCallback(".git-remove", `run ${ns.getScriptName()} --remove`);
}

/**
 * Thanks gpt for improving this
 * @param {NS} ns
 * @param {string} file File to read though
 * @param {string} script Data to find
 */
function getVersionFromFile(ns, file, script) {
    const data = ns.read(file);
    const regex = new RegExp(`^${script}:\\s*(\\S+)`, 'm');
    const match = data.match(regex);

    return match ? match[1] : '-1';
}

/** @param {NS} ns */
function updateVersionFile(ns, folderName, remove=false) {
    // update version files.
    let data = ns.read("Git/Data/local_version.txt");
    const lines = data.split('\n');
    const newVersion = getVersionFromFile(ns, 'Git/Data/version.txt', folderName);

    let found = false;
    for (let line = 0; line < lines.length; line++) {
        if (lines[line].startsWith(folderName)) {
            found = true;
            if (remove) {
                lines.splice(line, 1);
                break;
            }
            
            lines[line] = `${folderName}:${newVersion}`;
            break;
        }
    }

    if (!found) {
        lines.push(`${folderName}:${newVersion}`);
    }


    ns.write('Git/Data/local_version.txt', lines.join('\n'), 'w');
}


/** @param {NS} ns */
async function getRepoVersion(ns, file) {
    const versionURL = `https://raw.githubusercontent.com/${options.github}/${options.repository}/${options.branch}/version.txt`;
    let result = await ns.wget(versionURL, 'Git/Data/version.txt');

    if (!result) {
        ns.tprint("WARNING: Failed to get latest versions of `version.txt` from github! (Will use local file instead)");
    }

    if (!ns.fileExists("Git/Data/version.txt")) {
        // we quit here because we don't have an important part of the ui
        ns.tprint("ERROR: No `Git/Data/version.txt` file found! (No access to github?)");
        ns.exit();
    }

    if (ns.read('Git/Data/version.txt').trim() == wget_error_msg)  {
        ns.tprint("ERROR: Failed to download git version.txt script. (Incorrect url?)");
        ns.tprint("INFO: Reason='File contained default wget message not actualy version info'");
        ns.tprint("INFO: url=" + versionURL);
        ns.exit();
    }

    return getVersionFromFile(ns, 'Git/Data/version.txt', file);
}

/**
 * @param {NS} ns
 * @param {string} folder
 */
async function getModuleFiles(ns, url) {
    let response = null;
    try {
        response = await fetch(url);
        response = await response.json();

        return response.tree;
    } catch (error) {
        ns.tprint(`WARNING: Failed to get files for a module. (Hourly limit reached?)`)
        ns.tprint(`ERROR msg: ${String(error)}`);
        ns.exit();
    }
}

/** @param {NS} ns 
 * Gets a list of files to download, either from the github repository (if supported), or using a local directory listing **/
async function repositoryListing(ns) {
    const listUrl = `https://api.github.com/repos/${options.github}/${options.repository}/git/trees/${options.branch}`;

    let response = null;
    try {
        response = await fetch(listUrl); // Raw response
        // Expect an array of objects: [{path:"", type:"[file|dir]" },{...},...]
        response = await response.json(); // Deserialized

        // One module is a whole folder. Thats the structure.
        let files = [];

        for (let i of response.tree) {
            if (i.type == "tree") {
                files.push(i);
            }
        }

        return files;

    } catch (error) {
        ns.tprint(`WARNING: Failed to get a repository listing (GitHub API request limit of 60 reached?): ${listUrl}` +
            `\nResponse Contents (if available): $.api-limit{JSON.stringify(response ?? '(N/A)')}\nERROR: ${String(error)}`);
        ns.exit();
    }
}

/** @param {NS} ns */
async function printAPIInfo(ns) {
    let info = await getAPILimit(ns);
    let date = new Date(info.reset * 1000);

    ns.tprint(`INFO
    API Information:
    
    Limit: ${info.limit}
    Remaining: ${info.remaining} (${ns.formatPercent(info.remaining / info.limit)})
    Used: ${info.used}
    
    Reseting: ${date.getDate()}/${date.getMonth()} ${date.getHours()}:${date.getMinutes()} (dd/mm hh/mi)
    Note: you get 60/hour. The hour starts when you use your first api request.
    Note: running ${ns.getScriptName()} does not nesseccarly take from your limit for that hour.`)
}

/** @param {NS} ns */
async function getAPILimit(ns) {
    const limitURL = `https://api.github.com/rate_limit`;
    let response = null;
    try {
        response = await fetch(limitURL); // raw data
        response = await response.json(); // deseriaalized

        return response.resources.core;
    } catch (error) {
        ns.tprint(`WARNING: Failed to get the api rate limit data (No internet connection?)`);
        ns.tprint(`ERROR:${String(error)}`);
        return {
            "remaining": -1
        };
    }
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






const doc = eval('document');


/**
 * @param {string} html
 * HTML code to show in the terminal
 */
export function terminalInsert(html) {
    doc.getElementById("terminal").insertAdjacentHTML('beforeend', `<li>${html}</li>`);
}

/**
 * @param {string} name
 * Name of the CSS class
 *
 * @param {string} css
 * CSS class string (must include style tags)
 */
export function setCSS(name, css) {
    doc.getElementById(name)?.remove();
    doc.head.insertAdjacentHTML('beforeend', css);
}

/**
 * @param {string} inputValue
 * Value to run on action.
 */
export async function setNavCommand(inputValue) {
  const terminalInput = doc.getElementById("terminal-input");
  const terminalEventHandlerKey = Object.keys(terminalInput)[1]

  terminalInput.value = inputValue;
  terminalInput[terminalEventHandlerKey].onChange({ target: terminalInput });
  terminalInput.focus();
  await terminalInput[terminalEventHandlerKey].onKeyDown({ key: 'Enter', preventDefault: () => 0 });
}

/**
 * @param {string} cssClass
 * The CSS class to add the callback to
 * @param {string} command
 * The command to run on click
 */
export function addCallback(cssClass, command) {
  doc.querySelectorAll(cssClass).forEach(button => button
    .addEventListener('click', setNavCommand.bind(null, command + " " + button.parentNode.parentNode.id)));
}
