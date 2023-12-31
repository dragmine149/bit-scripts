/**
 * @param {number} seconds
 * @param {boolean} compact
 */
export function secondsToDhms(seconds, compact = false) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (compact ? "d" : d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (compact ? "h" : h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (compact ? "m" : m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (compact ? "s" : s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

/** @param {NS} ns */
export function getResetTime(ns) {
    let ri = ns.read('HTOP/reset-info.txt').split('\n');
    let resetInfo = {
        'lastAugReset': ri[0],
        'lastNodeReset': ri[1]
    }
    // let resetInfo = ns.getResetInfo();
    let plr = ns.getPlayer();
    let dn = Date.now();

    let augTime = resetInfo.lastAugReset == -1 ? secondsToDhms(plr.totalPlaytime / 1000) : secondsToDhms((dn - resetInfo.lastAugReset) / 1000);
    let nodeTime = resetInfo.lastNodeReset == -1 ? '' : `${secondsToDhms((dn - resetInfo.lastNodeReset) / 1000)} (node)`;

    return {
        "augment": `${augTime} (augment) ${resetInfo.lastNodeReset == -1 ? '' : '\n'}`,
        "node": nodeTime,
        "total": `${secondsToDhms(plr.totalPlaytime / 1000)} (total)`
    };
}

/**
 * @param {NS} ns
 */
export function getRam(ns, host) {
    let r = {
        "used": Math.abs(ns.getServerUsedRam(host)),
        "max": Math.abs(ns.getServerMaxRam(host)),
        "free": 0
    };

    r.free = r.max - r.used;

    return r;
}

export function getServerFromHTML(defaultServer = 'home') {
    let info = null;
    try {
        info = eval('document').getElementById("P_HID_SERVER").innerText;
    } catch (error) {
        return defaultServer;
    }
    return info == '' ? defaultServer : info;
}

export function progressBar2(progressData, nums = '', length = 50, html = false, cssData) {
    // progress bar stuff.
    let progress = `[`;

    Object.values(progressData).forEach((key) => {
        let tempInf = ``;
        tempInf += `${key.sym}`.repeat(Math.floor(length * key.percent));
        if (html) {
            tempInf = `<span style="color:${key.hex};">` + tempInf + `</span>`;
        }
        progress += tempInf;
    })

    progress += nums + `]`;

    if (html) {
        progress = `<span class="${cssData.cls}" id="${cssData.id}">` + progress + `</span>`;
    }

    return progress;
}

/**
 * @param {NS} ns
 * @param {string} runServer
 */
export function getRamAllServers(ns, runServer) {
    let servers = DFS(ns, runServer, true)[1];
    let totalRam = {
        "used": 0,
        "free": 0,
        "max": 0
    }


    for (let server of servers) {
        let ram = getRam(ns, server);
        totalRam.free += ram.free;
        totalRam.used += ram.used;
        totalRam.max += ram.max;
    }

    return totalRam;
}

/** @param {NS} ns
 * @param {string} server
 */
function getServerConnections(ns, server) {
    // TODO: read file and return connections
    // probably store files in their own section.
    // to make sure we keep this up to date (purcahsed servers). The data will be saved during a DFS loop.
    // DFS loop happens everytime the all server ram usage progress bar updates.
    let connections = ns.read(`HTOP/data/${server}.connections.txt`);
    return connections.split('\n');
}

/** @param {NS} ns
 * @param {string} server Server to get the route to
 */
export function getRoute(ns, server) {
    const serverInfo = (serverName) => {
        // Costs 2 GB. If you can't don't need backdoor links, uncomment and use the alternate implementations below
        // return ns.getServer(serverName)
        return {
            // requiredHackingSkill: ns.getServerRequiredHackingLevel(serverName),
            // hasAdminRights: ns.hasRootAccess(serverName),
            purchasedByPlayer: serverName.includes('daemon') || serverName.includes('hacknet'),
            backdoorInstalled: false // No way of knowing without ns.getServer
        }
    }
    const ordering = (serverA, serverB) => {
        // Sort servers with fewer connections towards the top.
        let orderNumber = getServerConnections(ns, serverA).length - getServerConnections(ns, serverB).length
        // Purchased servers to the very top
        orderNumber = orderNumber != 0 ? orderNumber
            : serverInfo(serverB).purchasedByPlayer - serverInfo(serverA).purchasedByPlayer
        // Hack: compare just the first 2 chars to keep purchased servers in order purchased
        orderNumber = orderNumber != 0 ? orderNumber
            : serverA.slice(0, 2).toLowerCase().localeCompare(serverB.slice(0, 2).toLowerCase())

        return orderNumber
    }
    let servers = ["home"],
        parentByIndex = [""],
        routes = { home: "home" }
    for (let server of servers) {
        let serConnections = getServerConnections(ns, server);
        // let serConnections = ns.scan(server);
        for (let oneScanResult of serConnections.sort(ordering))
            if (!servers.includes(oneScanResult)) {
                const backdoored = serverInfo(oneScanResult)?.backdoorInstalled
                servers.push(oneScanResult)
                parentByIndex.push(server)
                routes[oneScanResult] = backdoored ? "connect " + oneScanResult : routes[server] + ";connect " + oneScanResult
            }
    }
    return routes[server];
}

/**
 * DFS traversal starting from host
 *
 * @async
 * @param {NS} ns
 * @param {string} host starting point of the traversal
 * @returns {array} List of processes.
 */
export function DFS(ns, host) {
    let visited = { [host]: true };
    let stack = [{ host, parent: null }];
    let data = [];
    let hosts = [];
    let all = [];
    while (stack.length !== 0) {
        let h = stack.pop();
        let children = ns.scan(h.host);
        let savedChild = '';
        for (let child of children) {
            savedChild += `${child}\n`; // still save it because this is used for other things as well.
            if (visited[child] === true)
                continue;
            stack.push({ host: child, parent: h.host });
            visited[child] = true;
        }

        ns.write(`HTOP/data/${h.host}.connections.txt`, savedChild, 'w');

        let pss = ns.ps(h.host);
        data.push(...pss);
        if (pss.length > 0) {
            hosts.push(h.host);
        }
        all.push(h.host);
    }

    return [data, hosts, all];
}

export const randomHighContrastHexColor = () => '#' + Math.floor(Math.random() * 128 + 128).toString(16).padStart(2, '0') + Math.floor(Math.random() * 128 + 128).toString(16).padStart(2, '0') + Math.floor(Math.random() * 128 + 128).toString(16).padStart(2, '0');

/**
 * @param {NS} ns
 */
export function generateColourForServer(ns) {
    let servers = DFS(ns, "home")[2];
    let data = {};

    for (let sv of servers) {
        data[sv] = randomHighContrastHexColor();
    }

    ns.write('HTOP/data/server_data.json.txt', JSON.stringify(data));
}


/** @param {NS} ns
 *  @param {string} server
 *  @param {string[]} scripts
 */
export function generateScriptColour(ns, server, scripts) {
    let data = {};
    for (let sv of scripts) {
        data[sv] = randomHighContrastHexColor();
    }

    ns.write(`HTOP/data/scripts/${server}_script_data.json.txt`, JSON.stringify(data), 'w');
}

/** @param {NS} ns
 *  @param {string} server
 *  @param {string} script
 */
export function getScriptColour(ns, server, script) {
    let scriptColours = ns.read(`HTOP/data/scripts/${server}_script_data.json.txt`);
    try {
        scriptColours = JSON.parse(scriptColours);
    } catch (e) {
        ns.print("WARN: Failed to parse json data for script colours. Regenerating...");
        ns.toast('Regenerating script colours due to load failure!', 'warning');
        generateScriptColour(ns, server, [script]);
        scriptColours = ns.read(`HTOP/data/scripts/${server}_script_data.json.txt`);
        scriptColours = JSON.parse(scriptColours);
    }

    let colour;
    try {
        colour = scriptColours[script];
        if (colour == null || colour == undefined || colour == '') {
            colour = generateScriptColourDetails(ns, scriptColours, script, server);
        }
    } catch (e) {
        colour = generateScriptColourDetails(ns, scriptColours, script, server);
    }

    return colour;
}

/**
 * @param {NS} ns
 * @param {string} server
 */
export function getServerColour(ns, server) {
    let serverColours = ns.read('HTOP/data/server_data.json.txt');
    try {
        serverColours = JSON.parse(serverColours);
    } catch (e) {
        ns.print("WARN: Failed to parse json data for server colours. Regenerating...");
        ns.toast('Regenerating server colours due to load failure!', 'warning');
        generateColourForServer(ns);
        serverColours = ns.read('HTOP/data/server_data.json.txt');
        serverColours = JSON.parse(serverColours);
    }

    let colour;
    try {
        colour = serverColours[server];
        if (colour == null || colour == undefined || colour == '') {
            colour = generateServerColourDetails(ns, serverColours, server);
        }
    } catch (err) {
        // assume server didn't original exist, and generate a new random colour
        colour = generateServerColourDetails(ns, serverColours, server);
    }

    return colour;
}

function generateServerColourDetails(ns, serverColours, server) {
    serverColours[server] = randomHighContrastHexColor();
    ns.write('HTOP/data/server_data.json.txt', JSON.stringify(serverColours), 'w');
    return serverColours[server];;
}

/** @param {string} script */
function generateScriptColourDetails(ns, scriptColours, script, server) {
    if (!script.endsWith('.js')) {
        return;
    }
    scriptColours[script] = randomHighContrastHexColor();
    ns.write(`HTOP/data/scripts/${server}_script_data.json.txt`, JSON.stringify(scriptColours), 'w');
    return scriptColours[server];;
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