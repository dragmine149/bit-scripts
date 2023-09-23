import {terminalInsert, addCallback, setCSS} from 'HTOP/console-doc.js';

/** @param {NS} ns */
export async function main(ns) {
let html = `<span class="auto-main">`
  html += `<span id="auto-alias" class="auto-alias">[Set recommended alias]</span>\n`;
  html += `<span id="auto-help" class="auto-help">[Show help menu]</span>\n`;
  html += `</span>`

  let css = `<style id="pyauto">
  .auto-main {white-space:pre; color:#ccc; font:20px monospace; line-height: 16px; text-align:right;}
  .auto-alias {cursor:pointer; text-decoration:underline; color:#0ff;}
  .auto-help {cursor:pointer; text-decoration:underline; color:#ff0;}
  </style>`

  setCSS("pyauto", css);
  terminalInsert(html);

  let parent = ns.getScriptName().split('/').slice(0, -1).join('/');

  addCallback(".auto-alias", `alias py="run ${parent}/main.js"`);
  addCallback(".auto-help", `run ${parent}/main.js --help`);
}