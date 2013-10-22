var fs = require('fs')
  // -- npm modules
  , _ = require('lodash')
  , yaml = require('js-yaml')
  // -- project requires
  , libutil = require('./utils')
  , config = {}
  , defaultConfig = {
    title: '',
    versionize: false,
    verion: '0.0.1',
    ignore: []
  }

var defaults = _.partialRight(_.assign, function(a, b) {
  return typeof a == 'undefined' ? b : a;
});

function read(docroot) {


  var filename = docroot + '_config.yml';
  if(!libutil.exists(filename)) {
    config = defaultConfig;
    config.title = docroot;
  } else {
    var contents = fs.readFileSync(filename, 'utf8');
    var data     = yaml.load(contents);

    config = defaults(data, defaultConfig);
  }

  return config;
}

module.exports.read = read;