/*global module:false*/
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-shell');


  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    regarde: {
      theme: {
        files:['example-documentation/_theme/**/*'],
        tasks:['shell:generate']
      }
    },
    shell: {
      generate: {
        command: 'node lib/index.js'
      }
    }
  });

  grunt.registerTask('default', 'build');

  grunt.registerTask('watch:theme', ['regarde']);

};
