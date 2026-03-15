/* h2l-landmarks-list.js */

/* Imports */

import DebugLogging   from './debug.js';

import {
  getOptions,
  saveOption
} from './storage.js';

import {
  getMessage,
  getSpan,
  getSpanBrackets,
  highlightItems,
  removeChildContent,
  setI18nLabels,
  setTablistAttr
} from './utils.js';

import {
  TabpanelOptions
} from './h2l-tabpanel-options.js';

/* Constants */

const debug = new DebugLogging('h2lLandmarksList', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div role="listbox" data-i18n-aria-label="landmarks_list_label">
  </div>

  <div id="options">
    <label for="highlight-all">
      <input id="highlight-all"
             type="checkbox"
             data-option="highlightAllLandmarks"/>
      <span data-i18n="options_highlight_landmarks_all"></span>
    </label>
    <label for="show-name">
      <input id="show-name"
             type="checkbox"
             data-option="emulateScreenReaderForLandmarks"/>
      <span data-i18n="options_highlight_landmarks_emulate_screen_reader"></span>
    </label>
`;

class H2LLandmarksList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    const linkList = document.createElement('link');
    linkList.setAttribute('rel', 'stylesheet');
    linkList.setAttribute('href', './h2l-landmarks-list.css');
    this.shadowRoot.appendChild(linkList);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './h2l-focus-style.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);

    // Use external CSS stylesheet for options styling
    const linkOptions = document.createElement('link');
    linkOptions.setAttribute('rel', 'stylesheet');
    linkOptions.setAttribute('href', './h2l-tabpanel-options.css');
    linkOptions.id = 'tabpanel-options';
    this.shadowRoot.appendChild(linkOptions);

    // Add DOM listboxfrom template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.listboxNode = this.shadowRoot.querySelector("[role=listbox");

    this.highlightFollowsFocus = false;
    this.enterKeyMovesFocus    = false;
    this.isVisible = false;
    this.landmarkItems = [];

    this.lastLandmarkId = '';

    setI18nLabels(this.shadowRoot, debug.flag);

    this.tabpanelOptions = new TabpanelOptions(this.shadowRoot);

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

    const optionsNode = this.shadowRoot.querySelector("#options");
    const optionsRect = optionsNode.getBoundingClientRect();

    this.listboxNode.style.height = (height - 1 * 1.2 * optionsRect.height) + 'px';

  }

  addMessage(message, tabindexValue=0, className='') {
    if ((typeof message === 'string') && message.length) {
      const listitemNode = document.createElement('div');
      listitemNode.setAttribute('role', 'listitem');
      listitemNode.tabIndex    = tabindexValue;
      listitemNode.textContent = message;
      listitemNode.className   = className;

      listitemNode.addEventListener('keydown', this.handleMessageKeydown.bind(this));
      listitemNode.addEventListener('click',   this.handleMessageClick.bind(this));
      listitemNode.addEventListener('focus',   this.handleFocus.bind(this));
      listitemNode.addEventListener('blur',    this.handleBlur.bind(this));

      this.listboxNode.appendChild(listitemNode);
    }
  }

  clearContent(message='') {
     removeChildContent(this.listboxNode);
     this.addMessage(message);
  }

  updateContent(sameUrl, regions) {
    let lastLandmarkNode = null;
    let index = 1;
    let hiddenCount = 0;

    this.clearContent();
    this.landmarkItems = [];

    const listObj = this;

    if (regions) {
      getOptions().then( (options) => {

        this.highlightFollowsFocus = options.highlightFollowsFocus;
        this.enterKeyMovesFocus    = options.enterKeyMovesFocus;
        this.lastURL               = options.lastURL;
        this.lastLandmarkId        = options.lastLandmarkId;

        regions.forEach( (r) => {

          if (r.isVisibleOnScreen || r.isVisibleToAT) {
            const roleName = r.role[0].toUpperCase() + r.role.slice(1);

            listObj.landmarkItems.push({
              position:          r.ordinalPosition,
              isVisibleOnScreen: r.isVisibleOnScreen,
              isVisibleToAT:     r.isVisibleToAT,
              elemRole:          roleName
            });

            const listitemNode = document.createElement('div');
            listitemNode.id = 'landmark-' + index;
            index += 1;

            if (listitemNode.id === listObj.lastLandmarkId) {
              lastLandmarkNode = listitemNode;
            }

            listitemNode.setAttribute('role', 'listitem');
            listitemNode.setAttribute('data-ordinal-position', r.ordinalPosition);


            listitemNode.appendChild(getSpan(r.name ? `${roleName}: ${r.name}` : roleName, 'content'));
            if (!r.isVisibleOnScreen) {
              listitemNode.appendChild(getSpanBrackets(`hidden`, 'hidden'));
            }
            if (!r.isVisibleToAT) {
              listitemNode.appendChild(getSpanBrackets(`hidden from AT`, 'hidden'));
            }

            listitemNode.setAttribute('data-role',           roleName);
            listitemNode.setAttribute('data-name',           r.name);
            listitemNode.setAttribute('data-name-src',       r.nameSource);
            listitemNode.setAttribute('data-visible-screen', r.isVisibleOnScreen);
            listitemNode.setAttribute('data-visible-at',     r.isVisibleToAT);

            listitemNode.setAttribute('data-first-char', r.role.toLowerCase()[0]);
            listitemNode.addEventListener('click',   listObj.handleClick.bind(listObj));
            listitemNode.addEventListener('keydown', listObj.handleKeydown.bind(listObj));
            listitemNode.addEventListener('focus',   listObj.handleFocus.bind(listObj));
            listitemNode.addEventListener('blur',    listObj.handleBlur.bind(listObj));

            this.listboxNode.appendChild(listitemNode);
          }
          else {
            hiddenCount += 1;
          }
        });

        const firstListitem = this.listboxNode.querySelector('[role="listitem"]');

        const count = this.listboxNode.querySelectorAll('[role="listitem"]').length;

        if (hiddenCount) {
          hiddenCount === 1 ?
            this.addMessage(getMessage('msg_hidden_landmark'), (count ? -1 : 0), 'hidden') :
            this.addMessage(`${hiddenCount} ${getMessage('msg_hidden_landmarks')}`, (count ? -1 : 0), 'hidden');
        }

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

    getOptions().then( (options) => {
      if (options.highlightAllLandmarks) {
        highlightItems({}, this.landmarkItems, getMessage('msg_landmark_hidden'), true);
      }
    });

    this.tabpanelOptions.updateOptions();

  }

  getListitems () {
    return Array.from(this.listboxNode.querySelectorAll('[role="listitem"]'));
  }

  highlightLandmark(listitem) {
    const op   = listitem.getAttribute('data-ordinal-position') ?
                 listitem.getAttribute('data-ordinal-position') :
                 0;
    const role    = listitem.getAttribute('data-role');
    const name    = listitem.getAttribute('data-name');
    const namesrc = listitem.getAttribute('data-name-src');

    if (op) {
      getOptions().then( (options) => {
        highlightItems(
          { position: parseInt(op),
            elemRole: role
           },
          options.highlightAllLandmarks ? this.landmarkItems : [],
          getMessage('msg_landmark_hidden'),
          true
        );
        saveOption('lastLandmarkId', listitem.id);
      });
    }
  }

  removeHighlight() {
    getOptions().then( (options) => {
      highlightItems(
        {},
        [],
        getMessage('msg_landmark_hidden'),
        false
      );
    });
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
      this.highlightLandmark(tgt);
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

  handleMessageClick (event) {
    const tgt = event.currentTarget;
    this.setFocusToListitem(tgt);
    event.stopPropagation();
    event.preventDefault();
  }

  handleMessageKeydown(event) {
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



