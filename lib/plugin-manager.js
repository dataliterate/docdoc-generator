var fs = require('fs')
  , path = require('path')
  , util = require('util')
  // -- npm modules
  , Q = require('q')
  , ncp = require('ncp')

  // -- project requires
  , libutil = require('./utils')

  // -- vars
  , docdoc = null
  , config = null
  , docdocroot = ''
  , docroot = ''
  , siteroot = ''
  , plugins = []
  , pluginsByFiletype = []
  , scripts = []
  , styles = []
  , inlineScripts = []
  , preparationFunctions = []
  ;

function init(_docdoc, _config) {
  docdoc = _docdoc;
  config = _config;
  docroot = docdoc.docroot;
  docdocroot = docdoc.docdocroot;
  siteroot  = docdoc.siteroot;
}
module.exports.init = init;

var plugin = {
  /**
  * Plugin
  * {
  name: 'unique name',
  serves: ['png', 'jpg'],
  generate: function() { return html }
  }
  */
  register: function(plugin) {
    var needsPreparation = plugin.init(this);

    if(needsPreparation) {
      preparationFunctions.push(preparationFunction(plugin));
    }

    plugins.push(plugin);
    plugin.serves.forEach(function(extname) {
      if(!(extname in pluginsByFiletype)) {
        pluginsByFiletype[extname] = [];
      }
      pluginsByFiletype[extname].push(plugin);
    });
  },
  loadNpmPlugin: function() {
    // @todo implement similar to grunts loadNpmTask
    // the idea here is to manage all docdoc asset plugin as separate 
    // npm modules
  },

  registerScripts: function() {
    // @todo plugins can register scripts, that are then included
    // on rendered pages
  },
  registerStyles: function() {
    // @todo dito for style
  },
  registerInlineScripts: function() {
    // @todo dito for inline scripts
  },

  copyMedia: function(media) {
    libutil.copyFileSync(media.path, siteroot + media.webpath);
  },

  path: function(path, depth) {
    var i = 0;
    var s = '';
    while(i < depth) {
      s += '../';
      i++;
    }
    return s + path;
  }
};

var preparationFunction = function(plugin) {

  return function() {
    var deferred = Q.defer();
    // draft:
    // docdoc will copy all templates of this plugin to the folder docdoc/theme/plugins/PLUGIN_NAME
    // to let people manipulate them easily
    console.log('copying plugin theme ' + plugin.name);
    var clobber = false;
    if(config.plugin && config.plugin[plugin.name] && config.plugin[plugin.name].reset) {
      console.log('... reloading plugin theme ' + plugin.name);
      clobber = true;
    }
    var destination = docdoc.docdocroot + 'theme/plugin/' + plugin.name;
    libutil.ensureDirectories(destination)
    ncp(plugin.theme, destination, {
      clobber: clobber
    }, function(err){
      if(err) {
        console.log('copying plugin theme ' + plugin.name + ' .. error');
        deferred.reject(err);
        console.log(err);
        return;
      }
      console.log('copying plugin theme ' + plugin.name + ' .. done');
      deferred.resolve();
    });
  }
}

module.exports.prepare = function(cb) {

  var result = Q();
  preparationFunctions.forEach(function (f) {
    result = result.then(f);
  });
  result.then(cb);

};

module.exports.pluginFunctions = plugin;

function generateMedia(media, config, context) {
  var extname = path.extname(media.path).replace(/\./g, '');
  console.log(extname);
  if(extname in pluginsByFiletype && pluginsByFiletype[extname].length) {
    // currently takes the first plugin that registers for a filetype
    return pluginsByFiletype[extname][0].generate(media, config, context);
  }
  return '# nopluginfound';
}

module.exports.generateMedia = generateMedia;

function initNewPage() {
  // @todo: could be used to maintain included scripts and styles on 
  // a per-page-basis
}

module.exports.initNewPage = initNewPage;