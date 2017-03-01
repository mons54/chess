'use strict';

var gulp = require('gulp'),
    gulpDocs = require('gulp-ngdocs'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css');

gulp.
task('ngdocs', [], function () {
    gulpDocs.sections({
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
task('minify', function() {
    gulp.src([
        './node_modules/socket.io-client/socket.io.js', 
        './public/*.js',
        './public/app/app.js',
        './public/app/**/*.module.js', 
        './public/app/**/*.js'
    ]).
    pipe(concat('app.min.js')).
    pipe(uglify()).
    pipe(gulp.dest('./public/web/js'));

    gulp.src([
        './public/css/material/icon.css', 
        './public/css/style.css'
    ]).
    pipe(concat('app.min.css')).
    pipe(minifyCss()).
    pipe(gulp.dest('./public/web/css'));

    gulp.src([
        './public/css/style-ar.css'
    ]).
    pipe(concat('app-ar.min.css')).
    pipe(minifyCss()).
    pipe(gulp.dest('./public/web/css'));
});
