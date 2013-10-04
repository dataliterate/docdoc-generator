var fs = require('fs')
  , path = require('path')
  , util = require('util')
  // -- npm modules

  // -- project requires
  , libutil = require('./utils')

  // -- vars
  , docdocroot = ''
  , docroot = ''
  , siteroot = ''
  , plugins = []
  , pluginsByFiletype = []
  , scripts = []
  , styles = []
  , inlineScripts = []
  ;

var docdoc = {
  /**
  * Plugin
  * {
  name: 'unique name',
  serves: ['png', 'jpg'],
  generate: function() { return html }
  }
  */
  registerPlugin: function(plugin) {
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


function init(_docdocroot, _docroot, _siteroot) {
  docdocroot = _docdocroot;
  docroot = _docroot;
  siteroot = _siteroot;
  
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
}

module.exports.init = init;

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