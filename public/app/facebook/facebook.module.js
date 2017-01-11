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
constant('facebookRedirectUri', 'https://apps.facebook.com/1687859708170830').

/**
 * @ngdoc service
 * @name facebook.service:facebook
 * @description 
 * Facebook service.
 * @requires $rootScope
 * @requires global.service:socket
 * @requires global.service:lang
 */
service('facebook', ['$rootScope', '$cookies', 'socket', 'lang',

    function ($rootScope, $cookies, socket, lang) {

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

        /**
         * @ngdoc function
         * @name #init
         * @methodOf facebook.service:facebook
         * @description
         * Init app Facebook.
         */
        this.init = function () {
            FB.init({
                appId: '1687859708170830',
                xfbml: true,
                version: 'v2.8'
            });
        };

        /**
         * @ngdoc function
         * @name #setLoginStatus
         * @methodOf facebook.service:facebook
         * @description
         * Set Facebook login status.
         * @param {function} callback Callback
         */
        this.setLoginStatus = function (callback) {
            FB.getLoginStatus(function (response) {
                setLoginStatus(response);
                callback();
            });
        };

        /**
         * @ngdoc function
         * @name #login
         * @methodOf facebook.service:facebook
         * @description
         * Facebook login.
         */
        this.login = function () {
            if (this.status === 'connected') {
                this.handleLogin();
            } else {
                FB.login(function (response) {
                    setLoginStatus(response);
                    self.handleLogin();
                }, {
                    scope: 'user_friends'
                });
            }
        };

        /**
         * @ngdoc function
         * @name #logout
         * @methodOf facebook.service:facebook
         * @description
         * Facebook logout.
         */
        this.logout = function () {
            FB.logout(function () {
                socket.disconnect();
            });
        };

        /**
         * @ngdoc function
         * @name #handleLogin
         * @methodOf facebook.service:facebook
         * @description
         * Set user data from facebook.
         * Set user friends from facebook list.
         */
        this.handleLogin = function () {

            if (!this.isFacebookApp) {
                $cookies.put('login', 'facebook');
            }
            
            FB.api('/me?fields=first_name,name,locale,gender,currency', function (response) {

                lang.set(response.locale);

                $rootScope.user.gender = response.gender;

                socket.connect();

                if ($rootScope.user.friends.length) {
                    return;
                }
                        
                $rootScope.user.friends.push(response.id);

                FB.api('/me/friends?fields=installed,id,name', function (res) {
                    angular.forEach(res.data, function (value) {
                        if (value.installed) {
                            $rootScope.user.friends.push(value.id);
                        }
                    });
                });
            });
        }

        return this;
    }
]);

/**
 * Init the SDK Facebook
 */
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
