/* shortcutInfoDialog.js */

/* Imports */
import DebugLogging  from './debug.js';

/* Constants */
const debug = new DebugLogging('[optionsDialog]', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
<dialog id="skip-to-info-dialog" open="">
  <div class="header">
    <h2>Shortcut Information</h2>
    <button id="id-close-1" aria-label="Close">✕</button>
  </div>
  <div class="content">
    <p>Some Content...</p>
  </div>
  <div class="buttons">
    <button id="id-more-info">More Information</button>
    <button id="id-close-2">Close</button>
  </div>
</dialog>
`;

export default class TOCOptionsDialog extends HTMLElement {
  constructor () {

    super();
    this.attachShadow({ mode: 'open' });

    debug.flag && debug.log(`loading TOCLinksGrid...`);

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './toc-options-dialog.css');
    this.shadowRoot.appendChild(link);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Get references

    this.infoDialog  = this.shadowRoot.querySelector('dialog');

    this.closeButton1  = this.infoDialog.querySelector('#id-close-1');
    this.closeButton1.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton1.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.contentElem  = this.infoDialog.querySelector('.content');

    this.moreInfoButton  = this.infoDialog.querySelector('#id-more-info');
    this.moreInfoButton.addEventListener('click', this.handleMoreInfoClick.bind(this));

    this.closeButton2  = this.infoDialog.querySelector('#id-close-2');

    this.closeButton2.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton2.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.moreInfoURL = 'http://dres.illinois.edu';

  }

  handleCloseButtonClick () {
    this.infoDialog.close();
  }

  openDialog () {
    this.infoDialog.showModal();
    this.closeButton2.focus();
  }

  handleMoreInfoClick () {
    if (this.moreInfoURL) {
      window.open(this.moreInfoURL, '_blank').focus();
    }
  }

  handleKeyDown (event) {

    if ((event.key === "Tab") &&
        !event.altKey &&
        !event.ctlKey &&
        !event.metaKey) {

      if (event.shiftKey &&
          (event.currentTarget === this.closeButton1)) {
        this.closeButton2.focus();
        event.preventDefault();
        event.stopPropagation();
      }

      if (!event.shiftKey &&
          (event.currentTarget === this.closeButton2)) {
        this.closeButton1.focus();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}

window.customElements.define('toc-options-dialog', TOCOptionsDialog);
