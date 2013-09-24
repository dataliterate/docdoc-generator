# docdoc

is a tool and work principle designed by precious.

It helps people to document their design process.

We believe in the following principles

A) A documentation is never finished
B) Changes to the documentation are an important part of the documentation
C) We do not only document decision, we also document the reasons
D) The form of a documentation is diverse and not known yet

## System

[Draft]
### Site
Static HTML, plus media files in a robust 2-column layout.

*Interface* Main point, where the documentation is read

### Content (Filesystem under git version control)
"Convetions over configuration"
A bunch of folders, conventions, markdown ane media files

*Interface* Where the documentation is created

### Generator

A Node.js application that creates the Site, by transforming the Content. The
Generator will utilize Themes and Media Plugins.

#### Themes

#### Media Plugins
Think of it as 'OS Xs Quicklook for static websites'

(see Principle D)
A Media Plugin will process files during Site generation and offers HTML,
CSS + JavaScript to display media content in the browser.

- processor (during generation)
- viewer (executed when viewed)

An example
Image a media-plugin called 'PSD-Layersets'  
During Site generation the plugin would render all Layersets of an psd file as
png. When viewing the Site these pngs are presented in a Lightbox-style
slideshow.

#### Command-Line Interface
Think of it as 'grunt-cli'.  
Each docdoc documentation can have its own Generator version. The command line
Interface looks for and executed the 'local' Generator.

## docdoc-generator

The docdoc generator helps to turn a markdown and media files living in the
filessystem into a static website.
Think of it as a 'single-purpose jekyll + media files' written for Node.js