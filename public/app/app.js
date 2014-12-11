(function () {
    
    'use strict';

    angular.

    module('app', [
        'ngRoute',
        'components.services',
        'components.directives',
        'home.controllers',
        'home.directives'
    ]).

    constant('appId', '466889913406471').

    constant('paramsGame', {
        colors: ['white', 'black'],
        times: [300, 600, 1200, 3600, 5400],
        pointsMin: [1300, 1400, 1500, 1600, 1700, 1800],
        pointsMax: [1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500]
    }).

    factory('utils', function () {

        return {
            sprintf: function(value) {
                return (value.toString().length == 1 ? '0' : '') + value;
            }
        };
    }).

    run(['$rootScope', '$http', 'loading', 'appId', 'lfstmedia',

        function ($rootScope, $http, loading, appId, lfstmedia) {
            
            loading.show();

            $rootScope.user = {
                uid: null,
                name: 'User',
                lang: 'en',
                gender: 'male',
                moderateur: false,
                friends: [],
                sponsorship: null
            };

            window.fbAsyncInit = function () {

                FB.init({
                    appId: appId,
                    xfbml: true,
                    version: 'v2.1'
                });

                init();
            };

            function init () {

                getLoginStatus(getMe);
            }

            function getLoginStatus (callback) {

                FB.getLoginStatus(function (res) {
                    if (res.status !== 'connected') {
                        return login();
                    }
                    callback(res);
                });
            }

            function login () {
                FB.login(function (res) {
                    getMe();
                });
            }

            function getMe () {
                
                FB.api('/me', function (res) {
                    
                    $rootScope.user.uid = res.id;
                    $rootScope.user.firstName = res.first_name;
                    $rootScope.user.name = res.name.substr(0, 30);
                    $rootScope.user.lang = res.locale.substr(0, 2);
                    $rootScope.user.gender = res.gender;
                    $rootScope.user.friends.push($rootScope.user.uid);
                    
                    getDictionarie();

                    FB.api('/me/friends?fields=installed,id,name', function (res) {
                        setFriends(res.data);
                    });
                    
                    socketConnect();
                });
            }

            function setFriends (data) {
                angular.forEach(data, function (value) {
                    if (value.installed) {
                        $rootScope.user.friends.push(value.id);
                    }
                });
            }

            function getDictionarie () {
                $http.get('json/dictionaries/' + $rootScope.user.lang + '.json')
                .success(function(data) {
                    $rootScope.text = data;
                })
                .error(function (err) {
                    $rootScope.user.lang = 'en';
                    getDictionarie();
                });
            }

            function socketConnect () {
                $rootScope.socket = io.connect();

                $rootScope.socket.on('connect', function () {
                    getLoginStatus(socketCreate);
                });
            }

            function socketCreate (res) {
                $rootScope.socket.emit('init', {
                    uid: res.authResponse.userID,
                    accessToken: res.authResponse.accessToken,
                    name: $rootScope.user.name
                });

                $rootScope.socket.on('infosUser', function (data) {
                    angular.extend($rootScope.user, data);
                    loading.hide();
                    ready();
                });
            }

            function ready () {

                $rootScope.ready = true;

                lfstmedia.init();

                $rootScope.getProfil = function (data) {
                    $rootScope.socket.emit('Profil', data.uid, data.name);
                };

                $rootScope.closeModalProfil = function() {
                    $rootScope.modal.remove();
                    delete $rootScope.modal;
                };

                $rootScope.$apply();
            }
        }
    ]).

    config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
            
            when('/', {
                templateUrl: '/app/home/home.html',
                controller: 'homeCtrl'
            }).

            otherwise({
                redirectTo: '/'
            });
        }
    ])

})();

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
