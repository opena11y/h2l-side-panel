/* h2l-options-dialog.js */

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
  resetDialogOptions
} from './storage.js';

/* Constants */
const debug = new DebugLogging('[optionsDialog]', false);
debug.flag = false;

/* templates */
const template = document.createElement('template');
template.innerHTML = `
<dialog class="h2l-dialog">
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

        <div class="select">
          <label for="id-highlight-size"
                 data-i18n="options_dialog_label_highlight_size">
          </label>
          <select id="id-highlight-size"
                   data-option="highlightSize">
            <option value="small"
                    data-i18n="options_dialog_highlight_size_small">
            </option>
            <option value="medium"
                    data-i18n="options_dialog_highlight_size_medium">
            </option>
            <option value="large"
                    data-i18n="options_dialog_highlight_size_large">
            </option>
            <option value="x-large"
                    data-i18n="options_dialog_highlight_size_x_large">
            </option>
            <option value="xx-large"
                    data-i18n="options_dialog_highlight_size_xx_large">
            </option>
          </select>
        </div>

        <div class="select">
          <label for="id-highlight-style"
                 data-i18n="options_dialog_label_highlight_style">
          </label>
          <select id="id-highlight-style"
                   data-option="highlightStyle">
            <option value="solid"
                    data-i18n="options_dialog_highlight_style_solid">
            </option>
            <option value="dashed"
                    data-i18n="options_dialog_highlight_style_dashed">
            </option>
            <option value="dotted"
                    data-i18n="options_dialog_highlight_style_dotted">
            </option>
          </select>
        </div>

    </fieldset>

    <fieldset>
      <legend data-i18n="options_dialog_legend_landmarks">
        ABC
      </legend>

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
        ABC
      </legend>

        <label class="grid">
          <input type="checkbox"
                 data-group="links"
                 data-option="internalLinks"
                 aria-describedby="id-link-desc"/>
          <span class="label"
                data-i18n="options_dialog_label_internal_links">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-group="links"
                 data-option="sameSubDomainLinks"
                 aria-describedby="id-link-desc"/>
          <span class="label"
                data-i18n="options_dialog_label_same_sub_domain">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-group="links"
                 data-option="sameDomainLinks"
                 aria-describedby="id-link-desc"/>
          <span class="label"
                data-i18n="options_dialog_label_same_domain">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-group="links"
                 data-option="externalLinks"
                 aria-describedby="id-link-desc"/>
          <span class="label"
                data-i18n="options_dialog_label_external_links">
          </span>
        </label>

        <label class="grid">
          <input type="checkbox"
                 data-group="links"
                 data-option="nonHtmlExtensionLinks"
                 aria-describedby="id-link-desc"/>
          <span class="label"
                data-i18n="options_dialog_label_non_html_links">
          </span>
        </label>


        <div class="grid">
          <div></div>
          <div id="id-link-desc"
             class="desc"
             data-i18n="options_dialog_links_desc">
          </div>
        </div>
    </fieldset>
  </div>

  <div class="buttons">
    <button  class="first"
             id="id-reset-defaults"
            data-i18n="dialog_reset_defaults">
      Reset Defaults
    </button>
    <button class="third"
            id="id-close-2"
             data-i18n="options_dialog_close">
      Close
    </button>
  </div>
</dialog>
`;

export default class H2LOptionsDialog extends HTMLElement {
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

    this.infoDialog  = this.shadowRoot.querySelector('dialog');

    this.closeButton1  = this.infoDialog.querySelector('#id-close-1');
    this.closeButton1.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton1.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.contentElem  = this.infoDialog.querySelector('.content');

    this.resetDefaultsButton  = this.infoDialog.querySelector('#id-reset-defaults');
    this.resetDefaultsButton.addEventListener('click', () => {
      resetDialogOptions().then(this.updateOptions.bind(this));
    });

    this.closeButton2  = this.infoDialog.querySelector('#id-close-2');
    this.closeButton2.addEventListener('click', this.handleCloseButtonClick.bind(this));
    this.closeButton2.addEventListener('keydown', this.handleKeyDown.bind(this));

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
    this.infoDialog.showModal();
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
      atLeastOne('links');
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

  handleCloseButtonClick () {
    this.saveOptions();
    this.infoDialog.close();
    updateContent();
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

window.customElements.define('h2l-options-dialog', H2LOptionsDialog);
