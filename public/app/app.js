(function () {
    
    'use strict';

    angular.

    module('app', [
        'ngRoute',
        'easypiechart',
        'pascalprecht.translate',
        'components.services',
        'components.directives',
        'home.controllers',
        'home.directives',
        'game.controllers',
        'game.directives',
        'ranking.controllers',
        'trophies.controllers'
    ]).

    constant('appId', '466889913406471').

    constant('host', 'mons54.parthuisot.fr').

    constant('redirectUri', 'https://apps.facebook.com/the-chess-game/').

    constant('paramsGame', {
        colors: ['white', 'black'],
        times: [300, 600, 1200, 3600, 5400],
        points: {
            min: 1200,
            max: 3000
        }
    }).

    constant('trophies', {
        1: '_1_game',
        2: '_100_game',
        3: '_500_game',
        4: '_1000_game',
        5: '_5000_game',
        6: '_1_wins',
        7: '_50_wins',
        8: '_250_wins',
        9: '_500_wins',
        10: '_2000_wins',
        11: '_5_games_day',
        12: '_10_games_day',
        13: '_25_games_day',
        14: '_50_games_day',
        15: '_100_games_day',
        16: '_3_wins_cons',
        17: '_5_wins_cons',
        18: '_10_wins_cons',
        19: '_20_wins_cons',
        20: '_3_loses_cons'
    }).

    factory('utils', ['$rootScope', '$filter', 'redirectUri', 'host',
        
        function ($rootScope, $filter, redirectUri, host) {

            return {
                sprintf: function(value) {
                    return (value.toString().length == 1 ? '0' : '') + value;
                },
                share: function (caption) {
                    FB.ui({
                        method: 'feed',
                        redirect_uri: redirectUri,
                        link: redirectUri,
                        picture: 'https://' + host + '/images/mini-icon.png',
                        name: $filter('translate')('title'),
                        caption: caption,
                        description: $filter('translate')('description')
                    });
                }
            };
        }
    ]).

    run(['$rootScope', '$route', '$translate', '$http', '$location', 'appId', 'lfstmedia',

        function ($rootScope, $route, $translate, $http, $location, appId, lfstmedia) {

            $rootScope.$on('$routeChangeStart', function(next, current) {
                if (!$rootScope.user.gid) {
                    return;
                }
                redirectToGame();
            });

            $rootScope.$on('$routeChangeSuccess', function() {
                $rootScope.title = $route.current.title;
            });
            
            $rootScope.loading = true;

            $rootScope.user = {
                uid: null,
                accessToken: null,
                name: 'User',
                lang: 'en',
                gender: 'male',
                moderateur: false,
                currency: null,
                friends: []
            };

            window.fbAsyncInit = function () {

                FB.init({
                    appId: appId,
                    xfbml: true,
                    version: 'v2.2'
                });

                getLoginStatus();
            };

            function redirectToGame() {
                $location.path('/game/' + $rootScope.user.gid);
            }

            function getLoginStatus () {
                FB.getLoginStatus(function (res) {
                    if (res.status !== 'connected') {
                        return login();
                    }
                    getMe(res);
                });
            }

            function login () {
                FB.login(function (res) {
                    getMe(res);
                }, {
                    scope: 'user_friends'
                });
            }

            function getMe (res) {

                $rootScope.user.accessToken = res.authResponse.accessToken;
                
                FB.api('/me?fields=first_name,name,locale,gender,currency', socketConnect);
            }

            function setFriends (res) {
                angular.forEach(res.data, function (value) {
                    if (value.installed) {
                        $rootScope.user.friends.push(value.id);
                    }
                });
            }

            function socketConnect (res) {
                    
                $rootScope.user.uid = res.id;
                $rootScope.user.firstName = res.first_name;
                $rootScope.user.name = res.name.substr(0, 30);
                $rootScope.user.lang = res.locale.substr(0, 2);
                $rootScope.user.gender = res.gender;
                $rootScope.user.currency = res.currency;
                $rootScope.user.friends.push($rootScope.user.uid);

                $translate.use($rootScope.user.lang);

                FB.api('/me/friends?fields=installed,id,name', setFriends);

                $rootScope.socket = io.connect();

                $rootScope.socket.on('connect', socketInit);
            }

            function socketInit () {
                $rootScope.socket.emit('init', {
                    uid: $rootScope.user.uid,
                    accessToken: $rootScope.user.accessToken,
                    name: $rootScope.user.name
                });

                $rootScope.socket.on('infosUser', function (data) {
                    angular.extend($rootScope.user, data);
                });

                $rootScope.socket.on('startGame', function (gid) {
                    $rootScope.$apply(applyUserGid(gid));
                });

                $rootScope.socket.on('ready', function () {
                    $rootScope.$apply(applyReady);
                });

                $rootScope.socket.on('trophy', function (data) {
                    console.log(data);
                    console.log($rootScope.user.trophies);
                    angular.extend({}, $rootScope.user.trophies, data);
                });
            }

            function applyUserGid (gid) {
                $rootScope.user.gid = gid;
                redirectToGame();
            }

            function applyReady () {
                $rootScope.ready = true;
                $rootScope.loading = false;
            }
        }
    ]).

    config(['$routeProvider', '$translateProvider',
        function($routeProvider, $translateProvider) {
            $routeProvider
            .when('/', {
                title : 'home',
                templateUrl: '/app/home/home.html',
                controller: 'homeCtrl'
            })
            .when('/ranking', {
                title : 'ranking',
                templateUrl: '/app/ranking/ranking.html',
                controller: 'rankingCtrl'
            })
            .when('/trophies', {
                title : 'trophies',
                templateUrl: '/app/trophies/trophies.html',
                controller: 'trophiesCtrl'
            })
            .when('/game/:id', {
                title : 'game',
                templateUrl: 'app/game/game.html',
                controller: 'gameCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

            $translateProvider.useSanitizeValueStrategy('escape');

            $translateProvider.useStaticFilesLoader({
                'prefix': 'json/dictionaries/',
                'suffix': '.json'
            });

            $translateProvider.preferredLanguage('en');
        }
    ]);

})();

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
