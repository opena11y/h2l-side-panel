/* toc-sidepanel.js */

import DebugLogging   from './debug.js';

import {
  getMessage,
  setTablistAttr
} from './utils.js';

import {
  getOptions
} from './storage.js';

/* Constants */

const debug = new DebugLogging('tocSidepanel', false);
debug.flag = false;

// Browser Constants

const isMozilla = typeof browser === 'object';
debug.flag && debug.log(`[     isMozilla]: ${isMozilla}`);

const myBrowser = typeof browser === 'object' ?
              browser :
              chrome;
debug.flag && debug.log(`[     myBrowser]: ${myBrowser}`);

const browserTabs = typeof browser === 'object' ?
            browser.tabs :
            chrome.tabs;
debug.flag && debug.log(`[   browserTabs]: ${browserTabs}`);

const browserRuntime = typeof browser === 'object' ?
              browser.runtime :
              chrome.runtime;
debug.flag && debug.log(`[browserRuntime]: ${browserRuntime}`);


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
  <div id="id-toc-sidepanel"
       class="toc-sidepanel">
    <toc-tablist></toc-tablist>
  </div>
`;

class TOCSidePanel extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCSidePanel ...`);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.activeTabUrl;
    this.lastStatus = '';

    this.tocTablistNode = this.shadowRoot.querySelector('toc-tablist');
    debug.flag && debug.log(`[tocTablistNode]: ${this.tocTablistNode}`);

    // Update side panel title

    document.querySelector('title').textContent = getMessage('extension_name_chrome');

    const version = browserRuntime.getManifest().version;
    setTablistAttr('version', version);

    /*
    *   Add Window event listeners
    */
    window.addEventListener('load', this.handleWindowLoad.bind(this));
    window.addEventListener('unload', this.handleWindowUnload.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));

    // Setup a port to identify when side panel is open
    browserRuntime.connect({ name: 'toc-sidepanel-open' });

    browserRuntime.onMessage.addListener((request, sender, sendResponse) => {
      if (request['toc-sidepanel-open'] === true) {
        sendResponse(true);
      }
    });
  }

  clearContent(message = '') {
    debug.flag && debug.log(`[clearContent]: ${message}`);
    this.tocTablistNode.clearContent(message);
  }

  highlightOrdinalPosition(ordinalPosition, info='') {
    debug.flag && debug.log(`[highlightOrdinalPosition]`);

    if (!ordinalPosition) {
      ordinalPosition='';
      info='';
    }

    async function sendHighlightMessage(tabs) {
      debug.flag && debug.log(`[sendHighlightMessage]`);
      for (const tab of tabs) {
        debug.flag && debug.log(`[sendHighlightMessage][tab]: ${tab.id}`);
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, {highlight: {
                                    position: ordinalPosition,
                                    info: info
                                  }
                                });

        debug.flag && debug.log(`[sendHighlightMessage][myResult]: ${myResult}`);
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

  updateHighlightConfig(options) {
    debug.flag && debug.log(`[updateHighighlightConfig]`);

    async function sendHighlightMessage(tabs) {
      debug.flag && debug.log(`[sendUpdateHighlightConfigMessage]`);
      for (const tab of tabs) {
        debug.flag && debug.log(`[sendUpdateHighlightConfigMessage][tab]: ${tab.id}`);
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, { updateHighlightConfig: {
                                    size: options.highlightSize,
                                    style: options.highlightStyle
                                  }
                                });
        debug.flag && debug.log(`[sendUpdateHighlightConfigMessage][myResult]: ${myResult}`);
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

  focusOrdinalPosition(ordinalPosition) {
    debug.flag && debug.log(`[focusOrdinalPosition]`);

    async function sendFocusMessage(tabs) {
      debug.flag && debug.log(`[sendFocusMessage]`);
      for (const tab of tabs) {
        debug.flag && debug.log(`[sendFocusMessage][tab]: ${tab.id}`);
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, { focusPosition : ordinalPosition });

        debug.flag && debug.log(`[sendfocusMessage][myResult]: ${myResult}`);
      }
    }

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(sendFocusMessage)
      .catch(onError);
  }


  updateContent() {
    debug.flag && debug.log(`[updateContent]`);
    this.clearContent(getMessage('loading_content'));

    const spObj = this;

    function onUpdateContentError() {
      spObj.clearContent(getMessage('protocol_not_supported'));
      onError()
    }
    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(this.sendMessageToTabs.bind(this))
      .catch(onUpdateContentError);
  }

  handleGetInformationClick () {
    debug.flag && debug.log(`[handleGetInformationClick]`);

    this.clearContent(getMessage('loading_content'));

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(this.sendMessageToTabs.bind(this))
      .catch(onError);

  }

  async sendMessageToTabs(tabs) {
    debug.flag && debug.log(`[sendMessageToTabs]`);

    const tocSidePanelObj = this;

    for (const tab of tabs) {
      debug.flag && debug.log(`[sendMessageToTabs][tab]: ${tab.id}`);
      const myResult = await myBrowser.tabs
        .sendMessage(tab.id, { runEvaluation : true });

      tocSidePanelObj.tocTablistNode.updateContent(myResult);
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

    getOptions().then( (options) => {
      this.updateHighlightConfig(options);
    });
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
        this.clearContent(getMessage('loading_content'));
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
      that.clearContent(getMessage('protocol_not_supported'));
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

  handleResize () {
    debug.flag && debug.log(`handleResize: ${window.innerHeight} x ${window.innerWidth}`);
    this.tocTablistNode.resize();
  }

}

window.customElements.define('toc-sidepanel', TOCSidePanel);



