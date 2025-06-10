/* toc-tablist.js */

/* Imports */

import DebugLogging from './debug.js';

import {
  removeChildContent,
  setI18nLabels,
  updateContent
} from './utils.js';

import {
  getOptions,
  saveOptions,
  saveOption
} from './storage.js'

/* Constants */

const debug = new DebugLogging('tocTablist', false);
debug.flag = false;

const sidepanelOffsetHieght = 50;
const sidepanelOffsetWidth  = 20;

const tabpanelOffsetHeight = 20;
const tabpanelOffsetWidth = 10;

const URL_ABOUT = 'https://opena11y.github.io/table-of-contents/';

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div id="id-toc-tablist"
       class="toc-tablist">
    <div>
      <h2 data-i18n="tablist_title"></h2>
      <div id="id-div-title"></div>
    </div>

    <div role="tablist">
      <div id="id-tab-headings"
           role="tab"
           aria-controls="id-tabpanel-headings">
        <span class="focus">
          <span id="id-tab-headings"
                data-i18n="tab_headings">
            XYZ
          </span>
        </span>
      </div>
      <div id="id-tab-landmarks"
           role="tab"
           aria-controls="id-tabpanel-landmarks">
        <span class="focus">
          <span id="id-tab-landmarks"
              data-i18n="tab_landmarks">
            XYZ
          </span>
        </span>
      </div>
      <div id="id-tab-links"
           role="tab"
           aria-controls="id-tabpanel-links">
        <span class="focus">
          <span id="id-tab-links"
              data-i18n="tab_links">
            XYZ
          </span>
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
           id="id-tabpanel-landmarks"
           aria-labelledby="id-tab-landmarks">
        <toc-landmarks-list></toc-landmarks-list>
      </div>

      <div role="tabpanel"
           id="id-tabpanel-links"
           aria-labelledby="id-tab-links">
        <toc-links-grid></toc-links-grid>
      </div>
    </div>

    <div id="summary" role="group" aria-label="Summary">
      <div role="status">
        <span id="id-headings-count">
          <span class="value"></span>
          <span class="single"> Heading</span>
          <span class="plural"> Headings</span>
        </span>
        <span class="divider" aria-hidden="true">•</span>
        <span id="id-landmarks-count">
          <span class="value"></span>
          <span class="single"> Landmark</span>
          <span class="plural"> Landmarks</span>
        </span>
        <span class="divider" aria-hidden="true">•</span>
        <span id="id-links-count">
          <span class="value"></span>
          <span class="single"> Link</span>
          <span class="plural"> Links</span>
        </span>
      </div>
    </div>

    <footer>
      <div class="first">
        <button id="id-btn-options"
                data-i18n="buttons_options">
        </button>
      </div>
      <div class="middle">
        <button id="id-btn-about"
                data-i18n="buttons_about">
        </button>
      </div>
      <div class="last">
        <button id="id-btn-update-info"
                data-i18n="buttons_update_info">
        </button>
      </div>
    </footer>
    <toc-options-dialog></toc-options-dialog>
  </div>
`;

class TOCTabList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS style sheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-tablist.css');
    this.shadowRoot.appendChild(link);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './toc-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);


    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.divTitle        = this.shadowRoot.querySelector('#id-div-title');
    this.divTablist      = this.shadowRoot.querySelector('[role="tablist"]');
    this.divTabpanels    = this.shadowRoot.querySelector('#tabpanels');

    this.tocHeadingsTree   = this.shadowRoot.querySelector('toc-headings-tree');
    this.tocLandmarksList  = this.shadowRoot.querySelector('toc-landmarks-list');
    this.tocLinksGrid      = this.shadowRoot.querySelector('toc-links-grid');
    this.tocOptionsDialog  = this.shadowRoot.querySelector('toc-options-dialog');

    this.divSummary      = this.shadowRoot.querySelector('#summary');

    const btnGetInfo      = this.shadowRoot.querySelector('#id-btn-update-info');
    btnGetInfo.addEventListener('click', this.handleUpdateClick.bind(this));

    const btnAbout      = this.shadowRoot.querySelector('#id-btn-about');
    btnAbout.addEventListener('click', this.handleAboutClick.bind(this));

    const btnOptions      = this.shadowRoot.querySelector('#id-btn-options');
    btnOptions.addEventListener('click', this.handleOptionsClick.bind(this));

    this.footerNode      = this.shadowRoot.querySelector('footer');

    this.tabNodes = [];

    this.firstTab = null;
    this.lastTab = null;

    this.tabNodes = Array.from(this.divTablist.querySelectorAll('[role=tab]'));
    this.tabpanels = [];

    this.tabNodes.forEach( (tabNode) => {
      const tabpanel = {};

      const tabpanelNode =  this.shadowRoot.querySelector(`#${tabNode.getAttribute('aria-controls')}`);

      tabNode.tabIndex = -1;
      tabNode.setAttribute('aria-selected', 'false');

      tabpanel.node = tabpanelNode;
      tabpanel.contentNode = tabpanelNode.firstElementChild;

      this.tabpanels.push(tabpanel);

      tabNode.addEventListener('keydown', this.handleTabKeydown.bind(this));
      tabNode.addEventListener('click',   this.handleTabClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tabNode;
      }
      this.lastTab = tabNode;

    });

    setI18nLabels(this.shadowRoot, debug.flag);
    this.resize(window.innerHeight, window.innerWidth);

    getOptions().then((options) => {

      const lastTabNode = options.lastTabId ?
                          this.shadowRoot.querySelector(`#${options.lastTabId}`) :
                          null;

      if (options.lastTabId && lastTabNode) {
        this.setSelectedTab(lastTabNode, false);
      }
      else {
        this.setSelectedTab(this.firstTab, false);
      }
    });
  }

  static get observedAttributes() {
    return [
      "version",
      "headings-count",
      "landmarks-count",
      "links-count"
      ];
  }

  attributeChangedCallback(name, oldValue, newValue) {

    if (name === "headings-count") {
      this.setCount('id-headings-count', newValue);
    }

    if (name === "landmarks-count") {
      this.setCount('id-landmarks-count', newValue);
    }

    if (name === "links-count") {
      this.setCount('id-links-count', newValue);
    }

  }

  resize () {

    const height = window.innerHeight;
    const width  = window.innerWidth;

    const titleRect     = this.divTitle.getBoundingClientRect();
    const tablistRect   = this.divTablist.getBoundingClientRect();
    const tabpanelsRect = this.divTabpanels.getBoundingClientRect();
    const summaryRect   = this.divSummary.getBoundingClientRect();
    const footerRect    = this.footerNode.getBoundingClientRect();

    const newHeight = height -
                      titleRect.height -
                      tablistRect.height -
                      summaryRect.height -
                      footerRect.height -
                      sidepanelOffsetHieght;

    const tabpanelHeight = newHeight - tabpanelOffsetHeight;

    const newWidth       = width - sidepanelOffsetWidth;
    const tabpanelWidth  = newWidth - tabpanelOffsetWidth;

    this.divTabpanels.style.height = newHeight + 'px';
    this.divTabpanels.style.width  = newWidth + 'px';

    this.tabpanels.forEach ( (tabpanel) => {
      tabpanel.node.style.height = tabpanelHeight + 'px';
      tabpanel.node.style.width  = tabpanelWidth  + 'px';
    });

    this.tocHeadingsTree.resize(tabpanelsRect.height, newWidth);
    this.tocLandmarksList.resize(tabpanelsRect.height, newWidth);
    this.tocLinksGrid.resize(tabpanelsRect.height, newWidth);
  }

  setCount (id, count) {
    const countNode = this.shadowRoot.querySelector(`#${id}`);
    const valueNode = countNode.querySelector('.value');
    const singleNode = countNode.querySelector('.single');
    const pluralNode = countNode.querySelector('.plural');

    valueNode.textContent = count;
    if (count === '1') {
      singleNode.style.display = 'inline-block';
      pluralNode.style.display = 'none';
    }
    else {
      pluralNode.style.display = 'inline-block';
      singleNode.style.display = 'none';
    }
  }

  clearContent(message='') {
    this.divTitle.textContent = '';
    this.setCount('id-headings-count', '');
    this.setCount('id-landmarks-count', '');
    this.setCount('id-links-count', '');

    if ((typeof message === 'string') && message.length) {
      this.divTitle.textContent = message;
      this.tocHeadingsTree.clearContent(message);
      this.tocLandmarksList.clearContent(message);
      this.tocLinksGrid.clearContent(message);
    }
  }

  updateContent(myResult) {
    this.divTitle.textContent = myResult.title;
    const tabListObj = this;

    getOptions().then( (options) => {
      const sameUrl = options.lastUrl === myResult.url;
      options.lastUrl = myResult.url;

      if(!sameUrl) {
        options.lastHeadingId = '';
        options.lastLandmarkId = '';
        options.lastLinkId = '';
      }

      saveOptions(options).then( () => {
        tabListObj.tocHeadingsTree.updateContent(sameUrl, myResult);
        tabListObj.tocLandmarksList.updateContent(sameUrl, myResult);
        tabListObj.tocLinksGrid.updateContent(sameUrl, myResult);

        tabListObj.resize();
      });
    });
  }

  // Tablist support functions and heandlers

  setSelectedTab(currentTab, setFocus) {
    const tabListObj = this;
    if (typeof setFocus !== 'boolean') {
      setFocus = true;
    }

    saveOption('lastTabId', currentTab.id).then( () => {
      for (var i = 0; i < this.tabNodes.length; i += 1) {
        var tab = this.tabNodes[i];
        if (currentTab === tab) {
          tab.setAttribute('aria-selected', 'true');
          tab.tabIndex = 0;
          tabListObj.tabpanels[i].node.classList.remove('is-hidden');
          tabListObj.tabpanels[i].contentNode.setAttribute('visible', 'true');
          if (setFocus) {
            tab.focus();
          }
        } else {
          tab.setAttribute('aria-selected', 'false');
          tab.tabIndex = -1;
          this.tabpanels[i].node.classList.add('is-hidden');
          this.tabpanels[i].contentNode.setAttribute('visible', 'false');
        }
      }
    });
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

  handleUpdateClick () {
    updateContent();
  }

  handleAboutClick () {
    window.open(URL_ABOUT);
  }

  handleOptionsClick () {
    this.tocOptionsDialog.openDialog();
  }

  handleTabKeydown(event) {
    const tgt = event.currentTarget;
    let flag = false;

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

  handleTabClick(event) {
    this.setSelectedTab(event.currentTarget);
  }


}

window.customElements.define('toc-tablist', TOCTabList);



