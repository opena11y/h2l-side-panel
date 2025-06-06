/* toc-links-grid.js */

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

const debug = new DebugLogging('tocLinksGrid', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <table role="grid">
    <thead>
       <tr>
          <th tabindex="-1"
              class="position"
              data-i18n="links_grid_position">
          </th>
          <th tabindex="-1"
              class="name"
              data-i18n="links_grid_name">
          </th>
          <th tabindex="-1"
              class="type"
              data-i18n="links_grid_type">
          </th>
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

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './toc-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);


    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.gridNode = this.shadowRoot.querySelector('[role="grid"]');

    const trNode = this.shadowRoot.querySelector('[role="grid"] thead tr');
    trNode.addEventListener('keydown', this.handleGridrowKeydown.bind(this));
    trNode.addEventListener('focus',   this.handleFocus.bind(this));
    trNode.addEventListener('blur',    this.handleBlur.bind(this));

    const thNodes = Array.from(this.shadowRoot.querySelectorAll('[role="grid"] thead th'));

    thNodes.forEach( (thNode) => {
      thNode.addEventListener('keydown', this.handleGridcellKeydown.bind(this));
      thNode.addEventListener('focus',   this.handleFocus.bind(this));
      thNode.addEventListener('blur',    this.handleBlur.bind(this));
    });

    this.gridTbodyNode = this.shadowRoot.querySelector('[role="grid"] tbody');

    this.posWidth  = '40px';
    this.nameWidth = '120px';
    this.urlWidth  = '80px';
    this.typeWidth  = '80px';

    this.highlightFollowsFocus = false;
    this.enterKeyMovesFocus    = false;
    this.isVisible = false;
    this.lastLinkId = '';

    setI18nLabels(this.shadowRoot, debug.flag);

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
    debug.flag && debug.log(`height: ${height} x ${width}`);

    const tableWidth = width - 10;

    this.gridNode.style.width = tableWidth + 'px';

    const posWidth = 35;
    const typeWidth = 70;
    const nameWidth = tableWidth - posWidth - typeWidth;

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

  updateContent (sameUrl, myResult) {
    debug.flag && debug.log(`[updateContent]`);

    let lastGridNode = null;
    let index = 1;

    const linksObj = this;

    const linkLabel              = getMessage('link_label');
    const linkLabelExternal      = getMessage('link_label_external');
    const linkLabelInternal      = getMessage('link_label_internal');
    const linkLabelSameDomain    = getMessage('link_label_same_domain');
    const linkLabelSameSubDomain = getMessage('link_label_same_sub_domain');

    function addRow (pos, name, ext, url, typeContent, typeDesc) {
      const trNode = document.createElement('tr');
      trNode.id = 'row-' + index;
      index += 1;

      if (trNode.id === linksObj.lastLinkId) {
        lastGridNode = trNode;
      }

      const posNode =  document.createElement('td');
      posNode.id = trNode.id + '-pos';
      posNode.className = 'position';
      posNode.textContent = pos;
      trNode.appendChild(posNode);
      posNode.style.width = linksObj.posWidth;
      posNode.setAttribute('tabindex', '-1');
      posNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));
      posNode.addEventListener('focus',   linksObj.handleFocus.bind(linksObj));
      posNode.addEventListener('blur',    linksObj.handleBlur.bind(linksObj));

      if (posNode.id === linksObj.lastLinkId) {
        lastGridNode = posNode;
      }

      const nameNode =  document.createElement('td');
      nameNode.id = trNode.id + '-name';
      nameNode.className = 'name';
      nameNode.textContent = name;
      nameNode.title       = url;
      trNode.appendChild(nameNode);
      nameNode.style.width = linksObj.nameWidth;
      nameNode.setAttribute('tabindex', '-1');
      nameNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));
      nameNode.addEventListener('focus',   linksObj.handleFocus.bind(linksObj));
      nameNode.addEventListener('blur',    linksObj.handleBlur.bind(linksObj));

      if (nameNode.id === linksObj.lastLinkId) {
        lastGridNode = nameNode;
      }


      const typeNode =  document.createElement('td');
      typeNode.id = trNode.id + '-type';
      typeNode.className   = 'type';
      typeNode.textContent = typeContent;
      typeNode.title = typeDesc;
      trNode.appendChild(typeNode);
      typeNode.style.width = linksObj.typeWidth;
      typeNode.setAttribute('tabindex', '-1');
      typeNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));
      typeNode.addEventListener('focus',   linksObj.handleFocus.bind(linksObj));
      typeNode.addEventListener('blur',    linksObj.handleBlur.bind(linksObj));

      if (typeNode.id === linksObj.lastLinkId) {
        lastGridNode = typeNode;
      }

/*
      const urlNode =  document.createElement('td');
      urlNode.className   = 'url';
      urlNode.textContent = url;
      urlNode.title       = url;
      trNode.appendChild(urlNode);
      urlNode.style.width = linksObj.urlWidth;
      urlNode.setAttribute('tabindex', '-1');
      urlNode.addEventListener('keydown', linksObj.handleGridcellKeydown.bind(linksObj));
*/

      return trNode;
    }

    this.clearContent();

    if (myResult.links) {

      getOptions().then( (options) => {

        debug.flag && debug.log(`[options][    highlightFollowsFocus]: ${options.highlightFollowsFocus}`);
        debug.flag && debug.log(`[options][       enterKeyMovesFocus]: ${options.enterKeyMovesFocus}`);

        this.highlightFollowsFocus = options.highlightFollowsFocus;
        this.enterKeyMovesFocus    = options.enterKeyMovesFocus;
        this.lastURL               = options.lastURL;
        this.lastLinkId           = options.lastLinkId;

        const links = Array.from(myResult.links).filter( (l) => {
          return (l.isVisibleOnScreen && l.name.length) &&
                 ((l.isInternal   && options.internalLinks) ||
                  (l.isExternal   && options.externalLinks) ||
                  (l.isSameDomain && options.sameDomainLinks && !l.isSameSubDomain) ||
                  (l.isSameSubDomain && options.sameSubDomainLinks && !l.isInternal));
        });

        let index = 1;
        links.forEach( (l) => {

          let linkTypeContent = '';
          let linkTypeDesc    = '';

          if (l.isInternal) {
            linkTypeContent = getMessage('link_abbr_internal');
            linkTypeDesc    = getMessage('link_name_internal');
          }
          else {
            if (l.isSameSubDomain) {
              linkTypeContent = getMessage('link_abbr_same_sub_domain');
              linkTypeDesc    = getMessage('link_name_same_sub_domain');
            }
            else {
              if (l.isSameDomain) {
                linkTypeContent = getMessage('link_abbr_same_domain');
                linkTypeDesc    = getMessage('link_name_same_domain');
              }
              else {
                linkTypeContent = getMessage('link_abbr_external');
                linkTypeDesc = getMessage('link_name_external');
              }
            }
          }

          const rowNode = addRow(index,
                                 l.name,
                                 l.extension,
                                 l.url,
                                 linkTypeContent,
                                 linkTypeDesc);

          rowNode.setAttribute('data-ordinal-position', l.ordinalPosition);
          rowNode.setAttribute('data-info', '');

//          rowNode.setAttribute('data-label', linkLabel);
//          rowNode.setAttribute('data-ext', l.isExternal);
//          rowNode.setAttribute('data-sd',  l.isSameDomain);
//          rowNode.setAttribute('data-ssd', l.isSameSubDomain);
//          rowNode.setAttribute('data-int', l.isInternal);
//          rowNode.setAttribute('data-extension', l.extension);
//          rowNode.setAttribute('data-url', l.url);

          rowNode.setAttribute('data-index', index);
          rowNode.setAttribute('tabindex', '-1');
          const firstChar = l.name.length ? l.name[0].toLowerCase() : '';
          rowNode.setAttribute('data-first-char', firstChar);
          rowNode.addEventListener('click',   this.handleGridrowClick.bind(this));
          rowNode.addEventListener('keydown', this.handleGridrowKeydown.bind(this));
          rowNode.addEventListener('focus',   this.handleFocus.bind(this));
          rowNode.addEventListener('blur',    this.handleBlur.bind(this));

          index += 1;

          this.gridTbodyNode.appendChild(rowNode);
        });

        const firstGridrow = this.gridNode.querySelector('[role="grid"] tbody tr');

        const count = this.gridNode.querySelectorAll('[role="grid"] tbody tr').length;
        setTablistAttr('links-count', count);

        if (firstGridrow) {
          if (sameUrl && lastGridNode) {
            this.setFocusToGriditem(lastGridNode);
          }
          else {
            this.setFocusToGriditem(firstGridrow);
          }
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
                     griditem.parentNode.getAttribute('data-info');
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
    debug.flag && debug.log(`[setFocusToPreviousGridrowAndCell]: ${gridcell}`);

    const linksObj = this;

    function findCellInRow(gridrow, className) {
      debug.log(`[gridrow]: ${gridrow ? gridrow.textContent : 'null'} (${className})`);
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

    debug.log(`[prevRow]: ${gridcell.parentNode.previousElementSibling}`);

    if (!findCellInRow(gridcell.parentNode.previousElementSibling, className)) {
      const gridTbody = gridcell.parentNode.parentNode;
      debug.log(`[gridTbody]: ${gridTbody}`);
      if (gridTbody && gridTbody.previousElementSibling) {
        debug.log(`[gridTbody][prevRow]: ${gridTbody ? gridTbody.previousElementSibling : 'none'}`);
        findCellInRow(gridTbody.previousElementSibling.firstElementChild, className);
      }
    }
  }

  setFocusToNextGridrowAndCell(gridcell) {
    debug.flag && debug.log(`[setFocusToNextGridrowAndCell]: ${gridcell}`);

    const linksObj = this;

    function findCellInRow(gridrow, className) {
      debug.log(`[gridrow]: ${gridrow ? gridrow.textContent : 'null'} (${className})`);
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

    debug.log(`[nextRow]: ${gridcell.parentNode.nextElementSibling}`);

    if (!findCellInRow(gridcell.parentNode.nextElementSibling, className)) {
      const gridTbody = gridcell.parentNode.parentNode;
      debug.log(`[gridTbody]: ${gridTbody}`);
      if (gridTbody && gridTbody.nextElementSibling) {
        debug.log(`[gridTbody][nextRow]: ${gridTbody ? gridTbody.nextElementSibling : 'none'}`);
        findCellInRow(gridTbody.nextElementSibling.firstElementChild, className);
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

  handleFocus(event) {
    const tgt = event.currentTarget;
    if (this.highlightFollowsFocus) {
      this.highlightGriditem(tgt);
    }
  }

  handleBlur(event) {
    const tgt = event.currentTarget;
    this.removeHighlight()
  }


  handleGridrowClick (event) {
    const tgt = event.currentTarget;
    const iconNode = tgt.querySelector('.expand-icon');

    debug.flag && debug.log(`[handlegridrowClick]: ${tgt.tagName}`);

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
          if (this.enterKeyMovesFocus) {
            this.focusGridrow(tgt);
          }
          else {
            this.highlightGriditem(tgt);
          }
          break;

        case ' ':
          this.highlightGriditem(tgt.parentNode);
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



