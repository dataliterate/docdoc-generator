var fs = require('fs')
  , path = require('path')
  , util = require('util')
  // -- npm modules
  , Step = require('step')
  , slugify = require ('slug')
  , ncp = require('ncp').ncp
  , rmrf = require('rimraf')
  , yaml = require('js-yaml')
  , marked = require('marked')
  // -- project requires
  , libutil = require('./utils')
  , PluginManager = require('./plugin-manager.js')
  // -- vars
  , docdoc = null
  , docroot = ''
  , docdocroot = ''
  , siteroot = ''
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

function ensureDirectories(path) {
  var parts = path.split('/'), cur = '';
  for (var i = 0; i < parts.length - 1; ++i) {
    cur += parts[i] + '/';
    if (!libutil.exists(cur, true)) fs.mkdirSync(cur);
  }
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

function prepareLayout(err, docroot , cb) {
  if (err) { return console.error(err); }

  console.log('preparing layout:');
  ncp(docdocroot  + 'theme/_assets', siteroot + '_assets', function (err) {
    if (err) { return console.error(err); }
    console.log('preparing layout: .. done!');
    cb();
  });
}


function generate(_docdoc) {

  docdoc = _docdoc;
  docroot = docdoc.docroot;
  docdocroot = docdoc.docdocroot;
  siteroot  = docdoc.siteroot;

  console.log("Generate");
  console.log("========");

  console.log("Clear site: ");
  if (libutil.exists(siteroot, true)) rmrf.sync(siteroot);
  ensureDirectories(siteroot);
  console.log(".. done");

  Step(
    function() {
      prepareLayout(null, docroot , this);
    },
    function(err) {
      if (err) { return console.error(err); }
      return readTree(docroot );
    },
    function(err, tree) {
      if (err) { return console.error(err); }
      doGenerate(err, tree);
    }
    
  );
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
  console.log("READ TREE");
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
      console.log(filename);
      var extension = path.extname(filename);
      console.log(filename, extension);
      if(extension != '.md') {
        return;
      }
      var title = parseFilename(filename);
      var assetsFiles = assetsForMdFile(filename, data.content);
      var assets = [];
      assetsFiles.forEach(function(filename) {
        var a = {
          name: filename,
          path: data.path + filename,
          webpath: data.webpath + slugify(stripLeadingNumbers(filename).toLowerCase() + '/')
        }
        assets.push(a);
      });

      var filepath = data.path + filename;
      var content = fs.readFileSync(filepath, 'utf8');
      var config = {};
      if(hasFrontMatter(filepath)) {
        var mattered = readFrontMatter(content);
        config = readFrontMatter(content).front;
        content = readFrontMatter(content).main;
      }
      
      var packet = {
        name: filename,
        path: filepath,
        config: config,
        content: content,
        title: title,
        //webpath: data.webpath + '/' + slugify(title.toLowerCase()) + '.html',
        assets: assets
      }
      data.packets.push(packet);
    });
    delete data.content;
    return data;
  }
  var root = walkDir(docroot , './' + docroot , '');
  root = walkTree(root);

  console.log('------');
  //console.log(util.inspect(root, {depth: 6}));
  //console.log(root.children[1].packets)
  return root;
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
  var assets = '';
  def.assets.forEach(function(asset) {
    assets += renderWithPlugin(asset, def.config, def);
  });
  return {content: content, asset: assets}
}

function renderPage(def, nav, depth) {
  var out = siteroot + def.webpath + 'index.html';
  ensureDirectories(out);

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
    sections: sections,
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
    console.log("rendered " + out);
    fs.writeFileSync(out, html, 'utf8');
  });
}


function doGenerate(err, tree) {

  tree.title = 'docdoc';
  var nav = tree;

  function walkNode(node, depth) {
    renderPage(node, nav, depth);
    node.children.forEach(function(def, i) {
      walkNode(def, (depth + 1));
    });
  }
  walkNode(tree, 0);

}

module.exports.generate = generate;