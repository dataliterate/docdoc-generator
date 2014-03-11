var fs = require('fs')
  , path = require('path')
  , util = require('util')
  // -- npm modules
  , Q = require('q')
  , Step = require('step')
  , slugify = require('slug')
  , _ = require('lodash')
  , ncp = require('ncp').ncp
  , rmrf = require('rimraf')
  , yaml = require('js-yaml')
  , marked = require('marked')
  // -- project requires
  , logger = require('./logger')
  , libutil = require('./utils')
  , PluginManager = require('./plugin-manager.js')
  // -- vars
  , docdoc = null
  , docroot = ''
  , docdocroot = ''
  , siteroot = ''
  , config = {}
  ;

ncp.limit = 3;

/**
* docdoc generator
* --
* heavily inspired by https://github.com/marijnh/heckle
*/

function hasFrontMatter(file) {
  var fd = fs.openSync(file, 'r');
  var b = new Buffer(4);
  var ret = fs.readSync(fd, b, 0, 4, 0) == 4 && b.toString() == '---\n';
  fs.closeSync(fd);
  return ret;
}

function readFrontMatter(file) {
  if (/^---\n/.test(file)) {
    var end = file.search(/\n---\n/);
    if (end != -1) return {front: yaml.load(file.slice(4, end + 1)) || {}, main: file.slice(end + 5)};
  }
  return {front: {}, main: file};
}

function readConfig() {
  var config = (libutil.exists('_config.yml') && yaml.load(fs.readFileSync('_config.yml', 'utf8'))) || {};
  for (var opt in defaults) if (defaults.hasOwnProperty(opt) && !config.hasOwnProperty(opt))
    config[opt] = defaults[opt];
  return config;
}

function readPosts(dir, config) {
  var posts = [];
  fs.readdirSync(dir).forEach(function(file) {
    var d = file.match(/^(\d{4})-(\d\d?)-(\d\d?)-(.+)\.(md|link)$/);
    if (!d) return;
    var split = readFrontMatter(fs.readFileSync('_posts/' + file, 'utf8'));
    var post = split.front;
    post.date = new Date(d[1], d[2] - 1, d[3]);
    post.name = d[4];
    if (!post.tags) post.tags = [];
    if (!post.tags.forEach && post.tags.split) post.tags = post.tags.split(/\s+/);
    if (d[5] == 'md') {
      post.content = marked(split.main);
      post.url = getURL(config, post);
    }
    posts.push(post);
  });
  console.log(posts);
  return posts;
}

function prepareLayout(docroot , cb) {

  logger.info("Preparing layout");
  logger.info('.. Preparing layout: Copying theme assets to site');

  var deferred = Q.defer();

  libutil.ensureDirectories(siteroot + '_assets');
  ncp(docdocroot + 'theme/_assets', siteroot + '_assets', function() {

    logger.info('.. Preparing layout: Copying plugin assets to site');
    PluginManager.prepareLayout(function() {
      logger.info('.. Preparing layout: DONE!');
      deferred.resolve();
    });
  });
  return deferred.promise;
}

function generate(_docdoc, _config) {

  var deferred = Q.defer();

  logger.debug("Start listenting to status logs, to notify via promise");
  
  logger.on('logging', function (transport, level, msg, meta) {
    // [msg] and [meta] have now been logged at [level] to [transport]
    deferred.notify(msg);
  });

  docdoc = _docdoc;
  config = _config;
  docroot = docdoc.docroot;
  docdocroot = docdoc.docdocroot;
  siteroot  = docdoc.siteroot;

  logger.info("Starting generator");
  logger.info("Clearing site directory: %s", siteroot);

  if (libutil.exists(siteroot, true)) rmrf.sync(siteroot);
  libutil.ensureDirectories(siteroot);

  logger.info("... Clearing site directory: DONE!");

  prepareLayout(docroot)
    .then(function() {
      logger.info("Analysing directory structure");
      readTree(docroot)
        .then(function(tree) {
          logger.info(".. Analysing directory structure: DONE!");
          doGenerate(tree)
            .then(function() {
              deferred.resolve();
            });
        });
      }
    )
    .fail(function(err) {
      console.log(err);
      deferred.reject(new Error(err));
    });

    /*
  setTimeout(function() {
    deferred.resolve();
  }, 3000);
  */
  
  return deferred.promise;
}


/**
* Naming conventions
* --
*
* - '_' Underscores are turned to whitespace.
* - Leading Numbers (also dot-separated) will be ignored  
* 
* e.g.
* `01.2 Desktop_Grid-System` becomes 'Desktop Grid-System'
*
* Further Examples
* 
* - `01.1 Grids` => 'Grids'
* - `01.1.1_Fluid_Grid-System` => 'Fluid Grid System'
* - `01 Grids` => 'Grids'
* - `01_Grids` => 'Grids'
*
* *Best practive: Use leading number to maintain the order
* of your content*
*/

var NamingConvetion = new RegExp(/^([0-9]*\.?)*[ |_]/);

function stripLeadingNumbers(name) {
  return name.replace(NamingConvetion, '');
}
function parseName(name) {
  // @todo strip numbers

  return stripLeadingNumbers(name).replace(/_/g, ' ');
}

function parseFilename(name) {
  var name = parseName(name);
  return path.basename(name, path.extname(name));
}


/**
*
* 

tree = [
  {
    path: '01 Grids',
    name: 'Grids',
    webpath: 'Grids/',
    config: {}, // either _config.yml or front-matter
    children: [],
    packets: []
  },
  {
    path: '02 Typography',
    name: 'Grids',
    webpath: 'Grids/',
    config: {},
    children: [],
    packets: [
      {
        path: '00 Typography.md',
        config: {},
        assets: [
          {
            'path': 02 Typography.png
          }
        ]
      },
      {
        path: '02 Pattern Anatonmy.md',
        config: {},
        assets: [
        ]
      }
    ]
  },
]
*
*/

function readTree(docroot ) {
  
  var deferred = Q.defer();

  function walkDir(dir, path, webpath) {
    var data = {
      path: path,
      webpath: webpath,
      children: [],
      content: []
    };
    // first read all folders and its containing files
    fs.readdirSync(dir).forEach(function(filename) {
      if (/^[_\.]/.test(filename)) return;

      if(_.contains(config.ignore, filename)) {
        console.log('............', 'ignoring', filename);
        return;
      }
      var file = dir + filename;
      if (!fs.statSync(file).isDirectory()) {
        // content
        data.content.push(filename);
        return;
      } else {
        // children
        var title = parseName(filename);
        var slug = slugify(title.toLowerCase());
        var path = data.path + filename + '/';
        var webpath = data.webpath + slug + '/';
        var innerData = walkDir(dir + filename + '/', path, webpath);
        var folder = {
          name: filename,
          path: path,
          title: title,
          slug: slug,
          webpath: webpath,
          config: {}, //@todo look for an read _config.yml
          children: innerData.children,
          content: innerData.content
        }
        data.children.push(folder);
      }
    });
    return data;
  }

  function assetsForMdFile(filename, filelist) {
    var assets = [];
    var mdbasename = path.basename(filename, path.extname(filename));
    filelist.forEach(function(name) {
      var basename = path.basename(name, path.extname(name));
      if(mdbasename == basename && name != filename) {
        assets.push(name);
      }
    });
    return assets;
  }

  // next: walk the tree to analyse packets
  function walkTree(data) {
    
    data.children.forEach(function(folder, i) {
      data.children[i] = walkTree(folder);
    });
    
    data.packets = [];
    data.content.forEach(function(filename) {
      
      var extension = path.extname(filename);
      
      if(extension != '.md') {
        return;
      }
      var title = parseFilename(filename);
      var assetsFiles = assetsForMdFile(filename, data.content);
      var assets = [];
      var assetsByExtension = {};
      assetsFiles.forEach(function(filename) {
        var extension = path.extname(filename).replace('\.', '');
        var a = {
          name: filename,
          path: data.path + filename,
          extension: extension,
          webpath: data.webpath + slugify(stripLeadingNumbers(filename).toLowerCase() + '/')
        }
        assets.push(a);

        if(!_.has(assetsByExtension, extension)) {
          assetsByExtension[extension] = [];
        }
        assetsByExtension[extension].push(a);
      });

      var filepath = data.path + filename;
      var content = fs.readFileSync(filepath, 'utf8');
      var config = {};
      if(hasFrontMatter(filepath)) {
        var mattered = readFrontMatter(content);
        console.log(mattered.front);
        config = mattered.front;
        content = mattered.main;
      }
      
      //if(assets.length) {
        var packet = {
          name: filename,
          path: filepath,
          config: config,
          content: content,
          title: title,
          //webpath: data.webpath + '/' + slugify(title.toLowerCase()) + '.html',
          assets: assets,
          assetsByExtension: assetsByExtension
        }
        data.packets.push(packet);
      //}
    });
    delete data.content;
    return data;
  }
  var root = walkDir(docroot , './' + docroot , '');
  root = walkTree(root);

  setTimeout(function() {
    deferred.resolve(root);
  }, 1000);
  

  return deferred.promise;
  
}

/**
* nav

nav = [{
title: 'Grids',
url: 'grids/index.html'
},
{
title: 'Typography',
url: 'typography/index.html',
children: [{
  title: 'Common Erros'
  url: 'typography/common-errors/index.html',
  }]
}
]

*/
function nav(tree) {

}

function renderWithPlugin(media, config, context) {
  var html = PluginManager.generateMedia(media, config, context);
  return html;
}

function renderPacket(def) {
  var content = marked(def.content);

  // dirty: analyse outline level
  var level = -1;
  var result = content.match(/\s*<h([1-6])/);
  if(result) {
    level = result[1];
  }

  var assets = '';
  def.assets.forEach(function(asset) {
    assets += renderWithPlugin(asset, def.config, def);
  });
  return {level: level, content: content, asset: assets}
}

function renderPage(def, nav, parent, depth) {

  logger.status("Rendering %s", def.title);
  var deferred = Q.defer()
  PluginManager.initNewPage();

  var out = siteroot + def.webpath + 'index.html';
  libutil.ensureDirectories(out);

  var sections = [];
  // render packets
  if(def.packets.length) {
    def.packets.forEach(function(packet) {
      packet.config.depth = depth;
      sections.push(renderPacket(packet));
    });
  }

  var page = {
    nav: nav,
    title: def.title,
    webpath: def.webpath,
    sections: sections,
    depth: depth,
    parent: parent,
    pluginAssets: PluginManager.getAssets(depth),
    site: {
      title: config.title,
      version: (config.versionized ? '' : config.version)
    },
    docdoc: {
      path: function(path) {
        var i = 0;
        var s = '';
        while(i < depth) {
          s += '../';
          i++;
        }
        return s + path;
      }
    }
  }; // vars given to template

  docdoc.render('layout', page, function(err, html) {
    if(err) throw err;
    logger.status(".. Rendering %s: DONE!", def.title);
    fs.writeFileSync(out, html, 'utf8');
    deferred.resolve();
  });

  return deferred.promise;
}

function doGenerate(tree) {

  var deferred = Q.defer();
  var nav = tree;

  function walkNode(node, parent, depth) {

    var deferredWalkNode = Q.defer();
    
    renderPage(node, nav, parent, depth)
    .then(function() {
      var childNodes = [];
      node.children.forEach(function(def) {
        childNodes.push(walkNode(def, node, (depth + 1)));
      });
      Q.allSettled(childNodes)
      .then(function() {
        deferredWalkNode.resolve();
      });
    });
    return deferredWalkNode.promise;
  }

  tree.title = config.title;

  walkNode(tree, null, 0)
  .then(function() {
    deferred.resolve();
  });

  return deferred.promise;
}

module.exports.generate = generate;