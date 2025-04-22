/* toc-regions-list.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocRegionsTree', false);
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
  <div role="listbox">
  </div>
`;

class TOCRegionsList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCRegionsTree...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-regions-list.css');
    this.shadowRoot.appendChild(link);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.listboxNode = this.shadowRoot.querySelector("[role=listbox");

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

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    this.clearContent();

    if (myResult.regions) {
      myResult.regions.forEach( (r) => {
        const listitemNode = document.createElement('div');
        listitemNode.setAttribute('role', 'listbox');
        listitemNode.addEventListener('click', highlightHandler.bind(containerObj));
        listitemNode.setAttribute('data-ordinal-position', r.ordinalPosition);
        const textContent = r.accName ? `${r.role.toUpperCase()}: ${r.accName}` : r.role.toUpperCase();
        listitemNode.textContent = textContent + ` (${r.ordinalPosition})`;
        this.listboxNode.appendChild(listitemNode);
        debug.flag && debug.log(listitemNode.textContent);
      });
    }
  }
}

window.customElements.define('toc-regions-list', TOCRegionsList);



