/* h2l-landmarks-list.js */

/* Imports */

import DebugLogging   from './debug.js';

import {
  getOptions,
  saveOption
} from './storage.js';

import {
  getMessage,
  focusOrdinalPosition,
  highlightOrdinalPosition,
  removeChildContent,
  setI18nLabels,
  setTablistAttr
} from './utils.js';

/* Constants */

const debug = new DebugLogging('h2lLandmarksList', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div role="listbox" data-i18n-aria-label="landmarks_list_label">
  </div>
`;

class H2LLandmarksList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    const linkDefs = document.createElement('link');
    linkDefs.setAttribute('rel', 'stylesheet');
    linkDefs.setAttribute('href', './defs.css');
    this.shadowRoot.appendChild(linkDefs);

    const linkBase = document.createElement('link');
    linkBase.setAttribute('rel', 'stylesheet');
    linkBase.setAttribute('href', './base.css');
    this.shadowRoot.appendChild(linkBase);

    const linkList = document.createElement('link');
    linkList.setAttribute('rel', 'stylesheet');
    linkList.setAttribute('href', './h2l-landmarks-list.css');
    this.shadowRoot.appendChild(linkList);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './h2l-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);

    // Add DOM listboxfrom template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.listboxNode = this.shadowRoot.querySelector("[role=listbox");

    this.highlightFollowsFocus = false;
    this.enterKeyMovesFocus    = false;
    this.isVisible = false;

    this.lastLandmarkId = '';

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
  }

  clearContent(message='') {
     removeChildContent(this.listboxNode);

     if ((typeof message === 'string') && message.length) {
        const listitemNode = document.createElement('div');
        listitemNode.setAttribute('role', 'listbox');
        listitemNode.tabIndex = 0;
        listitemNode.textContent = message;
        this.listboxNode.appendChild(listitemNode);
     }
  }

  updateContent(sameUrl, regions) {
    let lastLandmarkNode = null;
    let index = 1;

    this.clearContent();

    const listObj = this;

    if (regions) {
      getOptions().then( (options) => {

        this.highlightFollowsFocus = options.highlightFollowsFocus;
        this.enterKeyMovesFocus    = options.enterKeyMovesFocus;
        this.lastURL               = options.lastURL;
        this.lastLandmarkId        = options.lastLandmarkId;

        regions.forEach( (r) => {
            const listitemNode = document.createElement('div');
            listitemNode.id = 'landmark-' + index;
            index += 1;

            if (listitemNode.id === listObj.lastLandmarkId) {
              lastLandmarkNode = listitemNode;
            }

            listitemNode.setAttribute('role', 'listitem');
            listitemNode.setAttribute('data-ordinal-position', r.ordinalPosition);

            const roleName = r.role[0].toUpperCase() + r.role.slice(1);

            listitemNode.textContent = r.name ? `${roleName}: ${r.name}` : roleName;
            listitemNode.setAttribute('data-info', listitemNode.textContent);
            listitemNode.setAttribute('data-first-char', r.role.toLowerCase()[0]);
            listitemNode.addEventListener('click', listObj.handleClick.bind(listObj));
            listitemNode.addEventListener('keydown', listObj.handleKeydown.bind(listObj));
            listitemNode.addEventListener('focus',   listObj.handleFocus.bind(listObj));
            listitemNode.addEventListener('blur',    listObj.handleBlur.bind(listObj));

            this.listboxNode.appendChild(listitemNode);
        });

        const firstListitem = this.listboxNode.querySelector('[role="listitem"]');

        const count = this.listboxNode.querySelectorAll('[role="listitem"]').length;

        setTablistAttr('landmarks-count', count);

        if (firstListitem) {
          if (sameUrl && lastLandmarkNode) {
            this.setFocusToListitem(lastLandmarkNode);
          }
          else {
            this.setFocusToListitem(firstListitem);
          }
        }
        else {
          this.clearContent(getMessage('Landmarks_none_found', debug.flag));
        }
      });
    }
    else {
      this.clearContent(getMessage('protocol_not_supported', debug.flag));
    }

  }

  getListitems () {
    return Array.from(this.listboxNode.querySelectorAll('[role="listitem"]'));
  }

  focusLandmark(listitem) {
    const op = listitem.getAttribute('data-ordinal-position');
    if (op) {
      focusOrdinalPosition(op);
    }
  }

  highlightLandmark(listitem) {
    const op   = listitem.getAttribute('data-ordinal-position') ?
                 listitem.getAttribute('data-ordinal-position') :
                 '';
    const info = listitem.getAttribute('data-info');
    if (op) {
      highlightOrdinalPosition(op, info);
      saveOption('lastLandmarkId', listitem.id);
    }
  }

  removeHighlight() {
    highlightOrdinalPosition('', '');
  }

  setFocusByFirstCharacter(listitem, char){

    function findChar (listitem) {
      return char === listitem.getAttribute('data-first-char');
    }

    const listitems = this.getListitems();
    let startIndex = listitems.indexOf(listitem) + 1;

    const searchOrder = (startIndex < listitems.length) ?
                        listitems.splice(startIndex).concat(listitems.splice(0, startIndex)) :
                        listitems;
    const result = searchOrder.find(findChar);
    if (result) {
      this.setFocusToListitem(result);
    }
  }

  setFocusToFirstListitem() {
    const listitems = this.getListitems();
    if (listitems[0]) {
      this.setFocusToListitem(listitems[0]);
    }
  }

  setFocusToLastListitem() {
    const listitems = this.getListitems();
    if (listitems.length) {
      this.setFocusToListitem(listitems[listitems.length-1]);
    }
  }

  setFocusToNextListitem(listitem) {
    const listitems = this.getListitems();
    const index = listitems.indexOf(listitem) + 1;
    const nextItem = index < listitems.length ?
                     listitems[index] :
                     false;

    if (nextItem) {
      this.setFocusToListitem(nextItem);
    }
  }

  setFocusToPreviousListitem(listitem) {
    const listitems = this.getListitems();
    const index = listitems.indexOf(listitem) - 1;
    const prevItem = index >= 0 ?
                     listitems[index] :
                     false;

    if (prevItem) {
      this.setFocusToListitem(prevItem);
    }
  }

  setFocusToListitem(listitem) {
    this.setTabindex(listitem);
    if (this.isVisible) {
      listitem.focus();
      if (this.highlightFollowsFocus){
        this.highlightLandmark(listitem);
      }
    }
  }

  setTabindex(listitem) {
    const listitems = this.getListitems();
    listitems.forEach( (ti) => {
      ti.setAttribute('tabindex', (ti === listitem) ? 0 : -1);
    });
  }

  // Event handlers

  handleFocus(event) {
    const tgt = event.currentTarget;
    if (this.highlightFollowsFocus) {
      this.highlightHeading(tgt);
    }
  }

  handleBlur(event) {
    const tgt = event.currentTarget;
    this.removeHighlight()
  }

  handleClick (event) {
    const tgt = event.currentTarget;
    this.setFocusToListitem(tgt);
    this.highlightLandmark(tgt);
    event.stopPropagation();
    event.preventDefault();
  }

  handleKeydown(event) {
    const tgt = event.currentTarget;
    const key = event.key;
    let flag  = false;

    function isPrintableCharacter(str) {
      return str.length === 1 && str.match(/\S/);
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.shift) {
      if (
        event.keyCode == this.keyCode.SPACE ||
        event.keyCode == this.keyCode.RETURN
      ) {
        event.stopPropagation();
      }
    } else {
      switch (key) {
        case 'Enter':
        case ' ':
          this.highlightLandmark(tgt);
          flag = true;
          break;

        case 'ArrowUp':
          this.setFocusToPreviousListitem(tgt);
          flag = true;
          break;

        case 'ArrowDown':
          this.setFocusToNextListitem(tgt);
          flag = true;
          break;

        case 'Home':
          this.setFocusToFirstListitem();
          flag = true;
          break;

        case 'End':
          this.setFocusToLastListitem();
          flag = true;
          break;

        default:
          if (isPrintableCharacter(key)) {
            this.setFocusByFirstCharacter(tgt, key);
          }
          break;
      }
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
}


window.customElements.define('h2l-landmarks-list', H2LLandmarksList);



