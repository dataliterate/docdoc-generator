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
  , theme = null
  , config = null
  ;

ncp.limit = 3;

function init(_docdoc, _config) {
  docdoc = _docdoc;
  config = _config;
}
module.exports.init = init;

var theme = {
  /**
  * Theme
  * {
    render: function(file, vars, fn)
    options: {
      theme: 'path/to/theme'
      ext: '.ejs'
    }
  }
  */
  init: function(_theme) {
    theme = _theme;
  }
};
module.exports.themeFunctions = theme;

module.exports.prepare = function(cb) {
  // draft:
  // docdoc will copy all templates in the folder docdoc/theme
  // to let people manipulate them easily
  // not sure, when this should happen

  var deferred  = Q.defer();
  console.log('copying theme');
  var clobber = false;
  if(config.theme.reset) {
    console.log('... reloading theme');
    clobber = true;
  }
  ncp(theme.options.theme, docdoc.docdocroot + 'theme', {
    clobber: clobber
  }, function(err){
    if(err) {
      deferred.reject(new Error(err))
      return;
    }
    console.log('copying theme .. done');
    deferred.resolve();
  });
  return deferred.promise;
}

module.exports.render = function(filename, vars, cb) {
  theme.render(docdoc.docdocroot + 'theme/' + filename + theme.options.ext, vars, cb);
}