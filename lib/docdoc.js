var path = require('path')
  // ---
  , Q = require('q')
  // ---
  // , logger = require('./logger')
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

  var deferredInitialization = Q.defer();

  docdoc.docroot = docroot = _docroot;

  // read config
  config = configManager.read(docdoc.docroot);

  docdoc.docdocroot = docdocroot = _docroot + '_docdoc/';

  siteroot = _docroot + '_site/';
  if(config.versionize) {
    siteroot = siteroot + 'v' + config.version + '/';
  }
  docdoc.siteroot = siteroot;

  pluginManager.init(docdoc, config);
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

  Q.all([
    theme.prepare(),
    pluginManager.prepare()
  ])
  .then(function() {
    docdoc.render = theme.render;
    // ready to generate
    docdoc.generate = function() {
      return generator.generate(docdoc, config);
    };
    console.log("RETURNING DOCOD");
    deferredInitialization.resolve(docdoc);
  })
  .fail(function(err) {
    console.log("PLUGIN MANAGER PREPARATION FAILS:");
    deferredInitialization.reject(new Error(err));
  });

  return deferredInitialization.promise;

}
module.exports.init = init;