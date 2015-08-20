(function () {
    
    'use strict';

    angular.

    module('app', [
        'ngRoute',
        'components.services',
        'components.directives',
        'home.controllers',
        'home.directives',
        'game.controllers',
        'ranking.controllers',
        'trophies.controllers'
    ]).

    constant('appId', '466889913406471').

    constant('host', 'mons54.parthuisot.fr').

    constant('paramsGame', {
        colors: ['white', 'black'],
        times: [300, 600, 1200, 3600, 5400],
        points: {
            min: 1200,
            max: 3000
        }
    }).

    factory('utils', ['$rootScope',
        function ($rootScope) {

            return {
                sprintf: function(value) {
                    return (value.toString().length == 1 ? '0' : '') + value;
                },
                getTokens: function () {
                    return [
                        {
                            id: 5,
                            number: 5000,
                            base: 1000,
                            price: this.convertPrice(20),
                        },
                        {
                            id: 4,
                            number: 1500,
                            base: 500,
                            price: this.convertPrice(10)
                        },
                        {
                            id: 3,
                            number: 500,
                            base: 250,
                            price: this.convertPrice(5)
                        },
                        {
                            id: 2,
                            number: 150,
                            base: 100,
                            price: this.convertPrice(2)
                        },
                        {
                            id: 1,
                            number: 50,
                            base: 50,
                            price: this.convertPrice(1)
                        }
                    ];


                },
                convertPrice: function (price) {

                    var userCurrency = $rootScope.user.currency,
                        currency = this.getCurrency(userCurrency.user_currency),
                        rate = userCurrency.usd_exchange_inverse,
                        newPrice = Math.round((price * rate) * 100) / 100,
                        localPrice = String(newPrice).split('.'),
                        minorUnits = localPrice[1] ? localPrice[1].substr(0, 2) : '',
                        majorUnits = localPrice[0] || "0",
                        separator = (1.1).toLocaleString()[1];

                    return currency + ' ' + String(majorUnits) + (minorUnits ? separator + minorUnits : '') + ' ' + userCurrency.user_currency;
                },
                getCurrency: function (currency) {

                    switch (currency) {
                        case 'BOB': return 'Bs';
                        case 'BRL': return 'R$';
                        case 'GBP': return '£';
                        case 'CAD': return 'C$';
                        case 'CZK': return 'Kc';
                        case 'DKK': return 'kr';
                        case 'EUR': return '€';
                        case 'GTQ': return 'Q';
                        case 'HNL': return 'L';
                        case 'HKD': return 'HK$';
                        case 'HUF': return 'Ft';
                        case 'ISK': return 'kr';
                        case 'INR': return 'Rs.';
                        case 'IDR': return 'Rp';
                        case 'ILS': return '₪';
                        case 'JPY': return '¥';
                        case 'KRW': return 'W';
                        case 'MYR': return 'RM';
                        case 'NIO': return 'C$';
                        case 'NOK': return 'kr';
                        case 'PEN': return 'S/.';
                        case 'PHP': return 'P';
                        case 'PLN': return 'zł';
                        case 'QAR': return 'ر.ق';
                        case 'RON': return 'L';
                        case 'RUB': return 'руб';
                        case 'SAR': return 'ر.س';
                        case 'SGD': return 'S$';
                        case 'ZAR': return 'R';
                        case 'SEK': return 'kr';
                        case 'CHF': return 'CHF';
                        case 'TWD': return 'NT$';
                        case 'THB': return 'B';
                        case 'TRY': return 'YTL';
                        case 'AED': return 'د.إ';
                        case 'UYU': return 'UYU';
                        case 'VEF': return 'VEF';
                        case 'VND': return '₫';
                        default: return '$';
                    }
                }
            };
        }
    ]).

    run(['$rootScope', '$http', 'appId', 'lfstmedia',

        function ($rootScope, $http, appId, lfstmedia) {
            
            $rootScope.loading = true;

            $rootScope.user = {
                uid: null,
                accessToken: null,
                name: 'User',
                lang: 'en',
                gender: 'male',
                moderateur: false,
                currency: null,
                friends: [],
                sponsorship: null
            };

            window.fbAsyncInit = function () {

                FB.init({
                    appId: appId,
                    xfbml: true,
                    version: 'v2.2'
                });

                getLoginStatus();
            };

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

            function socketConnect (res) {
                    
                $rootScope.user.uid = res.id;
                $rootScope.user.firstName = res.first_name;
                $rootScope.user.name = res.name.substr(0, 30);
                $rootScope.user.lang = res.locale.substr(0, 2);
                $rootScope.user.gender = res.gender;
                $rootScope.user.currency = res.currency;
                $rootScope.user.friends.push($rootScope.user.uid);
                    
                getDictionarie();

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
                    $rootScope.loading = false;
                    ready();
                });

                $rootScope.socket.on('game', function (data) {
                    console.log(data);
                    // Redirect game
                });
            }

            function ready () {

                lfstmedia.init();

                $rootScope.$apply(function () {
                    $rootScope.ready = true;
                });
            }
        }
    ]).

    config(['$routeProvider',
        function($routeProvider) {
            $routeProvider
            .when('/', {
                templateUrl: '/app/home/home.html',
                controller: 'homeCtrl'
            })
            .when('/ranking', {
                templateUrl: '/app/ranking/ranking.html',
                controller: 'rankingCtrl'
            })
            .when('/trophies', {
                templateUrl: '/app/trophies/trophies.html',
                controller: 'trophiesCtrl'
            })
            .when('/game', {
                templateUrl: 'app/game/game.html',
                controller: 'gameCtrl'
            })
            .otherwise({
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
