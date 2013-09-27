var fs = require('fs')
  , Step = require('step')
  , ncp = require('ncp').ncp
  , rmrf = require('rimraf')
  , yaml = require('js-yaml')
  , ghm = require('github-flavored-markdown')
  , util = require('./utils')
  , tmpl = require('consolidate')
  // --
  , defaults = {
    postLink: "${name}.html"
  };
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
  var config = (util.exists('_config.yml') && yaml.load(fs.readFileSync('_config.yml', 'utf8'))) || {};
  for (var opt in defaults) if (defaults.hasOwnProperty(opt) && !config.hasOwnProperty(opt))
    config[opt] = defaults[opt];
  return config;
}

function ensureDirectories(path) {
  var parts = path.split('/'), cur = '';
  for (var i = 0; i < parts.length - 1; ++i) {
    cur += parts[i] + '/';
    if (!util.exists(cur, true)) fs.mkdirSync(cur);
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
      post.content = ghm.parse(split.main);
      post.url = getURL(config, post);
    }
    posts.push(post);
  });
  return posts;
}

function prepareLayout(err, contentDir, cb) {
  if (err) { return console.error(err); }

  ncp(contentDir + '_theme/_assets', contentDir + '/_site/_assets', function (err) {
    if (err) { return console.error(err); }
    console.log('done!');
    cb();
  });
}

function generate() {

  var contentDir = './example-documentation/';
  Step(
    function() {
      prepareLayout(null, contentDir, this);
    },
    function(err) {
      if (err) { return console.error(err); }
      doGenerate(err, contentDir);
    }
    
  );
}

function doGenerate(err, contentDir) {

  
  var config = readConfig(), posts = readPosts(contentDir, config);
  var ctx = {site: {posts: posts, config: config}};
  
  if (util.exists('_site', true)) rmrf.sync('_site');
  posts.forEach(function(post) {
    if (post.isLink) return;
    var path = '_site/' + post.url;
    ensureDirectories(path);
    fs.writeFileSync(path, getLayout(post.layout || 'post.html', ctx)(post), 'utf8');
  });
  function walkDir(dir) {

    var page = {
      sections: [],
      title: 'Hello World'
    }; 
    fs.readdirSync(dir).forEach(function(fname) {

      /**
      * ignore hidden files (e.g. .DS_Store)
      * and by conventionen: files and directories that start with an _
      */
      if (/^[_\.]/.test(fname)) return;
      var file = dir + fname;
      if (fs.statSync(file).isDirectory()) {
        walkDir(file + '/');
      } else {


        if (/\.md$/.test(fname)) {
          
          // found a markdown file
          var content = fs.readFileSync(file, 'utf8');
          if(hasFrontMatter(file)) {
            var split = readFrontMatter(content);
            content = split.main;
          }
          var doc = {};
          doc.content = ghm.parse(content);
          doc.name = fname.match(/^(.*?)\.[^\.]+$/)[1];
          doc.url = file;
          
          doc.assets = [];

          page.sections.push(doc);
          console.log(out);

          
        } else {
          //util.copyFileSync(file, out);
        }
      }
    });

    // once all files in a folder are processed:


    if(!page.sections.length) {
      console.log("empty");
      return;
    }

    var filepath = dir;
    if(filepath.indexOf(contentDir) == 0) {
      filepath = filepath.substr(contentDir.length);
    }
    
    var out = contentDir + '_site/' + filepath.substring(0, filepath.length - 1) + '.html';
    ensureDirectories(out);

    tmpl.ejs(contentDir + '_theme/layout.ejs', page, function(err, html) {
      if(err) throw err;
      fs.writeFileSync(out, html, 'utf8');
    });

  }
  walkDir(contentDir);
}

module.exports.generate = generate;