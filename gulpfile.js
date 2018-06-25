var gulp = require('gulp');
var ts = require("gulp-typescript");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var paths = {
    pages: ['pages/*.html']
};

gulp.task('copyHtml', function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'));
});

function buildTs() {
    var tsProject = ts.createProject("src/tsconfig.json");
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(gulp.dest("dist"));
};

function buildTestTs() {
    var tsProject = ts.createProject("test/src/tsconfig.json");
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("test/dist"))
};

gulp.task('build', function () {
    return buildTs();
});

gulp.task('test', ['build'], function () {
    return buildTestTs(true);
});

gulp.task('default', ['test']);
