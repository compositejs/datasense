const gulp = require('gulp');
const ts = require("gulp-typescript");
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const paths = {
    pages: ['pages/*.html']
};

/* Functions in pipeline */

function copyHtml() {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'));
}

function buildTs() {
    var tsProject = ts.createProject("src/tsconfig.json");
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(gulp.dest("dist"));
}

function buildTestTs() {
    var tsProject = ts.createProject("test/src/tsconfig.json");
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("test/dist"))
};

/* Tasks */
gulp.task('copyHtml', copyHtml);
gulp.task('build', buildTs);
gulp.task('test', gulp.series(buildTs, buildTestTs));
gulp.task('default', gulp.series(buildTs, buildTestTs));
