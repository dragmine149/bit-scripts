const wget_error_msg = "Attempts to access local files outside the normal game environment will be directed to this file.";

/** @type {Document} */
const doc = eval('document');
/** @type {RequestInit} */
let headers;

const defaultOptions = {
    'headers': {
        'auth': ''
    },
    'repository': {
        'url': 'https://github.com/dragmine149/bit-scripts.git',
        'branch': 'main'
    },
    'script': {
        'LogLimit': 5
    }
}

/** @type {defaultOptions} */
let options;

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
    //'commit', 'status', 'diff', 'push', 'restore',
    const acData = ['add', 'clone', 'config', '--apiLimit', '--auth', '--setup', 'log', '--ver', '--remove', '--show_requests'];
    const configOptions = {
        'headers': ['auth'],
        'default_repository': ['url', 'branch'],
        'script': ['LogLimit']
    }

    if (args.length <= 1 && !acData.includes(args[0])) {
        return acData;
    }

    const configArgs = ['get', 'set', 'reset'];
    if (args.length <= 2 && args[0] == 'config' && !configArgs.includes(args[1])) {
        return configArgs;
    }

    const configKeys = Object.keys(configOptions);
    if (args.length <= 3 && !configKeys.includes(args[2]) && args[0] == 'config') {
        return configKeys
    }

    if (args.length <= 4 && args[0] == 'config') {
        if (args[1] == 'reset') {
            return [];
        }

        const configValues = configOptions[args[2]];
        if (!configValues.includes(args[3])) {
            return configValues;
        }
    }

    let collab = data.txts.concat(data.scripts);
    if (args.length <= 2 && !collab.includes(args[1]) && ['add'].includes(args[0])) {
        return collab;
    }

    if (args.length <= 1 && args[0] == 'restore') {
        return ['--staged'];
    }

    if (args.length <= 3 && args[0] == 'restore' && !collab.includes(args[2])) {
        return collab;
    }

    return ['--token', '--show_requests'];
}

// get information about the repo from the URL
const getRepoOwner = () => options.repository.url.split('/').slice(-2, -1)[0];
const getRepo = () => options.repository.url.split('/').slice(-1)[0].replace('.git', '');


/**
 * @param {NS} ns
 * THIS IS MAIN FUNCTION
 */
export async function main(ns) {
    options = getOptions(ns);
    optionHandler(ns);

    // header and token setup.
    await verifyToken(ns);

    let regenerate = false;
    switch (ns.args[0]) {
        case '--apiLimit':
            await printAPIInfo(ns);
            ns.exit();

        case '--auth':
            tokenAuth(ns);
            ns.exit();

        case '--setup':
            await setNavCommand(`alias git="run /${ns.getScriptName()}`);

        case '--expand':
            let data = [];
            let name = getModuleNameFromURL(ns, ns.args[1]);
            let contracted = false;
            if (ns.fileExists('Git/Temp/expanded.txt')) {
                data = ns.read('Git/Temp/expanded.txt').split('\n');
                let foundIndex = data.indexOf(name) > -1
                if (foundIndex) {
                    data.splice(foundIndex, 1);
                    contracted = true;
                }
            }

            if (!contracted) {
                data.push(name)
            }
            data = data.filter(entry => /\S/.test(entry));
            ns.write('Git/Temp/expanded.txt', data.join('\n'), 'w');
            regenerate = true;
            break;

        case 'log':
            await git_log(ns);
            ns.exit();

        case '--ver':
            let local = getVersionFromFile(ns, 'Git/Data/local_version.txt', options.ver);
            let git = await getRepoVersion(ns, options.ver);

            if (new Version(local).compareTo(new Version(git)) == -1) {
                log(ns, `WARN: New version of ${options.ver} alvalible. (Local version: ${local}. New version: ${git})`, true);
            }
            ns.exit();

        case 'clone':
            await pull(ns);
            ns.exit()
        
        case '--remove':
            removeModule(ns);
            ns.exit();
    }



    //     let file;
    //     let files;

    //     switch (ns.args[0]) {
    //         case 'status':
    //             let newData = await generateChangedFilesString(ns);
    //             if (!newData.changes) {
    //                 ns.tprint(`Nothing to commit. Working tree clean.`);
    //                 ns.exit();
    //             }
    //             let msg = `
    // On branch ${options.branch} (${options.github}/${options.repository})

    // `

    //             if (ns.fileExists('Git/Commit/added.txt')) {
    //                 let commits = ns.read('Git/Commit/added.txt').split('\n');
    //                 msg += `Changes to be commited:
    //     (use "git restore --staged <file>..." to unstage)
    // `;
    //                 for (let file of commits) {  
    //                     msg += `        ${file.replace(`${options.github}-${options.repository}/`, ``)}\n`
    //                 }
    //             }

    //             msg += `Changes not staged for commit:
    //     (use "git add/rm <file>..." to update what will be commited)
    //     (use "git restore <file>..." to discard changes)
    // \u001b[31m${newData.deleted}${newData.modified}\u001b[0m`

    //             if (newData.added.length > 0) {
    //                 msg += `Untracked files:
    //     (use "git add <file>..." to include in what will be commited)
    // \u001b[31m${newData.added}\u001b[0m`
    //             }

    //             if (!ns.fileExists('Git/Commit/added.txt')) {
    //                 msg += `no changes added to commit (use "git add" and/or "git commit -a")`;
    //             }

    //             ns.tprint(msg);
    //             ns.exit();

    //         case 'add':
    //             file = ns.args[1];
    //             files = [];
    //             if (ns.fileExists('Git/Commit/added.txt')) {
    //                 files = ns.read('Git/Commit/added.txt').split('\n');
    //             }

    //             files.push(file + '\n');
    //             ns.write('Git/Commit/added.txt', files.join('\n'), 'w');
    //             ns.exit();

    //         case 'rm':
    //             file = ns.args[1];
    //             files = [];
    //             if (ns.fileExists('Git/Commit/added.txt')) {
    //                 files = ns.read('Git/Commit/added.txt').split('\n');
    //             }

    //             let index = files.indexOf(file);
    //             if (index == -1) {
    //                 ns.tprint(`fatal: pathspec '${file}' does not match any files`);
    //                 ns.exit();
    //             }

    //             files.splice(index, 1);

    //             ns.write('Git/Commit/added.txt', files.join('\n'), 'w');
    //             ns.exit();
    //     }



    let limit = await fetchMain(ns, 'https://api.github.com/rate_limit');
    limit = limit.resources.core;
    if (limit.remaining < 10 && limit.remaining != -1) {
        let reset = limit.reset;
        let date = new Date(reset * 1000);

        log(ns, `WARNING: Running low on github API requests. (${limit.remaining} left. ${limit.used} used.)
        API limit reset happening at ${date.getDate()}/${date.getMonth()} ${date.getHours()}:${date.getMinutes()} (dd/mm hh/mm)
        
        NOTE: You can still download files as that does not use the git API.`, true);
    }

    let html = await generateHTML(ns);

    if (regenerate) {
        doc.getElementById('git').remove();
    }

    terminalInsert(html);

    addCallback(".git-log", `run ${ns.getScriptName()} log`, ns.args);
    addCallback(".git-download", `run ${ns.getScriptName()} clone`, ns.args);
    addCallback(".git-update", `run ${ns.getScriptName()} clone`, ns.args);
    addCallback(".git-remove", `run ${ns.getScriptName()} --remove`, ns.args);
    addCallback(".git-folder", `run ${ns.getScriptName()} --expand`, ns.args);
}

/** @param {NS} ns */
function getOptions(ns) {
    // get file and check if we have one
    let file = ns.getScriptName() + '.config.txt';
    if (ns.fileExists(file)) {
        // check to read and parse, also returns the parsed data on success.
        const oc = ns.read(file);
        if (oc != '') { // empty file due to reset
            try {
                return JSON.parse(oc);
            } catch (err) {
                log(ns, `WARNING: Failed to parse options file. Please check or remake using '${ns.getScriptName()} config reset'!`, true);
                ns.exit();
            }
        }
    }

    // create the new file using default options if the file doesn't exist.
    ns.write(file, JSON.stringify(defaultOptions), 'w');
    log(ns, `Generated default options file. Use '${ns.getScriptName()} config set <option> <value>' to change options.`);
    return defaultOptions;
}

/** @param {NS} ns */
function optionHandler(ns) {
    // if we don't want to do stuff with config, run.
    if (ns.args[0] != 'config') {
        return;
    }
    let file = ns.getScriptName() + '.config.txt';
    // file should already be generated, as this gets called afte getOptions
    if (!ns.fileExists(file)) {
        options = getOptions(ns);
        log(ns, `getOptions wasn't called before setOptions!`);
    }

    // bascially, delete everything in the file to reset it.
    if (ns.args[1] == 'reset') {
        ns.write(file, '', 'w');
        log(ns, `Cleared options file! Please rerun ${ns.getScriptName()} to continue!`, true);
        ns.exit();
    }

    let key = ns.args[2], value = ns.args[3];

    // checks so we don't have try and do undefined.undefined
    if (key == undefined) {
        log(ns, `No key defined for ${ns.args[1]}`, true);
        ns.exit();
    }
    if (value == undefined) {
        log(ns, `No value defined for ${ns.args[1]}`, true);
    }


    // print header.value
    if (ns.args[1] == 'get') {
        log(ns, `Data for option: ${key}.${value}: ${options[key][value]}`, true);
        ns.exit();
    }

    // set header.value and save
    if (ns.args[1] == 'set') {
        let info = ns.args.slice(4).join(',');
        options[key][value] = info;
        ns.write(file, JSON.stringify(options), 'w');
        log(ns, `Set ${key}.${value} to ${info}`, true);
        ns.exit();
    }

}

/** @param {NS} ns */
async function verifyToken(ns) {
    let rateapi = `https://api.github.com/rate_limit`;

    // check if token exists
    if (options.headers.auth != '') {
        log(ns, `Called: ${rateapi} (hidden headers)`, ns.args.includes('--show_requests'));

        // send a call to get our rate limit.
        // Not only is this free, but also tells us how much we have left and if we need to switch to free mode.
        let limit = await fetch(rateapi, {
            headers: {
                Authorization: 'Bearer ' + options.headers.auth
            }
        });

        limit = await limit.json();

        if (limit.message == "Bad credentials") {
            log(ns, `WARNING: Bad credentials (Token expired?) Using free mode!`, true);
            return;
        }

        headers = {
            headers: {
                Authorization: 'Bearer ' + options.headers.auth
            }
        };
        log(ns, `INFO: Working token. Using token as piority.`);
        return;
    }

    log(ns, `INFO: No auth token, Most of the script will still work however some parts might not. Run '${ns.getScriptName()} --apiLimit' to view more information`, true);
    return;
}

/**
 * Class to compare two version strings.
 */
class Version {
    constructor(s) {
        this.arr = s.split('.').map(Number);
    }
    compareTo(v) {
        for (var i = 0; ; i++) {
            if (i >= v.arr.length)
                return i >= this.arr.length ? 0 : 1;
            if (i >= this.arr.length)
                return -1;
            var diff = this.arr[i] - v.arr[i];
            if (diff)
                return diff > 0 ? 1 : -1;
        }
    }
}

/** 
 * Fetches data from an api.
 * @param {NS} ns
 * @param {string} url
 */
async function fetchMain(ns, url) {
    try {
        log(ns, `Called: ${url} (hidden headers)`, ns.args.includes('--show_requests'));
        let result = await fetch(url, headers);
        result = await result.json()

        if (result.message == "Bad credentials") {
            log(ns, 'WARNING: Bad Credentials! (Api Token Expired?) Trying again with no headers', true);
            log(ns, `Called: ${url} (no headers)`, ns.args.includes('--show_requests'));
            result = await fetch(url);
            result = await result.json();
        }

        return result;
    } catch (error) {
        log(ns, `WARNING: Failed to get inforamtion from: ${url}` +
            `\nResponse Contents (if available): $.api-limit{JSON.stringify(response ?? '(N/A)')}\nERROR: ${String(error)}`, true);
        ns.exit();
    }
}

/** @param {NS} ns 
 * Gets a list of files to download, either from the github repository (if supported), or using a local directory listing **/
async function repositoryListing(ns) {
    if (doc.getElementById('git') != undefined) {
        return JSON.parse(ns.read('Git/Temp/tree.json.txt'));
    }

    // get list of files
    const listUrl = `https://api.github.com/repos/${getRepoOwner()}/${getRepo()}/git/trees/`;
    let result = await fetchMain(ns, listUrl + `${options.repository.branch}`);
    let tree = await fetchMain(ns, listUrl + `${result.sha}?recursive=true`); // use the sha, and get all files. Two api calls instead of X per folder.
    log(ns, 'Git: Pulled new version of the tree.', false, 'info');
    ns.write('Git/Temp/tree.json.txt', JSON.stringify(tree), 'w'); // save to reduce the amount of calls we need.
    return tree;
}


/** @param {NS} ns */
function updateVersionFile(ns, folderName, remove = false) {
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
    const versionURL = `https://raw.githubusercontent.com/${getRepoOwner()}/${getRepo()}/${options.repository.branch}/version.txt`;
    let result = await ns.wget(versionURL, 'Git/Data/version.txt');

    if (!result) {
        log(ns, "WARNING: Failed to get latest versions of `version.txt` from github! (Will use local file instead)", true);
    }

    if (!ns.fileExists("Git/Data/version.txt")) {
        // we quit here because we don't have an important part of the ui
        log(ns, "ERROR: No `Git/Data/version.txt` file found! (No access to github?)", true);
        ns.exit();
    }

    if (ns.read('Git/Data/version.txt').trim() == wget_error_msg) {
        log(ns, "ERROR: Failed to download git version.txt script. (Incorrect url?)", true);
        log(ns,"INFO: Reason='File contained default wget message not actualy version info'", true);
        log(ns,"INFO: url=" + versionURL, true);
        ns.exit();
    }

    return getVersionFromFile(ns, 'Git/Data/version.txt', file);
}

/** @param {NS} ns */
async function printAPIInfo(ns) {
    let info = await fetchMain(ns, 'https://api.github.com/rate_limit');
    info = info.resources.core;
    let date = new Date(info.reset * 1000);
    let diff = (info.reset * 1000) - Date.now();

    if (info.remaining == -1 || info.used == -1 || info.limit == -1) {
        log(ns, "WARNING: Failed to pull api. Can't show limit usage.", true);
        ns.exit();
    }

    log(ns, `\x1b[37mAPI Information:
    
    Limit: ${info.limit}
    Remaining: ${info.remaining} (${ns.formatPercent(info.remaining / info.limit)})
    Used: ${info.used}
    
    Reset Date/Time: ${date.getDate()}/${date.getMonth()} ${date.getHours()}:${date.getMinutes()} (dd/mm hh/mi)
    In other words: resetting in ${secondsToDhms(diff / 1000)}

    Note: you get ${info.limit}/hour. The hour starts when you use your first api request.
    Note: running ${ns.getScriptName()} does not nesseccarly take from your limit for that hour.
    Note: 99.9% of the time, you are unlickly to run out. Unless you are doing other things with the git api.
    NOTE: If you want a higher limit per hour, you can make the 'Git/config.toml.txt' file with an auth token.\x1b[m`, true)
}


/** @param {NS} ns */
function tokenAuth(ns) {
    log(ns, `\x1b[4;37mInformation on using token authentication (PATs):\x1b[37m

By default, the normal api only gives a limit of 60 per hour. And does limit some of the functions you are able to do.
However, by generating and using a token. Not only can you gain more access to the api, you also get a higher limit of the amount of requests you can do.

You are not required to have an auth token to use this program. It is completly optional and up to you. (There are few features that require the use of a token and are designed for more advanced users.)
If you do use the auth token, it will only be stored locally (without encryption, so be careful with your save...);


To generate a token (and import it into this program) follow the steps below:

1. visit https://github.com/settings/tokens
2. Log in
3. Generate a new token
4. Set up permissions for that token (I recommend no permissions, public only, and expiration date is up to you.)
5. Save token somewhere outside of game.
6a. Run '${ns.getScriptName()} config set headers auth <Token>' (This saves it.)
OR
6b. Run '${ns.getScriptName()} <command>... --token <Token>' (This doesn't save it, however it gives piority to this token over the saved token.)
7. Success and carry on.

NOTE: No need to add any extra information to the token, the program should do that automatically.
\x1b[1;37mNOTE: Permissions provided to the token are at your own risk.\x1b[37m
Personally, I recommend that you have two tokens, a token for normal use and a token for advance use.
The normal token, should have no permissions and read-only access to repos. This token can be stored in config settings as it doesn't have much importance.
The advanced token, should have more permissions (To be added) and kept outside the game. This token should only be used when asked and never saved in-game.
Although the script will store the advanced token (as idk how to tell the differences without spending a use, etc) it will still ask when things require an advanced token.

If you are still worried about accidently sharing the token, then set an expiry date to something close (like tommorrow). It might mean you have to generate more tokens, but it wouldn't matter if they are shared
as they can't be used.


This program will use the auth token when it can, except for when its out of api requests. Then it will go ahead and use the free no token version (until that runs out.)
To get how many api requests you have left, run '${ns.getScriptName()} --apiLimit'

If you want to read up more about api token, bellow are some links to related documentation:
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api?apiVersion=2022-11-28

As of writing, the new Fine-grained PAT is in beta, it does not matter which one you use. However, using a Fine-grained PAT does give you more controll than the Classic PAT.
Read more: https://github.blog/2022-10-18-introducing-fine-grained-personal-access-tokens-for-github/ 



And if all the above is too complicated, don't worry. Just don't provide an auth token at all and everything will be fine.\x1b[m`, true)
}

/** @param {NS} ns
 * @param {{
 * path:string
 * mode:string
 * type:string
 * sha:string
 * url:string
 * }} treeElement
 */
async function generateHTMLFromTree(ns, treeElement) {
    let repo = -2, local = -2; // version controll.
    let html = `<tr id=${treeElement.url} class="git-item">`
    if (treeElement.type == 'tree') {
        // dont get it if it's a sub file. TBI
        repo = await getRepoVersion(ns, treeElement.path);
        local = getVersionFromFile(ns, 'Git/Data/local_version.txt', treeElement.path);
    }
    // add controlls and other stuff
    html += `<td><span class=${treeElement.type == 'tree' ? 'git-folder' : 'git-name'}>${treeElement.path}</span></td>`;
    html += `<td>${treeElement.type == 'tree' ? repo : ''}</td>`;
    html += `<td>${treeElement.type == 'tree' ? (local == -1 ? '' : local) : ''}</td>`;

    html += `<td>`;
    html += `<span id="git-log" class="git-log">[Log]</span>`;
    if (treeElement.type == 'tree') {
        let gitClass = local == '-1' ? 'git-download' : 'git-update';
        let gitMode = local == '-1' ? `[Download]` : `[Update]`;
        html += `<span id="${gitClass}" class="${gitClass}">${gitMode}</span>`;
        if (local != -1) {
            html += `<span id="git-remove" class="git-remove">[Remove]</span>`;
        }
    }

    return html + `</td></tr>`;
}

/** @param {NS} ns */
export async function generateHTML(ns) {
    let html = `<table id="git" class="git-main"><tr class="git-title"><td>Module</td><td>Git version</td><td>Local Version</td><td>Options</td>`;
    let gitData = await repositoryListing(ns);
    let expanded = [];

    // checks if git exists, and use that data instead.
    if (doc.getElementById('git') != undefined && ns.fileExists('Git/Temp/expanded.txt')) {
        expanded = ns.read('Git/Temp/expanded.txt').split('\n');
    } else {
        // overwrite the file otherwise for next use.
        ns.write('Git/Temp/expanded.txt', '', 'w');
    }

    for (let item of gitData.tree) {
        /** @type {string} */
        let itemParent = item.path;

        if (item.type == 'tree' || expanded.includes(itemParent.split('/').slice(0, -1).join('/'))) {
            // only show specified or the tree. Don't bother showing others to clean up ui.
            html += await generateHTMLFromTree(ns, item);
        }
    }
    html += `</table>`;

    // css stuff.
    let css =
        `<style id="gitcss">
        .git-item {text-align:left;}
        .git-main {white-space:pre; color:#ccc; font:20px monospace; line-height: 16px; text-align:right;}
        .git-title {background:#0ff; color:#000;}
        .git-log {cursor:pointer; text-decoration:underline; color:#c0297a;}
        .git-download {cursor:pointer; text-decoration:underline; color:#0ff;}
        .git-update {cursor:pointer; text-decoration:underline; color:#faf;}
        .git-remove {cursor:pointer; text-decoration:underline; color:#bf0a3c;}
        .git-folder {cursor:pointer; text-decoration:underline; font-weight: bold;}
    </style>`

    setCSS("gitcss", css);
    return html;
}

/** Return the name of the module from the specified url
 * @param {NS} ns
 * @param {string} url
 */
function getModuleNameFromURL(ns, url) {
    let folderName;
    try {
        folderName = doc.getElementById(url).firstElementChild.textContent;
    } catch (error) {
        log(ns, "ERROR: GIT UI is not visible. Please run " + ns.getScriptName() + " to spawn in the ui.", true);
        ns.exit();
    }

    return folderName;
}

/** Print out the latest log for that file
 * @param {NS} ns
 */
async function git_log(ns) {
    // get name
    let name = getModuleNameFromURL(ns, ns.args[1])
    let update = await fetchMain(ns, `https://api.github.com/repos/${getRepoOwner()}/${getRepo()}/commits?path=${name}`); // get all logs
    let msg = `INFO for ${name}`
    
    // generate message
    for (let i = 0; i < Math.min(options.script.LogLimit, update.length); i++) {
        let uInfo = update[i];
        msg += `
\x1b[38;5;88mcommit ${uInfo.sha}\x1b[37m
Author: ${uInfo.commit.author.name} <${uInfo.commit.author.email}>
Date:   ${uInfo.commit.author.date}

    ${uInfo.commit.message}`;
    }
    // output message
    log(ns, msg, true);
}

/** @param {NS} ns */
export async function pull(ns) {
    // get information
    let folderName = getModuleNameFromURL(ns, ns.args[1]);
    let files = await fetchMain(ns, ns.args[1] + `?recursive=true`);
    files = files.tree;
    const fileURL = `https://raw.githubusercontent.com/${getRepoOwner()}/${getRepo()}/${options.repository.branch}/${folderName}/`;

    // get files
    for (let file of files) {
        try {
            // attempt to download
            let response = await ns.wget(fileURL + file.path, `${getRepoOwner()}-${getRepo()}/${folderName}/${file.path}`, 'home');
            if (!response) { // check for response
                log(ns, `WARNING: Failed to download '${fileURL}${file.path}'.`, true, 'warning');
                continue;
            }

            if (ns.read(`${folderName}/${file.path}`) == wget_error_msg) { // check if actually saved
                log(ns, `WARNING: Failed to download '${fileURL}${file.path}'. Most likely due to invalid URL.`, true, 'warning');
                continue;
            }

        } catch (error) { // any other random errors
            log(ns, `ERROR occured whilst download file. More Info: ${String(error)}`, true, 'error');
            continue;
        }

        log(ns, `Downloaded ${fileURL}${file.path}`, false, 'info');
        ns.write(`Git/Data/${getRepoOwner()}-${getRepo()}/${folderName}/${file.path}`, ns.read(`${getRepoOwner()}-${getRepo()}/${folderName}/${file.path}`));
    }

    updateVersionFile(ns, folderName);

    log(ns, "INFO: Finish downloading files.", true);

    // run module autostart (if exists)
    if (ns.fileExists(`${getRepoOwner()}-${getRepo()}/${folderName}/AutoStart.js`)) {
        await setNavCommand(`run ${getRepoOwner()}-${getRepo()}/${folderName}/AutoStart.js`);
    }

    // restart git just to clear stuff up.
    doc.getElementById("git").remove();
    ns.run(ns.getScriptName());
}

/** @param {NS} ns */
export function removeModule(ns) {
    // get module and files
    let moduleName = getModuleNameFromURL(ns, ns.args[1]);
    let files = ns.ls('home', `${getRepoOwner()}-${getRepo()}/${moduleName}`);

    // remove files
    for (let file of files) {
        ns.rm(file, 'home');
    }

    updateVersionFile(ns, moduleName, true);

    log(ns, `Removed module ` + moduleName, true);

    doc.getElementById("git").remove();
    ns.run(ns.getScriptName());
}

/** @param {NS} ns */
async function getChangedFiles(ns) {
    let modified = [];
    let deleted = [];
    let added = [];

    let modules = await repositoryListing(ns);
    let commited = [];
    if (ns.fileExists('Git/Commit/added.txt')) {
        commited = ns.read('Git/Commit/added.txt');
    }

    for (let module of modules) {
        let files = ns.ls('home', `${options.github}-${options.repository}/${module.path}`);
        files = files.filter((x) => !x.startsWith('Git/Data'));
        let gitFiles = ns.ls('home', `Git/Data/${options.github}-${options.repository}/${module.path}/`);
        gitFiles = gitFiles.map(item => item.replace('Git/Data/', ''));

        added.push(...files.filter(x => !gitFiles.includes(x) && !commited.includes(x)));
        deleted.push(...gitFiles.filter(x => !files.includes(x) && !commited.includes(x)));

        for (let file of files) {
            if (added.includes(file) || deleted.includes(file) || commited.includes(file)) {
                continue;
            }

            if (ns.read(file) !== ns.read(`Git/Data/${options.github}-${options.repository}/${module.path}/${file.split('/').pop()}`)) {
                modified.push(file);
                continue;
            }
        }
    }

    return {
        'modified': modified,
        'added': added,
        'deleted': deleted,
        'changes': modified.length > 0 || deleted.length > 0 || added.length > 0
    }
}

async function generateChangedFilesString(ns) {
    let files = await getChangedFiles(ns);

    let modified = '';
    let deleted = '';
    let added = '';

    for (let file of files.added) {
        added += `       ${file.replace(`${options.github}-${options.repository}/`, '')}\n`;
    }
    for (let file of files.modified) {
        modified += `       modified: ${file.replace(`${options.github}-${options.repository}/`, '')}\n`;
    }
    for (let file of files.deleted) {
        deleted += `       deleted: ${file.replace(`${options.github}-${options.repository}/`, '')}\n`;
    }

    return {
        'modified': modified,
        'added': added,
        'deleted': deleted,
        'changes': files.changes
    };
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




/************************************************************
 *                  UTILITY SECTION                         *
 * **********************************************************/


/**
 * @param {number} seconds
 * @param {boolean} compact
 */
function secondsToDhms(seconds, compact = false) {
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

/** 
 * SOURCE: https://github.com/alainbryden/bitburner-scripts/blob/main/helpers.js
 * 
 * Helper to log a message, and optionally also tprint it and toast it
 * @param {NS} ns - The nestcript instance passed to your script's main entry point */
export function log(ns, message = "", alsoPrintToTerminal = false, toastStyle = "", maxToastLength = Number.MAX_SAFE_INTEGER) {
    checkNsInstance(ns, '"log"');
    ns.printf(message);
    if (toastStyle) ns.toast(message.length <= maxToastLength ? message : message.substring(0, maxToastLength - 3) + "...", toastStyle);
    if (alsoPrintToTerminal) {
        ns.tprintf(message);
    }
    ns.write('Git/log/terminal.txt', message + '\n', 'a');
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
 * @param {string} html
 * HTML code to show in the terminal
 * @param {string} parent
 * ID of the parent node to place the html code their instead
 */
export function terminalInsert(html, parent = '') {
    if (parent.length > 0) {
        doc.getElementById(parent).innerHTML = html;
        return;
    }
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
export function addCallback(cssClass, command, args) {
    doc.querySelectorAll(cssClass).forEach(button => button
        .addEventListener('click', setNavCommand.bind(null, `${command} ${button.parentNode.parentNode.id} ${args.includes('--show_requests') ? '--show_requests' : ''}`)));
}