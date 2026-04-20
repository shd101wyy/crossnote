const gulp = require('gulp');
const less = require('gulp-less');
const cleanCss = require('gulp-clean-css');
const path = require('path');
const fs = require('fs');

gulp.task('clean-out', function (cb) {
  // Delete ./out folder
  if (fs.existsSync('./out')) {
    fs.rmSync('./out', { recursive: true });
  }
  cb();
});

gulp.task('compile-less', function (cb) {
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

  // 2. Minify CSS files (not .less) in ./styles
  gulp
    .src(['./styles/**/*.css'])
    .pipe(cleanCss())
    .pipe(gulp.dest('./out/styles'));

  // 3. Copy non-CSS/non-less assets (e.g. images) as binary
  gulp
    .src(['./styles/**/*', '!./styles/**/*.less', '!./styles/**/*.css'], {
      encoding: false,
    })
    .pipe(gulp.dest('./out/styles'));

  cb();
});

// Whenever there is a change in ./styles, run 'compile-less' task
gulp.task('watch-less', function (cb) {
  gulp.watch('./styles/**/*', gulp.series('compile-less'));

  cb();
});

gulp.task('copy-files', function (cb) {
  // Copy ./dependencies to ./out
  // encoding: false prevents Gulp 5 from treating binary files (fonts, etc.) as UTF-8
  gulp
    .src('./dependencies/**/*', { encoding: false })
    .pipe(gulp.dest('./out/dependencies'));

  cb();
});
