/* toc-links-grid.js */

/* Imports */

import DebugLogging   from './debug.js';

import {
  highlightOrdinalPosition
} from './toc-sidepanel.js';

import {
  getMessage,
  removeChildContent,
  setI18nLabels,
  setTablistAttr
} from './utils.js';

import {
  getOptions
} from './storage.js';

/* Constants */

const debug = new DebugLogging('tocLinksGrid', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <table role="grid">
    <thead>
       <tr>
          <th class="position" data-i18n="links_grid_position">XYZ</th>
          <th class="name" data-i18n="links_grid_name">XYZ</th>
          <th class="url" data-i18n="links_grid_url">XYZ</th>
       </tr>
    </thead>
    <tbody id="id-grid-data">
    </tbody>
  </table>
`;

class TOCLinksGrid extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCLinksGrid...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-links-grid.css');
    this.shadowRoot.appendChild(link);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.gridNode = this.shadowRoot.querySelector('[role="grid"]');

    this.gridTbodyNode = this.shadowRoot.querySelector('[role="grid"] tbody');

    this.posWidth  = '40px';
    this.nameWidth = '120px';
    this.urlWidth  = '80px';

    setI18nLabels(this.shadowRoot, debug.flag);

  }

  resize (height, width) {
    debug.flag && debug.log(`height: ${height} x ${width}`);

    const tableWidth = width - 10;

    this.gridNode.style.width = tableWidth + 'px';

    const posWidth = 30;
    const remainingWidth = tableWidth - posWidth;

    this.posWidth  = posWidth + 'px';
    this.nameWidth = 0.55 * remainingWidth + 'px';
    this.urlWidth  = 0.35 * remainingWidth + 'px';

    const posNodes = Array.from(this.gridNode.querySelectorAll('.position'));
    posNodes.forEach( (n) => {
      n.style.width = this.posWidth;
    });

    const nameNodes = Array.from(this.gridNode.querySelectorAll('.name'));
    nameNodes.forEach( (n) => {
      n.style.width = this.nameWidth;
    });

    const urlNodes = Array.from(this.gridNode.querySelectorAll('.url'));
    urlNodes.forEach( (n) => {
      n.style.width = this.urlWidth;
    });

    this.gridNode.style.height = height - 20 + 'px';

  }

  clearContent (message = '') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.gridTbodyNode);

     if ((typeof message === 'string') && message.length) {
       const trNode = document.createElement('tr');
       const msgNode =  document.createElement('td');
       msgNode.setAttribute('colspan', 3);
       msgNode.textContent = message;
       trNode.appendChild(msgNode);
       trNode.setAttribute('tabindex', '0');
       this.gridTbodyNode.appendChild(trNode);
     }
  }

  updateContent (myResult) {
    debug.flag && debug.log(`[updateContent]`);

    const linksObj = this;

    function addRow (pos, name, ext, url) {
      const trNode = document.createElement('tr');

      const posNode =  document.createElement('td');
      posNode.className = 'position';
      posNode.textContent = pos;
      trNode.appendChild(posNode);
      posNode.style.width = linksObj.posWidth;
      posNode.setAttribute('tabindex', '-1');
      posNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));


      const nameNode =  document.createElement('td');
      nameNode.className = 'name';
      nameNode.textContent = name;
      trNode.appendChild(nameNode);
      nameNode.style.width = linksObj.nameWidth;
      nameNode.setAttribute('tabindex', '-1');
      nameNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));

      const urlNode =  document.createElement('td');
      urlNode.className = 'url';
      urlNode.textContent = url;
      trNode.appendChild(urlNode);
      urlNode.style.width = linksObj.urlWidth;
      urlNode.setAttribute('tabindex', '-1');
      urlNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));

      return trNode;
    }

    this.clearContent();

    if (myResult.links) {

      getOptions().then( (options) => {

        const links = Array.from(myResult.links).filter( (l) => {
          return (l.isVisibleOnScreen && l.name.length) &&
                 ((l.isInternal && options.internalLinks) ||
                  (l.isExternal && options.externalLinks) ||
                  (!l.isExternal && options.sameDomainLinks));
        });

        debug.log(`[links]: ${myResult.links.length} ${links.length}`);

        let index = 1;
        links.forEach( (l) => {
          const rowNode = addRow(index, l.name, l.extension, l.url);

          rowNode.setAttribute('data-ordinal-position', l.ordinalPosition);
          rowNode.setAttribute('data-href', l.href);
          rowNode.setAttribute('data-is-internal', l.isInternal);
          rowNode.setAttribute('data-is-external', l.isExternal);
          rowNode.setAttribute('data-extension', l.extension);
          rowNode.setAttribute('data-url', l.url);
          rowNode.setAttribute('data-index', index);
          rowNode.setAttribute('tabindex', '-1');
          const firstChar = l.name.length ? l.name[0].toLowerCase() : '';
          rowNode.setAttribute('data-first-char', firstChar);
          rowNode.addEventListener('click', this.handleGridrowClick.bind(this));
          rowNode.addEventListener('keydown', this.handleGridrowKeydown.bind(this));

          index += 1;

          this.gridTbodyNode.appendChild(rowNode);
        });

        const firstGridrow = this.gridNode.querySelector('[role="grid"] tbody tr');

        const count = this.gridNode.querySelectorAll('[role="grid"] tbody tr').length;
        setTablistAttr('links-count', count);

        if (firstGridrow) {
          this.setFocusToGriditem(firstGridrow);
        }
        else {
          this.clearContent(getMessage('links_none_found', debug.flag));
        }
      });
    }
    else {
      this.clearContent(getMessage('protocol_not_supported', debug.flag));
    }


  }

  // Tree keyboard navigation methods

  getGridrows () {
    return Array.from(this.gridNode.querySelectorAll('tbody tr'));
  }

  getGriditems () {
    return Array.from(this.gridNode.querySelectorAll('tbody tr, tbody td'));
  }

  highlightGridrow(gridrow) {
    const op = gridrow.getAttribute('data-ordinal-position');
    if (op) {
      highlightOrdinalPosition(op);
    }
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
    griditem.focus();
  }

  setFocusToPreviousGridrowAndCell(gridcell) {
    debug.flag && debug.log(`[setFocusToPreviousGridrowAndCell]: ${gridcell}`);

    const className = gridcell.className;
    const gridrow   = gridcell.parentNode;
    const previousGridrow = gridrow.previousElementSibling;
    if (previousGridrow) {
      const gridcell = previousGridrow.querySelector(`.${className}`);
      if (gridcell) {
        this.setFocusToGriditem(gridcell);
      }
    }
  }

  setFocusToNextGridrowAndCell(gridcell) {
    debug.flag && debug.log(`[setFocusToNextGridrowAndCell]: ${gridcell}`);

    const className = gridcell.className;
    const gridrow   = gridcell.parentNode;
    const nextGridrow = gridrow.nextElementSibling;
    if (nextGridrow) {
      const gridcell = nextGridrow.querySelector(`.${className}`);
      if (gridcell) {
        this.setFocusToGriditem(gridcell);
      }
    }

  }

  setFocusToNextGridcell(gridcell) {
    debug.flag && debug.log(`[setFocusToNextGridcell]: ${gridcell}`);
    const nextGridcell = gridcell.nextElementSibling;
    if (nextGridcell) {
      this.setFocusToGriditem(nextGridcell);
    }
  }

  setFocusToPreviousGridcell(gridcell) {
    debug.flag && debug.log(`[setFocusToPreviousGridcell]: ${gridcell}`);
    const prevGridcell = gridcell.previousElementSibling;
    if (prevGridcell) {
      this.setFocusToGriditem(prevGridcell);
    }
    else {
      this.setFocusToGriditem(gridcell.parentNode);
    }
  }

  setFocusToFirstGridcell(griditem) {
    debug.flag && debug.log(`[setFocusToFirstGridcell]: ${griditem.tagName}`);
    if (griditem.tagName === 'TR') {
      this.setFocusToGriditem(griditem.firstElementChild);
    }
    else {
      this.setFocusToGriditem(griditem.parentNode.firstElementChild);
    }
  }

  setFocusToLastGridcell(gridcell) {
    debug.flag && debug.log(`[setFocusToLstGridcell]: ${gridcell}`);
    this.setFocusToGriditem(gridcell.parentNode.lastElementChild);
  }

  setTabindex(griditem) {
    const griditems = this.getGriditems();
    griditems.forEach( (gi) => {
      gi.setAttribute('tabindex', (gi === griditem) ? 0 : -1);
    });
  }

  // Event handlers


  handleGridrowClick (event) {
    const tgt = event.currentTarget;
    const iconNode = tgt.querySelector('.expand-icon');

    debug.flag && debug.log(`[handlegridrowClick]: ${tgt.tagName}`);

    // if clicked on expand icon in the treeview then do not process event
    if (!iconNode ||
        (iconNode && (iconNode !== event.target)) ||
        (iconNode && !iconNode.contains(event.target))) {
      this.setFocusToGriditem(tgt);
      this.highlightGridrow(tgt);
      event.stopPropagation();
      event.preventDefault();
    }
  }

 handleGridrowKeydown(event) {
    const tgt = event.currentTarget;
    const key = event.key;
    let flag  = false;

    debug.flag && debug.log(`[handleKeydown][key]: ${key}`);

    function isPrintableCharacter(str) {
      return str.length === 1 && str.match(/\S/);
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.shiftKey) {
      debug.flag && debug.log(`Shift key press`);
    }
    else {
      switch (key) {
        case 'Enter':
        case ' ':
          this.highlightGridrow(tgt);
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

    debug.flag && debug.log(`[handleGridcellKeydown][key]: ${key}`);

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.shiftKey) {
      debug.flag && debug.log(`Shift key press`);
    }
    else {
      switch (key) {
        case 'Enter':
        case ' ':
          this.highlightGridrow(tgt.parentNode);
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
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

}

window.customElements.define('toc-links-grid', TOCLinksGrid);



