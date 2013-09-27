# docdoc

is a tool and work principle designed by precious.

It helps people to document their design process.

We believe in the following principles

* (A) A documentation is never finished
* (B) Changes to the documentation are an important part of the documentation
* (C) We do not only document decision, we also document the reasons
* (D) The form of a documentation is diverse and not known yet

## System [Draft]

### Site
Static HTML, plus media files in a robust 2-column layout.

The Site is the main point, where people that are not involved in the creation
process of the documentation read the content.

### Content (Filesystem under git version control)
"Convetions over configuration"  
A bunch of folders, conventions, markdown and media files

This is the place, where the documentation is created. The filesystem offers a
universal interface. People may choose the tools they want to add content,
either if it is 'iA Writer' or 'vim'.

### Generator

A Node.js application that creates the Site, by transforming the Content. The
Generator will utilize Themes and Media Plugins.

#### Themes

#### Media Plugins
Think of it as 'OS Xs Quicklook for static websites'

*see Principle (D)*
A Media Plugin will process files during Site generation and offers HTML,
CSS + JavaScript to display media content in the browser.

- processor (during generation)
- viewer (executed when viewed)

*An example*
Imagine a media-plugin called 'PSD-Layersets'  
During Site generation the plugin would render all Layersets of an psd file as
png. When viewing the Site these pngs are presented in a Lightbox-style
slideshow.

#### Command-Line Interface
Think of it as 'grunt-cli'.

Each docdoc documentation can have its own Generator version. The command line
Interface looks for and executed the 'local' Generator.

----------

# docdoc-generator

The docdoc generator helps to turn a markdown and media files living in the
filessystem into a static website.
Think of it as a 'single-purpose jekyll + media files' written for Node.js

## Creation Guide

### Conventions

#### Structure

##### Hierachy
Each folder appears as menu item in the navigation. Two hierachy levels are
supported.

Example:
```
- [Folder] 01 Grids
-- [Folder] 01.1_Touch_Device_Grid-System
-- [Folder] 01.2 Desktop Grid-System
--- [Folder] 01.2.1 will-be-ignored
- [Folder] 02 Typography
```
The above filesystem structure will lead to the following navigation:

- Grid-System
    - Touch Devices
    - Desktop
- Typography

The hierachy level of the folder `01.2.1 will-be-ignored` is too deep. The
folder and its content will be ignored.

##### Names
The generator will process the file and folder names, when creating the Site.

- _ Underscores are turned to whitespace.  
`01.1_Touch_Device_Grid-System` becomes 'Touch Devices Grid-System' in the navigation
- Leading Numbers (also dot-separated) will be ignored  
`01.2 Desktop Grid-System` becomes 'Desktop Grid-System'

*Use leading number to maintain the order of your content*

##### Pages
All markdown files in one folder will be combined to one page.

Example:
```
- [Folder] 01 Grids
-- [Folder] 01.1 Touch Device Grid-System
-- [Folder] 01.2 Desktop Grid-System
--- [File] 01.2.1 General Information.md
--- [File] 01.2.2 16-column Grids.md
--- [File] 01.2.3 12-column Grids.md
--- [File] 01.2.4 Grid Behavior on Small Screens.md
--- [Folder] 01.3 will-be-ignored
- [Folder] 02 Typography
```

The page `01.2 Desktop Grid-System` contains all information given in the four
markdown files contained in that folder

#### Packets
Media items that should appear in the Site must have a corresponding markdown
file. Both files must have the same filename, with different extensions:

```
- 01 Image Gallery.md
- 01 Image Gallery.mov
```

*Media items that do not have a corresponding markdown file will be ignored*

#### Ignorance
`_notpartofthedocumentation.md`  
Files and Folders starting with an underscore will be ignored and not be part of
the Site

*Best practice: If you have work-in-progress content, that should not be part of
the Site, just prefix the file or foldername with _*

##### Protected Names
The Site will be created in a folder named `_site`. The generator will
create the Site, using a theme placed in a folder named `_theme`.

Each folder might contain a configuration file named `_config.yml`.

*Best practice: Do not name your folders, that contain content of the
documentation _site or  _theme. Never use _config.yml as a filename for content
that should appear in the site*

### Usage
- run 'node lib/index.js'

## Development

### Prerequisites
- [Node.js + npm](http://http://nodejs.org/)
- [grunt](http://http://gruntjs.com/) (for Development Helpers)

### Installation
- run `npm install`

### Development Helpers
- 'grunt watch:theme'  
will run the generator if the content of the _theme folder changes

### Theme Development

see [docdoc-theme](https://github.com/preciousforever/docdoc-theme)

If you are working on the theme, you might want to link the constantly changing
theme directory for the docdoc-theme directory to the example-documentation:  
`ln -s ../docdoc-theme/theme ./example-documentation/_theme`

and then run 'grunt watch:theme'