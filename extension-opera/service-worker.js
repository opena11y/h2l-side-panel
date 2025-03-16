/* service-worker.js */

const debug = true;

if (typeof chrome  === 'object' && chrome.sidePanel) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });
}

debug && console.log(`[browser][tyoeof]: ${typeof browser}`);

if (typeof browser === 'object') {
  debug && console.log(`[browser][tyoeof]: ${browser.action}`);
}

if (typeof browser === 'object' && browser.action) {
  debug && console.log(`[Added Browser Action]`);
  browser.action.onClicked.addListener(function (evt) {
    browser.sidebarAction.toggle();
  });
}

