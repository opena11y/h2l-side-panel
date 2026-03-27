/* h2l-options-dialog.js */

/* Imports */
import DebugLogging  from './debug.js';

import {
  getMessage,
  setI18nLabels,
  updateContent,
  updateHighlightConfig
} from './utils.js';

import {
  getOptions,
  saveOptions,
  resetDefaultOptions
} from './storage.js';

import {
  highlightTemplate,
  exportTemplate,
  aboutTemplate,
  buttonsDefaultsCloseTemplate,
  buttonsDefaultsCloseExportTemplate,
  buttonsInfoCloseTemplate
} from './h2l-dialog-templates.js';

/* Constants */

const URL_ABOUT = 'https://opena11y.github.io/h2l-side-panel';

const browserI18n = typeof browser === 'object' ?
            browser.i18n :
            chrome.i18n;

const debug = new DebugLogging('[optionsDialog]', false);
debug.flag = false;

/* templates */
const dialogTemplate = document.createElement('template');
dialogTemplate.innerHTML = `
<dialog class="h2l-dialog">
  <div class="header">
    <h2 id="title" data-i18n="options_dialog_title">
    </h2>
    <button id="id-close-1"
            data-i18n-aria-label="options_dialog_close"
            aria-label="Close" >✕</button>
  </div>

  <div id="content">
  </div>

  <div id="buttons">
  </div>

</dialog>
`;

class H2LDialog extends HTMLElement {
  constructor (title='no title', contentTemplates=[], buttonTemplate) {

    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    const linkDialog = document.createElement('link');
    linkDialog.setAttribute('rel', 'stylesheet');
    linkDialog.setAttribute('href', './h2l-dialog.css');
    this.shadowRoot.appendChild(linkDialog);

    // Use external CSS stylesheet for focus styling
    const linkFocus = document.createElement('link');
    linkFocus.setAttribute('rel', 'stylesheet');
    linkFocus.setAttribute('href', './h2l-focus-style.css');
    linkFocus.id = 'focus-style';
    this.shadowRoot.appendChild(linkFocus);

    // Add dialog template
    this.shadowRoot.appendChild(dialogTemplate.content.cloneNode(true));
    const contentElem = this.shadowRoot.querySelector('#content');
    const buttonsElem = this.shadowRoot.querySelector('#buttons');

    // Add content templates
    contentTemplates.forEach( (t) => {
      contentElem.appendChild(t.content.cloneNode(true));
    });

    // Add content templates
    if (buttonTemplate) {
      buttonsElem.appendChild(buttonTemplate.content.cloneNode(true));
    }

    // Get references

    this.dialogElem = this.shadowRoot.querySelector('dialog');

    this.h2Title       = this.shadowRoot.querySelector('h2');
    this.h2Title.textContent = title;

    this.closeButton1  = this.shadowRoot.querySelector('#id-close-1');
    this.closeButton1.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton1.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.closeButton2  = this.shadowRoot.querySelector('#id-close-2');
    this.closeButton2.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton2.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.lastButton = this.closeButton2;

    this.resetDefaultsButton  = this.shadowRoot.querySelector('#id-reset-defaults');
    if (this.resetDefaultsButton) {
      this.resetDefaultsButton.addEventListener('click', () => {
        resetDefaultOptions().then(this.updateOptions.bind(this));
      });
    }

    this.exportButton  = this.shadowRoot.querySelector('#id-export');
    if (this.exportButton) {
      this.exportButton.addEventListener('click', this.handleExportButtonClick.bind(this));
      this.exportButton.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.lastButton = this.exportButton;
    }



    setI18nLabels(this.shadowRoot, debug.flag);

    this.inputs = Array.from(this.shadowRoot.querySelectorAll('button, input, select'));

    this.inputs.forEach( (input) => {
      input.addEventListener('focus', this.handleInputFocus.bind(this));
      if (input.hasAttribute('data-group')) {
        input.addEventListener('change', this.handleAtLeastOne.bind(this));
      }
    });

    this.optionControls =  this.dialogElem.querySelectorAll('[data-option]');

  }

  openDialog  () {

    this.updateOptions();
    this.dialogElem.showModal();
    this.closeButton2.focus();
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
    });
  }

  saveOptions () {

    const optionControls = this.optionControls;

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

        if (option == 'highlightStyleSelected') {
          switch (option) {
              case 'solid':
                option['highlightStyle'] = 'dashed';
                break;

              case 'dashed':
              case 'dotted':
                option['highlightStyle'] = 'solid';
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

      updateHighlightConfig(options);
      saveOptions(options);
    });
  }

  atLeastOne (groupName) {
    if (typeof groupName === 'string' || groupName.length) {
      const groupNodes = Array.from(this.dialogElem.querySelectorAll(`[data-group="${groupName}"`));
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
  }


  /*
  /   Event handlers
  */

  handleAtLeastOne (event) {
    const tgt = event.currentTarget;
    const groupName = tgt.getAttribute('data-group');
    if (groupName) {
      this.atLeastOne(groupName);
    }
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

  handleCloseButtonClick () {
    this.saveOptions();
    this.dialogElem.close('close');
    updateContent();
  }

  handleKeyDown (event) {

    if ((event.key === "Tab") &&
        !event.altKey &&
        !event.ctlKey &&
        !event.metaKey) {

      if (event.shiftKey &&
          (event.currentTarget === this.closeButton1)) {
        this.lastButton.focus();
        event.preventDefault();
        event.stopPropagation();
      }

      if (!event.shiftKey &&
          (event.currentTarget === this.lastButton)) {
        this.closeButton1.focus();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}

export class H2LOptionsDialog extends H2LDialog {
  constructor () {
    super(getMessage('options_dialog_title'),
          [highlightTemplate,exportTemplate],
          buttonsDefaultsCloseTemplate);
  }
}

window.customElements.define('h2l-options-dialog', H2LOptionsDialog);

export class H2LExportDialog extends H2LDialog {
  constructor () {
    super(getMessage('export_dialog_title'),
          [exportTemplate],
          buttonsDefaultsCloseExportTemplate);
  }

  handleExportButtonClick () {
    this.saveOptionsAndCloseDialog('export');
  }

  saveOptionsAndCloseDialog (value) {

    const optionControls = this.optionControls;

    const dialogElem = this.dialogElem;

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
        dialogElem.close(value);
      });
    });
  }

}

window.customElements.define('h2l-export-dialog', H2LExportDialog);

export class H2LAboutDialog extends H2LDialog {
  constructor () {
    super(getMessage('export_dialog_title'),
          [aboutTemplate],
          buttonsInfoCloseTemplate);

    this.moreInfo  = this.dialogElem.querySelector('#id-more-info');
    this.moreInfo.addEventListener('click', this.handleMoreInfoButtonClick.bind(this));

  }

  handleMoreInfoButtonClick () {
    window.open(URL_ABOUT);
  }


}

window.customElements.define('h2l-about-dialog', H2LAboutDialog);
