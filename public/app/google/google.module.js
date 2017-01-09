'use strict';

/**
 * @ngdoc overview
 * @name google
 * @description 
 * Google module
 */
angular.module('google', []).

/**
 * @ngdoc service
 * @name google.service:google
 * @description 
 * Google service.
 * @requires $rootScope
 * @requires global.service:socket
 * @requires global.service:lang
 */
service('google', ['$rootScope', '$cookies', 'socket', 'lang',

    function ($rootScope, $cookies, socket, lang) {

        var self = this;

        function setData (response) {

            if (!self.auth) {
                return;
            }

            var data = {};

            angular.forEach(response.locales, function (value) {
                if (value.value.substr(0, 2) !== 'en') {
                    lang.set(value.value);
                }
            });

            angular.forEach(response.genders, function (value) {
                if (!data.gender) {
                    $rootScope.user.gender = value.value;
                }
            });

            if (typeof response.nicknames === 'object') {
                response.names = angular.extend(response.names, response.nicknames);
            }

            angular.forEach(response.names, function (value) {
                if (!self.auth.name) {
                    self.auth.name = value.value;
                }
            });

            angular.forEach(response.photos, function (value) {
                if (!self.auth.avatar) {
                    self.auth.avatar = value.url;
                }
            });
        }

        /**
         * @ngdoc function
         * @name #init
         * @methodOf google.service:google
         * @description
         * Init app Google.
         */
        this.init = function () {
            return gapi.client.init({
                apiKey: 'AIzaSyCE3PfWFk6TXpS16wV38NadJnf2nJN6duI',
                discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
                clientId: '695464964183-2cofi6rshusga6ojnocqubdf124eg7oh.apps.googleusercontent.com',
                scope: 'profile'
            }).then(function(response) {
                gapi.auth2.getAuthInstance().isSignedIn.listen(function() {
                    self.setLoginStatus(self.handleLogin);
                });
            }, function (err) {
                self.status = 'error';
            });
        };

        /**
         * @ngdoc function
         * @name #setLoginStatus
         * @methodOf google.service:google
         * @description
         * Set Google login status.
         * @param {function} callback Callback
         */
        this.setLoginStatus = function (callback) {

            if (this.status === 'error') {
                callback();
                return;
            }

            var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
            if (!isSignedIn) {
                this.status = 'unknown';
                delete this.auth;
            } else {
                this.status = 'connected';
                this.auth = {
                    accessToken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
                };
            }
            callback();
        };

        /**
         * @ngdoc function
         * @name #login
         * @methodOf google.service:google
         * @description
         * Google login.
         */
        this.login = function () {
            if (this.status === 'connected') {
                this.handleLogin();
            } else {
                gapi.auth2.getAuthInstance().signIn();
            }
        };

        /**
         * @ngdoc function
         * @name #logout
         * @methodOf google.service:google
         * @description
         * Google logout.
         */
        this.logout = function () {
            gapi.auth2.getAuthInstance().signOut();
            socket.disconnect();
        };

        /**
         * @ngdoc function
         * @name #handleLogin
         * @methodOf google.service:google
         * @description
         * Set user data from facebook.
         * Set user friends from facebook list.
         */
        this.handleLogin = function () {
            $cookies.put('login', 'google');
            gapi.client.people.people.get({
                resourceName: 'people/me'
            }).then(function(response) {
                setData(response.result);
                socket.connect();
            });
        };

        return this;
    }
]);
