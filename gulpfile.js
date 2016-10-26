'use strict';

var gulp = require('gulp');

gulp.task('ngdocs', [], function () {
    var gulpDocs = require('gulp-ngdocs');
    return gulp.src('./public/app/**/*.js')
        .pipe(gulpDocs.process({
            html5Mode: false
        }))
        .pipe(gulp.dest('./public/docs'));
});
