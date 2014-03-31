var fs = require('fs')
  , path = require('path')
  , util = require('util')
  // -- npm modules
  , _ = require('lodash')
  , Q = require('q')
  , ncp = require('ncp')

  // -- project requires
  , logger = require('./logger')
  , libutil = require('./utils')

  // -- vars
  , docdoc = null
  , config = null
  , docdocroot = ''
  , docroot = ''
  , siteroot = ''
  , plugins = []
  , pluginsByFiletype = []
  , pageContext = {}
  , packetContext = {}
  , scripts = []
  , styles = []
  , inlineScripts = []
  , preparationFunctions = []
  , prepareLayoutFunctions = []
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
    
    var pluginContext = new PluginContext(plugin);

    plugins.push(pluginContext);
    pluginContext.plugin.serves.forEach(function(extname) {
      if(!(extname in pluginsByFiletype)) {
        pluginsByFiletype[extname] = [];
      }
      pluginsByFiletype[extname].push(pluginContext);
    });
  }
}
var PluginContext = function(plugin) {
  this.plugin = plugin;
  var needsPreparation = plugin.init(this);
  if(needsPreparation) {
    preparationFunctions.push(preparationFunction(plugin));
  }
  this.init();

}

var relativePath = function(path, depth) {
  var i = 0;
  var s = '';
  while(i < depth) {
    s += '../';
    i++;
  }
  return s + path;
}

PluginContext.prototype = {

  init: function() {
    this.name = this.plugin.name;
    this.assets = '_assets/plugin/' + this.name + '/';
  },

  generate: function(media, config, context) {

    var pluginConfig = {};
    if(_.has(config, 'plugin') && _.has(config.plugin, this.name)) {
      pluginConfig = config.plugin[this.name];
    }
    
    var html = '<div class="plugin-' + this.name + '">';
    html += this.plugin.generate(media, config, pluginConfig, context);
    html += '</div>';
    return html;
  },
  registerScript: function(path) {
    // @todo plugins can register scripts, that are then included
    // on rendered pages
    logger.verbose("Plugin %s: adds script: %s", this.name, path);
    
    scripts.push(this.assets + path);
  },
  registerStyle: function(path) {
    // @todo dito for style
    logger.verbose("Plugin %s: adds stylesheet: %s", this.name, path);
    styles.push(this.assets + path);
  },
  registerInlineScripts: function() {
    // @todo dito for inline scripts
  },
  getPageContextVar: function(name, defaultValue) {
    if(_.has(pageContext, name)) {
      return pageContext[name];
    }
    return defaultValue;
  },
  setPageContextVar: function(name, value) {
    logger.info("Plugin %s: pageContext: %s set to: %s", this.name, name, value);
    pageContext[name] = value;
  },
  getPacketContextVar: function(name, defaultValue) {
    if(_.has(packetContext, name)) {
      return packetContext[name];
    }
    return defaultValue;
  },
  setPacketContextVar: function(name, value) {
    logger.info("Plugin %s: packetContext: %s set to: %s", this.name, name, value);
    packetContext[name] = value;
  },
  copyMedia: function(media) {
    libutil.copyFileSync(media.path, siteroot + media.webpath);
  },
  writeMediaFile: function(data, path) {
    fs.writeFileSync(siteroot + path, data);
  },
  path: relativePath
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
        deferred.reject(new Error(err));
        return;
      }
      console.log('copying plugin theme ' + plugin.name + ' .. done');

      ///
      prepareLayoutFunctions.push(function() {
        logger.info('.. Preparing layout: plugin %s', plugin.name);

        var siteDestination = docdoc.siteroot + '_assets/plugin/' + plugin.name + '/';
        var pd = Q.defer();
        libutil.ensureDirectories(siteDestination);
        ncp(destination + '/_assets', siteDestination, {
          clobber: true
        }, function(err) {
          if(err) {
            logger.error('.. Preparing layout: plugin %s, Error: %s', plugin.name, err);
            pd.reject(err);
            return;
          }
          pd.resolve();
        });
      });
      deferred.resolve();
    });
    return deferred.promise;
  }
}

module.exports.pluginFunctions = plugin;

var prepareLayout = function(cb) {

  var result = Q();
  prepareLayoutFunctions.forEach(function (f) {
    result = result.then(f);
  });
  result.then(cb);
  result.fail(function(err) {
    console.log(err);
  });

};
module.exports.prepareLayout = prepareLayout;

var prepare = function() {

  var result = Q();
  preparationFunctions.forEach(function (f) {
    result = result.then(f);
  });
  result.then(function() {
    console.log(" all prepared");
  });
  
  return result;

};
module.exports.prepare = prepare;

function generateMedia(media, config, context) {

  console.log(config);

  var extname = path.extname(media.path).replace(/\./g, '');
  if(extname in pluginsByFiletype && pluginsByFiletype[extname].length) {
    // currently takes the first plugin that registers for a filetype
    return pluginsByFiletype[extname][0].generate(media, config, context);
  }
  return ''; //# nopluginfound';
}

module.exports.generateMedia = generateMedia;

function initNewPage() {
  // @todo: could be used to maintain included scripts and styles on 
  // a per-page-basis
  styles = [];
  scripts = [];
  pageContext = {};
}

module.exports.initNewPage = initNewPage;

function initNewPacket() {
  packetContext = {};
};

module.exports.initNewPacket = initNewPacket;

function getAssets(depth) {
  // @todo: return styles
  var html = '';
  styles = _.unique(styles);
  styles.forEach(function(style) {
    html += '<link rel="stylesheet" href="' + relativePath(style, depth) + '" type="text/css">';
  });

  scripts = _.unique(scripts);
  scripts.forEach(function(script) {
    html += '<script src="' + relativePath(script, depth) + '"></script>';
  });
  return html;
}

module.exports.getAssets = getAssets;