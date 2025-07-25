/* h2l-tablist.js */

/* Imports */

import DebugLogging from './debug.js';

import {
  filterForCSV,
  getMessage,
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

const debug = new DebugLogging('h2lTablist', false);
debug.flag = false;

const sidepanelOffsetHeight = 55;
const sidepanelOffsetWidth  = 25;

const tabpanelOffsetHeight = 18;
const tabpanelOffsetWidth  = 0;

const minTabpanelHeight = 100;
const minTabpanelWidth = 120;

const URL_ABOUT = 'https://opena11y.github.io/h2l-side-panel';

const MAX_LANDMARKS_WITHOUT_NAMES = 4;

const browserDownloads   = typeof browser === 'object' ?
                       browser.downloads :
                       chrome.downloads;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div id="id-h2l-tablist"
       class="h2l-tablist">
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
        <h2l-headings-tree></h2l-headings-tree>
      </div>

      <div role="tabpanel"
           id="id-tabpanel-landmarks"
           aria-labelledby="id-tab-landmarks">
        <h2l-landmarks-list></h2l-landmarks-list>
      </div>

      <div role="tabpanel"
           id="id-tabpanel-links"
           aria-labelledby="id-tab-links">
        <h2l-links-grid></h2l-links-grid>
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
      <div class="second">
        <button id="id-btn-update-info"
                data-i18n="buttons_update_info">
        </button>
      </div>
      <div class="third">
        <button id="id-btn-about"
                data-i18n="buttons_about">
        </button>
      </div>
      <div class="fourth">
        <button id="id-btn-export"
                data-i18n="buttons_export">
        </button>
      </div>
    </footer>
    <h2l-options-dialog></h2l-options-dialog>
    <h2l-export-dialog></h2l-export-dialog>
  </div>
`;

class TOCTabList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS style sheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './h2l-tablist.css');
    this.shadowRoot.appendChild(link);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './h2l-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);


    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.divTitle        = this.shadowRoot.querySelector('#id-div-title');
    this.divTablist      = this.shadowRoot.querySelector('[role="tablist"]');
    this.divTabpanels    = this.shadowRoot.querySelector('#tabpanels');

    this.h2lHeadingsTree   = this.shadowRoot.querySelector('h2l-headings-tree');
    this.h2lLandmarksList  = this.shadowRoot.querySelector('h2l-landmarks-list');
    this.h2lLinksGrid      = this.shadowRoot.querySelector('h2l-links-grid');
    this.h2lOptionsDialog  = this.shadowRoot.querySelector('h2l-options-dialog');
    this.h2lExportDialog   = this.shadowRoot.querySelector('h2l-export-dialog');

    this.divSummary      = this.shadowRoot.querySelector('#summary');

    const btnGetInfo      = this.shadowRoot.querySelector('#id-btn-update-info');
    btnGetInfo.addEventListener('click', this.handleUpdateClick.bind(this));

    const btnAbout      = this.shadowRoot.querySelector('#id-btn-about');
    btnAbout.addEventListener('click', this.handleAboutClick.bind(this));

    const btnOptions      = this.shadowRoot.querySelector('#id-btn-options');
    btnOptions.addEventListener('click', this.handleOptionsClick.bind(this));

    const btnExport      = this.shadowRoot.querySelector('#id-btn-export');
    btnExport.addEventListener('click', this.handleExportClick.bind(this));

    this.h2lExportDialog.exportDialog.addEventListener("close", this.handleExportDialogClose.bind(this));

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

    this.lastResult = {};
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

    const baseComponentsHeight = titleRect.height +
                                 tablistRect.height +
                                 summaryRect.height +
                                 footerRect.height +
                                 sidepanelOffsetHeight;

    const newWidth  = width - sidepanelOffsetWidth;
    const newHeight = Math.max(minTabpanelHeight, height - baseComponentsHeight);

    this.divTabpanels.style.height = newHeight + 'px';
    this.divTabpanels.style.width  = newWidth + 'px';

    const tabpanelWidth  = newWidth - tabpanelOffsetWidth;
    const tabpanelHeight = newHeight - tabpanelOffsetHeight;

    this.tabpanels.forEach ( (tabpanel) => {
      tabpanel.node.style.height = tabpanelHeight + 'px';
      tabpanel.node.style.width  = tabpanelWidth  + 'px';
    });

    this.h2lHeadingsTree.resize(tabpanelsRect.height, newWidth);
    this.h2lLandmarksList.resize(tabpanelsRect.height, newWidth);
    this.h2lLinksGrid.resize(tabpanelsRect.height, newWidth);
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
      this.h2lHeadingsTree.clearContent(message);
      this.h2lLandmarksList.clearContent(message);
      this.h2lLinksGrid.clearContent(message);
    }
  }

  updateContent(myResult) {
    this.lastResult = myResult;

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

      // Determine Headings to render

      tabListObj.headings = Array.from(myResult.headings).filter( (h) => {
          return h.name.length &&     // heading must have a name
                 ((h.level === 1) ||  // If a heading level 1, usually important
                  h.isVisibleOnScreen);
        });

      // Determine Landmarks to render

      const landmarkCounts = {};

      myResult.regions.forEach( (r) => {
        if (landmarkCounts[r.role]) {
          landmarkCounts[r.role] += 1;
        }
        else {
          landmarkCounts[r.role] = 1;
        }
      });

      tabListObj.landmarks = Array.from(myResult.regions).filter( (r) => {
          return (r.name ||
              (landmarkCounts[r.role] <= MAX_LANDMARKS_WITHOUT_NAMES) ||
              options.unNamedDuplicateRegions);
      });

      // Determine links to render

      tabListObj.links= Array.from(myResult.links).filter( (l) => {
        return (l.isVisibleOnScreen && l.name.length) &&
               ((l.isInternal   && options.internalLinks) ||
                (l.isExternal   && options.externalLinks) ||
                (l.isSameDomain && options.sameDomainLinks && !l.isSameSubDomain) ||
                (l.isSameSubDomain && options.sameSubDomainLinks && !l.isInternal) ||
                (l.extensionType && options.nonHtmlExtensionLinks));
      })

      saveOptions(options).then( () => {
        tabListObj.h2lHeadingsTree.updateContent(sameUrl, tabListObj.headings);
        tabListObj.h2lLandmarksList.updateContent(sameUrl, tabListObj.landmarks);
        tabListObj.h2lLinksGrid.updateContent(sameUrl, tabListObj.links);

        tabListObj.resize();
      });
    });
  }

  // Tablist support functions and handlers

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
    this.h2lOptionsDialog.openDialog();
  }

  handleExportClick () {
    this.h2lExportDialog.openDialog();
  }

  getCSVContent(options) {

    const date = new Date();

    let content = `${getMessage('export_title')}, ${this.lastResult.title}`;
    content += `\n${getMessage('export_url')}, ${this.lastResult.url}`;
    content += `\n${getMessage('export_date')}, ${date.toLocaleDateString()}`;
    content += `\n${getMessage('export_time')}, ${date.toLocaleTimeString()}\n`;

    const eo  = getMessage('export_order');
    const ehl = getMessage('export_heading_lavel');
    const ean = getMessage('export_accessible_name');
    const elt1 = getMessage('export_landmark_type');
    const elt2 = getMessage('export_link_type');
    const ead = getMessage('export_accessible_desc');

    if (options.exportHeadings) {
      content += `\n${getMessage('headings_tree_label')}`;

      content += `\n${eo},"${ehl}","${ean}"`;
      this.headings.forEach( (h, index) => {
        content += `\n${index+1},${h.level},"${filterForCSV(h.name.trim())}"`;
      });
    }

    if (options.exportLandmarks) {
      content += `\n\n${getMessage('landmarks_list_label')}`;

      content += `\n${eo},"${elt1}","${ean}"`;
      this.landmarks.forEach( (r, index) => {
        content += `\n${index+1},${r.role},${filterForCSV(r.name.trim()) ? '"' + filterForCSV(r.name.trim()) + '"' : ''}`;
      });

    }

    if (options.exportLinks) {
      content += `\n\n${getMessage('tab_links')}`;

      content += `\n${eo},"${elt2}","${ean}","${ead}",URL`;
      this.links.forEach( (l, index) => {
        content += `\n${index+1},${l.type},"${filterForCSV(l.name)}","${filterForCSV(l.desc)}", ${l.url}`;
      });

    }

    return content;
  }

  handleExportDialogClose () {

    function incrementIndex() {
      getOptions().then( (options) => {
        options.exportIndex = parseInt(options.exportIndex) + 1;
        saveOptions(options);
      });
    }

    function onFailed(error) {
      console.error(`Download failed: ${error}`);
    }

    const tabListObj = this;

    const returnValue = this.h2lExportDialog.exportDialog.returnValue;
    if (returnValue === 'export') {
      getOptions().then( (options) => {
        const filename = options.exportFilename + '-' + options.exportIndex.padStart(4, "0") + '.csv';
        const content = tabListObj.getCSVContent(options);

        const blob = new Blob([content], {
         type: "text/csv;charset=utf-8"
        });

        let downloading = browserDownloads.download({
          url : URL.createObjectURL(blob),
          filename : filename,
          saveAs: true,
          conflictAction : 'uniquify'
        });
        downloading.then(incrementIndex, onFailed);
      });
    }
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

window.customElements.define('h2l-tablist', TOCTabList);



