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
  <div>
      <ul id="id-ul-regions">
        <li>Loading...</li>
      </ul>
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

    this.ulRegions = this.shadowRoot.querySelector("#id-ul-regions");

  }

  clearContent(message='') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.ulRegions);

     if ((typeof message === 'string') && message.length) {
        const liNode = document.createElement('li');
        liNode.textContent = message;
        this.ulRegions.appendChild(liNode);
     }
  }

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    this.clearContent();

    if (myResult.regions) {
      myResult.regions.forEach( (r) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', highlightHandler.bind(containerObj));
        liNode.setAttribute('data-ordinal-position', r.ordinalPosition);
        const textContent = r.accName ? `${r.role.toUpperCase()}: ${r.accName}` : r.role.toUpperCase();
        liNode.textContent = textContent + ` (${r.ordinalPosition})`;
        this.ulRegions.appendChild(liNode);
        debug.flag && debug.log(liNode.textContent);
      });
    }
  }
}

window.customElements.define('toc-regions-list', TOCRegionsList);



