'use strict';

/**
 * @ngdoc overview
 * @name global
 * @description 
 * Global module
 */
angular.module('global', []).

/**
 * @ngdoc parameters
 * @name global.constant:host
 * @description
 * The host.
 */
constant('host', 'chess-game.herokuapp.com').

/**
 * @ngdoc parameters
 * @name global.constant:paramsGame
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
 * @ngdoc service
 * @name global.service:utils
 * @description
 * Utils methods
 * @requires $rootScope
 * @requires $filter
 * @requires facebook.constant:facebookRedirectUri
 * @requires global.constant:host
 */
factory('utils', ['$rootScope', '$filter', '$window', 'host', 'facebookRedirectUri',
    
    function ($rootScope, $filter, $window, host, facebookRedirectUri) {

        return {

            /**
             * @ngdoc function
             * @name #sprintf
             * @methodOf global.service:utils
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
             * @methodOf global.service:utils
             * @description
             * Share on facebook
             * @param {string} caption The description to share
             */
            share: function (data) {

                if (!data.picture) {
                    data.picture = 'logo.png';
                }

                if (!data.name) {
                    data.name = $filter('translate')('title');
                }

                if (!data.description) {
                    data.description = $filter('translate')('description');
                }

                if (!data.caption) {
                    data.caption = $filter('translate')('title');
                }

                FB.ui({
                    method: 'feed',
                    redirect_uri: facebookRedirectUri,
                    link: facebookRedirectUri,
                    picture: 'https://' + host + '/images/' + data.picture,
                    name: data.name,
                    caption: data.caption,
                    description: data.description
                });
            },

            /**
             * @ngdoc function
             * @name #isTouch
             * @methodOf global.service:utils
             * @description
             * Check if device has touch
             * @returns {bool} has touch
             */
            isTouch: function () {
                return 'ontouchstart' in $window || navigator.msMaxTouchPoints;
            }
        };
    }
]).

/**
 * @ngdoc service
 * @name global.service:sound
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
        return !!$cookies.get('sound');
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
        $cookies.put('sound', sound);

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
         * @methodOf global.service:sound
         * @description 
         * Change on/off sound
         * @returns {bool} true (on) / false (off)
         */
        change: change,
        /**
         * @ngdoc function
         * @name #timer
         * @methodOf global.service:sound
         * @description 
         * Manage sound timer
         * @returns {object} soundService
         */
        timer: new Sound('timer'),
        /**
         * @ngdoc function
         * @name #capture
         * @methodOf global.service:sound
         * @description 
         * Manage sound capture
         * @returns {object} soundService
         */
        capture: new Sound('capture'),
        /**
         * @ngdoc function
         * @name #deplace
         * @methodOf global.service:sound
         * @description 
         * Manage sound deplace
         * @returns {object} soundService
         */
        deplace: new Sound('deplace')
    };
}]).

/**
 * @ngdoc service
 * @name global.service:socket
 * @description 
 * Socket management.
 */
factory('socket', ['$rootScope', function ($rootScope) {

    var socket,
        deferedEvents = {};

    return {
        /**
         * @ngdoc function
         * @name #connect
         * @methodOf global.service:socket
         * @description 
         * Socket connect.
         */
        connect: function () {
            if (!socket) {
                socket = io.connect();
            } else {
                socket.connect();
            }
            angular.forEach(deferedEvents, function (callback, eventName) {
                this.on(eventName, callback)
            }.bind(this));
            deferedEvents = {};
        },
        /**
         * @ngdoc function
         * @name #disconnect
         * @methodOf global.service:socket
         * @description 
         * Socket disconnect.
         */
        disconnect: function () {
            if (!socket) {
                return;
            }
            socket.disconnect();
        },
        /**
         * @ngdoc function
         * @name #on
         * @methodOf global.service:socket
         * @description 
         * Subscribe once event.
         * @param {string} eventName Event name
         * @param {function} callback Callback
         */
        on: function (eventName, callback) {
            if (!socket) {
                deferedEvents[eventName] = callback;
                return;
            }
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        /**
         * @ngdoc function
         * @name #once
         * @methodOf global.service:socket
         * @description 
         * Subscribe once event.
         * @param {string} eventName Event name
         * @param {function} callback Callback
         */
        once: function (eventName, callback) {
            if (!socket) {
                deferedEvents[eventName] = callback;
                return;
            }
            socket.once(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        /**
         * @ngdoc function
         * @name #emit
         * @methodOf global.service:socket
         * @description 
         * Emit an event.
         * @param {string} eventName Event name
         * @param {object} data Data
         * @param {function} callback Callback
         */
        emit: function (eventName, data, callback) {
            if (!socket) {
                return;
            }
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
}]).

/**
 * @ngdoc service
 * @name global.service:lang
 * @description 
 * Seervice lang.
 * @requires $translate
 */
service('lang', ['$rootScope', '$translate',

    function ($rootScope, $translate) {

        return {
            /**
             * @ngdoc function
             * @name #set
             * @methodOf global.service:lang
             * @description 
             * Set app lang.
             * @param {string} lang New lang
             */
            set: function (lang) {

                if (!lang) {
                    return;
                }

                lang = lang.substr(0, 2);

                if (lang !== $translate.use()) {
                    $rootScope.user.lang = lang;
                    $translate.use(lang);
                }
            },
        };
    }
]).

service('user', ['$cookies', function ($cookies) {
    return {
        setLogin: function (value) {
            var expires = new Date();
            expires.setDate(expires.getDate() + 365);
            $cookies.put('login', value, {
                expires: expires
            });
        },
        getLogin: function () {
            return $cookies.get('login');
        }
    }
}]).

directive('scrollDown', [function () {
    return {
        scope: {
            scrollDown: '='
        },
        restrict: 'A',
        link: function(scope, element, attrs) {
            var scrollDown = true,
                el = element[0];

            element.on('scroll', function () {
                var el = element[0];
                scrollDown = (el.scrollTop + el.clientHeight + 1) > el.scrollHeight;
            });

            scope.$parent.$watch(scope.scrollDown, function (newValue) {
                if (newValue && scrollDown) {
                    element.scrollTop(el.scrollHeight);
                }
            });
        }
    };
}]);
