/* toc-tablist.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocSidepanel', false);
debug.flag = true;

// Browser Constants

const isMozilla = typeof browser === 'object';
debug.flag && debug.log(`[isMozilla]: ${isMozilla}`);

const myBrowser = typeof browser === 'object' ?
              browser :
              chrome;
debug.flag && debug.log(`[myBrowser]: ${myBrowser}`);


const browserAction = typeof browser === 'object' ?
              browser.action :
              chrome.action;
debug.flag && debug.log(`[browserAction]: ${browserAction}`);

const browserRuntime = typeof browser === 'object' ?
              browser.runtime :
              chrome.runtime;
debug.flag && debug.log(`[browserRuntime]: ${browserRuntime}`);

const browserScripting = typeof browser === 'object' ?
              browser.scripting :
              chrome.scripting;
debug.flag && debug.log(`[browserScripting]: ${browserScripting}`);

const browserI18n = typeof browser === 'object' ?
            browser.i18n :
            chrome.i18n;
debug.flag && debug.log(`[browserI18n]: ${browserI18n}`);

const browserTabs = typeof browser === 'object' ?
            browser.tabs :
            chrome.tabs;
debug.flag && debug.log(`[browserTabs]: ${browserTabs}`);

let myWindowId = -1;  // used for checking if a tab is in the same window as the sidebar

/* Utility functions */

/*
**  @function onError
*/

function onError(error) {
  console.error(`Error: ${error}`);
}

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div id="id-toc-sidepanel">
    <toc-tablist></toc-tablist>
  </div>
`;

class TOCSidePanel extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCSidePanel ...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-sidepanel.css');
    this.shadowRoot.appendChild(link);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.activeTabUrl;
    this.lastStatus = '';

    this.tocTablistNode = this.shadowRoot.querySelector('toc-tablist');
    this.tocTablistNode.init(this, this.handleGetInformationClick);

    debug.flag && debug.log(`[tocTablistNode]: ${this.tocTablistNode}`);
    /*
    *   Add Window event listeners
    */
    window.addEventListener('load', this.handleWindowLoad.bind(this));
    window.addEventListener('unload', this.handleWindowUnload.bind(this));
  }

  clearContent(message = '') {
    debug.flag && debug.log(`[clearContent]: ${message}`);
    this.tocTablistNode.clearContent(message);
  }

  updateContent() {
    debug.flag && debug.log(`[updateContent]`);
    this.clearContent('loading...');
    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(this.sendMessageToTabs.bind(this))
      .catch(onError);
  }

  handleGetInformationClick () {
    debug.flag && debug.log(`[handleGetInformationClick]`);

    this.clearContent('loading...');

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(this.sendMessageToTabs.bind(this))
      .catch(onError);

  }

  handleHighlight(event) {
    debug.flag && debug.log(`[handleHighlight]`);

    async function sendHighlightMessage(tabs) {
      debug.flag && debug.log(`[ssendHighlightMessage]`);
      for (const tab of tabs) {
        debug.flag && debug.log(`[sendHighlightMessage][tab]: ${tab.id}`);
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, { highlightPosition : ordinalPosition });

        debug.flag && debug.log(`[sendHighlightMessage][myResult]: ${myResult}`);
      }
    }

    const ordinalPosition = event.currentTarget.getAttribute('data-ordinal-position');

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(sendHighlightMessage)
      .catch(onError);
  }

  async sendMessageToTabs(tabs) {
    debug.flag && debug.log(`[sendMessageToTabs]`);

    const tocSidePanelObj = this;

    for (const tab of tabs) {
      debug.flag && debug.log(`[sendMessageToTabs][tab]: ${tab.id}`);
      const myResult = await myBrowser.tabs
        .sendMessage(tab.id, { runEvaluation : true });

      tocSidePanelObj.tocTablistNode.updateContent(myResult,
                                                   tocSidePanelObj,
                                                   tocSidePanelObj.handleHighlight);
    }
  }

  //-----------------------------------------------
  //  Methods that handle tab and window events
  //-----------------------------------------------

  handleWindowLoad () {
    debug.flag && debug.log(`[handleWindowLoad]`);

    browserTabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    browserTabs.onActivated.addListener(this.handleTabActivated.bind(this));
    myBrowser.windows.onFocusChanged.addListener(this.handleWindowFocusChanged.bind(this));
    this.updateContent();
  }

  handleWindowUnload () {
    debug.flag && debug.log(`[handleWindowUnload]`);

    const page = myBrowser.extension.getBackgroundPage();
    debug.flag && debug.log(`[unload][page]: ${page}`);
  }

  /*
  **  Handle tabs.onUpdated event when status is 'complete'
  */
  handleTabUpdated (tabId, changeInfo, tab) {
    debug.flag && debug.log(`[handleTabUpdated]`);

    // Skip content update when new page is loaded in background tab
    if (!tab.active) return;

    if (debug) {
      if (tab.url !== this.activeTabUrl) {
        this.activeTabUrl = tab.url;
        console.log(`[handleTabUpdated][url]: ${tab.url}`);
      }
      console.log(`[handleTabUpdated][status]: ${changeInfo.status}`);
    }

    if (changeInfo.status === "complete") {
      debug.flag && debug.log(`[handleTabUpdated][status]: complete`);
      this.lastStatus = changeInfo.status;
      this.updateContent();
    }
    else {
      if (changeInfo.status !== this.lastStatus) {
        debug.flag && debug.log(`[handleTabUpdated][status]: ${changeInfo.status}`);
        this.lastStatus = changeInfo.status;
      }
    }
  }

  /*
  **  Handle tabs.onActivated event
  */
  handleTabActivated (activeInfo) {
    debug.flag && debug.log(`[handleTabActivated]`);
    this.logTabUrl(activeInfo);

    const that = this;

    function onErrorPotocol(error) {
      that.clearContent(`Protocol not supported...`);
      onError(error);
    }

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(this.sendMessageToTabs.bind(this))
      .catch(onErrorPotocol);

  }

  /*
  **  @function logTabUrl
  */

  async logTabUrl(info) {
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
  **  Handle window focus change events: If the sidebar is open in the newly
  **  focused window, save the new window ID and update the sidebar content.
  */
  handleWindowFocusChanged (windowId) {
    debug.flag && debug.log(`[handleWindowFocusChanged][windowId]: ${windowId}`);

    if (windowId !== myWindowId) {
      if (isMozilla) {
        let checkingOpenStatus = myBrowser.sidebarAction.isOpen({ windowId });
        checkingOpenStatus.then(onGotStatus, onInvalidId);
      }
    }

    function onGotStatus (result) {
      if (result) {
        myWindowId = windowId;

        this.updateContent();
        debug.flag && debug.log(`Focus changed to window: ${myWindowId}`);
      }
    }

    function onInvalidId (error) {
      debug.flag && debug.log(`onInvalidId: ${error}`);
    }
  }



}

window.customElements.define('toc-sidepanel', TOCSidePanel);



