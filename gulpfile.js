const gulp = require("gulp");
const shell = require("gulp-shell")
const mocha = require("gulp-mocha");
const del = require("del");

gulp.task("clean", function cleanTask() {
  return del([
    "build/**",
    "definitions/**"
  ], {
    force: true
  });
});

gulp.task("ts", gulp.series("clean", shell.task("tsc -p .\\/src")));

gulp.task("lint", gulp.series(shell.task("eslint .\\/src")));

gulp.task("test", gulp.series("lint", function testTask() {
  const tests = [
    "test/*.js"
  ];
  const srcOpts = {
    read: false
  };
  return gulp.src(tests, srcOpts)
    .pipe(mocha({
      reporter: "list"
    }));
}));

gulp.task("watch", gulp.series("clean", shell.task("tsc -p .\\/src --watch")));

gulp.task("build", gulp.series("lint", "ts"));

gulp.task("default", gulp.series("test"));
