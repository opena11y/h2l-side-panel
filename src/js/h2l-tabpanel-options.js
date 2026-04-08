/* h2l-tabpanel-options.js */

/* Imports */
import DebugLogging  from './debug.js';


import {
  updateContent,
  updateHighlightConfig
} from './utils.js';

import {
  getOptions,
  saveOptions,
} from './storage.js';

/* Constants */
const debug = new DebugLogging('[optionsTabpanel]', false);
debug.flag = false;


export class TabpanelOptions {

  constructor(node) {

    this.inputs = Array.from(node.querySelectorAll('input'));

    this.inputs.forEach( (input) => {
      input.addEventListener('focus',   this.handleInputFocus.bind(this));
      input.addEventListener('blur',    this.handleInputBlur.bind(this));
      input.addEventListener('change',  this.saveOptions.bind(this));
    });

    this.updateOptions();
  }

  updateOptions () {

    const inputs = this.inputs;

    getOptions().then( (options) => {
      inputs.forEach( input => {
        const option = input.getAttribute('data-option');

        switch (input.type) {
          case 'checkbox':
            input.checked = options[option];
            break;

          default:
            break;
        }
      });
    });
  }

  saveOptions () {
    debug.log(`saveOptions`);
    const inputs = this.inputs;

    getOptions().then( (options) => {

      inputs.forEach( input => {
        const option = input.getAttribute('data-option');

        switch (input.type) {
          case 'checkbox':
            options[option] = input.checked;
            break;

          default:
            break;
        }

      });
      saveOptions(options).then( () => {
        updateContent();
      });
    });
  }

  /*
  /   Event handlers
  */

  handleInputFocus (event) {
    event.currentTarget.parentNode.classList.add('focus');
  }

  handleInputBlur (event) {
    event.currentTarget.parentNode.classList.remove('focus');
  }

}

