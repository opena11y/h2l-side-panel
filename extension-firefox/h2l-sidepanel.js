/* h2l-sidepanel.js */

import DebugLogging   from './debug.js';

import {
  getMessage,
  setTablistAttr
} from './utils.js';

import {
  getOptions
} from './storage.js';

/* Constants */

const debug = new DebugLogging('h2lSidepanel', false);
debug.flag = false;

// Browser Constants

const isMozilla = typeof browser === 'object';

const myBrowser = typeof browser === 'object' ?
              browser :
              chrome;

const browserTabs = typeof browser === 'object' ?
            browser.tabs :
            chrome.tabs;

const browserRuntime = typeof browser === 'object' ?
              browser.runtime :
              chrome.runtime;


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
  <div id="id-h2l-sidepanel"
       class="h2l-sidepanel">
    <h2l-tablist></h2l-tablist>
  </div>
`;

class H2LSidePanel extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.lastStatus = '';

    this.tocTablistNode = this.shadowRoot.querySelector('h2l-tablist');

    // Update side panel title

    document.querySelector('title').textContent = getMessage('extension_name_chrome');

    const version = browserRuntime.getManifest().version;
    setTablistAttr('version', version);

    /*
    *   Add Window event listeners
    */
    window.addEventListener('DOMContentLoaded', this.handleWindowLoad.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));

    // Setup a port to identify when side panel is open
    browserRuntime.connect({ name: 'h2l-sidepanel-open' });

    browserRuntime.onMessage.addListener((request, sender, sendResponse) => {
      if (request['h2l-sidepanel-open'] === true) {
        sendResponse(true);
      }
    });
  }

  clearContent(message = '') {
    this.tocTablistNode.clearContent(message);
  }


  highlightItems(selectedItem, allItems) {

    async function sendHighlightItemsMessage(tabs) {
      for (const tab of tabs) {
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, {highlightItems: {
                                    selectedItem: selectedItem,
                                    allItems: allItems
                                  }
                                });
      }
    }

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(sendHighlightItemsMessage)
      .catch(onError);
  }

  updateHighlightConfig(options) {

    async function sendHighlightConfigMessage(tabs) {
      for (const tab of tabs) {
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, { updateHighlightConfig: true});
      }
    }

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(sendHighlightConfigMessage)
      .catch(onError);
  }

  highlightItems(selectedItem={}, allItems=[]) {

    async function sendHighlightItemsMessage(tabs) {
      for (const tab of tabs) {
        const myResult = await myBrowser.tabs
          .sendMessage(tab.id, { highlightItems : {
            selectedItem: selectedItem,
            allItems: allItems
          }
        });
      }
    }

    myBrowser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(sendHighlightItemsMessage)
      .catch(onError);
  }

  updateContent() {
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
    const tocSidePanelObj = this;

    for (const tab of tabs) {
      const myResult = await myBrowser.tabs
        .sendMessage(tab.id, { runEvaluation : true });

      tocSidePanelObj.tocTablistNode.updateContent(myResult);
    }
  }

  //-----------------------------------------------
  //  Methods that handle tab and window events
  //-----------------------------------------------

  handleWindowLoad () {
    debug && console.log('Window Loaded');
    browserTabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    browserTabs.onActivated.addListener(this.handleTabActivated.bind(this));
    myBrowser.windows.onFocusChanged.addListener(this.handleWindowFocusChanged.bind(this));

    getOptions().then( (options) => {
      this.updateHighlightConfig(options);
    });
    this.updateContent();
  }

  /*
  **  Handle tabs.onUpdated event when status is 'complete'
  */
  handleTabUpdated (tabId, changeInfo, tab) {
    debug && console.log('handleTabUpdated');
    // Skip content update when new page is loaded in background tab
    if (!tab.active) return;

    if (changeInfo.status === "complete") {
      this.lastStatus = changeInfo.status;
      this.updateContent();
    }
    else {
      if (changeInfo.status !== this.lastStatus) {
        this.lastStatus = changeInfo.status;
        this.clearContent(getMessage('loading_content'));
      }
    }
  }

  /*
  **  Handle tabs.onActivated event
  */
  handleTabActivated (activeInfo) {
    debug && console.log('handleTabActivated');
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
      debug.flag && debug.log(`[handleTabActivated][ myWindowId]: ${myWindowId}`);
      debug.flag && debug.log(`[handleTabActivated][   windowId]: ${tab.windowId}`);
      debug.flag && debug.log(`[handleTabActivated][same window]: ${tab.windowId === myWindowId}`);
      debug.flag && debug.log(`[handleTabActivated][         id]: ${tab.id}`);
      debug.flag && debug.log(`[handleTabActivated][        url]: ${tab.url}`);
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
    debug && console.log('handleWindowFocusChanged');

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
      }
    }

    function onInvalidId (error) {
      debug.flag && debug.log(`onInvalidId: ${error}`);
    }
  }

  handleResize () {
    this.tocTablistNode.resize();
  }

}

window.customElements.define('h2l-sidepanel', H2LSidePanel);



