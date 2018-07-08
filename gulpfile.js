const gulp = require("gulp");
const eslint = require("gulp-eslint");
const mocha = require("gulp-mocha");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

gulp.task("lint", function() {
  const sources = [
    "*.js",
    "src/lib/**",
    "test/*.js"
  ];
  return gulp.src(sources)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task("test", ["lint"], function() {
  var tests = [
    "test/*.js"
  ];
  var srcOpts = {
    read: false
  };
  return gulp.src(tests, srcOpts)
    .pipe(mocha({
      reporter: "list"
    }));
});

gulp.task("build", ["lint"], function() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("lib"));
});

gulp.task("default", ["build"], function() {

});
