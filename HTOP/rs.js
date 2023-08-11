/**
 *  restarts a script with the same args, threads, everything.
 * 
 *  Args:
 * {id/File name} {tail}
 * 
 * Note: tail is just anything that isn't "undefined" and will tail the new instance of the restarted script.
 * 
 *  @param {NS} ns
*/

export async function main(ns) {
  let script = ns.args[0];

  let scriptInfo = ns.getRunningScript(script);

  if (scriptInfo == null) {
    ns.tprint("Please provide a valid running script");
    return false;
  }

  let scriptArgs = scriptInfo.args;
  let scriptThreads = scriptInfo.threads;
  let scriptTitle = scriptInfo.title;
  let scriptFile = scriptInfo.filename;
  
  ns.scriptKill(scriptFile, scriptInfo.server);
  let id = ns.run(scriptFile, scriptThreads, ...scriptArgs);

  if (ns.args[1] != undefined) {
    ns.tail(id);
  }

  ns.tprint("Restarted " + scriptTitle + `(${id})`);
  return true;
}