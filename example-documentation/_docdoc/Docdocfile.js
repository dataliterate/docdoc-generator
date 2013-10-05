/*global module:false*/
module.exports = function(docdoc) {

  console.log(docdoc);
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
