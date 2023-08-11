/**
 * @param {number} seconds
 * @param {boolean} compact
 */
export function secondsToDhms(seconds, compact = false) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);

  var dDisplay = d > 0 ? d + (compact ? "d" : d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (compact ? "h" : h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (compact ? "m" : m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (compact ? "s" : s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

/**
 * @param {NS} ns
 */
export function getRam(ns, host) {
  let r = {
    "used": ns.getServerUsedRam(host),
    "max": ns.getServerMaxRam(host)
  };

  return r;
}

/**
 * @param {number} n1 - First number
 * @param {number} n2 - Second number
 * @param {string} v1 - value of the first number. Defaults to n1
 * @param {string} v2 - value of the second number. Defaults to n2
 * @param {object} cssData - Data to use for the css. (parent, filled, empty)
 * @param {number} length - Length of the progress bar (characters) 
 * @returns html `span` class element.
 */
export function progressBar(n1, n2, v1 = null, v2 = null, cssData, length = 25) {
  v1 = v1 == null ? n1 : v1;
  v2 = v2 == null ? n2 : v2;

  let progress = n1 / n2;
  progress = Math.min(1, progress) || 0;
  return `<span class=${cssData['parent']} id=${cssData['parent']}>${cssData['parent']}[<span class=${cssData['filled']}>${'|'.repeat(Math.floor(length * progress))}</span><span class=${cssData['empty']}>${' '.repeat(Math.ceil(length * (1 - progress)))}</span>${v1}/${v2}]</span>`;
}


export function getRoute(ns, server) {
    const serverInfo = (serverName) => {
            // Costs 2 GB. If you can't don't need backdoor links, uncomment and use the alternate implementations below
            return ns.getServer(serverName)
            /* return {
                requiredHackingSkill: ns.getServerRequiredHackingLevel(serverName),
                hasAdminRights: ns.hasRootAccess(serverName),
                purchasedByPlayer: serverName.includes('daemon') || serverName.includes('hacknet'),
                backdoorInstalled: true // No way of knowing without ns.getServer
            } */
        }
    const ordering = (serverA, serverB) => {
            // Sort servers with fewer connections towards the top.
            let orderNumber = ns.scan(serverA).length - ns.scan(serverB).length
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
    for (let server of servers)
        for (let oneScanResult of ns.scan(server).sort(ordering))
            if (!servers.includes(oneScanResult)) {
                const backdoored = serverInfo(oneScanResult)?.backdoorInstalled
                servers.push(oneScanResult)
                parentByIndex.push(server)
                routes[oneScanResult] = backdoored ? "connect " + oneScanResult : routes[server] + ";connect " + oneScanResult
         }
    return routes[server];
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