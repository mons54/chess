'use strict';

var gulp = require('gulp');

gulp.task('ngdocs', [], function () {
    var gulpDocs = require('gulp-ngdocs');

    return gulpDocs.sections({
        api: {
            glob:'./public/app/**/*.js',
            api: true,
            title: 'API Documentation'
        },
    })
    .pipe(gulpDocs.process({
        title: "Chess Game",
        navTemplate: './public/ngdocs/nav.html'
    }))
    .pipe(gulp.dest('./public/docs'));
});
