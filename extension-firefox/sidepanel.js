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

/*
*   Add event listeners when sidebar loads
*/
window.addEventListener('load', function () {
//  browserTabs.onUpdated.addListener(handleTabUpdated, { properties: ["status"] });
  browserTabs.onUpdated.addListener(handleTabUpdated);
  browserTabs.onActivated.addListener(handleTabActivated);
  myBrowser.windows.onFocusChanged.addListener(handleWindowFocusChanged);
//  resizeView();
});

window.addEventListener('unload', function () {
  const page = myBrowser.extension.getBackgroundPage();
  debug && console.log(`[unload][page]: ${page}`);
});


//-----------------------------------------------
//  Functions that handle tab and window events
//-----------------------------------------------

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
    console.log(`[handleTabActivated][ id]: ${tab.id}`);
    console.log(`[handleTabActivated][url]: ${tab.url}`);
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
//  runContentScripts('handleTabActivated');
}

/*
**  Handle window focus change events: If the sidebar is open in the newly
**  focused window, save the new window ID and update the sidebar content.
*/
let myWindowId = '';
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

      //runContentScripts('onGotFocus');
      if (debug) console.log(`Focus changed to window: ${myWindowId}`);
    }
  }

  function onInvalidId (error) {
    if (debug) console.log(`onInvalidId: ${error}`);
  }
}

