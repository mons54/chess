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

    run(['$rootScope', '$route', '$http', '$location', '$window', 'user', 'socket', 'modal', 'facebook', 'google', 'lang',

        /**
         * @param {object} $rootScope Global scope
         * @param {object} $route Service route
         * @param {object} $http Service http
         * @param {object} $location Service location
         * @param {object} $window Service window
         * @param {object} $window Service window
         * @param {object} user User service
         * @param {object} modal Modal service
         * @param {object} facebook Facebook service
         * @param {object} google Google service
         */
        function ($rootScope, $route, $http, $location, $window, user, socket, modal, facebook, google, lang) {

            $rootScope.$on('$routeChangeStart', function() {

                if ($rootScope.user && $rootScope.user.gid) {
                    redirectToGame();
                }
            });

            $rootScope.$on('$routeChangeSuccess', function(event, toState, fromState) {
                
                if (fromState && $rootScope.user && !$rootScope.user.refresh) {
                    $rootScope.user.refresh = true;
                }

                $rootScope.title = $route.current.title;
            });

            /**
             * Close menu mobile
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
                if (facebook.isFacebookApp) {
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

                var login = user.getLogin();

                if (!facebook.status) {
                    return;
                }

                if ((facebook.isFacebookApp || login === 'facebook') && facebook.status === 'connected') {
                    facebook.handleLogin();
                    return;
                } 

                if (facebook.isFacebookApp) {
                    facebook.login();
                    return;
                }

                if (!google.status) {
                    return;
                }

                if (login === 'google' && google.status === 'connected') {
                    google.handleLogin();
                    return;
                }

                modal.show(modal.get('modal-connect'));
            }

            var isDisconnect = false;

            socket.on('connect', function () {
                var login = user.getLogin();

                if (facebook.isFacebookApp || (login === 'facebook' && facebook.auth)) {
                    socket.emit('facebookConnect', facebook.auth);
                } else if (login === 'google' && google.auth) {
                    socket.emit('googleConnect', google.auth);
                }
            });

            socket.on('disconnect', function () {
                isDisconnect = true;
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
                if (isDisconnect) {
                    $route.reload();
                }
                modal.hide(modal.get('modal-connect'));
                modal.hide(modal.get('modal-disconnect'));
                $rootScope.loading = false;
                $rootScope.ready = true;
            });

            socket.on('trophies', function (data) {
                $rootScope.user.trophies = data.trophies;
                $rootScope.$emit('trophies', data.newTrophies);
            });

            $window.fbAsyncInit = function () {

                facebook.init();

                facebookSetLoginStatus();
            };

            facebook.isFacebookApp = $location.search().facebook;

            if (!facebook.isFacebookApp && gapi && gapi.load) {

                gapi.load('client', function () {
                    google.init().then(googleSetLoginStatus);
                });
            }

            $rootScope.loading = true;

            $rootScope.user = {
                gender: 1,
                friends: []
            };

            lang.set(navigator.language || navigator.userLanguage || 'en');
            
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
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

            $translateProvider.preferredLanguage('en');
        }
    ]);

})();
