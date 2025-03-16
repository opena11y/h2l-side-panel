/* toggle.js */

(function () {
  const debug = true;

  debug && console.log(`[toggle.js][onclick]`);

  browser.sidebarAction.isOpen({}).then((result) => {
    console.log(`[result]: ${result}`);
  });

})();
