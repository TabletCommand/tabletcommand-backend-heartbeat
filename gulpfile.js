var gulp = require("gulp");
const eslint = require("gulp-eslint");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("lint", function() {
  const sources = [
    "*.js",
    "src/lib/**",
    "src/middleware/*.js",
    "src/routes/*.js",
    "test/*.js"
  ];
  return gulp.src(sources)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task("default", function() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("lib"));
});
