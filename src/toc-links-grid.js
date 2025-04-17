/* toc-links-grid.js */

import DebugLogging   from './debug.js';

/* Constants */

const debug = new DebugLogging('tocLinksGrid', false);
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
      <ul id="id-ul-links">
        <li>Loading...</li>
      </ul>
  </div>
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

    this.ulLinks = this.shadowRoot.querySelector("#id-ul-links");
  }

  clearContent(message = '') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.ulLinks);

     if ((typeof message === 'string') && message.length) {
        const liNode = document.createElement('li');
        liNode.textContent = message;
        this.ulLinks.appendChild(liNode);
     }
  }

  updateContent(myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    this.clearContent();

    if (myResult.links) {
      myResult.links.forEach( (l) => {
        const liNode = document.createElement('li');
        liNode.addEventListener('click', highlightHandler.bind(containerObj));
        const textContent = l.accName ?
                            `${l.accName}` :
                            `** no name **`;
        liNode.textContent = textContent + ` (${l.ordinalPosition})`;
        liNode.setAttribute('data-ordinal-position', l.ordinalPosition);
        liNode.setAttribute('data-href', l.href);
        liNode.setAttribute('data-is-internal', l.isInternal);
        liNode.setAttribute('data-is-external', l.isExternal);
        this.ulLinks.appendChild(liNode);
        debug.flag && debug.log(liNode.textContent);
      });
    }
  }
}

window.customElements.define('toc-links-grid', TOCLinksGrid);



