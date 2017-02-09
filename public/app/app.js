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
     * @requires components
     * @requires game
     * @requires home
     * @requires ranking
     * @requires trophies
     */
    module('app', [
        'ngRoute',
        'ngCookies',
        'global',
        'facebook',
        'google',
        'components',
        'game',
        'home',
        'ranking',
        'trophies'
    ]).

    run(['$rootScope', '$route', '$http', '$location', '$window', '$timeout', 'user', 'socket', 'modal', 'facebook', 'google', 'translator', 'utils',

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
        function ($rootScope, $route, $http, $location, $window, $timeout, user, socket, modal, facebook, google, translator, utils) {

            $rootScope.$on('$routeChangeStart', function() {

                if ($rootScope.user && $rootScope.user.gid) {
                    redirectToGame();
                }
            });

            $rootScope.$on('$routeChangeSuccess', function(event, toState, fromState) {

                modal('[data-modal]').hide();
                
                // Used for refresh user when join home if true
                if (fromState && $rootScope.user && !$rootScope.user.refresh) {
                    $rootScope.user.refresh = true;
                }
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
                afterLogin();
            };

            $rootScope.googleLogin = function () {
                google.login();
                afterLogin();
            };

            $rootScope.reconnect = function () {
                socket.connect();
                delete $rootScope.socketServerDisconnect;
            };

            $rootScope.logout = function () {
                if (facebook.isFacebookApp) {
                    return;
                }

                logout();
            };

            $rootScope.lang = function () {
                return translator.lang;
            };

            $rootScope.inviteFriends = utils.inviteFriends;

            function logout() {
                $rootScope.loading = true;
                user.setLogin(false);
                socket.disconnect();
                modalConnect.show();
            }

            /**
             * Redirect to the game in progress of the user.
             */
            function redirectToGame () {
                $location.path('/game/' + $rootScope.user.gid);
            }

            function afterLogin() {
                modalConnect.hide();
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

            function callBackLoginStatus(service) {

                if (!service) {
                    return;
                }

                var login = user.getLogin();

                if (facebook.isFacebookApp) {
                    login = facebook.name;
                }

                if (!facebook.isFacebookApp && (!login || login === service.name && service.status !== 'connected')) {
                    modalConnect.show();
                    return;
                }


                if (login === service.name) {
                    if (service.status === 'connected') {
                        service.handleLogin();
                    } else if (facebook.isFacebookApp) {
                        facebook.login();
                    }
                }
            }

            socket.on('connect', function () {
                var login = user.getLogin();

                if (facebook.isFacebookApp || (login === 'facebook' && facebook.auth)) {
                    socket.emit('facebookConnect', facebook.auth);
                } else if (login === 'google' && google.auth) {
                    socket.emit('googleConnect', google.auth);
                }
            });

            socket.on('refreshAccessToken', function () {

                if ($rootScope.refreshAccessToken) {
                    logout();
                }

                $rootScope.refreshAccessToken = true;

                socket.disconnect();

                setLoginStatus();
            });

            socket.on('disconnect', function (data) {
                modal('#modal-create-game').hide();
                $rootScope.loading = true;
                $rootScope.isDisconnected = true;
                if (data === 'io server disconnect') {
                    $rootScope.socketServerDisconnect = true;
                }
            });

            socket.on('unauthorized', function () {
                $rootScope.unauthorized = true;
                socket.disconnect();
            });

            socket.on('user', function (data) {
                angular.extend($rootScope.user, data);
            });

            socket.on('startGame', function (gid) {
                modal('#modal-create-game').hide();
                $rootScope.user.gid = gid;
                redirectToGame();
            });

            socket.on('connected', function () {
                if ($rootScope.isDisconnected) {
                    $route.reload();
                }
                delete $rootScope.refreshAccessToken;
                delete $rootScope.isDisconnected;
                $rootScope.loading = false;
                $rootScope.ready = true;
            });

            socket.on('trophies', function (data) {
                $rootScope.user.trophies = data.trophies;
                $timeout(function () {
                    $rootScope.$emit('trophies', data.newTrophies);
                }, 1000);
            });

            $window.fbAsyncInit = function () {

                facebook.init();

                facebookSetLoginStatus();
            };

            var modalConnect = modal('#modal-connect');

            facebook.isFacebookApp = angular.element('html').data('facebook');

            $rootScope.isFacebookApp = facebook.isFacebookApp;

            if (!facebook.isFacebookApp && typeof gapi !== 'undefined' && gapi.load) {
                gapi.load('client', function () {
                    google.init().then(googleSetLoginStatus);
                });
            }

            $rootScope.loading = true;

            $rootScope.user = {
                gender: 1,
                friends: []
            };

            translator.use(navigator.language || navigator.userLanguage || 'en');
            
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

            $window.twttr = (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0],
                t = $window.twttr || {};
                if (d.getElementById(id)) return t;
                js = d.createElement(s);
                js.id = id;
                js.src = "https://platform.twitter.com/widgets.js";
                fjs.parentNode.insertBefore(js, fjs);

                t._e = [];
                t.ready = function(f) {
                t._e.push(f);
                };

                return t;
            }(document, 'script', 'twitter-wjs'));
        }
    ]).

    config(['$routeProvider', '$locationProvider',
        function ($routeProvider, $locationProvider) {
            $routeProvider
            .when('/', {
                name : 'home',
                templateUrl: '/app/home/templates/home.html',
                controller: 'homeCtrl'
            })
            .when('/game/:id', {
                name : 'game',
                templateUrl: 'app/game/templates/game.html',
                templateUrl: '/app/game/templates/game.html',
                controller: 'gameCtrl'
            })
            .when('/ranking', {
                name : 'ranking',
                templateUrl: '/app/ranking/templates/ranking.html',
                controller: 'rankingCtrl'
            })
            .when('/trophies', {
                name : 'trophies',
                templateUrl: '/app/trophies/templates/trophies.html',
                controller: 'trophiesCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

            $locationProvider.html5Mode(true);
        }
    ]);

})();
