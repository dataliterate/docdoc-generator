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

function init(_docroot) {
  docdoc.docroot = docroot = _docroot;
  docdoc.docdocroot = docdocroot = _docroot + '_docdoc/';
  docdoc.siteroot = siteroot = _docroot + '_site/';

  pluginManager.init(docdoc);
  docdoc.plugin = pluginManager.pluginFunctions;

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

  // ready to generate
  docdoc.generate = function() {
    generator.generate(docdoc);
  }
  return docdoc;
}
module.exports.init = init;