 /* storage.js */

/* imports */

import DebugLogging from './debug.js';

/* constants */

const debug = new DebugLogging('storage', false);
debug.flag = false;

const browserRuntime = typeof browser === 'object' ?
                       browser.runtime :
                       chrome.runtime;

const browserStorage = typeof browser === 'object' ?
                       browser.storage.local :
                       chrome.storage.sync;

const defaultOptions = {
  smallAndOffScreenHeadings: false,
  unNamedDuplicateRegions: false,
  internalLinks: true,
  externalLinks: true,
  sameDomainLinks: true
};

function hasAllProperties (refObj, srcObj) {
  for (const key of Object.keys(refObj)) {
    if (!Object.hasOwn(srcObj, key)) {
      return false;
    }
  }
  return true;
}

function isComplete (obj) {
  const numOptions = Object.keys(defaultOptions).length;
  if (Object.keys(obj).length !== numOptions) {
    return false;
  }
  return hasAllProperties(defaultOptions, obj);
}

function addDefaultValues (options) {
  const copy = Object.assign({}, defaultOptions);
  for (let [key, value] of Object.entries(options)) {
    if (Object.hasOwn(copy, key)) {
      copy[key] = value;
    }
  }
  return copy;
}


/*
**  getOptions
*/
export function getOptions () {
  return new Promise (function (resolve) {
    browserStorage.get(function (options) {
      if (notLastError()) {
        if (isComplete(options)) {
          resolve(options);
        }
        else {
          const optionsWithDefaults = addDefaultValues(options);
          saveOptions(optionsWithDefaults);
          resolve(optionsWithDefaults);
        }
      }
    });
  });
}

/*
**  saveOptions
*/
export function saveOptions (options) {
  return new Promise (function (resolve) {
    browserStorage.set(options, function () {
      if (notLastError()) { resolve(); }
    });
  });
}

/*
** resetDefaultOptions
*/
export function resetDefaultOptions () {
  return new Promise (function (resolve) {
    browserStorage.set(defaultOptions, function () {
      if (notLastError()) { resolve(); }
    });
  });
}

/*
**  logOptions
*/
export function logOptions (context, objName, obj) {
  let output = [];
  for (const prop in obj) {
    output.push(`${prop}: '${obj[prop]}'`);
  }
  console.log(`${context} > ${objName} > ${output.join(', ')}`);
}

/*
**  clearStorage: Used for testing
*/
export function clearStorage () {
  browserStorage.clear();
}

// Generic error handler
function notLastError () {
  if (!browserRuntime.lastError) { return true; }
  else {
    console.log(browserRuntime.lastError.message);
    return false;
  }
}

