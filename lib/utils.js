var fs = require("fs");

exports.copyFileSync = function(input, output) {
  var buff = new Buffer(65536), pos = 0;
  var infd = fs.openSync(input, "r"), outfd = fs.openSync(output, "w");
  do {
    var read = fs.readSync(infd, buff, 0, 65536, pos);
    pos += read;
    fs.writeSync(outfd, buff, 0, read);
  } while (read);
  fs.closeSync(infd); fs.closeSync(outfd);
};

var exists = exports.exists = function(file, isDir) {
  try { return fs.statSync(file)[isDir ? "isDirectory" : "isFile"](); }
  catch(e) { return false; }
};

exports.ensureDirectories = function(path) {
  var parts = path.split('/'), cur = '';
  for (var i = 0; i < parts.length - 1; ++i) {
    cur += parts[i] + '/';
    if (!exists(cur, true)) fs.mkdirSync(cur);
  }
}