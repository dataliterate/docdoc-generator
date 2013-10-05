var fs = require('fs')
  , path = require('path')
  , util = require('util')
  // -- npm modules

  // -- project requires
  , libutil = require('./utils')

  // -- vars
  , docdoc = null
  , docdocroot = ''
  , docroot = ''
  , siteroot = ''
  , plugins = []
  , pluginsByFiletype = []
  , scripts = []
  , styles = []
  , inlineScripts = []
  ;

function init(_docdoc) {
  docdoc = _docdoc;
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
  init: function(plugin) {
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