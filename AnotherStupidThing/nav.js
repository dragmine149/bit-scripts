/** @type {Document} */
const doc = eval('document');

function closeUI(event) {
  let tab = doc.getElementById('AST-selected-tab').innerHTML;
  let win = doc.getElementById('AST-Win');
  let mainWindow = doc.getElementsByClassName('jss1').item(0);
  let Scls = doc.getElementById('AST-classInfo').innerHTML;
  let original = doc.getElementsByClassName(Scls).item(0);
  let obj = doc.getElementById(`AST-${tab}`);

  if (win == undefined) {
    // just a simple fix. Although we should avoid to call this function alltogether when
    // we are not on that page.
    return;
  }

  // "remove" our element and show the others.
  for (let mwin of mainWindow.childNodes) {
    if (mwin.id == "AST-Win") {
      continue;
    }

    // should be last child.
    mwin.style.display = mwin.lastChild.innerHTML;
    // doc.getElementsByClassName(Scls).item(0).classList.remove(Scls);
    original.classList.add(Scls);
    obj.classList.remove(Scls);
    // todo: fix colour.
    obj.firstChild.firstChild.firstChild.style.color = '#888';
    doc.getElementById('AST-Win').innerHTML = '';

    mwin.lastChild.remove();
  }

  let menus = doc.getElementsByClassName('MuiCollapse-root');
  for (let i = 1; i < menus.length; i++) {
    menus.item(i).firstChild.firstChild.childNodes.forEach((child) => {
      child.removeEventListener('click', closeUI);
    })
  }

  // reset selected tab info for us to use it again.
  doc.getElementById('AST-selected-tab').innerHTML = '';
}

function loadPageInfo(event, tab, page) {
  // check if the tab we clicked is the tab we are currently in.
  if (doc.getElementById('AST-selected-tab').innerHTML == tab) {
    console.log("Tab already selected!");
    return;
  }
  console.log(`Clicked custom tab -> ${tab}!`);

  let Scls = doc.getElementById('AST-classInfo').innerHTML;
  // should only be one element so we should be fine.
  // remove the class from the currently selected element.
  let original = doc.getElementsByClassName(Scls).item(0);
  if (original != null) {
    original.classList.remove(Scls);
  }

  let obj = doc.getElementById(`AST-${tab}`);
  // add to show the switch
  obj.classList.add(Scls);

  // only one so first item is fine.
  let mainWindow = doc.getElementsByClassName('jss1').item(0);
  // get our custom window
  let win = doc.getElementById('AST-Win');
  win.hidden = false;

  // hide all other elements.
  for (let mwin of mainWindow.childNodes) {
    if (mwin.id == "AST-Win") {
      // don't include custom element.
      continue;
    }

    // store the original display value so we can restore it later without things going weird.
    let displayInfo = doc.createElement('div');
    displayInfo.id = "mwin-display";
    mwin.appendChild(displayInfo);
    displayInfo.innerHTML = mwin.style.display;

    mwin.style.display = "none";
  }

  // load tab.
  win.innerHTML = page;
  doc.getElementById('AST-selected-tab').innerHTML = tab;

  // add event listeners for all the items so we can go back once done. (Without having to click a certain button in the UI);
  let menus = doc.getElementsByClassName('MuiCollapse-root');
  for (let i = 1; i < menus.length; i++) {
    menus.item(i).firstChild.firstChild.childNodes.forEach((child) => {
      if (child.id == tab) {
        return;
      }
      child.addEventListener('click', closeUI);
    })
  }
}

/** @param {NS} ns */
function getItems(ns) {
  let items = ns.ls('home', 'AnotherStupidThing');
  let list = [];
  items.forEach((v) => {
    // don't include scripts.
    if (v.endsWith('.js')) {
      return;
    }

    // get the folder name
    let folderName = v.split('/')[1];

    // if already have, return
    if (list.includes(folderName)) {
      return;
    }

    // add to list;
    list.push(folderName);
  })

  return list;
}

/** @param {NS} ns */
export async function main(ns) {
  if (doc.getElementById('AST-hidden') == undefined) {
    // create hidden items to use as a information transfer system.
    let hidden = doc.createElement('div');
    hidden.id = "AST-hidden";
    hidden.hidden = true;
    doc.body.appendChild(hidden);

    hidden.innerHTML = `<div id="AST-selected-tab"></div><div id="AST-cls1"></div><div id="AST-cls2"></div><div id="AST-classInfo"></div>`;
  }

  if (doc.getElementById("AST-Class") == undefined) {
    // create class element
    doc.head.insertAdjacentHTML('beforeend', 
    `<style id="AST-Class">
.AST-main {color: #fff;}
</style>`);
  }

  // sort out the different classes for the selected tab icon stuff.
  const classes = 'MuiButtonBase-root MuiListItem-root MuiListItem-gutters MuiListItem-padding MuiListItem-button';
  const spClasses = classes.split(' ');
  const elements = doc.getElementsByClassName(classes);
  // loop though to see if new items;
  for (let element of elements) {
    element.classList.forEach((cls) => {
      if (spClasses.includes(cls)) {
        return;
      }

      // any other class we don't want.
      if (!cls.startsWith('jss')) {
        return;
      }

      if (doc.getElementById('AST-cls1').innerHTML == cls) {
        if (doc.getElementById('AST-cls2').innerHTML == cls) {
          // continue
          return;
        }
        doc.getElementById('AST-cls2').innerHTML = cls;
        // continue;
        return;
      }

      doc.getElementById('AST-cls1').innerHTML = cls;
    })
  }

  // both items, one should be lower than the other so it should be able to find out which is which.
  const st = doc.getElementById('AST-cls1').innerHTML.replace('jss', '');
  const ot = doc.getElementById('AST-cls2').innerHTML.replace('jss', '');
  doc.getElementById('AST-classInfo').innerHTML = `jss${Number(st) > Number(ot) ? st - 1 : ot - 1}`;


  // create the main viewport window. This will just be hidden when not in use.
  const win = doc.createElement('div');
  win.id = "AST-Win";
  win.style = "colour:#fff"; // make sure its white by default.
  win.hidden = true;
  const mwin = doc.getElementsByClassName('jss1').item(0);
  mwin.insertBefore(win, mwin.firstChild);


  // actually create the tab and events.
  const items = getItems(ns);
  const tab = doc.getElementsByClassName('MuiCollapse-root');
  items.forEach((item) => {
    // load information
    const svg = ns.read(`AnotherStupidThing/${item}/icon.svg.txt`);
    const page = ns.read(`AnotherStupidThing/${item}/page.html.txt`);
    const info = ns.read(`AnotherStupidThing/${item}/info.txt`).split('\n');

    // location is first line.
    const location = info[0].split(',');

    // create the icon.
    /** @type {Element} */
    const tabInfo = tab[location[0]];

    // clone an icon and use that.
    let parentTabIconInfo = tabInfo.firstChild.firstChild;
    let tabIconInfo = parentTabIconInfo.firstChild.cloneNode(true);
    tabIconInfo.id = `AST-${item}`;
    // parentTabIconInfo.appendChild(tabIconInfo);

    let index = Number(location[1]);
    if (index < 0) {
      index = parentTabIconInfo.childNodes.length + index;
    }

    parentTabIconInfo.insertBefore(tabIconInfo, parentTabIconInfo.childNodes.item(index))

    // so that we get auto complete and other things are just better.
    let obj = doc.getElementById(`AST-${item}`);

    // create the icon
    obj.firstChild.firstChild.firstChild.innerHTML = svg;
    obj.firstChild.firstChild.firstChild.ariaLabel = item;
    obj.childNodes.item(1).firstChild.textContent = item;
    obj.classList.remove(doc.getElementById('AST-classInfo').innerHTML);

    // add event listeners and the code they run.
    obj.addEventListener('click', (e) => {
      loadPageInfo(e, item, page);
    });
  })
}
