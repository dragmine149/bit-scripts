/** @type {Document} */
const doc = eval('document');

/**
 * @param {string} html
 * HTML code to show in the terminal
 */
export function terminalInsert(html) {
  doc.getElementById("terminal").insertAdjacentHTML('beforeend', `<li>${html}</li>`);
}

/**
 * @param {NS} ns
 * @param {number} hostScriptID
 */
export function tailWindow(ns, hostScriptID, data, html, title='') {
  ns.tail(hostScriptID);
  const logArea = [...doc.querySelectorAll(".react-draggable .react-resizable")].pop();
  logArea.children[1].style.display = "none";
  const text = doc.createElement("SPAN");
  logArea.style.backgroundColor = data.bc;
  logArea.style.color = data.c;
  logArea.style.font = data.font;
  logArea.appendChild(text);
  logArea.lastChild.innerHTML = html;
  ns.resizeTail(data.width, data.height);
  ns.moveTail(data.x, data.y);

  ns.setTitle(title, hostScriptID);

  return logArea;
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
export async function addCallback(cssClass, command) {
  if (!cssClass.startsWith('.')) {
    cssClass = `.${cssClass}`;
  }

  doc.querySelectorAll(cssClass).forEach(button => button
    .addEventListener('click', setNavCommand.bind(null, command)));
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

export function removeElement(name) {
  doc.getElementById(name).remove();
}