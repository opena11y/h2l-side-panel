/* toc-tablist.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocTablist', false);
debug.flag = true;

const sidepanelOffsetHieght = 20;
const sidepanelOffsetWidth  = 30;

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
         aria-controls="id-tabpanel-headings">
      <span class="focus"
           id="id-tab-headings">
        Headings
      </span>
    </div>
    <div role="tab"
         aria-controls="id-tabpanel-regions">
      <span class="focus"
            id="id-tab-regions">
        Regions
      </span>
    </div>
    <div role="tab"
         aria-controls="id-tabpanel-links">
      <span class="focus"
            id="id-tab-links">
        Links
      </span>
    </div>
  </div>

  <div id="tabpanels">
    <div role="tabpanel"
         id="id-tabpanel-headings"
         aria-labelledby="id-tab-headings">
      <toc-headings-tree></toc-headings-tree>
    </div>

    <div role="tabpanel"
         id="id-tabpanel-regions"
         aria-labelledby="id-tab-regions">
      <toc-regions-list></toc-regions-list>
    </div>

    <div role="tabpanel"
         id="id-tabpanel-links"
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

    this.btnGetInfo      = this.shadowRoot.querySelector("#id-btn-get-info");
    this.divTitle        = this.shadowRoot.querySelector("#id-div-title");
    this.tocHeadingsTree = this.shadowRoot.querySelector("toc-headings-tree");
    this.tocRegionsList  = this.shadowRoot.querySelector("toc-regions-list");
    this.tocLinksGrid    = this.shadowRoot.querySelector("toc-links-grid");

    this.tablistNode = this.shadowRoot.querySelector("[role=tablist]");

    debug.flag && debug.log(`[TabList]: ${this.tablistNode}`);

    this.tabNodes = [];

    this.firstTab = null;
    this.lastTab = null;

    this.tabNodes = Array.from(this.tablistNode.querySelectorAll('[role=tab]'));
    this.tabpanelNodes = [];

    this.tabNodes.forEach( (tabNode) => {
      debug.flag && debug.log(`[tabNode]: ${tabNode}`);
      const tabpanelNode =  this.shadowRoot.querySelector(`#${tabNode.getAttribute('aria-controls')}`);
      debug.flag && debug.log(`[tabpanelNode]: ${tabpanelNode}`);

      tabNode.tabIndex = -1;
      tabNode.setAttribute('aria-selected', 'false');
      this.tabpanelNodes.push(tabpanelNode);

      tabNode.addEventListener('keydown', this.onKeydown.bind(this));
      tabNode.addEventListener('click', this.onClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tabNode;
      }
      this.lastTab = tabNode;

    });

    this.setSelectedTab(this.firstTab, false);

  }

  resize (height, width) {
    debug.flag && debug.log(`height: ${height} x ${width}`);

    const panelRect = this.tabpanelNodes[0].getBoundingClientRect();

    const newHeight = height - panelRect.top - sidepanelOffsetHieght;
    const newWidth  = width - sidepanelOffsetWidth;
    debug.flag && debug.log(`newHeight: ${newHeight}`);
    debug.flag && debug.log(` newWidth: ${newWidth}`);

    this.tabpanelNodes.forEach ( (tabpanel) => {
      tabpanel.style.height = newHeight + 'px';
      tabpanel.style.width  = newWidth  + 'px';
    });
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

  // Tablist support functions and heandlers

  setSelectedTab(currentTab, setFocus) {
    if (typeof setFocus !== 'boolean') {
      setFocus = true;
    }
    for (var i = 0; i < this.tabNodes.length; i += 1) {
      var tab = this.tabNodes[i];
      if (currentTab === tab) {
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;
        this.tabpanelNodes[i].classList.remove('is-hidden');
        if (setFocus) {
          tab.focus();
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.tabIndex = -1;
        this.tabpanelNodes[i].classList.add('is-hidden');
      }
    }
  }

  setSelectedToPreviousTab(currentTab) {
    var index;

    if (currentTab === this.firstTab) {
      this.setSelectedTab(this.lastTab);
    } else {
      index = this.tabNodes.indexOf(currentTab);
      this.setSelectedTab(this.tabNodes[index - 1]);
    }
  }

  setSelectedToNextTab(currentTab) {
    var index;

    if (currentTab === this.lastTab) {
      this.setSelectedTab(this.firstTab);
    } else {
      index = this.tabNodes.indexOf(currentTab);
      this.setSelectedTab(this.tabNodes[index + 1]);
    }
  }

  /* EVENT HANDLERS */

  onKeydown(event) {
    var tgt = event.currentTarget,
      flag = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.setSelectedToPreviousTab(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.setSelectedToNextTab(tgt);
        flag = true;
        break;

      case 'Home':
        this.setSelectedTab(this.firstTab);
        flag = true;
        break;

      case 'End':
        this.setSelectedTab(this.lastTab);
        flag = true;
        break;

      default:
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event) {
    this.setSelectedTab(event.currentTarget);
  }


}

window.customElements.define('toc-tablist', TOCTabList);



