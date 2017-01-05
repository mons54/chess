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
factory('utils', ['$rootScope', '$filter', 'host', 'facebookRedirectUri',
    
    function ($rootScope, $filter, host, facebookRedirectUri) {

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
                return 'ontouchstart' in window || navigator.msMaxTouchPoints;
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
provider('socket', function () {

    var socket,
        deferedEvents = {};

    /**
     * @ngdoc function
     * @name #connect
     * @methodOf global.service:socket
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
     * @methodOf global.service:socket
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
     * @methodOf global.service:socket
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
     * @methodOf global.service:socket
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
     * @methodOf global.service:socket
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

service('user', ['$rootScope', '$translate',

    function ($rootScope, $translate) {

        var defaultData = {
            lang: $translate.use(),
            gender: 1,
            friends: []
        };

        return {
            init: function () {
                $rootScope.user = defaultData;
            },
            set: function (data) {
                if (data.lang) {
                    data.lang = data.lang.substr(0, 2);
                    if (data.lang !== defaultData.lang) {
                        $translate.use(data.lang);
                    }
                }
                angular.extend($rootScope.user, data);
            },
        };
    }
]);
