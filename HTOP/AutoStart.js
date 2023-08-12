import {terminalInsert, addCallback, setCSS} from 'HTOP/console-doc.js';

/** @param {NS} ns */
export async function main(ns) {
  let html = `<span class="auto-main">`
  html += `<span id="auto-alias" class="auto-alias">[Set recommended alias]</span>\n`;
  html += `<span id="auto-help" class="auto-help">[Show help menu]</span>\n`;
  html += `<span id="auto-ram" class="auto-ram">[Show Ram requirements]</span>`
  html += `</span>`

  let css = `<style id="htopauto">
  .auto-main {white-space:pre; color:#ccc; font:20px monospace; line-height: 16px; text-align:right;}
  .auto-alias {cursor:pointer; text-decoration:underline; color:#0ff;}
  .auto-help {cursor:pointer; text-decoration:underline; color:#ff0;}
  .auto-ram {cursor:pointer; text-decoration:underline; color:#3fa36f;}
  </style>`

  setCSS("htopauto", css);
  terminalInsert(html);

  addCallback(".auto-alias", `alias htop="run HTOP/htop.js"`);
  addCallback(".auto-help", `run HTOP/htop.js --help`);
  addCallback(".auto-ram", "run HTOP/ram-calc.js");
}