/* sidepanel.js */

const debug = true;

// Browser COnstants

const isMozilla = typeof browser === 'object';

debug && console.log(`[isMozilla]: ${isMozilla}`);

const myBrowser = typeof browser === 'object' ?
              browser :
              chrome;

debug && console.log(`[myBrowser]: ${myBrowser}`);


const browserAction = typeof browser === 'object' ?
              browser.action :
              chrome.action;

debug && console.log(`[browserAction]: ${browserAction}`);

const browserRuntime = typeof browser === 'object' ?
              browser.runtime :
              chrome.runtime;

debug && console.log(`[browserRuntime]: ${browserRuntime}`);

const browserScripting = typeof browser === 'object' ?
              browser.scripting :
              chrome.scripting;

debug && console.log(`[browserScripting]: ${browserScripting}`);

const browserI18n = typeof browser === 'object' ?
            browser.i18n :
            chrome.i18n;

debug && console.log(`[browserI18n]: ${browserI18n}`);

const browserTabs = typeof browser === 'object' ?
            browser.tabs :
            chrome.tabs;

debug && console.log(`[browserTabs]: ${browserTabs}`);

let myWindowId = -1;  // used for checking if a tab is in the same window as the sidebar

let divTitle;
let ulHeadings;
let ulRegions;
let ulLinks;


// Initialize controls in Side Panel
window.addEventListener('load', () => {

  const btnGetInfo = document.querySelector("#id-btn-get-info");

  divTitle   = document.querySelector("#id-div-title");
  ulHeadings = document.querySelector("#id-ul-headings");
  ulRegions  = document.querySelector("#id-ul-regions");
  ulLinks    = document.querySelector("#id-ul-links");

  debug && console.log(`[divTitle  ]: ${divTitle}`);
  debug && console.log(`[ulHeadings]: ${ulHeadings}`);
  debug && console.log(`[ulRegions ]: ${ulRegions}`);
  debug && console.log(`[ulLinks   ]: ${ulLinks}`);

  btnGetInfo.addEventListener('click', () => {
    debug && console.log(`[Get Information Button][click]`);

    updateContent();

  });

});

function clearContent(message = '') {

   while(divTitle.firstChild) {
    divTitle.removeChild(divTitle.firstChild);
   }

   while(ulRegions.firstChild) {
    ulRegions.removeChild(ulRegions.firstChild);
   }

   while(ulHeadings.firstChild) {
    ulHeadings.removeChild(ulHeadings.firstChild);
   }

   while(ulLinks.firstChild) {
    ulLinks.removeChild(ulLinks.firstChild);
   }

   if (message) {

      divTitle.textContent = message;

      let liNode = document.createElement('li');
      liNode.textContent = message;
      ulHeadings.appendChild(liNode);

      liNode = document.createElement('li');
      liNode.textContent = message;
      ulRegions.appendChild(liNode);

      liNode = document.createElement('li');
      liNode.textContent = message;
      ulLinks.appendChild(liNode);

   }

}

function handleHighlight(event) {

  const ordinalPosition = event.currentTarget.getAttribute('data-ordinal-position');

  async function sendHighlightMessage(tabs) {
    debug && console.log(`[ssendHighlightMessage]`);
    for (const tab of tabs) {
      debug && console.log(`[sendHighlightMessage][tab]: ${tab.id}`);
      const myResult = await myBrowser.tabs
        .sendMessage(tab.id, { highlightPosition : ordinalPosition });

      debug && console.log(`[sendHighlightMessage][myResult]: ${myResult}`);
    }
  }

  myBrowser.tabs
    .query({
      currentWindow: true,
      active: true,
    })
    .then(sendHighlightMessage)
    .catch(onError);
}



function updateContent() {

  clearContent('loading...');

  myBrowser.tabs
    .query({
      currentWindow: true,
      active: true,
    })
    .then(sendMessageToTabs)
    .catch(onError);
}

function onError(error) {
  console.error(`Error: ${error}`);
  clearContent('Protocol not supported');
}

async function sendMessageToTabs(tabs) {
  debug && console.log(`[sendMessageToTabs]`);
  for (const tab of tabs) {
    debug && console.log(`[sendMessageToTabs][tab]: ${tab.id}`);
    const myResult = await myBrowser.tabs
      .sendMessage(tab.id, { runEvaluation : true });

    clearContent();

    divTitle.textContent = myResult.title;

    if (myResult.headings) {
      myResult.headings.forEach( (h) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', handleHighlight);
        liNode.setAttribute('data-ordinal-position', h.ordinalPosition);
        liNode.textContent = `${h.level}: ${h.accName} (${h.ordinalPosition})`;
        ulHeadings.appendChild(liNode);
        console.log(liNode.textContent);
      });
    }

    if (myResult.regions) {
      myResult.regions.forEach( (r) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', handleHighlight);
        liNode.setAttribute('data-ordinal-position', r.ordinalPosition);
        const textContent = r.accName ? `${r.role}: ${r.accName}` : r.role;
        liNode.textContent = textContent + ` (${r.ordinalPosition})`;
        ulRegions.appendChild(liNode);
        console.log(liNode.textContent);
      });
    }

    if (myResult.links) {
      myResult.links.forEach( (l) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', handleHighlight);
        const textContent = l.accName ?
                            `${l.accName}` :
                            `** no name **`;
        liNode.textContent = textContent + ` (${l.ordinalPosition})`;
        liNode.setAttribute('data-ordinal-position', l.ordinalPosition);
        liNode.setAttribute('data-href', l.href);
        liNode.setAttribute('data-is-internal', l.isInternal);
        liNode.setAttribute('data-is-external', l.isExternal);
        ulLinks.appendChild(liNode);
        console.log(liNode.textContent);
      });
    }



  }
}

//-----------------------------------------------
//  Functions communicating with content script
//-----------------------------------------------




//-----------------------------------------------
//  Functions that handle tab and window events
//-----------------------------------------------

/*
*   Add event listeners when sidebar loads
*/
window.addEventListener('load', function () {
//  browserTabs.onUpdated.addListener(handleTabUpdated, { properties: ["status"] });
  browserTabs.onUpdated.addListener(handleTabUpdated);
  browserTabs.onActivated.addListener(handleTabActivated);
  myBrowser.windows.onFocusChanged.addListener(handleWindowFocusChanged);
  updateContent();
});

window.addEventListener('unload', function () {
  const page = myBrowser.extension.getBackgroundPage();
  debug && console.log(`[unload][page]: ${page}`);
});


/*
**  Handle tabs.onUpdated event when status is 'complete'
*/
let activeTabUrl;
let lastStatus = '';
function handleTabUpdated (tabId, changeInfo, tab) {
  // Skip content update when new page is loaded in background tab
  if (!tab.active) return;

  if (debug) {
    if (tab.url !== activeTabUrl) {
      activeTabUrl = tab.url;
      console.log(`[handleTabUpdated][url]: ${tab.url}`);
    }
    console.log(`[handleTabUpdated][status]: ${changeInfo.status}`);
  }

  if (changeInfo.status === "complete") {
    debug && console.log(`[handleTabUpdated][status]: complete`);
    lastStatus = changeInfo.status;
    updateContent();
  }
  else {
    if (changeInfo.status !== lastStatus) {
      debug && console.log(`[handleTabUpdated][status]: ${changeInfo.status}`);
      lastStatus = changeInfo.status;
    }
  }
}

/*
**  @function logTabUrl
*/

async function logTabUrl(info) {
  try {
    let tab = await browserTabs.get(info.tabId);
    console.log(`[handleTabActivated][ myWindowId]: ${myWindowId}`);
    console.log(`[handleTabActivated][   windowId]: ${tab.windowId}`);
    console.log(`[handleTabActivated][same window]: ${tab.windowId === myWindowId}`);
    console.log(`[handleTabActivated][         id]: ${tab.id}`);
    console.log(`[handleTabActivated][        url]: ${tab.url}`);
  }
  catch (error) {
    console.error(error);
  }
}

/*
**  Handle tabs.onActivated event
*/
function handleTabActivated (activeInfo) {
  if (debug) {
    logTabUrl(activeInfo);
  }
  updateContent();
}

/*
**  Handle window focus change events: If the sidebar is open in the newly
**  focused window, save the new window ID and update the sidebar content.
*/
function handleWindowFocusChanged (windowId) {
  debug && console.log(`[handleWindowFocusChanged][windowId]: ${windowId}`);
  if (windowId !== myWindowId) {
    if (isMozilla) {
      let checkingOpenStatus = myBrowser.sidebarAction.isOpen({ windowId });
      checkingOpenStatus.then(onGotStatus, onInvalidId);
    }
  }

  function onGotStatus (result) {
    if (result) {
      myWindowId = windowId;

      updateContent();
      if (debug) console.log(`Focus changed to window: ${myWindowId}`);
    }
  }

  function onInvalidId (error) {
    if (debug) console.log(`onInvalidId: ${error}`);
  }
}

