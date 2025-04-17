/* toc-tablist.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocTablist', false);
debug.flag = true;

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
      <toc-headings-tree></toc-headings-tree>
    </div>

    <div role="tabpanel"
         aria-labelledby="id-tab-regions">
      <toc-regions-list></toc-regions-list>
    </div>

    <div role="tabpanel"
         aria-labelledby="id-tab-links">
      <toc-links-grid></toc-links-grid>
    </div>
  </div>
`;

class TOCTabList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCTabList...`);

    // Use external CSS style sheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-tablist.css');
    this.shadowRoot.appendChild(link);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.divTitle        = this.shadowRoot.querySelector("#id-div-title");
    this.tocHeadingsTree = this.shadowRoot.querySelector("toc-headings-tree");
    this.tocRegionsList  = this.shadowRoot.querySelector("toc-regions-list");
    this.tocLinksGrid    = this.shadowRoot.querySelector("toc-links-grid");

    debug.flag && debug.log(`[tocLinksGrid]: ${this.tocLinksGrid}`);
    debug.flag && debug.log(`[tocLinksGrid][ clearContent]: ${this.tocLinksGrid.clearContent}`);
    debug.flag && debug.log(`[tocLinksGrid][updateContent]: ${this.tocLinksGrid.updateContent}`);

    this.btnGetInfo = this.shadowRoot.querySelector("#id-btn-get-info");

  }

  init (containerObj, getInformationHandler) {
    this.btnGetInfo.addEventListener('click', getInformationHandler.bind(containerObj));
  }

  clearContent(message='') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);


    removeChildContent(this.divTitle);
    if ((typeof message === 'string') && message.length) {
      this.divTitle.textContent = message;
      this.tocHeadingsTree.clearContent(message);
      this.tocRegionsList.clearContent(message);
      this.tocLinksGrid.clearContent(message);
    }
  }

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    this.divTitle.textContent = myResult.title;
    debug.flag && debug.log(`[Title]:${ myResult.title}`);

    this.tocHeadingsTree.updateContent(myResult, containerObj, highlightHandler);
    this.tocRegionsList.updateContent(myResult, containerObj, highlightHandler);
    this.tocLinksGrid.updateContent(myResult, containerObj, highlightHandler);
  }
}

window.customElements.define('toc-tablist', TOCTabList);



