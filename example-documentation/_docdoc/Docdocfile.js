/*global module:false*/
module.exports = function(docdoc) {

  docdoc.theme.init(require('docdoc-theme'));

  docdoc.plugin.init({
    name: 'image',
    serves: ['png'],
    generate: function(media, config, context) {
      // @todo should be callback based
      docdoc.plugin.copyMedia(media);
      return '<img src="' + docdoc.plugin.path(media.webpath, config.depth) + '">';
    }
  });

};
