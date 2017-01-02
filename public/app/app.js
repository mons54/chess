(function () {
    
    'use strict';

    angular.

    /**
     * @ngdoc overview
     * @name app
     * @description
     * The module of app.
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
        'components',
        'game',
        'home',
        'ranking',
        'trophies'
    ]).

    /**
     * @ngdoc parameters
     * @name app.constant:appId
     * @description
     * The app Id.
     */
    constant('appId', '466889913406471').

    /**
     * @ngdoc parameters
     * @name app.constant:host
     * @description
     * The host.
     */
    constant('host', 'chess-game.herokuapp.com').

    /**
     * @ngdoc parameters
     * @name app.constant:redirectUri
     * @description
     * The redirect uri.
     */
    constant('redirectUri', 'https://apps.facebook.com/____test/').

    /**
     * @ngdoc parameters
     * @name app.constant:paramsGame
     * @description
     * The params games data
     */
    constant('paramsGame', {
        colors: ['white', 'black'],
        times: [300, 600, 1200, 3600, 5400],
        points: {
            min: 1200,
            max: 3000
        }
    }).

    /**
     * @ngdoc parameters
     * @name app.constant:trophies
     * @description
     * The list of trophies
     */
    constant('trophies', {
        1: 'game-1',
        2: 'game-10',
        3: 'game-500',
        4: 'game-1000',
        5: 'game-5000',
        6: 'win-1',
        7: 'win-50',
        8: 'win-250',
        9: 'win-500',
        10: 'win-2000',
        11: 'game-day-5',
        12: 'game-day-10',
        13: 'game-day-25',
        14: 'game-day-50',
        15: 'game-day-100',
        16: 'win-cons-3',
        17: 'win-cons-5',
        18: 'win-cons-10',
        19: 'win-cons-20',
        20: 'lose-cons-3'
    }).

    /**
     * @ngdoc service
     * @name app.service:socket
     * @description 
     * Socket management.
     */
    provider('socket', function () {

        var socket,
            deferedEvents = {};

        /**
         * @ngdoc function
         * @name #connect
         * @methodOf app.service:socket
         * @description 
         * Connect the socket.
         */
        this.connect = function () {
            if (!socket) {
                socket = io.connect();
            } else {
                socket.connect();
            }

            angular.forEach(deferedEvents, function (callback, event) {
                this.on(event, callback)
            }.bind(this));

            deferedEvents = {};
        };

        /**
         * @ngdoc function
         * @name #disconnect
         * @methodOf app.service:socket
         * @description 
         * Disconnect the socket.
         */
        this.disconnect = function () {
            if (!socket) {
                return;
            }
            socket.disconnect();
        };

        /**
         * @ngdoc function
         * @name #emit
         * @methodOf app.service:socket
         * @description 
         * Emit one event.
         * @param {string} event The event name
         * @param {object=} data The data
         */
        this.emit = function (event, data) {
            if (!socket) {
                return;
            }
            socket.emit(event, data);
        };

        /**
         * @ngdoc function
         * @name #emit
         * @methodOf app.service:socket
         * @description 
         * Subscribe on event.
         * @param {string} event The event name
         * @param {function} callback The callback
         */
        this.on = function (event, callback) {
            if (!socket) {
                deferedEvents[event] = callback;
                return;
            }
            socket.on(event, callback);
        };

        /**
         * @ngdoc function
         * @name #once
         * @methodOf app.service:socket
         * @description 
         * Subscribe once event.
         * @param {string} event The event name
         * @param {function} callback The callback
         */
        this.once = function (event, callback) {
            if (!socket) {
                return;
            }
            socket.once(event, callback);
        };
            
        this.$get = function () {
            return this;
        };
    }).

    /**
     * @ngdoc service
     * @name app.service:sound
     * @description 
     * Sound management.
     */
    service('sound', ['$cookies', function ($cookies) {

        var sounds,
            sound = getSound();

        if (typeof Audio === 'function') {
            sounds = {
                timer: new Audio('/sounds/timer.mp3'),
                deplace: new Audio('/sounds/deplace.wav'),
                capture: new Audio('/sounds/capture.wav')
            };
        };

        function getSound() {
            return !!$cookies.getObject('sound');
        }

        function loadAll() {
            if (!sounds) {
                return;
            }

            angular.forEach(sounds, function (value, name) {
                value.load();
            });
        }

        function change() {
            sound = !getSound();
            $cookies.putObject('sound', sound);

            if (!sound) {
                loadAll();
            }

            return sound;
        }

        function Sound(name) {
            if (sounds &&
                sounds[name]) {
                this.sound = sounds[name];
            }

            this.play = function () {
                if (sound && this.isPaused()) {
                    this.sound.play();
                }
                return this;
            };

            this.pause = function () {
                if (sound && this.isPlayed()) {
                    this.sound.pause();
                }
                return this;
            };

            this.load = function () {
                if (sound && this.sound) {
                    this.sound.load();
                }
                return this;
            };

            this.isPlayed = function () {
                return this.sound && !this.sound.paused;
            };

            this.isPaused = function () {
                return this.sound && this.sound.paused;
            };
        }

        return {
            sound: sound,
            /**
             * @ngdoc function
             * @name #change
             * @methodOf app.service:sound
             * @description 
             * Change on/off sound
             * @returns {bool} true (on) / false (off)
             */
            change: change,
            /**
             * @ngdoc function
             * @name #timer
             * @methodOf app.service:sound
             * @description 
             * Manage sound timer
             * @returns {object} soundService
             */
            timer: new Sound('timer'),
            /**
             * @ngdoc function
             * @name #capture
             * @methodOf app.service:sound
             * @description 
             * Manage sound capture
             * @returns {object} soundService
             */
            capture: new Sound('capture'),
            /**
             * @ngdoc function
             * @name #deplace
             * @methodOf app.service:sound
             * @description 
             * Manage sound deplace
             * @returns {object} soundService
             */
            deplace: new Sound('deplace')
        };
    }]).

    /**
     * @ngdoc service
     * @name app.service:utils
     * @description
     * Utils methods
     * @requires $rootScope
     * @requires $filter
     * @requires app.constant:redirectUri
     * @requires app.constant:host
     */
    factory('utils', ['$rootScope', '$filter', 'redirectUri', 'host',
        
        function ($rootScope, $filter, redirectUri, host) {

            return {

                /**
                 * @ngdoc function
                 * @name #sprintf
                 * @methodOf app.service:utils
                 * @description
                 * Return a string formatted.
                 * @param {float} value The value
                 * @returns {string} The value formatted
                 */
                sprintf: function(value) {
                    return (value.toString().length == 1 ? '0' : '') + value;
                },

                /**
                 * @ngdoc function
                 * @name #share
                 * @methodOf app.service:utils
                 * @description
                 * Share on facebook
                 * @param {string} caption The description to share
                 */
                share: function (caption) {
                    FB.ui({
                        method: 'feed',
                        redirect_uri: redirectUri,
                        link: redirectUri,
                        picture: 'https://' + host + '/images/mini-icon.png',
                        name: $filter('translate')('title'),
                        caption: caption,
                        description: $filter('translate')('description')
                    });
                },

                isTouch: function () {
                    return 'ontouchstart' in window || navigator.msMaxTouchPoints;
                }
            };
        }
    ]).

    run(['$rootScope', '$route', '$translate', '$http', '$location', 'socket', 'modal', 'appId',

        /**
         * @param {object} $rootScope Global scope
         * @param {object} $route Service route
         * @param {object} $translate Service translator
         * @param {object} $http Service http
         * @param {object} $location Service location
         * @param {string} appId App Id
         */
        function ($rootScope, $route, $translate, $http, $location, socket, modal, appId) {

            $rootScope.$on('$routeChangeStart', function() {
                /**
                 * Check if the user has a game in progress.
                 */
                if (!$rootScope.user.gid) {
                    return;
                }
                /**
                 * If the user has a game in progress redirect to this game
                 */
                redirectToGame();
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
             * Start the loader
             */
            $rootScope.loading = true;

            /**
             * Set the user default values.
             */
            $rootScope.user = {
                uid: null,
                accessToken: null,
                name: 'User',
                lang: 'en',
                gender: 'male',
                moderateur: false,
                currency: null,
                friends: []
            };

            /**
             * Facebook is loaded
             */
            window.fbAsyncInit = function () {

                FB.init({
                    appId: appId,
                    xfbml: true,
                    version: 'v2.8'
                });

                getLoginStatus();
            };

            /**
             * Redirect to the game in progress of the user.
             */
            function redirectToGame () {
                $location.path('/game/' + $rootScope.user.gid);
            }

            /**
             * Get the user login status.
             */
            function getLoginStatus () {
                FB.getLoginStatus(function (res) {
                    if (res.status !== 'connected') {
                        return login();
                    }
                    getUser(res);
                });
            }

            /**
             * User login
             */
            function login () {
                FB.login(function (res) {
                    getUser(res);
                }, {
                    scope: 'user_friends'
                });
            }

            /**
             * Get the user data
             */
            function getUser (res) {

                $rootScope.user.accessToken = res.authResponse.accessToken;
                
                FB.api('/me?fields=first_name,name,locale,gender,currency', setUser);
            }

            /**
             * Set user data and socket
             */
            function setUser (res) {
                    
                $rootScope.user.uid = res.id;
                $rootScope.user.firstName = res.first_name;
                $rootScope.user.name = res.name.substr(0, 30);
                $rootScope.user.lang = res.locale.substr(0, 2);
                $rootScope.user.gender = res.gender;
                $rootScope.user.currency = res.currency;
                $rootScope.user.friends.push($rootScope.user.uid);

                $translate.use($rootScope.user.lang);

                FB.api('/me/friends?fields=installed,id,name', function (res) {
                    angular.forEach(res.data, function (value) {
                        if (value.installed) {
                            $rootScope.user.friends.push(value.id);
                        }
                    });
                });

                socket.connect();
            }

            $rootScope.connect = function () {
                socket.connect();
            };

            socket.on('connect', function () {
                modal.hide(modal.get('modal-disconnect'));
                socket.emit('init', {
                    uid: $rootScope.user.uid,
                    accessToken: $rootScope.user.accessToken,
                    name: $rootScope.user.name
                });
            });

            socket.on('disconnect', function () {
                modal.show(modal.get('modal-disconnect'));
            });

            socket.on('infosUser', function (data) {
                angular.extend($rootScope.user, data);
            });

            socket.on('startGame', function (gid) {
                $rootScope.$apply(function () {
                    $rootScope.user.gid = gid;
                    redirectToGame();
                });
            });

            socket.on('ready', function () {
                $rootScope.$apply(function () {
                    $rootScope.ready = true;
                    $rootScope.loading = false;
                });
            });

            socket.on('trophy', function (data) {
                angular.extend({}, $rootScope.user.trophies, data);
            });
        }
    ]).

    config(['$routeProvider', '$locationProvider', '$translateProvider',
        function ($routeProvider, $locationProvider, $translateProvider) {
            $routeProvider
            .when('/game/:id', {
                title : 'game',
                templateUrl: 'app/game/templates/game.html',
                controller: 'gameCtrl'
            })
            .when('/', {
                title : 'home',
                templateUrl: '/app/home/templates/home.html',
                controller: 'homeCtrl'
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
