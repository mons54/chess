/**
 * @ngdoc overview
 * @name vkontakte
 * @description 
 * Google module
 */
angular.module('vkontakte', []).

/**
 * @ngdoc parameters
 * @name vkontakte.constant:vkApiId
 * @description
 * VK Api Id
 */
constant('vkontakteApiId', 6170101).

/**
 * @ngdoc service
 * @name vkontakte.service:vkontakte
 * @description 
 * Google service.
 * @requires $rootScope
 * @requires vkontakte.constant:vkontakteApiId
 * @requires global.service:user
 * @requires global.service:socket
 * @requires global.service:translator
 */
service('vkontakte', ['$rootScope', 'vkontakteApiId', 'user', 'socket', 'translator',

    function ($rootScope, vkontakteApiId, user, socket, translator) {

        var self = this;

        this.name = 'vkontakte';

        function getLanguage(language) {
            switch (language) {
                case '98':
                    return 'ar';
                case '6':
                    return 'de';
                case '3':
                    return 'en';
                case '4':
                    return 'es';
                case '16':
                    return 'fr';
                case '7':
                    return 'it';
                case '20':
                    return 'ja';
                case '61':
                    return 'nl';
                case '12':
                case '73':
                    return 'pt';
                case '82':
                    return 'tr';
                case '18':
                    return 'zh';
                default:
                    return 'ru';
            };
        }

        function setLoginStatus (response, callback) {
            self.status = response.status;
            if (response.status === 'connected') {
                self.auth = response.session;
                VK.api('users.get', {fields: 'photo_50, language'}, function(response) {
                    if (response &&
                        response.response &&
                        response.response[0]) {

                        var response = response.response[0];

                        self.auth.user = {
                            name: response.nickname || (response.first_name + ' ' + response.last_name),
                            picture: response.photo_50,
                            lang: getLanguage(response.language)
                        };
                    }    
                    callback();
                });
            } else {
                delete self.auth;
                callback();
            }
        }

        /**
         * @ngdoc function
         * @name #init
         * @methodOf vkontakte.service:vkontakte
         * @description
         * Init app VK.
         */
        this.init = function () {
            VK.init({
                apiId: 6090659
            });
        };

        /**
         * @ngdoc function
         * @name #setLoginStatus
         * @methodOf vkontakte.service:vkontakte
         * @description
         * Set VK login status.
         * @param {function} callback Callback
         */
        this.setLoginStatus = function (callback) {
            VK.Auth.getLoginStatus(function (response) {
                setLoginStatus(response, function () {
                    callback(self);
                });
            });
        };

        /**
         * @ngdoc function
         * @name #login
         * @methodOf vkontakte.service:vkontakte
         * @description
         * VK login.
         */
        this.login = function () {
            if (this.status === 'connected') {
                this.handleLogin();
            } else {
                VK.Auth.login(function (response) {
                    setLoginStatus(response, function () {
                        if (self.status === 'connected') {
                            self.handleLogin();
                        }
                    });
                });
            }
        };

        /**
         * @ngdoc function
         * @name #handleLogin
         * @methodOf vkontakte.service:vkontakte
         * @description
         * Set user data from VK.
         */
        this.handleLogin = function () {
            if (!this.isVkontakteApp) {
                user.setLogin(this.name);
            }
            
            socket.connect();
        };

        return this;
    }
]);
