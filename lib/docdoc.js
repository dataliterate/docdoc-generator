var path = require('path')
  // ---
  , generator = require('./generator')
  , pluginManager = require('./plugin-manager')
  // ---
  , docroot = ''
  , docdocroot = ''
  , siteroot = ''
  ;

var docdoc = {};
docdoc.plugin = pluginManager.pluginFunctions;
docdoc.generate = function() {
  generator.generate(docdoc);
}

function init(_docroot) {
  docdoc.docroot = docroot = _docroot;
  docdoc.docdocroot = docdocroot = _docroot + '_docdoc/';
  docdoc.siteroot = siteroot = _docroot + '_site/';

  console.log(docdocroot);
  pluginManager.init(docdoc);

  try {
    // Load taskfile.
    fn = require(path.resolve(docdocroot + '/Docdocfile.js'));
    if (typeof fn === 'function') {
      fn.call(docdoc, docdoc);
    }
  } catch(e) {
    // Something went wrong.
    console.error(e.stack);
    console.error(e);
  }
  return docdoc;
}
module.exports.init = init;