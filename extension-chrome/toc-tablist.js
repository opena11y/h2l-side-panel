/* toc-tablist.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocTablist', false);
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

/* Utility functions */

/*
**  @function removeChildContent
*/

function removeChildContent(node) {
   while(node.firstChild) {
    node.removeChild(node.firstChild);
   }
}


/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div>
    <button id="id-btn-get-info">
      Get Information
    </button>
  </div>

  <div>
    <h2>Title</h2>
    <div id="id-div-title">Loading...</div>
  </div>
  <div role="tablist">
    <div role="tab"
         id="id-tab-headings">
      Headings
    </div>
    <div role="tab"
         id="id-tab-regions">
      Regions
    </div>
    <div role="tab"
         id="id-tab-links">
      Links
    </div>
  </div>
  <div id="tabpanels">
    <div role="tabpanel"
         aria-labelledby="id-tab-headings">

      <ul id="id-ul-headings">
        <li>Loading...</li>
      </ul>
    </div>

    <div role="tabpanel"
         aria-labelledby="id-tab-regions">

      <ul id="id-ul-regions">
        <li>Loading...</li>
      </ul>
    </div>

    <div role="tabpanel"
         aria-labelledby="id-tab-links">

      <ul id="id-ul-links">
        <li>Loading...</li>
      </ul>    </div>
  </div>
`;

class TOCTabList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCTabList...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-tablist.css');
    this.shadowRoot.appendChild(link);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.divTitle   = this.shadowRoot.querySelector("#id-div-title");
    this.ulHeadings = this.shadowRoot.querySelector("#id-ul-headings");
    this.ulRegions  = this.shadowRoot.querySelector("#id-ul-regions");
    this.ulLinks    = this.shadowRoot.querySelector("#id-ul-links");

    this.btnGetInfo = this.shadowRoot.querySelector("#id-btn-get-info");

  }

  init (containerObj, getInformationHandler) {
    this.btnGetInfo.addEventListener('click', getInformationHandler.bind(containerObj));
  }

  clearContent(message = '') {
    debug.flag && debug.log(`[clearContent]: ${message}`);

     removeChildContent(this.divTitle);
     removeChildContent(this.ulRegions);
     removeChildContent(this.ulHeadings);
     removeChildContent(this.ulLinks);

     if (message) {
        this.divTitle.textContent = message;

        let liNode = document.createElement('li');
        liNode.textContent = message;
        this.ulHeadings.appendChild(liNode);

        liNode = document.createElement('li');
        liNode.textContent = message;
        this.ulRegions.appendChild(liNode);

        liNode = document.createElement('li');
        liNode.textContent = message;
        this.ulLinks.appendChild(liNode);
     }
  }

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    this.clearContent();

    this.divTitle.textContent = myResult.title;
    debug.flag && debug.log(`[Title]:${ myResult.title}`);

    if (myResult.headings) {
      myResult.headings.forEach( (h) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', highlightHandler.bind(containerObj));
        liNode.setAttribute('data-ordinal-position', h.ordinalPosition);
        liNode.textContent = `${h.level}: ${h.accName} (${h.ordinalPosition})`;
        this.ulHeadings.appendChild(liNode);
        debug.flag && debug.log(liNode.textContent);
      });
    }

    if (myResult.regions) {
      myResult.regions.forEach( (r) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', highlightHandler.bind(containerObj));
        liNode.setAttribute('data-ordinal-position', r.ordinalPosition);
        const textContent = r.accName ? `${r.role}: ${r.accName}` : r.role;
        liNode.textContent = textContent + ` (${r.ordinalPosition})`;
        this.ulRegions.appendChild(liNode);
        debug.flag && debug.log(liNode.textContent);
      });
    }

    if (myResult.links) {
      myResult.links.forEach( (l) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', highlightHandler.bind(containerObj));
        const textContent = l.accName ?
                            `${l.accName}` :
                            `** no name **`;
        liNode.textContent = textContent + ` (${l.ordinalPosition})`;
        liNode.setAttribute('data-ordinal-position', l.ordinalPosition);
        liNode.setAttribute('data-href', l.href);
        liNode.setAttribute('data-is-internal', l.isInternal);
        liNode.setAttribute('data-is-external', l.isExternal);
        this.ulLinks.appendChild(liNode);
        debug.flag && debug.log(liNode.textContent);
      });
    }
  }
}

window.customElements.define('toc-tablist', TOCTabList);



