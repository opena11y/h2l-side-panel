/* toc-headings-tree.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocHeadingsTree', false);
debug.flag = true;

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
  <div role="tree"
       aria-label="Headings">
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

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.treeNode = this.shadowRoot.querySelector("[role=tree]");

    this.treeitems = [];

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
    debug.flag && debug.log(`[updateContent]`);

    const handleIconClick = this.handleIconClick;
    const treeObj = this;

    function addTreeitem (parentNode, heading) {
      debug.log(`addTreeItem`);
      const treeitemNode = document.createElement('div');
      treeitemNode.addEventListener('keydown', treeObj.handleKeydown.bind(treeObj));
      treeitemNode.addEventListener('click', treeObj.handleTreeitemClick.bind(treeObj));
      treeitemNode.tabindex = -1;
      treeitemNode.setAttribute('role', 'treeitem');
      treeitemNode.setAttribute('data-level', heading.level);
      treeitemNode.setAttribute('data-ordinal-position', heading.ordinalPosition);
      const firstChar = heading.accName[0] ? heading.accName[0].toLowerCase() : '';
      treeitemNode.setAttribute('data-first-char', firstChar);
      if (heading.level > 1) {
        const iconNode = document.createElement('span');
        iconNode.className = 'no-icon';
        treeitemNode.appendChild(iconNode);
      }
      const nameNode = document.createElement('span');
      nameNode.classList.add('name');
      nameNode.textContent = `${heading.level}: ${heading.accName} (${heading.ordinalPosition})`;
      treeitemNode.appendChild(nameNode);
      treeitemNode.addEventListener('click', highlightHandler.bind(containerObj));
      parentNode.appendChild(treeitemNode);
      return treeitemNode;
    }

    function addGroup (parentNode, id) {
      debug.log(`addGroup`);
      const groupNode = document.createElement('div');
      groupNode.setAttribute('role', 'group');
      groupNode.id = id;
      parentNode.appendChild(groupNode);
      return groupNode;
    }

    function processHeadings (parentNode, lastHeadingNode, headings, lastLevel) {
      while (headings[0]) {
        const heading = headings[0];
        debug.log(`[heading][${headings.length}]: ${heading ? heading.accName : 'none'}`);
        if ((heading.level === lastLevel) ||
            (lastLevel === 0) ||
            (lastLevel === 1)) {
          const headingNode = addTreeitem(parentNode, heading);
          headings.shift();
          processHeadings (parentNode, headingNode, headings, heading.level);
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
            // Check if heading level is being skipped by author
            if ((heading.level-lastLevel) > 1) {
              headings = processHeadings (groupNode, lastHeadingNode, headings, 0);
            }
            else {
              headings = processHeadings (groupNode, lastHeadingNode, headings, heading.level);
            }
            count = count - headings.length;
            lastHeadingNode.setAttribute('data-children', count);
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
      debug.log(`[myResult]: ${myResult.headings}`);
      const headings = Array.from(myResult.headings);
      debug.log(`[headings]: ${headings}`);
      processHeadings(this.treeNode, null, headings, 0);
    }

    this.setFocusToTreeitem(this.treeNode.querySelector('[role="treeitem"]'));
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
    debug.flag && debug.log(`[setFocusByFirstCharacter]: ${treeitem} ${char}`);

    const treeitems = this.getVisibleTreeitems();
    debug.log(`[treeitems]: ${treeitems.length}`);
    let i;
    let index = -1;
    let ti;
    char = char.toLowerCase();

    // Get start index for search based on position of treeitem
    let startIndex = treeitems.indexOf(treeitem) + 1;
    if (startIndex >= treeitems.length) {
      startIndex = 0;
    }

    // Check remaining items in the tree
    for (i = startIndex; i < treeitems.length; i++) {
      ti = treeitems[i];
      debug.log(`[char]: ${char}  [attr]: ${ti.getAttribute('data-first-char')}`);
      if (char === ti.getAttribute('data-first-char')) {
        debug.log(`[found][A]: ${i}`);
        index = i;
        break;
      }
    }

    // If not found in remaining slots, check from beginning
    if (index === -1) {
      for (i = 0; i < startIndex; i++) {
        ti = treeitems[i];
        if (char === ti.getAttribute('data-first-char')) {
          debug.log(`[found][B]: ${i}`);
          index = i;
          break;
        }
      }
    }

    debug.log(`[index]: ${index}`);

    // If match was found...
    if (index > -1) {
      this.setFocusToTreeitem(treeitems[index]);
    }
  }

  setFocusToNextTreeitem(treeitem) {
    debug.log && debug.log(`[setFocusToNextTreeitem]: ${treeitem}`);

    const treeitems = this.getVisibleTreeitems();
    let nextItem = false;

    for (let i = treeitems.length - 1; i >= 0; i--) {
      const ti = treeitems[i];
      if (ti === treeitem) {
        break;
      }
      nextItem = ti;
    }

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
    let prevItem = false;

    for (let i = 0; i < treeitems.length; i++) {
      const ti = treeitems[i];
      if (ti === treeitem) {
        break;
      }
      prevItem = ti;
    }

    if (prevItem) {
      this.setFocusToTreeitem(prevItem);
    }
  }

  setFocusToTreeitem(treeitem) {
    debug.flag && debug.log(`[setFocusToTreeitem]: ${treeitem}`);
    this.setTabindex(treeitem);
    treeitem.focus();
  }

  setTabindex(treeitem) {
    debug.flag && debug.log(`[setTabindex]: ${treeitem}`);
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
        // NOTE: Return key is supported through the click event
        case ' ':
          this.updateContent(tgt.href, tgt.textContent.trim());
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
          this.setFocusToTreeitem(this.treeitems[0]);
          flag = true;
          break;

        case 'End':
          var visibleTreeitems = this.getVisibleTreeitems();
          this.setFocusToTreeitem(
            visibleTreeitems[visibleTreeitems.length - 1]
          );
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



