const gulp         = require('gulp');
const exec         = require('child_process').exec;
const rollup       = require('rollup');
const {src, dest, task}  = require('gulp');
const {parallel, series}   = require('gulp');
const eslint       = require('gulp-eslint');
const minify       = require("gulp-minify");
const concat       = require("gulp-concat");
const sass         = require('gulp-dart-sass');
 
gulp.task('linting', () => {
    return src(['src/*.js'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

// Update extension common code

 gulp.task('extensionsCode', () => {
  return src([
    'src/js/*.js',
    'src/*.html',
  ])
    .pipe(dest('extension-chrome'))
    .pipe(dest('extension-edge'))
    .pipe(dest('extension-opera'))
    .pipe(dest('extension-firefox'));
});

gulp.task('extensionsLocales', () => {
  return src([
    'src/_locales/en/*.json',
  ])
    .pipe(dest('extension-chrome/_locales/en'))
    .pipe(dest('extension-edge/_locales/en'))
    .pipe(dest('extension-opera/_locales/en'))
    .pipe(dest('extension-firefox/_locales/en'));
});

gulp.task('style', function () {
  return gulp.src('./src/scss/*.scss')
  .pipe(sass().on('error', sass.logError))
    .pipe(dest('extension-chrome'))
    .pipe(dest('extension-edge'))
    .pipe(dest('extension-opera'))
    .pipe(dest('extension-firefox'));
});


gulp.task('documentation', function (cb) {
  exec('node ./gen-documentation.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);  });
})

gulp.task('documentationStyle', function () {
  return gulp.src('./src-docs/templates/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(gulp.dest('./docs/css'));
});

const linting            = task('linting');
const extensionsCode     = task('extensionsCode');
const extensionsLocales  = task('extensionsLocales');
const style              = task('style');

const documentation      = task('documentation');
const documentationStyle = task('documentationStyle');

exports.default = series(
  linting,
  parallel(extensionsCode, extensionsLocales, style),
  parallel(documentation,documentationStyle));
