/* toc-tablist.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocTablist', false);
debug.flag = true;

const sidepanelOffsetHieght = 50;
const sidepanelOffsetWidth  = 20;

const tabpanelOffsetHeight = 20;
const tabpanelOffsetWidth = 10;

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

  <div id="buttons">
    <button id="id-btn-options">
      Options
    </button>
    <button id="id-btn-get-info">
      Get Information
    </button>
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

    this.divTitle        = this.shadowRoot.querySelector('#id-div-title');
    this.divTablist      = this.shadowRoot.querySelector('[role="tablist"]');
    this.divTabpanels    = this.shadowRoot.querySelector('#tabpanels');

    this.tocHeadingsTree = this.shadowRoot.querySelector('toc-headings-tree');
    this.tocRegionsList  = this.shadowRoot.querySelector('toc-regions-list');
    this.tocLinksGrid    = this.shadowRoot.querySelector('toc-links-grid');

    this.btnGetInfo      = this.shadowRoot.querySelector('#id-btn-get-info');
    this.btnOptions      = this.shadowRoot.querySelector('#id-btn-options');
    this.divButtons      = this.shadowRoot.querySelector('#buttons');

    debug.flag && debug.log(`[tocHeadingsTree]: ${this.tocHeadingsTree}`);
    debug.flag && debug.log(`[ tocRegionsList]: ${this.tocRegionsList}`);
    debug.flag && debug.log(`[   tocLinksGrid]: ${this.tocLinksGrid}`);

    debug.flag && debug.log(`[TabList]: ${this.divTablist}`);

    this.tabNodes = [];

    this.firstTab = null;
    this.lastTab = null;

    this.tabNodes = Array.from(this.divTablist.querySelectorAll('[role=tab]'));
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
    this.resize(window.innerHeight, window.innerWidth);
  }

  init (containerObj, getInformationHandler) {
    this.btnGetInfo.addEventListener('click', getInformationHandler.bind(containerObj));
  }

  resize () {

    const height = window.innerHeight;
    const width  = window.innerWidth;

    debug.flag && debug.log(`height: ${height} x width: ${width}`);

    const titleRect     = this.divTitle.getBoundingClientRect();
    const tablistRect   = this.divTablist.getBoundingClientRect();
    const tabpanelsRect = this.divTabpanels.getBoundingClientRect();
    const buttonsRect   = this.divButtons.getBoundingClientRect();

    debug.flag && debug.log(`[    titleRect]: ${    titleRect.height}`);
    debug.flag && debug.log(`[  tablistRect]: ${  tablistRect.height}`);
    debug.flag && debug.log(`[tabpanelsRect]: ${tabpanelsRect.height}`);
    debug.flag && debug.log(`[  buttonsRect]: ${  buttonsRect.height}`);

    const newHeight = height -
                      titleRect.height -
                      tablistRect.height -
                      buttonsRect.height -
                      sidepanelOffsetHieght;

    const tabpanelHeight = newHeight - tabpanelOffsetHeight;

    const newWidth       = width - sidepanelOffsetWidth;
    const tabpanelWidth  = newWidth - tabpanelOffsetWidth;

    debug.flag && debug.log(`newHeight: ${newHeight}`);
    debug.flag && debug.log(` newWidth: ${newWidth}`);

    this.divTabpanels.style.height = newHeight + 'px';
    this.divTabpanels.style.width  = newWidth + 'px';

    debug.flag && debug.log(`[    newHeight]: ${newHeight}`);

    this.tabpanelNodes.forEach ( (tabpanel) => {
      tabpanel.style.height = tabpanelHeight + 'px';
      tabpanel.style.width  = tabpanelWidth  + 'px';
    });

    this.tocHeadingsTree.resize(tabpanelsRect.height, newWidth);
    this.tocRegionsList.resize(tabpanelsRect.height, newWidth);
    this.tocLinksGrid.resize(tabpanelsRect.height, newWidth);
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

  updateContent(myResult) {
    debug.flag && debug.log(`[updateContent]`);

    this.divTitle.textContent = myResult.title;
    debug.flag && debug.log(`[Title]:${ myResult.title}`);

    this.tocHeadingsTree.updateContent(myResult);
    this.tocRegionsList.updateContent(myResult);
    this.tocLinksGrid.updateContent(myResult);

    this.resize();
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



