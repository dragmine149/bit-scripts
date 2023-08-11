import {terminalInsert, addCallback, setCSS} from 'HTOP/console-doc.js';

/** @param {NS} ns */
export async function main(ns) {
  let html = `<span class="auto-main">`
  html += `<span id="auto-alias" class="auto-alias">[Set recommended alias]</span>\n`;
  html += `<span id="auto-help" class="auto-help">[Show help menu]</span>`;
  html += `</span>`

  let css = `<style id="htopauto">
  .auto-main {white-space:pre; color:#ccc; font:20px monospace; line-height: 16px; text-align:right;}
  .auto-alias {cursor:pointer; text-decoration:underline; color:#0ff;}
  .auto-help {cursor:pointer; text-decoration:underline; color:#ff0;}
  </style>`

  setCSS("htopauto", css);
  terminalInsert(html);

  addCallback(".auto-alias", `alias htop="run ${ns.getScriptName()}"`);
  addCallback(".auto-help", `run HTOP/htop.js --help`);
}