'use strict';

/**
 * @ngdoc overview
 * @name facebook
 * @description 
 * Facebook module
 */
angular.module('facebook', []).

/**
 * @ngdoc parameters
 * @name facebook.constant:facebookRedirectUri
 * @description
 * The redirect uri.
 */
constant('facebookRedirectUri', 'https://apps.facebook.com/____test/').

service('facebook', ['user', 'socket', function (user, socket) {

    var self = this;

    function setLoginStatus (response) {
        self.status = response.status;
        if (response.status === 'connected') {
            self.auth = {
                id: response.authResponse.userID,
                accessToken: response.authResponse.accessToken
            };
        } else {
            delete self.auth;
        }
    }

    this.init = function () {
        FB.init({
            appId: '738045286230106',
            xfbml: true,
            version: 'v2.8'
        });
    };

    this.getLoginStatus = function (callback) {
        FB.getLoginStatus(function (response) {
            setLoginStatus(response);
            callback();
        });
    };

    this.login = function () {
        FB.login(function (response) {
            setLoginStatus(response);
            self.handleLogin();
        }, {
            scope: 'user_friends'
        });
    };

    this.logout = function () {
        FB.logout(function () {
            socket.disconnect();
        });
    };

    this.handleLogin = function () {
        
        FB.api('/me?fields=first_name,name,locale,gender,currency', function (response) {

            user.set({
                lang: response.locale,
                gender: response.gender
            });

            var friends = [];
                    
            friends.push(response.id);

            FB.api('/me/friends?fields=installed,id,name', function (res) {
                angular.forEach(res.data, function (value) {
                    if (value.installed) {
                        friends.push(value.id);
                    }
                });
            });

            user.set({
                friends: friends
            });

            socket.connect();
        });
    }

    return this;
}]);
