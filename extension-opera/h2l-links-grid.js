/* h2l-links-grid.js */

/* Imports */

import DebugLogging   from './debug.js';

import {
  getMessage,
  focusOrdinalPosition,
  highlightOrdinalPosition,
  removeChildContent,
  setI18nLabels,
  setTablistAttr
} from './utils.js';

import {
  getOptions,
  saveOption
} from './storage.js';

/* Constants */

const debug = new DebugLogging('h2lLinksGrid', false);
debug.flag = false;

const isMozilla = typeof browser === 'object';
const isWin     = navigator.userAgent.includes('Windows');

const gridOffsetWidth = ( isWin && !isMozilla) ?
                            40 :
                            25;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <table role="grid">
    <thead>
       <tr id="id-tr-sort"
           data-i18n-aria-label="links_sorting_options_row">
          <th id="id-th-pos"
              tabindex="-1"
              class="position"
              data-sort="position"
              aria-sort="ascending">
            <span class="label"
                  data-i18n="links_grid_position">
            </span>
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg"
                   width="1em"
                   height="1em"
                   viewbox="0 0 32 32">
                  <polygon points="4,8 28,8 16,28"/>
              </svg>
            </span>
          </th>
          <th id="id-th-name"
              tabindex="-1"
              class="name"
              data-sort="name"
              aria-sort="none">
            <span class="label"
                  data-i18n="links_grid_name">
            </span>
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg"
                   width="1em"
                   height="1em"
                   viewbox="0 0 32 32">
                  <polygon points="4,8 28,8 16,28"/>
              </svg>
            </span>
          </th>
          <th id="id-th-type"
              tabindex="-1"
              class="type"
              data-sort="type"
              aria-sort="none">
            <span class="label"
                  data-i18n="links_grid_type">
            </span>
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg"
                   width="1em"
                   height="1em"
                   viewbox="0 0 32 32">
                  <polygon points="4,8 28,8 16,28"/>
              </svg>
            </span>
          </th>
       </tr>
    </thead>
    <tbody id="id-grid-data">
    </tbody>
  </table>
`;

class H2LLinksGrid extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './h2l-links-grid.css');
    this.shadowRoot.appendChild(link);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './h2l-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);


    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.gridNode = this.shadowRoot.querySelector('[role="grid"]');

    const trNode = this.shadowRoot.querySelector('[role="grid"] thead tr');
    trNode.addEventListener('keydown', this.handleGridrowKeydown.bind(this));
    trNode.addEventListener('focus',   this.handleFocus.bind(this));
    trNode.addEventListener('blur',    this.handleBlur.bind(this));

    this.thNodes = Array.from(this.shadowRoot.querySelectorAll('[role="grid"] thead th'));

    this.thNodes.forEach( (thNode) => {
      thNode.addEventListener('click',   this.handleClickSort.bind(this));
      thNode.addEventListener('keydown', this.handleGridcellKeydown.bind(this));
      thNode.addEventListener('focus',   this.handleFocus.bind(this));
      thNode.addEventListener('blur',    this.handleBlur.bind(this));
    });

    this.gridTbodyNode = this.shadowRoot.querySelector('[role="grid"] tbody');

    this.posWidth  = 0;
    this.nameWidth = 0;
    this.typeWidth  = 0;

    this.highlightFollowsFocus = false;
    this.enterKeyMovesFocus    = false;
    this.isVisible = false;
    this.lastLinkId = '';

    setI18nLabels(this.shadowRoot, debug.flag);

    this.links = [];
  }

 static get observedAttributes() {
    return [
      "visible",
      ];
  }


  attributeChangedCallback(name, oldValue, newValue) {

    switch (name) {
      case "visible":
        this.isVisible = newValue.toLowerCase() === 'true';
        break;

      default:
        break;
    }
  }


  resize (height, width) {
    const tableWidth = width;

    this.gridNode.style.width = tableWidth + 'px';

    const posWidth = 50;
    const typeWidth = 55;
    const nameWidth = tableWidth - posWidth - typeWidth - gridOffsetWidth;

    this.posWidth   = posWidth + 'px';
    this.nameWidth  = nameWidth + 'px';
    this.typeWidth  = typeWidth + 'px';

    const posNodes = Array.from(this.gridNode.querySelectorAll('.position'));
    posNodes.forEach( (n) => {
      n.style.width = this.posWidth;
    });

    const nameNodes = Array.from(this.gridNode.querySelectorAll('.name'));
    nameNodes.forEach( (n) => {
      n.style.width = this.nameWidth;
    });

    const typeNodes = Array.from(this.gridNode.querySelectorAll('.type'));
    typeNodes.forEach( (n) => {
      n.style.width = this.typeWidth;
    });

    this.gridNode.style.height = height - 20 + 'px';

  }

  clearContent (message = '') {
     removeChildContent(this.gridTbodyNode);

     if ((typeof message === 'string') && message.length) {
       const trNode = document.createElement('tr');
       const msgNode =  document.createElement('td');
       msgNode.setAttribute('colspan', 3);
       msgNode.textContent = message;
       trNode.appendChild(msgNode);
       trNode.tabIndex = 0;
       this.gridTbodyNode.appendChild(trNode);
     }
  }

  updateContent (sameUrl, links) {
    const linksObj = this;

    this.links = links;

    if (links) {

      getOptions().then( (options) => {

        linksObj.highlightFollowsFocus = options.highlightFollowsFocus;
        linksObj.enterKeyMovesFocus    = options.enterKeyMovesFocus;
        linksObj.lastURL               = options.lastURL;
        linksObj.lastLinkId            = options.lastLinkId;

        links.forEach( (link, index) => {
          [link.type, link.typeDesc, link.typeSort] = linksObj.getTypeContentAndDescription(link);
          link.pos = index + 1;
        });

        const lastGridNode = linksObj.updateLinkContent(links);

        const firstGridrow = linksObj.gridNode.querySelector('[role="grid"] tbody tr');

        const count = linksObj.gridNode.querySelectorAll('[role="grid"] tbody tr').length;
        setTablistAttr('links-count', count);

        if (firstGridrow) {
          if (sameUrl && lastGridNode) {
            linksObj.setFocusToGriditem(lastGridNode);
          }
          else {
            linksObj.setFocusToGriditem(firstGridrow);
          }
        }
        else {
          linksObj.clearContent(getMessage('links_none_found', debug.flag));
        }
      });
    }
    else {
      this.clearContent(getMessage('protocol_not_supported', debug.flag));
    }
  }

  updateLinkContent (links) {
    const linksObj = this;
    let lastGridNode = null;

    function addRow (pos, ordinalPos, name, desc, url, typeContent, typeDesc, typeSort) {

      function getDataCell(id, cname, content, title, sortValue, width) {

        const cellNode =  document.createElement('td');
        cellNode.id = id;
        cellNode.className = cname;
        cellNode.textContent = content;
        if (title) {
          cellNode.title = title;
        }
        if (sortValue) {
          cellNode.setAttribute('data-sort-value', sortValue);
        }
        cellNode.style.width = width;
        cellNode.setAttribute('tabindex', '-1');
        cellNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));
        cellNode.addEventListener('focus',   linksObj.handleFocus.bind(linksObj));
        cellNode.addEventListener('blur',    linksObj.handleBlur.bind(linksObj));

        if (cellNode.id === linksObj.lastLinkId) {
          lastGridNode = cellNode;
        }
        return cellNode;
      }

      const trNode = document.createElement('tr');
      trNode.id = 'row-' + pos;
      trNode.title = url;
      const accNameForRow = pos + ', ' + name + ', ' + typeDesc;
      trNode.setAttribute('aria-label', accNameForRow);
      trNode.setAttribute('data-ordinal-position', ordinalPos);

      if (trNode.id === linksObj.lastLinkId) {
        lastGridNode = trNode;
      }

      trNode.setAttribute('data-index', pos);
      trNode.setAttribute('tabindex', '-1');
      const firstChar = name.length ? name[0].toLowerCase() : '';
      trNode.setAttribute('data-first-char', firstChar);
      trNode.addEventListener('click',   linksObj.handleGridrowClick.bind(linksObj));
      trNode.addEventListener('keydown', linksObj.handleGridrowKeydown.bind(linksObj));
      trNode.addEventListener('focus',   linksObj.handleFocus.bind(linksObj));
      trNode.addEventListener('blur',    linksObj.handleBlur.bind(linksObj));

      trNode.appendChild(getDataCell(trNode.id + '-pos',
                                     'position',
                                     pos,
                                     '',
                                     '',
                                     linksObj.posWidth));

      const nameDesc = desc ?
                       `${name}: ${desc}` :
                       name;

      trNode.appendChild(getDataCell(trNode.id + '-name',
                                     'name',
                                     nameDesc,
                                     '',
                                     '',
                                     linksObj.nameWidth));

      trNode.appendChild(getDataCell(trNode.id + '-type',
                                     'type',
                                     typeContent,
                                     typeDesc,
                                     typeSort,
                                     linksObj.typeWidth));
      return trNode;
    }

    this.clearContent();

    links.forEach( (link) => {
      const rowNode = addRow(link.pos,
                             link.ordinalPosition,
                             link.name,
                             link.desc,
                             link.url,
                             link.type,
                             link.typeDesc,
                             link.typeSort);

      this.gridTbodyNode.appendChild(rowNode);
    });

    return lastGridNode;
  }

  getTypeContentAndDescription(link) {

    let linkTypeContent = '';
    let linkTypeDesc    = '';
    let linkTypeSort = 0;

    if (link.extensionType) {
      switch (link.extensionType) {
        case 'pdf':
          linkTypeContent = link.extension;
          linkTypeDesc    = getMessage('link_name_pdf');
          linkTypeSort = 1;
          break;

        case 'doc':
          linkTypeContent = link.extension;
          linkTypeDesc    = getMessage('link_name_doc');
          linkTypeSort = 2;
          break;

        case 'media':
          linkTypeContent = link.extension;
          linkTypeDesc    = getMessage('link_name_media');
          linkTypeSort = 3;
          break;

        case 'zip':
          linkTypeContent = link.extension;
          linkTypeDesc    = getMessage('link_name_zip');
          linkTypeSort = 4;
          break;

        default:
          linkTypeContent = link.extension;
          linkTypeDesc    = '';
          break;
      }
    }
    else {
      if (link.isInternal) {
        linkTypeContent = getMessage('link_name_internal');
        linkTypeDesc    = '';
        linkTypeSort = 11;
      }
      else {
        if (link.isSameSubDomain) {
          linkTypeContent = getMessage('link_abbr_same_sub_domain');
          linkTypeDesc    = getMessage('link_name_same_sub_domain');
          linkTypeSort = 12;
        }
        else {
          if (link.isSameDomain) {
            linkTypeContent = getMessage('link_abbr_same_domain');
            linkTypeDesc    = getMessage('link_name_same_domain');
            linkTypeSort = 13;
          }
          else {
            linkTypeContent = getMessage('link_name_external');
            linkTypeDesc    = '';
            linkTypeSort = 14;
         }
        }
      }
    }
    return [linkTypeContent, linkTypeDesc, linkTypeSort];
  }

  sortRows(sortColumn, direction) {

    function nameCompare(a, b) {
      const aStr = a.name.toLowerCase().trim();
      const bStr = b.name.toLowerCase().trim();
      const result = aStr.localeCompare(bStr);
      if (result === 0) {
        return posCompare(a, b);
      }
      return result;
    }

    function nameCompareDescending(a, b) {
      const aStr = a.name.toLowerCase().trim();
      const bStr = b.name.toLowerCase().trim();
      const result = bStr.localeCompare(aStr);
      if (result === 0) {
        return posCompare(a, b);
      }
      return result;
    }

    function typeCompare(a, b) {
      const result = a.typeSort - b.typeSort;
      if (result === 0) {
        return posCompare(a, b);
      }
      return result;
    }

    function typeCompareDescending(a, b) {
      const result = b.typeSort - a.typeSort;
      if (result === 0) {
        return posCompare(a, b);
      }
      return result;
    }

    function posCompare(a, b) {
      return a.pos - b.pos;
    }

    function posCompareDescending(a, b) {
      return b.pos - a.pos;
    }

    switch (sortColumn) {
      case 'name':
        direction === 'ascending' ?
        this.links.sort(nameCompare) :
        this.links.sort(nameCompareDescending);
        break;

      case 'type':
        direction === 'ascending' ?
        this.links.sort(typeCompare) :
        this.links.sort(typeCompareDescending);
        break;

      default:
        direction === 'ascending' ?
        this.links.sort(posCompare) :
        this.links.sort(posCompareDescending);
        break;
    }

    this.updateLinkContent(this.links);

    // Update attributes with new sort information

    this.thNodes.forEach( (th) => {
      if (th.getAttribute('data-sort') === sortColumn) {
        th.setAttribute('aria-sort', direction);
      }
      else {
        th.setAttribute('aria-sort', 'none');
      }
    });
  }

  sortLinks(elem) {
    const dir        = elem.getAttribute('aria-sort');
    const sortColumn = elem.getAttribute('data-sort');
    switch (dir) {
      case 'none':
      case 'descending':
        this.sortRows(sortColumn, 'ascending');
        break;

      default:
        this.sortRows(sortColumn, 'descending');
        break;
    }
  }



  // Tree keyboard navigation methods

  getGridrows () {
    return Array.from(this.gridNode.querySelectorAll('tr'));
  }

  getGriditems () {
    return Array.from(this.gridNode.querySelectorAll('tr, th, td'));
  }

  focusGridrow(gridrow) {
    const op = gridrow.getAttribute('data-ordinal-position');
    if (op) {
      focusOrdinalPosition(op);
    }
  }


  highlightGriditem(griditem) {
    const op   = griditem.hasAttribute('data-ordinal-position') ?
                     griditem.getAttribute('data-ordinal-position') :
                     griditem.parentNode.getAttribute('data-ordinal-position') ?
                     griditem.parentNode.getAttribute('data-ordinal-position') :
                     '';

    const info = griditem.hasAttribute('data-info') ?
                     griditem.getAttribute('data-info') :
                     griditem.parentNode.hasAttribute('data-info') ?
                     griditem.parentNode.getAttribute('data-info') :
                     '';
    highlightOrdinalPosition(op, info);
    saveOption('lastLinkId', griditem.id);
  }

  removeHighlight() {
    highlightOrdinalPosition('', '');
  }

  setFocusByFirstCharacter(gridrow, char){

    function findChar (gridrow) {
      return char === gridrow.getAttribute('data-first-char');
    }

    const gridrows = this.getGridrows();
    let startIndex = gridrows.indexOf(gridrow) + 1;

    const searchOrder = (startIndex < gridrows.length) ?
                        gridrows.splice(startIndex).concat(gridrows.splice(0, startIndex)) :
                        gridrows;
    const result = searchOrder.find(findChar);
    if (result) {
      this.setFocusToGriditem(result);
    }
  }

  setFocusToFirstGridrow() {
    const gridrows = this.getGridrows();
    if (gridrows[0]) {
      this.setFocusToGriditem(gridrows[0]);
    }
  }

  setFocusToLastGridrow() {
    const gridrows = this.getGridrows();
    if (gridrows.length) {
      this.setFocusToGriditem(gridrows[gridrows.length-1]);
    }
  }

  setFocusToNextGridrow(gridrow) {
    const gridrows = this.getGridrows();
    const index = gridrows.indexOf(gridrow) + 1;
    const nextGridrow = index < gridrows.length ?
                        gridrows[index] :
                        false;

    if (nextGridrow) {
      this.setFocusToGriditem(nextGridrow);
    }
  }

  setFocusToPreviousGridrow(gridrow) {
    const gridrows = this.getGridrows();
    const index = gridrows.indexOf(gridrow) - 1;
    const prevGridrow = index >= 0 ?
                        gridrows[index] :
                        false;

    if (prevGridrow) {
      this.setFocusToGriditem(prevGridrow);
    }
  }

  setFocusToGriditem(griditem) {
    this.setTabindex(griditem);
    if (this.isVisible) {
      griditem.focus();
    }
  }

  setFocusToPreviousGridrowAndCell(gridcell) {
    const linksObj = this;

    function findCellInRow(gridrow, className) {
      if (gridrow) {
        const gridcell = gridrow.querySelector(`.${className}`);
        if (gridcell) {
          linksObj.setFocusToGriditem(gridcell);
          return true;
        }
      }
      return false;
    }

    const className = gridcell.className;

    if (!findCellInRow(gridcell.parentNode.previousElementSibling, className)) {
      const gridTbody = gridcell.parentNode.parentNode;
      if (gridTbody && gridTbody.previousElementSibling) {
        findCellInRow(gridTbody.previousElementSibling.firstElementChild, className);
      }
    }
  }

  setFocusToNextGridrowAndCell(gridcell) {
    const linksObj = this;

    function findCellInRow(gridrow, className) {
      if (gridrow) {
        const gridcell = gridrow.querySelector(`.${className}`);
        if (gridcell) {
          linksObj.setFocusToGriditem(gridcell);
          return true;
        }
      }
      return false;
    }

    const className = gridcell.className;

    if (!findCellInRow(gridcell.parentNode.nextElementSibling, className)) {
      const gridTbody = gridcell.parentNode.parentNode;
      if (gridTbody && gridTbody.nextElementSibling) {
        findCellInRow(gridTbody.nextElementSibling.firstElementChild, className);
      }
    }
  }

  setFocusToNextGridcell(gridcell) {
    const nextGridcell = gridcell.nextElementSibling;
    if (nextGridcell) {
      this.setFocusToGriditem(nextGridcell);
    }
  }

  setFocusToPreviousGridcell(gridcell) {
    const prevGridcell = gridcell.previousElementSibling;
    if (prevGridcell) {
      this.setFocusToGriditem(prevGridcell);
    }
    else {
      this.setFocusToGriditem(gridcell.parentNode);
    }
  }

  setFocusToFirstGridcell(griditem) {
    if (griditem.tagName === 'TR') {
      this.setFocusToGriditem(griditem.firstElementChild);
    }
    else {
      this.setFocusToGriditem(griditem.parentNode.firstElementChild);
    }
  }

  setFocusToLastGridcell(gridcell) {
    this.setFocusToGriditem(gridcell.parentNode.lastElementChild);
  }

  setTabindex(griditem) {
    const griditems = this.getGriditems();
    griditems.forEach( (gi) => {
      gi.setAttribute('tabindex', (gi === griditem) ? 0 : -1);
    });
  }


  // Event handlers

  handleFocus(event) {
    const tgt = event.currentTarget;
    if (this.highlightFollowsFocus) {
      this.highlightGriditem(tgt);
    }
  }

  handleBlur() {
    this.removeHighlight()
  }

  handleClickSort(event) {
    const tgt = event.currentTarget;
    this.sortLinks(tgt);
    event.stopPropagation();
    event.preventDefault();
  }

  handleGridrowClick (event) {
    const tgt = event.currentTarget;
    const iconNode = tgt.querySelector('.expand-icon');

    // if clicked on expand icon in the treeview then do not process event
    if (!iconNode ||
        (iconNode && (iconNode !== event.target)) ||
        (iconNode && !iconNode.contains(event.target))) {
      this.setFocusToGriditem(tgt);
      this.highlightGriditem(tgt);
      event.stopPropagation();
      event.preventDefault();
    }
  }

 handleGridrowKeydown(event) {
    const tgt = event.currentTarget;
    const key = event.key;
    let flag  = false;

    function isPrintableCharacter(str) {
      return str.length === 1 && str.match(/\S/);
    }

    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    switch (key) {
      case 'Enter':
      case ' ':
        this.highlightGriditem(tgt);
        flag = true;
        break;

      case 'ArrowUp':
        this.setFocusToPreviousGridrow(tgt);
        flag = true;
        break;

      case 'ArrowDown':
        this.setFocusToNextGridrow(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.setFocusToFirstGridcell(tgt);
        flag = true;
        break;

      case 'ArrowLeft':
        flag = true;
        break;

      case 'Home':
        this.setFocusToFirstGridrow();
        flag = true;
        break;

      case 'End':
        this.setFocusToLastGridrow();
        flag = true;
        break;

      default:
        if (isPrintableCharacter(key)) {
          this.setFocusByFirstCharacter(tgt, key);
          flag = true;
        }
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

 handleGridcellKeydown(event) {
    const tgt = event.currentTarget;
    const key = event.key;
    let flag  = false;

    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    switch (key) {
      case 'Enter':
      case ' ':
        if (tgt.hasAttribute('data-sort')) {
          this.sortLinks(tgt);
        }
        else {
          this.highlightGriditem(tgt.parentNode);
        }
        flag = true;
        break;

      case 'ArrowUp':
        this.setFocusToPreviousGridrowAndCell(tgt);
        flag = true;
        break;

      case 'ArrowDown':
        this.setFocusToNextGridrowAndCell(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.setFocusToNextGridcell(tgt);
        flag = true;
        break;

      case 'ArrowLeft':
        this.setFocusToPreviousGridcell(tgt);
        flag = true;
        break;

      case 'Home':
        this.setFocusToFirstGridcell(tgt);
        flag = true;
        break;

      case 'End':
        this.setFocusToLastGridcell(tgt);
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

}

window.customElements.define('h2l-links-grid', H2LLinksGrid);



