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
 * @ngdoc languages
 * @name global.constant:languages
 * @description
 * Available languages
 */
constant('languages', {
    ar: "‏العربية‏",
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
    it: "Italiano",
    ja: "日本語",
    nl: "Nederlands",
    pt: "Português",
    ru: "Русский",
    tr: "Türkçe",
    zh: "中文"
}).

constant('patterns', window.utils.patterns).

/**
 * @ngdoc service
 * @name global.service:utils
 * @description
 * Utils methods
 * @requires $rootScope
 * @requires $filter
 * @requires global.constant:host
 */
factory('utils', ['$rootScope', '$filter', '$window', 'host',
    
    function ($rootScope, $filter, $window, host) {

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
             * @name #inviteFriends
             * @methodOf global.service:utils
             * @description
             * Invite friend facebook
             */
            inviteFriends: function () {
                FB.ui({
                    method: 'apprequests',
                    title: $filter('translate')('title'),
                    message: $filter('translate')('description')
                });
            },

            isTouch: function () {
                return $window.hasOwnProperty('ontouchstart') || $window.navigator.maxTouchPoints;
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
service('sound', ['$rootScope', 'user', function ($rootScope, user) {

    $rootScope.$watch('user.sound', function (value) {
        if (typeof value === 'boolean') {
            sound = value;
        }
    });

    function Sound(name) {

        if (sounds &&
            sounds[name]) {
            this.sound = new Audio(sounds[name]);
            this.sound.volume = 0.5;
        }

        this.play = function () {
            if (sound) {
                this.sound.play();
            }
            return this;
        };

        this.stop = function () {
            if (this.sound && !this.sound.paused) {
                this.sound.pause();
                this.sound.currentTime = 0;
            }
            return this;
        };

        return this;
    }

    var sounds,
        sound = user.getSound();

    if (typeof Audio === 'function') {
        
        sounds = {
            timer: '/sounds/timer.mp3',
            deplace: '/sounds/deplace.mp3',
            capture: '/sounds/capture.mp3'
        };
    }

    return Sound;
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

        isConnected: function () {
            return socket && socket.connected;
        },
        
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
            });
        }
    };
}]).

/**
 * @ngdoc service
 * @name global.service:user
 * @description 
 * Socket management.
 */
service('user', ['$rootScope', '$cookies', function ($rootScope, $cookies) {

    return {
        /**
         * @ngdoc function
         * @name #has
         * @methodOf global.service:user
         * @description 
         * Has cookies name
         * @param {string} name Cookies name
         * @returns {boolean} response
         */
        has: function (name) {
            return typeof $cookies.get(name) !== 'undefined';
        },
        /**
         * @ngdoc function
         * @name #getUser
         * @methodOf global.service:user
         * @description 
         * Get user data
         * @param {string} name Name
         * @returns {object} Value
         */
        getUser: function (name) {
            var user = $cookies.getObject('user') || {};
            if (name) {
                return user[name];
            }
            return user;
        },
        /**
         * @ngdoc function
         * @name #setUser
         * @methodOf global.service:user
         * @description 
         * Set user data
         * @param {string} name Name
         * @param {string|object} value Value
         */
        setUser: function (name, value) {

            var data = this.getUser(),
                expires = new Date();

            data[name] = value;

            expires.setDate(expires.getDate() + 365);

            $cookies.putObject('user', data, {
                expires: expires
            });
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
            return this.getUser('login');
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
            this.setUser('login', value);
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
            return this.getUser('showPlayed');
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
            this.setUser('showPlayed', value);
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
            return this.getUser('showMessages');
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
            this.setUser('showMessages', value);
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
            return $cookies.getObject('sound');
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
            $rootScope.user.sound = value;
            $cookies.putObject('sound', value);
        },
        /**
         * @ngdoc function
         * @name #getColorGame
         * @methodOf global.service:user
         * @description 
         * Get color game
         * @returns {string} Color
         */
        getColorGame: function () {
            return $cookies.get('colorGame');
        },
        /**
         * @ngdoc function
         * @name #setColorGame
         * @methodOf global.service:user
         * @description 
         * Set color game
         * @param {string} value Color
         */
        setColorGame: function (value) {
            $rootScope.user.colorGame = value;
            $cookies.put('colorGame', value);
        },
        /**
         * @ngdoc function
         * @name #getDataGame
         * @methodOf global.service:user
         * @description 
         * Get data game
         * @returns {object} Data Game
         */
        getDataGame: function () {
            return $cookies.getObject('dataGame');
        },
        /**
         * @ngdoc function
         * @name #setDataGame
         * @methodOf global.service:user
         * @description 
         * Set data game
         * @param {string} value Data Game
         */
        setDataGame: function (value) {
            $rootScope.dataGame = value;
            $cookies.putObject('dataGame', value);
        }
    };
}]).

/**
 * @ngdoc service
 * @name global.service:translator
 * @description 
 * Service translator
 * @requires $http
 */
service('translator', ['$rootScope', '$http', 'languages', function($rootScope, $http, languages) {
    return {
        available: Object.keys(languages),
        lang: null,
        default: 'en',
        navigator: navigator.language || navigator.userLanguage,
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
                $rootScope.$emit('lang', lang);
            }.bind(this));
        },
        translate: function (key, params) {

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

            if (result && params) {
                angular.forEach(params, function(value, key) {
                    result = result.replace('{' + key + '}', value);
                });
            }

            return result ? result : key;
        }
    };
}]).

filter('translate', ['translator', function (translator) {
    
    function translate(value, params) {
        return translator.translate(value, params);
    }

    translate.$stateful = true;

    return translate;
}]).

filter('relativeNumber', function () {
    return function (value) {
        return value > 0 ? '+' + value : value;
    };
}).

filter('localeDateTime', function () {
    return function (value) {
        var date = new Date(value);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString(navigator.language, {
            hour: '2-digit', 
            minute:'2-digit'
        });
    };
});

