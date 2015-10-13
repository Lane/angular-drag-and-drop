gulp              = require 'gulp'
plumber           = require 'gulp-plumber'
coffee            = require 'gulp-coffee'
concat            = require 'gulp-concat'
less              = require 'gulp-less'
autoprefixer      = require 'gulp-autoprefixer'
gutil             = require 'gulp-util'
browserSync       = require 'browser-sync'

config =
  source:
    coffee: "./src/app/angular-drag-and-drop.coffee"
    exampleCoffee: "./src/app/sample-app.coffee"
    less: "./src/less/**/*.less"
    html: "./src/**/*.html"
    vendor: "./src/vendor/**/*.min.js"
  target: "./build"
  demo: "./examples"

log =
  info: (path, type) ->
    console.log "\nFile #{path} was #{type}, running tasks...\n"
  error: (err) ->
    gutil.log err.toString()
    this.emit 'end'

gulp.task "less", ->

  gulp.src config.source.less
    .pipe less()
    .pipe autoprefixer "browsers": [
      'last 2 version'
      '> 1%'
      'ie >= 8'
      'opera 12.1'
      'bb 10'
      'android 4'
    ]
    .pipe gulp.dest "#{config.target}/css"

gulp.task "coffee", ->

  gulp.src config.source.coffee
    .pipe coffee bare: true
    .pipe concat "angular-drag-and-drop.js"
    .pipe gulp.dest "#{config.target}/js"

gulp.task "example-coffee", ->

  gulp.src config.source.exampleCoffee
    .pipe coffee bare: true
    .pipe concat "sample-app.js"
    .pipe gulp.dest "#{config.demo}/js"

gulp.task "vendor", ->

  gulp.src config.source.vendor
    .pipe gulp.dest "#{config.demo}/vendor"

gulp.task "html", ->

  gulp.src config.source.html
    .pipe gulp.dest config.demo + "/"

gulp.task "watch", ->
  gulp.watch config.source.less, ["less"]
  gulp.watch config.source.coffee, ["coffee"]
  gulp.watch config.source.html, ["html"]

gulp.task "browser-sync", ->
  browserSync.init [
    config.source.less
    config.source.coffee
    config.source.html
    config.source.exampleCoffee
  ],
    server:
      baseDir: './'
      directory: true
      index: './examples/index.html'
    notify: true
    open: true
    ui:
      enabled: true

gulp.task "default", [
  "less", "coffee", "example-coffee", "vendor", "html", "watch", "browser-sync"
]
