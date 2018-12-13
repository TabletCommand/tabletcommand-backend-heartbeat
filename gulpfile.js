const gulp = require("gulp");
const gulpTslint = require("gulp-tslint");
const tslint = require("tslint");
// const mocha = require("gulp-mocha");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

gulp.task("tslint", function tslintTask() {
  const program = tslint.Linter.createProgram("./tsconfig.json");
  const sources = [
    "*.ts",
    "src/**/*.ts"
  ];
  return gulp.src(sources)
    .pipe(gulpTslint({
      formatter: "verbose",
      program: program
    }))
    .pipe(gulpTslint.report());
});

gulp.task("lint", gulp.series("tslint"));

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

gulp.task("build", gulp.series("lint", function buildTask() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("lib"));
}));

gulp.task("default", gulp.series("build", function defaultTask(done) {
  return done();
}));
