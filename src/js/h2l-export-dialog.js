/* h2l-export-dialog.js */

/* Imports */
import DebugLogging  from './debug.js';

import {
  setI18nLabels,
  updateContent,
  updateHighlightConfig
} from './utils.js';

import {
  getOptions,
  saveOptions,
  resetExportOptions
} from './storage.js';

/* Constants */


const debug = new DebugLogging('[optionsDialog]', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
<dialog class="h2l-dialog">
  <div class="header">
    <h2 data-i18n="export_dialog_title">ABC</h2>
    <button id="id-cancel-1"
            data-i18n-aria-label="export_dialog_cancel"
            aria-label="Cancel" >✕</button>
  </div>
  <div class="content">

    <fieldset>
      <legend data-i18n="export_dialog_legend_info">
        ABC
      </legend>

        <label class="grid">
            <input type="checkbox"
                   data-group="info"
                   data-option="exportHeadings"/>
          <span class="label"
                data-i18n="export_dialog_label_headings">
          </span>
        </label>

        <label class="grid">
            <input type="checkbox"
                   data-group="info"
                   data-option="exportLandmarks"/>
          <span class="label"
                data-i18n="export_dialog_label_landmarks">
          </span>
        </label>
        <label class="grid">
            <input type="checkbox"
                   data-group="info"
                   data-option="exportLinks"/>
          <span class="label"
                data-i18n="export_dialog_label_links">
          </span>
        </label>

    </fieldset>

    <fieldset>
      <legend data-i18n="export_dialog_legend_filename">
        ABC
      </legend>

      <div class="text">
        <label for="id-filename"
               data-i18n="export_dialog_label_filename">
        </label>
        <input  id="id-filename"
                type="text"
                size="32"
                maxlength="32"
                data-option="exportFilename"
                aria-describedby="id-filename-desc"/>
        <div id="id-filename-desc"
             class="desc"
             data-i18n="export_dialog_desc_filename">
        </div>
      </div>

      <div class="text">
          <label for="id-index"
                data-i18n="export_dialog_label_index">
          </label>
          <input id="id-index"
                 type="number"
                 min="1"
                 size="6"
                 pattern="\d*"
                 data-option="exportIndex"
                aria-describedby="id-index-desc"/>
        <div id="id-index-desc"
             class="desc"
             data-i18n="export_dialog_desc_index">
        </div>
      </div>

    </fieldset>

  </div>

  <div class="buttons">
    <button  class="first"
             id="id-reset-defaults"
             data-i18n="dialog_reset_defaults">
      Def
    </button>
    <button  class="second"
             id="id-cancel-2"
             data-i18n="export_dialog_cancel">
      Can
    </button>
    <button  class="third"
             id="id-export"
             data-i18n="export_dialog_export">
      Ex
    </button>
  </div>
</dialog>
`;

export default class H2LExportDialog extends HTMLElement {
  constructor () {

    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './h2l-dialog.css');
    this.shadowRoot.appendChild(link);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './h2l-focus-styled.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);

    // Add DOM tree from template
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Get references

    this.exportDialog  = this.shadowRoot.querySelector('dialog');

    this.cancelButton1  = this.exportDialog.querySelector('#id-cancel-1');
    this.cancelButton1.addEventListener('click', this.handleCancelButtonClick.bind(this));
    this.cancelButton1.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.contentElem  = this.exportDialog.querySelector('.content');

    this.cancelButton2  = this.exportDialog.querySelector('#id-cancel-2');
    this.cancelButton2.addEventListener('click', this.handleCancelButtonClick.bind(this));
    this.cancelButton2.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.resetDefaultsButton  = this.exportDialog.querySelector('#id-reset-defaults');
    this.resetDefaultsButton.addEventListener('click', () => {
      resetExportOptions().then(this.updateOptions.bind(this));
    });

    this.exportButton  = this.exportDialog.querySelector('#id-export');
    this.exportButton.addEventListener('click', this.handleExportButtonClick.bind(this));
    this.exportButton.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.inputs = Array.from(this.shadowRoot.querySelectorAll('input, button, select'));

    this.inputs.forEach( (input) => {
      input.addEventListener('focus', this.handleInputFocus.bind(this));
      if (input.hasAttribute('data-group')) {
        input.addEventListener('change', this.handleAtLeastOne.bind(this));
      }
    });

    setI18nLabels(this.shadowRoot, debug.flag);

    this.optionControls =  Array.from(this.shadowRoot.querySelectorAll('[data-option]'));
    this.updateOptions();
  }

  openDialog  () {
    this.exportDialog.showModal();
    this.updateOptions();
    this.exportButton.focus();
  }

  updateOptions () {
    const optionControls = this.optionControls;
    const atLeastOne     = this.atLeastOne.bind(this);

    getOptions().then( (options) => {
      optionControls.forEach( input => {
        const option = input.getAttribute('data-option');
        const tagName = input.tagName.toLowerCase();


        if (tagName === 'input') {
          switch (input.type) {
            case 'checkbox':
              input.checked = options[option];
              break;

            case 'text':
            case '':
              input.value = options[option];
              break;

            case 'number':
              input.value = options[option];
              break;

            default:
              break;
          }
        }

        if (tagName === 'select') {
          const selectValues = Array.from(input.querySelectorAll('option'));
          selectValues.forEach( (sv) => {
            sv.selected = sv.value === options[option];
          });
        }
      });
      atLeastOne('info');
    });
  }

  saveOptionsAndCloseDialog (value) {

    const optionControls = this.optionControls;

    const dialog = this.exportDialog;

    getOptions().then( (options) => {

      optionControls.forEach( input => {
        const option = input.getAttribute('data-option');
        const tagName = input.tagName.toLowerCase();

        if (tagName === 'input') {
          switch (input.type) {
            case 'checkbox':
              options[option] = input.checked;
              break;

            case 'text':
            case '':
              options[option] = input.value;
              break;

            case 'number':
              options[option] = input.value;
              break;

            default:
              break;
          }
        }

        if (tagName === 'select') {
          const selectValues = Array.from(input.querySelectorAll('option'));
          selectValues.forEach( (sv) => {
            options[option] = sv.selected ? sv.value : options[option];
          });
        }
      });

      saveOptions(options).then( () => {
        dialog.close(value);
      });
    });
  }

  atLeastOne (groupName) {

    const groupNodes = Array.from(this.shadowRoot.querySelectorAll(`[data-group="${groupName}"`));
    let count = 0;

    groupNodes.forEach( (input) => {
      count += input.checked ? 1 : 0;
    });

    if (count === 1) {
      groupNodes.forEach( (input) => {
        if (input.checked) {
          input.disabled = true;
        }
        else {
          input.disabled = false;
        }
      });
    }
    else {
      groupNodes.forEach( (input) => {
        input.disabled = false;
      });
      if (count === 0) {
        groupNodes[0].checked = true;
      }
    }
  }

  /*
  /   Event handlers
  */

  handleAtLeastOne (event) {
    const tgt = event.currentTarget;
    const groupName = tgt.getAttribute('data-group');
    this.atLeastOne(groupName);
  }

  handleInputFocus (event) {
    const tgt = event.currentTarget;
    this.inputs.forEach( (input) => {
      if (input.tagName === "INPUT") {
        input === tgt ?
                  input.parentNode.classList.add('focus') :
                  input.parentNode.classList.remove('focus');
      }
    });
  }

  handleCancelButtonClick () {
    this.exportDialog.close('cancel');
  }

  handleExportButtonClick () {
    this.saveOptionsAndCloseDialog('export');
  }

  handleKeyDown (event) {

    if ((event.key === "Tab") &&
        !event.altKey &&
        !event.ctlKey &&
        !event.metaKey) {

      if (event.shiftKey &&
          (event.currentTarget === this.cancelButton1)) {
        this.exportButton.focus();
        event.preventDefault();
        event.stopPropagation();
      }

      if (!event.shiftKey &&
          (event.currentTarget === this.exportButton)) {
        this.cancelButton1.focus();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}

window.customElements.define('h2l-export-dialog', H2LExportDialog);
