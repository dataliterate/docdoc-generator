/*global module:false*/
module.exports = function(docdoc) {

  docdoc.registerPlugin({
    name: 'image',
    serves: ['png'],
    generate: function(media, config, context) {
      // @todo should be callback based
        docdoc.copyMedia(media);
      return '<img src="' + docdoc.path(media.webpath, config.depth) + '">';
    }
  });

};
