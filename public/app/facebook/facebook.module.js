/**
 * @ngdoc overview
 * @name facebook
 * @description 
 * Facebook module
 */
angular.module('facebook', []).

/**
 * @ngdoc parameters
 * @name facebook.constant:facebookAppId
 * @description
 * The redirect uri.
 */
constant('facebookAppId', $('html').data('env') === 'dev' ? '1709923609297773' : '1687859708170830').

/**
 * @ngdoc service
 * @name facebook.service:facebook
 * @description 
 * Facebook service.
 * @requires $rootScope
 * @requires global.service:user
 * @requires global.service:socket
 */
service('facebook', ['$rootScope', '$q', 'user', 'socket', 'facebookAppId',

    function ($rootScope, $q, user, socket, facebookAppId) {

        this.name = 'facebook';

        this.init = function () {
            FB.init({
                appId: facebookAppId,
                xfbml: true,
                version: 'v2.8'
            });
        };

        this.silenceLogin = function () {

            var deferred = $q.defer();

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    deferred.resolve(response);
                    this.handleLogin(response);
                } else {
                    deferred.reject(response);
                }
            }.bind(this));

            return deferred.promise;
        };

        this.login = function () {

            var deferred = $q.defer();

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    deferred.resolve(response);
                    this.handleLogin(response);
                } else {
                    FB.login(function (response) {
                        if (response.authResponse) {
                            deferred.resolve(response);
                            this.handleLogin(response);
                        } else {
                            deferred.reject(response);
                        }
                    }.bind(this), {
                        scope: 'user_friends'
                    });
                }
            }.bind(this));

            return deferred.promise;
        };

        this.handleLogin = function (response) {

            if (!this.isFacebookApp) {
                user.setLogin(this.name);
            }

            this.auth = {
                id: response.authResponse.userID,
                accessToken: response.authResponse.accessToken
            };
            
            socket.connect();

            if ($rootScope.user.friends.length) {
                return;
            }
                        
            $rootScope.user.friends.push(this.auth.id);

            FB.api('/me/friends?fields=installed,id,name', function (res) {
                angular.forEach(res.data, function (value) {
                    if (value.installed) {
                        $rootScope.user.friends.push(value.id);
                    }
                });
            });
        };

        return this;
    }
]);
