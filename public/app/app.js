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

    run(['$rootScope', '$route', '$translate', '$http', '$location', 'user', 'socket', 'modal', 'facebook', 'google',

        /**
         * @param {object} $rootScope Global scope
         * @param {object} $route Service route
         * @param {object} $translate Service translator
         * @param {object} $http Service http
         * @param {object} $location Service location
         * @param {string} facebookAppId Facebook app Id
         */
        function ($rootScope, $route, $translate, $http, $location, user, socket, modal, facebook, google) {

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
                
                closeDrawer();
            });

            function closeDrawer() {
                var drawer = angular.element('.mdl-layout__drawer');
                if (!drawer || !drawer.hasClass('is-visible')) {
                  return;
                }

                var layout = document.querySelector('.mdl-layout.is-small-screen').MaterialLayout;
                if (!layout) {
                  return;
                }
                layout.toggleDrawer();
            }

            /**
             * Redirect to the game in progress of the user.
             */
            function redirectToGame () {
                $location.path('/game/' + $rootScope.user.gid);
            }

            var isFacebook = $location.search().facebook;


            /**
             * Facebook is loaded
             */
            window.fbAsyncInit = function () {

                facebook.init();

                facebookGetLoginStatus();
            };

            if (!isFacebook && gapi && gapi.load) {

                gapi.load('client', function () {
                    google.init().then(googleGetLoginStatus);
                });
            }

            function getLoginStatus() {
                facebookGetLoginStatus();
                googleGetLoginStatus();
            }

            function facebookGetLoginStatus () {
                facebook.getLoginStatus(callBackLoginStatus);
            }

            function googleGetLoginStatus () {
                google.getLoginStatus(callBackLoginStatus);
            }

            function callBackLoginStatus() {
                if (!facebook.status) {
                    return;
                }

                if (facebook.status === 'connected') {
                    facebook.handleLogin();
                } else if (isFacebook) {
                    facebook.login();
                } 

                if (!google.status) {
                    return;
                } 

                if (google.status === 'connected') {
                    google.handleLogin();
                } else {
                    console.log('openModal');
                }
            }

            $rootScope.connect = function () {
                if (isFacebook) {
                    socket.connect();
                } else {
                    getLoginStatus();
                }
            };

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
                $rootScope.$apply(function () {
                    $rootScope.user.gid = gid;
                    redirectToGame();
                });
            });

            socket.on('connected', function () {
                modal.hide(modal.get('modal-disconnect'));
                $rootScope.$apply(function () {
                    $rootScope.loading = false;
                });
            });

            socket.on('trophies', function (data) {
                $rootScope.$apply(function () {
                    $rootScope.user.trophies = data.trophies;
                    $rootScope.$emit('trophies', data.newTrophies)
                });
            });

            $rootScope.loading = true;

            user.init();
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

/**
 * Init the SDK Facebook
 */
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
