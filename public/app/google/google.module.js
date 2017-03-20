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
service('google', ['$rootScope', '$q', 'googleClientId', 'user', 'socket', 'translator',

    function ($rootScope, $q, googleClientId, user, socket, translator) {

        this.name = 'google';

        this.init = function () {
            return gapi.client.init({
                apiKey: 'AIzaSyDo-HJeI3NjUs4T0HVett5W2SBfeUcpIXY',
                discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
                clientId: googleClientId,
                scope: 'profile'
            }).then(function(response) {
                gapi.auth2.getAuthInstance().isSignedIn.listen(this.handleLogin);
            }.bind(this));
        };

        this.silenceLogin = function () {

            var deferred = $q.defer();

            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                deferred.resolve('connected');
                this.handleLogin();
            } else {
                deferred.reject('unknown');
            }

            return deferred.promise;
        };

        this.login = function () {
            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                this.handleLogin();
            } else {
                gapi.auth2.getAuthInstance().signIn();
            }
        };

        this.handleLogin = function () {

            user.setLogin(this.name);

            this.auth = {
                accessToken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
                lang: translator.navigator
            };

            socket.connect();
        };

        return this;
    }
]);
