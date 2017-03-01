'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    plumber = require('gulp-plumber'),
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
task('app', function() {
    return gulp.src(['./public/app/app.js', './public/app/**/*.module.js', './public/app/**/*.js'])
        .pipe(plumber())
        .pipe(concat('app.js'))
        .pipe(gulp.dest('./public/src/'));
}).
task('prod', ['app'], function() {
    return gulp.src(['./node_modules/socket.io-client/socket.io.js', './public/*.js', './public/src/app.js'])
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./public/src/'));
});
