var gulp = require('gulp');
var ts = require("gulp-typescript");
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var paths = {
    pages: ['pages/*.html']
};

gulp.task('copyHtml', function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'));
});

function buildTs(test, folder, bundleFileName) {
    var p = browserify({
        basedir: './' + (folder || (test ? "test" : "src")),
        debug: true,
        entries: ['main.ts'],
        cache: {},
        packageCache: {}
    })
    .plugin(tsify)
    .transform('babelify', {
        presets: ['es2015'],
        extensions: ['.ts']
    })
    .bundle();
    if (!test) return p
    .pipe(source(bundleFileName || 'index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
    else return p
    .pipe(source(bundleFileName || 'bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('../test'));
};

function buildTs2() {
    var tsProject = ts.createProject("src/tsconfig.json");
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
};

gulp.task('test', function () {
    return buildTs(true);
});

gulp.task('default', function () {
    return buildTs();
});
