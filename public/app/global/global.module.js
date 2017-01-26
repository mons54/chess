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
constant('host', 'www.worldofchess.online').

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
service('sound', ['user', function (user) {

    var sounds,
        sound = user.getSound();

    if (typeof Audio === 'function') {
        sounds = {
            timer: new Audio('/sounds/timer.mp3'),
            deplace: new Audio('/sounds/deplace.wav'),
            capture: new Audio('/sounds/capture.wav')
        };
    };

    function loadAll() {
        if (!sounds) {
            return;
        }

        angular.forEach(sounds, function (value, name) {
            value.load();
        });
    }

    function change() {
        sound = !sound;
        user.setSound(sound);

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
factory('socket', ['$timeout', function ($timeout) {

    var socket,
        deferedEvents = [];

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
            angular.forEach(deferedEvents, function (callback) {
                callback();
            });
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
         * @param {object} scope Scope
         */
        on: function (eventName, callback, scope) {
            if (!socket) {
                deferedEvents.push(function () {
                    this.on(eventName, callback, scope);
                }.bind(this));
                return;
            }

            var listener = function () {
                var args = arguments;
                $timeout(function () {
                    callback.apply(socket, args);
                });
            };

            socket.on(eventName, listener);

            if (scope) {
                scope.$on('$destroy', function() {
                    socket.off(eventName, listener);
                });
            }
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
        once: function (eventName, callback, scope) {
            if (!socket) {
                deferedEvents.push(function () {
                    this.once(eventName, callback, scope);
                }.bind(this));
                return;
            }

            var listener = function () {
                var args = arguments;
                $timeout(function () {
                    callback.apply(socket, args);
                });
            };

            socket.once(eventName, listener);

            if (scope) {
                scope.$on('$destroy', function() {
                    socket.off(eventName, listener);
                });
            }
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
                $timeout(function () {
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
 * @name global.service:user
 * @description 
 * Socket management.
 */
service('user', ['$cookies', function ($cookies) {

    function get() {
        return $cookies.getObject('user') || {};
    }

    function set(data) {
        var expires = new Date();

        expires.setDate(expires.getDate() + 365);

        $cookies.putObject('user', data, {
            expires: expires
        });
    }

    return {
        /**
         * @ngdoc function
         * @name #get
         * @methodOf global.service:user
         * @description 
         * Get user data
         * @param {string} name Name
         * @returns {object} Value
         */
        get: function (name) {
            return get()[name];
        },
        /**
         * @ngdoc function
         * @name #set
         * @methodOf global.service:user
         * @description 
         * Set user data
         * @param {string} name Name
         * @param {string|object} value Value
         */
        set: function (name, value) {
            var data = get();

            data[name] = value;

            set(data);
        },
        /**
         * @ngdoc function
         * @name #getLogin
         * @methodOf global.service:user
         * @description 
         * Get login value
         * @returns {bool} Login
         */
        getLogin: function () {
            return this.get('login');
        },
        /**
         * @ngdoc function
         * @name #setLogin
         * @methodOf global.service:user
         * @description 
         * Set login value
         * @param {bool} value Login
         */
        setLogin: function (value) {
            this.set('login', value);
        },
        /**
         * @ngdoc function
         * @name #getSound
         * @methodOf global.service:user
         * @description 
         * Get sound value
         * @returns {bool} Sound
         */
        getSound: function () {
            return this.get('sound');
        },
        /**
         * @ngdoc function
         * @name #setSound
         * @methodOf global.service:user
         * @description 
         * Set sound value
         * @param {bool} value Sound
         */
        setSound: function (value) {
            this.set('sound', value);
        },
        /**
         * @ngdoc function
         * @name #getShowPlayed
         * @methodOf global.service:user
         * @description 
         * Get show played value
         * @returns {bool} Show
         */
        getShowPlayed: function () {
            return this.get('showPlayed');
        },
        /**
         * @ngdoc function
         * @name #setShowPlayed
         * @methodOf global.service:user
         * @description 
         * Set show played value
         * @param {bool} value Show
         */
        setShowPlayed: function (value) {
            this.set('showPlayed', value);
        },
        /**
         * @ngdoc function
         * @name #getShowMessages
         * @methodOf global.service:user
         * @description 
         * Get show messages value
         * @returns {bool} Show
         */
        getShowMessages: function () {
            return this.get('showMessages');
        },
        /**
         * @ngdoc function
         * @name #setShowMessages
         * @methodOf global.service:user
         * @description 
         * Set show messages value
         * @param {bool} value Show
         */
        setShowMessages: function (value) {
            this.set('showMessages', value);
        },
    }
}]).

/**
 * @ngdoc service
 * @name global.service:translator
 * @description 
 * Service translator
 * @requires $http
 */
service('translator', ['$http', function($http) {
    return {
        available: ['ar', 'de', 'en', 'es', 'fr', 'it', 'ja', 'nl', 'pt', 'ru', 'tr', 'zh'],
        default: 'en',
        lang: null,
        data: null,
        use: function (lang) {

            if (typeof lang === 'string') {
                lang = lang.substr(0, 2);
            }

            if (this.available.indexOf(lang) === -1) {
                lang = this.default;
            }

            if (this.lang && lang === this.lang) {
                return;
            }

            $http.get('/json/dictionaries/' + lang + '.json')
            .then(function (response) {
                this.lang = lang;
                this.data = response.data;
            }.bind(this));
        },
        translate: function (key) {

            if (!key || !this.data) {
                return key;
            }

            var result,
                data = this.data;

            angular.forEach(key.split('.'), function(value, index) {
                
                if (result) {
                    return;
                }

                if (typeof data[value] === 'string') {
                    result = data[value];
                } else if (typeof data[value] === 'object') {
                    data = data[value];
                } else {
                    result = key;
                }
            }.bind(this));

            return result ? result : key;
        }
    };
}]).
filter('translate', ['translator', function (translator) {
    function translate(value) {
        return translator.translate(value);
    };

    translate.$stateful = true;

    return translate;
}]).
filter('relativeNumber', function () {
    return function (value) {
        return value > 0 ? '+' + value : value;
    };
});
