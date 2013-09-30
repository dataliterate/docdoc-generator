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
      },
      generator: {
        files:['lib/**/*'],
        tasks:['shell:generate']
      },
    },
    shell: {
      generate: {
        options: {                      // Options
          stdout: true
        },
        command: 'node lib/index.js'
      }
    }
  });

  grunt.registerTask('default', 'build');

  grunt.registerTask('watch:theme', ['regarde:theme']);
  grunt.registerTask('watch:generator', ['regarde:generator']);

};
