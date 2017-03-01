'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

gulp.
task('ngdocs', [], function () {
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
}).
task('prod', function() {
    return gulp.src([
        './node_modules/socket.io-client/socket.io.js', 
        './public/*.js',
        './public/app/app.js',
        './public/app/**/*.module.js', 
        './public/app/**/*.js'
    ]).
    pipe(concat('app.min.js')).
    pipe(uglify()).
    pipe(gulp.dest('./public/web/js'));
});
