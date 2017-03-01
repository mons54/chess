/**
 * @ngdoc overview
 * @name google
 * @description 
 * Google module
 */
angular.module('google', []).

constant('googleClientId', '241448993510-5860ln6qoa9a1iov1t3j6uirsvhlerbb.apps.googleusercontent.com').

/**
 * @ngdoc service
 * @name google.service:google
 * @description 
 * Google service.
 * @requires $rootScope
 * @requires global.service:user
 * @requires global.service:socket
 * @requires global.service:translator
 */
service('google', ['$rootScope', 'googleClientId', 'user', 'socket', 'translator',

    function ($rootScope, googleClientId, user, socket, translator) {

        var self = this;

        this.name = 'google';

        function setAuth (user) {

            var profile = user.getBasicProfile();

            self.auth = {
                accessToken: user.getAuthResponse().access_token,
                id: user.getId(),
                avatar: profile.Paa,
                name: profile.ig,
                lang: translator.navigator
            };
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
                apiKey: 'AIzaSyDo-HJeI3NjUs4T0HVett5W2SBfeUcpIXY',
                discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
                clientId: googleClientId,
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
            }

            callback(this);
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
         * @name #handleLogin
         * @methodOf google.service:google
         * @description
         * Set user data from google.
         */
        this.handleLogin = function () {
            user.setLogin(self.name);
            setAuth(gapi.auth2.getAuthInstance().currentUser.get());
            socket.connect();
        };

        return this;
    }
]);
