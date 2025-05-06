/* shortcutInfoDialog.js */

/* Imports */
import DebugLogging  from './debug.js';

import {
  setI18nLabels,
  updateContent
} from './utils.js';

import {
  getOptions,
  saveOptions,
  resetDefaultOptions
} from './storage.js';

/* Constants */
const debug = new DebugLogging('[optionsDialog]', false);
debug.flag = true;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
<dialog class="toc-options">
  <div class="header">
    <h2 data-i18n="options_dialog_title">TOC Options</h2>
    <button id="id-close-1"
            data-i18n-aria-label="options_dialog_close"
            aria-label="Close" >✕</button>
  </div>
  <div class="content">

    <fieldset>
      <legend data-i18n="options_dialog_legend_highlight">
        Highlight/Focus
      </legend>

        <label class="grid">
            <input type="checkbox"
                   data-option="highlightFollowsFocus"/>
          <span class="label"
                data-i18n="options_dialog_label_highlight">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-option="enterKeyMovesFocus"/>
          <span class="label"
                data-i18n="options_dialog_label_focus">
          </span>
        </label>

    </fieldset>

    <fieldset>
      <legend data-i18n="options_dialog_legend_heading">
        Heading and Landmark Filters
      </legend>

        <label class="grid">
            <input type="checkbox"
                   data-option="smallAndOffScreenHeadings"/>
          <span class="label"
                data-i18n="options_dialog_label_small_headings">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-option="unNamedDuplicateRegions"/>
          <span class="label"
                data-i18n="options_dialog_label_un_named">
          </span>
        </label>

    </fieldset>

    <fieldset>
      <legend data-i18n="options_dialog_legend_link">
        Link Filters
      </legend>

        <label class="grid">
          <input type="checkbox"
                 data-option="internalLinks"/>
          <span class="label"
                data-i18n="options_dialog_label_internal_links">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-option="externalLinks"/>
          <span class="label"
                data-i18n="options_dialog_label_external_links">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-option="sameDomainLinks"/>
          <span class="label"
                data-i18n="options_dialog_label_same_domain">
          </span>
        </label>


    </fieldset>
  </div>

  <div class="buttons">
    <button id="id-reset-defaults"
            data-i18n="options_dialog_reset_defaults">
      Reset Defaults
    </button>
    <button id="id-close-2"
             data-i18n="options_dialog_close">
      Close
    </button>
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
    debug.log(`[infoDialog]: ${this.infoDialog}`);

    this.closeButton1  = this.infoDialog.querySelector('#id-close-1');
    this.closeButton1.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton1.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.contentElem  = this.infoDialog.querySelector('.content');

    this.resetDefaultsButton  = this.infoDialog.querySelector('#id-reset-defaults');
    this.resetDefaultsButton.addEventListener('click', () => {
      debug.flag && debug.log(`[handleResetDefaults]`);
      resetDefaultOptions().then(this.updateOptions.bind(this));
    });

    this.closeButton2  = this.infoDialog.querySelector('#id-close-2');
    this.closeButton2.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton2.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.inputs = Array.from(this.shadowRoot.querySelectorAll('input, button'));

    this.inputs.forEach( (input) => {
      debug.log(`added handleInputFocus`);
      input.addEventListener('focus', this.handleInputFocus.bind(this));
    });

    setI18nLabels(this.shadowRoot, debug.flag);

    this.optionControls =  Array.from(this.shadowRoot.querySelectorAll('[data-option]'));
    this.updateOptions();
  }

  updateOptions () {
    const optionControls = this.optionControls;

    getOptions().then( (options) => {
      optionControls.forEach( input => {
        const option = input.getAttribute('data-option');

        switch (input.type) {
          case 'checkbox':
            input.checked = options[option];
            debug && console.log(`[updateOptions][${option}]: ${options[option]} (${input.checked})`);
            break;

          case 'text':
          case '':
            input.value = options[option];
            debug && console.log(`[updateOptions][${option}]: ${options[option]} (${input.value})`);
            break;

          default:
            break;
        }
      });
    });
  }

  saveOptions () {

    const optionControls = this.optionControls;

    getOptions().then( (options) => {

      optionControls.forEach( input => {
        const option = input.getAttribute('data-option');

        switch (input.type) {
          case 'checkbox':
            options[option] = input.checked;
            debug.flag && console.log(`[saveOptions][${option}]: ${options[option]} (${input.checked})`);
            break;

          case 'text':
          case '':
            options[option] = input.value;
            debug.flag && console.log(`[saveOptions][${option}]: ${options[option]} (${input.value})`);
            break;

          default:
            break;
        }
      });

      saveOptions(options);
    });
  }

  /*
  /   Event handlers
  */

  handleInputFocus (event) {
    debug.log(`[handleInputFocus]`);
    const tgt = event.currentTarget;
    this.inputs.forEach( (input) => {
      if (input.tagName === "INPUT") {
        input === tgt ?
                  input.parentNode.classList.add('focus') :
                  input.parentNode.classList.remove('focus');
      }
    });
  }

  handleCloseButtonClick () {
    this.saveOptions();
    this.infoDialog.close();
    updateContent();
  }

  openDialog () {
    this.infoDialog.showModal();
    this.closeButton2.focus();
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
