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
  <table role="grid">
    <thead>
       <tr>
          <th>Pos</th>
          <th>Name</th>
          <th>URL</th>
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

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.gridData = this.shadowRoot.querySelector("#id-grid-data");
  }

  clearContent (message = '') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.gridData);

     if ((typeof message === 'string') && message.length) {
       const trNode = document.createElement('tr');
       const msgNode =  document.createElement('td');
       msgNode.setAttribute('colspan', 3);
       msgNode.textContent = message;
       trNode.appendChild(msgNode);
       this.gridData.appendChild(trNode);
     }
  }

  updateContent (myResult, containerObj, highlightHandler) {
    debug.flag && debug.log(`[updateContent]`);

    function addRow (pos, name, url) {
      const trNode = document.createElement('tr');

      const posNode =  document.createElement('td');
      posNode.textContent = pos;
      trNode.appendChild(posNode);

      const nameNode =  document.createElement('td');
      nameNode.textContent = name;
      trNode.appendChild(nameNode);

      const urlNode =  document.createElement('td');
      urlNode.textContent = url;
      trNode.appendChild(urlNode);

      return trNode;
    }

    this.clearContent();

    if (myResult.links) {
      let index = 1;
      myResult.links.forEach( (l) => {
        const rowNode = addRow(index, l.accName, l.url);

        rowNode.addEventListener('click', highlightHandler.bind(containerObj));
        rowNode.setAttribute('data-ordinal-position', l.ordinalPosition);
        rowNode.setAttribute('data-href', l.href);
        rowNode.setAttribute('data-is-internal', l.isInternal);
        rowNode.setAttribute('data-is-external', l.isExternal);
        rowNode.setAttribute('data-index', index);

        index += 1;

        this.gridData.appendChild(rowNode);
      });
    }
  }
}

window.customElements.define('toc-links-grid', TOCLinksGrid);



