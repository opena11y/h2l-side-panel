/* toc-headings-tree.js */

import DebugLogging from './debug.js';

import {
  getOptions
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

const debug = new DebugLogging('tocHeadingsTree', false);
debug.flag = false;


/* templates */
const template = document.createElement('template');
template.innerHTML = `
  <div role="tree"
       aria-label="XYZ"
       data-i18n-aria-label="headings_tree_label">
  </div>
`;

const icon = document.createElement('template');
icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         xml:space="preserve"
         width="1em"
         height="1em"
         viewbox="0 0 32 32">
        <polygon points="8,8 28,20 8,32"/>
    </svg>
`;

class TOCHeadingsTree extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCHeadingsTree...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-headings-tree.css');
    this.shadowRoot.appendChild(link);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './toc-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);


    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.treeNode = this.shadowRoot.querySelector("[role=tree]");

    this.treeitems = [];

    this.highlightFollowsFocus = false;
    this.enterKeyMovesFocus    = false;

    setI18nLabels(this.shadowRoot, debug.flag);
  }

  resize (height, width) {
    debug.flag && debug.log(`height: ${height} x ${width}`);
  }

  clearContent(message = '') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.treeNode);

     if ((typeof message === 'string') && message.length) {
        const treeitemNode = document.createElement('div');
        treeitemNode.setAttribute('role', 'treeitem');
        treeitemNode.tabindex = 0;
        treeitemNode.textContent = message;
        this.treeNode.appendChild(treeitemNode);
     }
  }

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent][headings]: ${myResult.headings}`);

    this.handleObj = containerObj;
    this.handleHighlight = highlightHandler;

    const handleIconClick = this.handleIconClick;
    const treeObj = this;

    const levelLabel = getMessage('headings_level_label');

    function addTreeitem (parentNode, heading) {
      debug.flag && debug.log(`addTreeItem`);
      const treeitemNode = document.createElement('div');
      treeitemNode.addEventListener('keydown', treeObj.handleKeydown.bind(treeObj));
      treeitemNode.addEventListener('click', treeObj.handleTreeitemClick.bind(treeObj));
      treeitemNode.tabindex = -1;
      treeitemNode.setAttribute('role', 'treeitem');
      treeitemNode.setAttribute('data-level', heading.level);
      treeitemNode.setAttribute('data-ordinal-position', heading.ordinalPosition);

      const firstChar = heading.name[0] ? heading.name[0].toLowerCase() : '';
      treeitemNode.setAttribute('data-first-char', firstChar);
      treeitemNode.setAttribute('data-visible', heading.isVisibleOnScreen);
      if (heading.level > 1) {
        const iconNode = document.createElement('span');
        iconNode.className = 'no-icon';
        treeitemNode.appendChild(iconNode);
      }
      const nameNode = document.createElement('span');
      nameNode.classList.add('name');
      nameNode.textContent = `${heading.level}: ${heading.name}`;
      treeitemNode.setAttribute('data-info', levelLabel + nameNode.textContent);
      treeitemNode.appendChild(nameNode);
      treeitemNode.addEventListener('click', treeObj.handleTreeitemClick.bind(treeObj));
      parentNode.appendChild(treeitemNode);
      return treeitemNode;
    }

    function addGroup (parentNode, id) {
      debug.flag && debug.log(`addGroup`);
      const groupNode = document.createElement('div');
      groupNode.setAttribute('role', 'group');
      groupNode.id = id;
      parentNode.appendChild(groupNode);
      return groupNode;
    }

    function processHeadings (parentNode, lastHeadingNode, headings, lastLevel) {
      while (headings[0]) {
        const heading = headings[0];
        debug.flag && debug.log(`[heading][${headings.length}]: ${heading ? heading.name : 'none'}`);

        if ((heading.level === lastLevel) ||
            (lastLevel === 0) ||
            (lastLevel === 1)) {
          const headingNode1 = addTreeitem(parentNode, heading);
          headings.shift();
          processHeadings (parentNode, headingNode1, headings, heading.level);
        }
        else {
          if (heading.level > lastLevel) {
            const id = `heading-${heading.ordinalPosition}`;
            if (lastHeadingNode) {
              lastHeadingNode.setAttribute('aria-owns', id);
              const iconNode = lastHeadingNode.querySelector(`.no-icon`);
              if (iconNode) {
                iconNode.className = 'expand-icon';
                iconNode.appendChild(icon.content.cloneNode(true));
                lastHeadingNode.setAttribute('aria-expanded', 'false');
                iconNode.addEventListener('click', handleIconClick.bind(treeObj));
              }
              else {
                lastHeadingNode.setAttribute('aria-expanded', 'true');
              }
            }
            const groupNode = addGroup(parentNode, id);
            let count = headings.length;

            const headingNode2 = addTreeitem(groupNode, heading);
            headings.shift();

            headings = processHeadings (groupNode, headingNode2, headings, heading.level);

            count = count - headings.length;

            lastHeadingNode.setAttribute('data-children', count);
            const nameSpan = lastHeadingNode.querySelector('.name');
            nameSpan.textContent += ` (${count})`;
          }
          else {
            return headings;
          }
        }
      }
      return headings;
    }

    this.clearContent();

    if (myResult.headings) {
      debug.flag && debug.log(`[myResult]: ${myResult.headings}`);

      getOptions().then( (options) => {

        debug.flag && debug.log(`[options][    highlightFollowsFocus]: ${options.highlightFollowsFocus}`);
        debug.flag && debug.log(`[options][       enterKeyMovesFocus]: ${options.enterKeyMovesFocus}`);
        debug.flag && debug.log(`[options][smallAndOffScreenHeadings]: ${options.smallAndOffScreenHeadings}`);

        this.highlightFollowsFocus = options.highlightFollowsFocus;
        this.enterKeyMovesFocus    = options.enterKeyMovesFocus;

        const headings = Array.from(myResult.headings).filter( (h) => {
          return h.name.length &&     // heading must have a name
                 ((h.level === 1) ||  // If a heading level 1, usually important
                  h.isVisibleOnScreen ||
                  (h.isVisibleToAT && options.smallAndOffScreenHeadings));
        });

        processHeadings(this.treeNode, null, headings, 0);

        const firstTreeitem = this.treeNode.querySelector('[role="treeitem"]');
        const count = this.treeNode.querySelectorAll('[role="treeitem"]').length;

       setTablistAttr('headings-count', count);

        if (firstTreeitem) {
          this.setFocusToTreeitem(firstTreeitem);
        }
        else {
          this.clearContent(getMessage('headings_none_found', debug.flag));
        }

      });
    }
    else {
      this.clearContent(getMessage('protocol_not_supported', debug.flag));
    }


  }

  // Tree keyboard navigation methods

  collapseTreeitem (treeitem) {
    treeitem.setAttribute('aria-expanded', 'false');
  }

  expandAllSiblingTreeitems (treeitem) {
    const expandable = Array.from(treeitem.parentNode.querySelectorAll('[aria-expanded]'));
    expandable.forEach( (ti) => {
      ti.setAttribute('aria-expanded', 'true');
    });
  }

  expandTreeitem (treeitem) {
    treeitem.setAttribute('aria-expanded', 'true');
  }

  getVisibleTreeitems () {
    return Array.from(this.treeNode.querySelectorAll('[role="treeitem"]:not([role="treeitem"][aria-expanded="false"] + [role="group"] > [role="treeitem"]'));
  }

  focusHeading(treeitem) {
    const op = treeitem.getAttribute('data-ordinal-position');
    if (op) {
      focusOrdinalPosition(op);
    }
  }

  highlightHeading(treeitem) {
    const op   = treeitem.getAttribute('data-ordinal-position');
    const info = treeitem.getAttribute('data-info');
    if (op) {
      highlightOrdinalPosition(op, info);
    }
  }

  isExpandable(treeitem) {
    return treeitem.hasAttribute('aria-expanded');
  }

  isExpanded(treeitem) {
    return treeitem.hasAttribute('aria-expanded') &&
           (treeitem.getAttribute('aria-expanded') === 'true');
  }

  isInSubtree (treeitem) {
    return treeitem.parentNode.getAttribute('role') === 'group';
  }

  setFocusByFirstCharacter(treeitem, char){

    function findChar (treeitem) {
      return char === treeitem.getAttribute('data-first-char');
    }

    const treeitems = this.getVisibleTreeitems();
    let startIndex = treeitems.indexOf(treeitem) + 1;

    const searchOrder = (startIndex < treeitems.length) ?
                        treeitems.splice(startIndex).concat(treeitems.splice(0, startIndex)) :
                        treeitems;
    const result = searchOrder.find(findChar);
    if (result) {
      this.setFocusToTreeitem(result);
    }
  }

  setFocusToFirstTreeitem() {
    const treeitems = this.getVisibleTreeitems();
    if (treeitems[0]) {
      this.setFocusToTreeitem(treeitems[0]);
    }
  }

  setFocusToLastTreeitem() {
    const treeitems = this.getVisibleTreeitems();
    if (treeitems.length) {
      this.setFocusToTreeitem(treeitems[treeitems.length-1]);
    }
  }

  setFocusToNextTreeitem(treeitem) {
    const treeitems = this.getVisibleTreeitems();
    const index = treeitems.indexOf(treeitem) + 1;
    const nextItem = index < treeitems.length ?
                     treeitems[index] :
                     false;

    if (nextItem) {
      this.setFocusToTreeitem(nextItem);
    }
  }

  setFocusToParentTreeitem (treeitem)  {
    if (this.isInSubtree(treeitem)) {
      var ti = treeitem.parentNode.previousElementSibling;
      this.setFocusToTreeitem(ti);
    }
  }

  setFocusToPreviousTreeitem(treeitem) {
    const treeitems = this.getVisibleTreeitems();
    const index = treeitems.indexOf(treeitem) - 1;
    const prevItem = index >= 0 ?
                     treeitems[index] :
                     false;

    if (prevItem) {
      this.setFocusToTreeitem(prevItem);
    }
  }

  setFocusToTreeitem(treeitem) {
    this.setTabindex(treeitem);
    treeitem.focus();
    if (this.highlightFollowsFocus){
      this.highlightHeading(treeitem);
    }
  }

  setTabindex(treeitem) {
    const treeitems = this.getVisibleTreeitems();
    treeitems.forEach( (ti) => {
      ti.setAttribute('tabindex', (ti === treeitem) ? 0 : -1);
    });
  }

  // Event handlers

  handleIconClick (event) {

    debug.flag && debug.log(`[handleIconClick]: ${event.currentTarget.tagName}`);

    // get treeitem with aria-expanded
    const ti = event.currentTarget.parentNode;
    if (ti.getAttribute('aria-expanded') === 'false') {
      ti.setAttribute('aria-expanded', 'true');
    }
    else {
      ti.setAttribute('aria-expanded', 'false');
    }
    event.stopPropagation();
    event.preventDefault();
  }

  handleTreeitemClick (event) {
    const tgt = event.currentTarget;
    const iconNode = tgt.querySelector('.expand-icon');

    debug.flag && debug.log(`[handleTreeitemClick]: ${tgt.tagName}`);

    // if clicked on expand icon in the treeview then do not process event
    if (!iconNode ||
        (iconNode && (iconNode !== event.target)) ||
        (iconNode && !iconNode.contains(event.target))) {
      this.setFocusToTreeitem(tgt);
      this.highlightHeading(tgt);
      event.stopPropagation();
      event.preventDefault();
    }
  }

 handleKeydown(event) {
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

    if (event.shift) {
      if (
        event.keyCode == this.keyCode.SPACE ||
        event.keyCode == this.keyCode.RETURN
      ) {
        event.stopPropagation();
      } else {
        if (isPrintableCharacter(key)) {
          if (key == '*') {
            this.expandAllSiblingTreeitems(tgt);
            flag = true;
          } else {
            this.setFocusByFirstCharacter(tgt, key);
          }
        }
      }
    } else {
      switch (key) {
        case 'Enter':
          if (this.enterKeyMovesFocus) {
            this.focusHeading(tgt);
          }
          else {
            this.highlightHeading(tgt);
          }
          break;

        case ' ':
          this.highlightHeading(tgt);
          flag = true;
          break;

        case 'ArrowUp':
          this.setFocusToPreviousTreeitem(tgt);
          flag = true;
          break;

        case 'ArrowDown':
          this.setFocusToNextTreeitem(tgt);
          flag = true;
          break;

        case 'ArrowRight':
          if (this.isExpandable(tgt)) {
            if (this.isExpanded(tgt)) {
              this.setFocusToNextTreeitem(tgt);
            } else {
              this.expandTreeitem(tgt);
            }
          }
          flag = true;
          break;

        case 'ArrowLeft':
          if (this.isExpandable(tgt) && this.isExpanded(tgt)) {
            this.collapseTreeitem(tgt);
          } else {
            if (this.isInSubtree(tgt)) {
              this.setFocusToParentTreeitem(tgt);
            }
          }
          flag = true;
          break;

        case 'Home':
          this.setFocusToFirstTreeitem();
          flag = true;
          break;

        case 'End':
          this.setFocusToLastTreeitem();
          flag = true;
          break;

        default:
          if (isPrintableCharacter(key)) {
            if (key == '*') {
              this.expandAllSiblingTreeitems(tgt);
              flag = true;
            } else {
              this.setFocusByFirstCharacter(tgt, key);
            }
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

window.customElements.define('toc-headings-tree', TOCHeadingsTree);



