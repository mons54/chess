(function () {
    
    'use strict';

    angular.

    /**
     * @ngdoc overview
     * @name app
     * @description
     * App module.
     * @requires ngRoute
     * @requires ngCookies
     * @requires easypiechart
     * @requires pascalprecht.translate
     * @requires components
     * @requires game
     * @requires home
     * @requires ranking
     * @requires trophies
     */
    module('app', [
        'ngRoute',
        'ngCookies',
        'easypiechart',
        'pascalprecht.translate',
        'global',
        'facebook',
        'google',
        'components',
        'game',
        'home',
        'ranking',
        'trophies'
    ]).

    run(['$rootScope', '$route', '$http', '$location', 'socket', 'modal', 'facebook', 'google',

        /**
         * @param {object} $rootScope Global scope
         * @param {object} $route Service route
         * @param {object} $http Service http
         * @param {object} $location Service location
         * @param {object} socket Socket service
         * @param {object} modal Modal service
         * @param {object} facebook Facebook service
         * @param {object} google Google service
         */
        function ($rootScope, $route, $http, $location, socket, modal, facebook, google) {

            $rootScope.$on('$routeChangeStart', function() {
                /**
                 * Check if the user has a game in progress.
                 */
                if ($rootScope.user && $rootScope.user.gid) {
                    /**
                     * If the user has a game in progress redirect to this game
                     */
                    redirectToGame();
                }
            });

            $rootScope.$on('$routeChangeSuccess', function() {
                /**
                 * Set the title of the page.
                 */
                $rootScope.title = $route.current.title;
            });

            /**
             * Close mobile menu.
             */
            $rootScope.closeDrawer = function () {
                var drawer = angular.element('.mdl-layout__drawer');
                if (!drawer || !drawer.hasClass('is-visible')) {
                  return;
                }

                var layout = document.querySelector('.mdl-layout.is-small-screen').MaterialLayout;
                if (!layout) {
                  return;
                }
                layout.toggleDrawer();
            };

            $rootScope.facebookLogin = function () {
                facebook.login();
            };

            $rootScope.googleLogin = function () {
                google.login();
            };

            $rootScope.connect = function () {
                if (isFacebook) {
                    facebookSetLoginStatus();
                } else {
                    setLoginStatus();
                }
            };

            /**
             * Redirect to the game in progress of the user.
             */
            function redirectToGame () {
                $location.path('/game/' + $rootScope.user.gid);
            }

            function setLoginStatus() {
                facebookSetLoginStatus();
                googleSetLoginStatus();
            }

            function facebookSetLoginStatus () {
                facebook.setLoginStatus(callBackLoginStatus);
            }

            function googleSetLoginStatus () {
                google.setLoginStatus(callBackLoginStatus);
            }

            function callBackLoginStatus() {
                if (!facebook.status) {
                    return;
                }

                if (facebook.status === 'connected') {
                    facebook.handleLogin();
                    return;
                } 

                if (isFacebook) {
                    facebook.login();
                    return;
                }

                if (!google.status) {
                    return;
                }

                if (google.status === 'connected') {
                    google.handleLogin();
                    return;
                }

                modal.show(modal.get('modal-connect'));
            }

            socket.on('connect', function () {
                if (facebook.auth) {
                    socket.emit('facebookConnect', facebook.auth);
                } else if (google.auth) {
                    socket.emit('googleConnect', google.auth);
                }
            });

            socket.on('disconnect', function () {
                modal.show(modal.get('modal-disconnect'));
            });

            socket.on('user', function (data) {
                angular.extend($rootScope.user, data);
            });

            socket.on('startGame', function (gid) {
                $rootScope.user.gid = gid;
                redirectToGame();
            });

            socket.on('connected', function () {
                modal.hide(modal.get('modal-connect'));
                modal.hide(modal.get('modal-disconnect'));
                $rootScope.loading = false;
                $rootScope.ready = true;
            });

            socket.on('trophies', function (data) {
                $rootScope.user.trophies = data.trophies;
                $rootScope.$emit('trophies', data.newTrophies);
            });

            window.fbAsyncInit = function () {

                facebook.init();

                facebookSetLoginStatus();
            };

            var isFacebook = $location.search().facebook;

            if (!isFacebook && gapi && gapi.load) {

                gapi.load('client', function () {
                    google.init().then(googleSetLoginStatus);
                });
            }

            $rootScope.loading = true;

            $rootScope.user = {
                gender: 1,
                friends: []
            };
        }
    ]).

    config(['$routeProvider', '$locationProvider', '$translateProvider',
        function ($routeProvider, $locationProvider, $translateProvider) {
            $routeProvider
            .when('/', {
                title : 'home',
                templateUrl: '/app/home/templates/home.html',
                controller: 'homeCtrl'
            })
            .when('/game/:id', {
                title : 'game',
                templateUrl: 'app/game/templates/game.html',
                controller: 'gameCtrl'
            })
            .when('/ranking', {
                title : 'ranking',
                templateUrl: '/app/ranking/templates/ranking.html',
                controller: 'rankingCtrl'
            })
            .when('/trophies', {
                title : 'trophies',
                templateUrl: '/app/trophies/templates/trophies.html',
                controller: 'trophiesCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

            $locationProvider.html5Mode(true);

            $translateProvider.useSanitizeValueStrategy('escape');

            $translateProvider.useStaticFilesLoader({
                'prefix': 'json/dictionaries/',
                'suffix': '.json'
            });

            $translateProvider.preferredLanguage(navigator.language || navigator.userLanguage || 'en');
        }
    ]);

})();
