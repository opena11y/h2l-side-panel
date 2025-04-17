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
  <div>
      <ul id="id-ul-headings">
        <li>Loading...</li>
      </ul>
  </div>
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

    this.ulHeadings = this.shadowRoot.querySelector("#id-ul-headings");

  }

  clearContent(message = '') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.ulHeadings);

     if ((typeof message === 'string') && message.length) {
        const liNode = document.createElement('li');
        liNode.textContent = message;
        this.ulHeadings.appendChild(liNode);
     }
  }

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    this.clearContent();

    if (myResult.headings) {
      myResult.headings.forEach( (h) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', highlightHandler.bind(containerObj));
        liNode.setAttribute('data-ordinal-position', h.ordinalPosition);
        liNode.textContent = `H${h.level}: ${h.accName} (${h.ordinalPosition})`;
        this.ulHeadings.appendChild(liNode);
        debug.flag && debug.log(liNode.textContent);
      });
    }
  }
}

window.customElements.define('toc-headings-tree', TOCHeadingsTree);



