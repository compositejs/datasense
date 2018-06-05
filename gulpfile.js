var gulp = require("gulp");
var ts = require("gulp-typescript");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var tsProject = ts.createProject("./src/tsconfig.json");
var tsTestProject = ts.createProject("./test/tsconfig.json");

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});

gulp.task("test", function () {
    return tsTestProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});
