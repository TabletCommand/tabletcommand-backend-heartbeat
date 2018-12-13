const gulp = require("gulp");
const eslint = require("gulp-eslint");
const tslint = require("gulp-tslint");
// const mocha = require("gulp-mocha");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

gulp.task("eslint", function() {
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

gulp.task("tslint", function() {
  const sources = [
    "*.ts",
    "src/**/*.ts"
  ];
  return gulp.src(sources)
    .pipe(tslint({
      formatter: "verbose"
    }))
    .pipe(tslint.report());
});

gulp.task("lint", gulp.series("tslint", function() {
  gulp.series("eslint");
}));

/*
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

*/

gulp.task("build", gulp.series("lint", function() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("lib"));
}));

gulp.task("default", gulp.series("build", function() {

}));
