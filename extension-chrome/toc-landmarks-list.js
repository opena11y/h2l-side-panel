/* toc-landmarks-list.js */

/* Imports */

import DebugLogging   from './debug.js';

import {
  getOptions
} from './storage.js';

import {
  highlightOrdinalPosition
} from './toc-sidepanel.js';

import {
  getMessage,
  removeChildContent,
  setI18nLabels,
  setTablistAttr
} from './utils.js';

/* Constants */

const debug = new DebugLogging('tocLandmarksList', false);
debug.flag = false;


/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div role="listbox" data-i18n-aria-label="landmarks_list_label">
  </div>
`;

class TOCLandmarksList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCRegionsList...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-regions-list.css');
    this.shadowRoot.appendChild(link);

    // Add DOM listboxfrom template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.listboxNode = this.shadowRoot.querySelector("[role=listbox");

    setI18nLabels(this.shadowRoot, debug.flag);

  }

  resize (height, width) {
    debug.flag && debug.log(`height: ${height} x ${width}`);
  }

  clearContent(message='') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.listboxNode);

     if ((typeof message === 'string') && message.length) {
        const listitemNode = document.createElement('div');
        listitemNode.setAttribute('role', 'listbox');
        listitemNode.textContent = message;
        this.listboxNode.appendChild(listitemNode);
     }
  }

  updateContent(myResult) {
    debug.flag && debug.log(`[updateContent]`);

    this.clearContent();

    const listObj = this;

    if (myResult.regions) {

      const landmarkCounts = {};

      myResult.regions.forEach( (r) => {
        if (landmarkCounts[r.role]) {
          landmarkCounts[r.role] += 1;
        }
        else {
          landmarkCounts[r.role] = 1;
        }
      });

      for (let role in landmarkCounts) {
        debug.log(`[${role}]: ${landmarkCounts[role]}`);
      }

      getOptions().then( (options) => {

        debug.flag && debug.log(`[options]: ${options}`);
        myResult.regions.forEach( (r) => {
          if (r.name ||
              (landmarkCounts[r.role] < 3) ||
              options.unNamedDuplicateRegions) {

            const listitemNode = document.createElement('div');
            listitemNode.setAttribute('role', 'listitem');
            listitemNode.setAttribute('data-ordinal-position', r.ordinalPosition);

            const roleName = r.role[0].toUpperCase() + r.role.slice(1);

            listitemNode.textContent = r.name ? `${roleName}: ${r.name}` : roleName;
            listitemNode.setAttribute('data-first-char', r.role.toLowerCase()[0]);
            listitemNode.addEventListener('click', listObj.handleListitemClick.bind(listObj));
            listitemNode.addEventListener('keydown', listObj.handleKeydown.bind(listObj));

            this.listboxNode.appendChild(listitemNode);
            debug.flag && debug.log(listitemNode.textContent);
          }

        });

        const firstListitem = this.listboxNode.querySelector('[role="listitem"]');

        const count = this.listboxNode.querySelectorAll('[role="listitem"]').length;

        setTablistAttr('landmarks-count', count);

        if (firstListitem) {
          this.setFocusToListitem(firstListitem);
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

  // Listbox keyboard navigation methods

  getListitems () {
    return Array.from(this.listboxNode.querySelectorAll('[role="listitem"]'));
  }

  highlightRegion(listitem) {
    const op = listitem.getAttribute('data-ordinal-position');
    if (op) {
      highlightOrdinalPosition(op);
    }
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
    listitem.focus();
  }

  setTabindex(listitem) {
    const listitems = this.getListitems();
    listitems.forEach( (ti) => {
      ti.setAttribute('tabindex', (ti === listitem) ? 0 : -1);
    });
  }

  // Event handlers

  handleListitemClick (event) {
    const tgt = event.currentTarget;
    debug.log(`[handleListitemClick]: ${tgt.tagName}`);
    this.setFocusToListitem(tgt);
    this.highlightRegion(tgt);
    event.stopPropagation();
    event.preventDefault();
  }

 handleKeydown(event) {
    const tgt = event.currentTarget;
    debug.log(`[handleKeydown]: ${tgt.tagName}`);
    const key = event.key;
    let flag  = false;

    debug.flag && debug.log(`[handleKeydown][key]: ${key}`);

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
          this.highlightRegion(tgt);
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


window.customElements.define('toc-landmarks-list', TOCLandmarksList);



