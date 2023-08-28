/** @type {Document} */
const doc = eval("document");

function SetVar(name) {
  doc.getElementById('pytns2').innerHTML = name;
}
function getResult() {
  return doc.getElementById('ns2tpy').innerHTML;
}
function Die() {
  doc.getElementById('ns2Die').innerHTML = 'e';
}