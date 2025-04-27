/* toc-links-grid.js */

import DebugLogging   from './debug.js';

import {
  highlightOrdinalPosition
} from './toc-sidepanel.js';

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
          <th class="position">Pos</th>
          <th class="name">Name</th>
          <th class="url">URL</th>
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

    this.gridNode = this.shadowRoot.querySelector('[role="grid"]');

    this.gridTbodyNode = this.shadowRoot.querySelector('[role="grid"] tbody');

    this.posWidth  = '40px';
    this.nameWidth = '120px';
    this.urlWidth  = '80px';

  }

  resize (height, width) {
    debug.flag && debug.log(`height: ${height} x ${width}`);

    const tableWidth = width - 10;

    this.gridNode.style.width = tableWidth + 'px';

    const posWidth = 30;
    const remainingWidth = tableWidth - posWidth;

    this.posWidth  = posWidth + 'px';
    this.nameWidth = 0.55 * remainingWidth + 'px';
    this.urlWidth  = 0.35 * remainingWidth + 'px';

    const posNodes = Array.from(this.gridNode.querySelectorAll('.position'));
    posNodes.forEach( (n) => {
      n.style.width = this.posWidth;
    });

    const nameNodes = Array.from(this.gridNode.querySelectorAll('.name'));
    nameNodes.forEach( (n) => {
      n.style.width = this.nameWidth;
    });

    const urlNodes = Array.from(this.gridNode.querySelectorAll('.url'));
    urlNodes.forEach( (n) => {
      n.style.width = this.urlWidth;
    });

    this.gridNode.style.height = height - 20 + 'px';

  }

  clearContent (message = '') {
    debug.flag && debug.log(`[clearContent]: ${message} ${typeof message} ${message.length}`);

     removeChildContent(this.gridTbodyNode);

     if ((typeof message === 'string') && message.length) {
       const trNode = document.createElement('tr');
       const msgNode =  document.createElement('td');
       msgNode.setAttribute('colspan', 3);
       msgNode.textContent = message;
       trNode.appendChild(msgNode);
       trNode.setAttribute('tabindex', '0');
       this.gridTbodyNode.appendChild(trNode);
     }
  }

  updateContent (myResult) {
    debug.flag && debug.log(`[updateContent]`);

    const linksObj = this;

    function addRow (pos, name, ext, url) {
      const trNode = document.createElement('tr');

      const posNode =  document.createElement('td');
      posNode.className = 'position';
      posNode.textContent = pos;
      trNode.appendChild(posNode);
      posNode.style.width = linksObj.posWidth;
      posNode.setAttribute('tabindex', '-1');


      const nameNode =  document.createElement('td');
      nameNode.className = 'name';
      nameNode.textContent = name;
      trNode.appendChild(nameNode);
      nameNode.style.width = linksObj.nameWidth;
      nameNode.setAttribute('tabindex', '-1');

      const urlNode =  document.createElement('td');
      urlNode.className = 'url';
      urlNode.textContent = url;
      trNode.appendChild(urlNode);
      urlNode.style.width = linksObj.urlWidth;
      urlNode.setAttribute('tabindex', '-1');

      return trNode;
    }

    this.clearContent();

    if (myResult.links) {

      const links = Array.from(myResult.links).filter( (l) => {
        return (l.isVisibleOnScreen && l.name.length);
      });

      debug.log(`[links]: ${myResult.links.length} ${links.length}`);

      let index = 1;
      links.forEach( (l) => {
        const rowNode = addRow(index, l.name, l.extension, l.url);

        rowNode.setAttribute('data-ordinal-position', l.ordinalPosition);
        rowNode.setAttribute('data-href', l.href);
        rowNode.setAttribute('data-is-internal', l.isInternal);
        rowNode.setAttribute('data-is-external', l.isExternal);
        rowNode.setAttribute('data-extension', l.extension);
        rowNode.setAttribute('data-url', l.url);
        rowNode.setAttribute('data-index', index);
        rowNode.setAttribute('tabindex', '-1');
        rowNode.addEventListener('click', this.handleGridrowClick.bind(this));
        rowNode.addEventListener('keydown', this.handleGridrowKeydown.bind(this));


        index += 1;

        this.gridTbodyNode.appendChild(rowNode);
      });
    }

    const firstGridrow = this.gridNode.querySelector('[role="grid"] tbody tr');

    if (firstGridrow) {
      this.setFocusToGridrow(firstGridrow);
    }
    else {
      this.clearContent('No links found');
    }


  }

  // Tree keyboard navigation methods

  getGridrows () {
    return Array.from(this.gridNode.querySelectorAll('tbody tr'));
  }

  highlightGridrow(gridrow) {
    const op = gridrow.getAttribute('data-ordinal-position');
    if (op) {
      highlightOrdinalPosition(op);
    }
  }

  setFocusByFirstCharacter(gridrow, char){

    function findChar (gridrow) {
      return char === gridrow.getAttribute('data-first-char');
    }

    const gridrows = this.getgridrows();
    let startIndex = gridrows.indexOf(gridrow) + 1;

    const searchOrder = (startIndex < gridrows.length) ?
                        gridrows.splice(startIndex).concat(gridrows.splice(0, startIndex)) :
                        gridrows;
    const result = searchOrder.find(findChar);
    if (result) {
      this.setFocusToGridrow(result);
    }
  }

  setFocusToFirstGridrow() {
    const gridrows = this.getGridrows();
    if (gridrows[0]) {
      this.setFocusToGridrow(gridrows[0]);
    }
  }

  setFocusToLastGridrow() {
    const gridrows = this.getGridrows();
    if (gridrows.length) {
      this.setFocusToGridrow(gridrows[gridrows.length-1]);
    }
  }

  setFocusToNextGridrow(gridrow) {
    const gridrows = this.getGridrows();
    const index = gridrows.indexOf(gridrow) + 1;
    const nextItem = index < gridrows.length ?
                     gridrows[index] :
                     false;

    if (nextItem) {
      this.setFocusToGridrow(nextItem);
    }
  }

  setFocusToPreviousGridrow(gridrow) {
    const gridrows = this.getGridrows();
    const index = gridrows.indexOf(gridrow) - 1;
    const prevItem = index >= 0 ?
                     gridrows[index] :
                     false;

    if (prevItem) {
      this.setFocusToGridrow(prevItem);
    }
  }

  setFocusToGridrow(gridrow) {
    this.setTabindex(gridrow);
    gridrow.focus();
  }

  setTabindex(gridrow) {
    const gridrows = this.getGridrows();
    gridrows.forEach( (gr) => {
      gr.setAttribute('tabindex', (gr === gridrow) ? 0 : -1);
    });
  }

  // Event handlers


  handleGridrowClick (event) {
    const tgt = event.currentTarget;
    const iconNode = tgt.querySelector('.expand-icon');

    debug.flag && debug.log(`[handlegridrowClick]: ${tgt.tagName}`);

    // if clicked on expand icon in the treeview then do not process event
    if (!iconNode ||
        (iconNode && (iconNode !== event.target)) ||
        (iconNode && !iconNode.contains(event.target))) {
      this.setFocusToGridrow(tgt);
      this.highlightGridrow(tgt);
      event.stopPropagation();
      event.preventDefault();
    }
  }

 handleGridrowKeydown(event) {
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

    switch (key) {
      case 'Enter':
      case ' ':
        this.highlightGridrow(tgt);
        flag = true;
        break;

      case 'ArrowUp':
        this.setFocusToPreviousGridrow(tgt);
        flag = true;
        break;

      case 'ArrowDown':
        this.setFocusToNextGridrow(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        flag = true;
        break;

      case 'ArrowLeft':
        flag = true;
        break;

      case 'Home':
        this.setFocusToFirstGridrow();
        flag = true;
        break;

      case 'End':
        this.setFocusToLastGridrow();
        flag = true;
        break;

      default:
        if (isPrintableCharacter(key)) {
          this.setFocusByFirstCharacter(tgt, key);
          flag = true;
        }
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }


}

window.customElements.define('toc-links-grid', TOCLinksGrid);



