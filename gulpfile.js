const gulp = require('gulp');
const less = require('gulp-less');
const cleanCss = require('gulp-clean-css');
const path = require('path');

gulp.task('compile-less', function(cb) {
  // 1. Compile all *.less files in ./styles
  gulp
    .src('./styles/**/*.less')
    .pipe(
      less({
        paths: [
          path.join(__dirname, 'styles'),
          path.join(__dirname, 'styles/preview_theme'),
          path.join(__dirname, 'styles/prism_theme'),
        ],
      }),
    )
    .pipe(cleanCss())
    .pipe(gulp.dest('./out/styles'));

  // 2. Copy all files except *.less in ./styles to ./out/styles
  gulp
    .src(['./styles/**/*', '!./styles/**/*.less'])
    .pipe(cleanCss())
    .pipe(gulp.dest('./out/styles'));

  cb();
});

gulp.task('copy-files', function(cb) {
  // Copy ./dependencies to ./out
  gulp.src('./dependencies/**/*').pipe(gulp.dest('./out/dependencies'));

  cb();
});