'use strict';

/**
 * @ngdoc overview
 * @name google
 * @description 
 * Google module
 */
angular.module('google', []).

service('google', ['$q', 'user', 'socket', function ($q, user, socket) {

    var self = this;

    function setData (response) {

        if (!self.auth) {
            return;
        }

        var data = {};

        angular.forEach(response.locales, function (value) {
            if (!data.lang) {
                data.lang = value.value;
            }
        });

        angular.forEach(response.genders, function (value) {
            if (!data.gender) {
                data.gender = value.value;
            }
        });

        user.set(data);

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

    this.init = function () {
        return gapi.client.init({
            apiKey: 'AIzaSyCE3PfWFk6TXpS16wV38NadJnf2nJN6duI',
            discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
            clientId: '695464964183-2cofi6rshusga6ojnocqubdf124eg7oh.apps.googleusercontent.com',
            scope: 'profile'
        }).then(function(response) {
            gapi.auth2.getAuthInstance().isSignedIn.listen(self.handleLogin);
        });
    }

    this.getLoginStatus = function (callback) {
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
    };

    this.handleLogin = function () {
        gapi.client.people.people.get({
            resourceName: 'people/me'
        }).then(function(response) {
            setData(response.result);
            socket.connect();
        });
    }

    this.login = function (event) {
        gapi.auth2.getAuthInstance().signIn();
    };

    this.logout = function (event) {
        gapi.auth2.getAuthInstance().signOut();
        socket.disconnect();
    };

    return this;
}]);
