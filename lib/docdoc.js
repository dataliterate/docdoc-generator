var path = require('path')
  // ---
  , configManager = require('./config')
  , generator = require('./generator')
  , pluginManager = require('./plugin-manager')
  , theme = require('./theme')
  // ---
  , docroot = ''
  , docdocroot = ''
  , siteroot = ''
  ;

var docdoc = {};



function init(_docroot, cb) {
  docdoc.docroot = docroot = _docroot;

  // read config
  config = configManager.read(docdoc.docroot);

  docdoc.docdocroot = docdocroot = _docroot + '_docdoc/';

  siteroot = _docroot + '_site/';
  if(config.versionize) {
    siteroot = siteroot + 'v' + config.version + '/';
  }
  docdoc.siteroot = siteroot;

  pluginManager.init(docdoc);
  docdoc.plugin = pluginManager.pluginFunctions;

  theme.init(docdoc, config);
  docdoc.theme = theme.themeFunctions;

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

  theme.prepare(function() {
    docdoc.render = theme.render;
    // ready to generate
    docdoc.generate = function() {
      generator.generate(docdoc, config);
    };
    cb(docdoc);
  })

}
module.exports.init = init;