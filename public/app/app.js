/**
 * @ngdoc overview
 * @name app
 * @description
 * App module.
 * @requires ngRoute
 * @requires ngCookies
 * @requires components
 * @requires game
 * @requires home
 * @requires ranking
 * @requires trophies
 */
angular.module('app', [
    'ngRoute',
    'ngCookies',
    'global',
    'facebook',
    'google',
    'components',
    'game',
    'home',
    'ranking',
    'trophies',
    'profile'
]).

run(['$rootScope', '$route', '$http', '$location', '$window', '$timeout', 'user', 'socket', 'modal', 'facebook', 'google', 'translator', 'utils',

    /**
     * @param {object} $rootScope Global scope
     * @param {object} $route Service route
     * @param {object} $http Service http
     * @param {object} $location Service location
     * @param {object} $window Service window
     * @param {object} $window Service window
     * @param {object} user User service
     * @param {object} modal Modal service
     * @param {object} facebook Facebook service
     * @param {object} google Google service
     */
    function ($rootScope, $route, $http, $location, $window, $timeout, user, socket, modal, facebook, google, translator, utils) {

        $rootScope.$on('$routeChangeStart', function(event, toState, fromState) {

            if ($rootScope.user && $rootScope.user.gid) {
                if (fromState.name === 'game' && fromState.params.id === $rootScope.user.gid) {
                    event.preventDefault();
                    return;
                }
                if (toState.name !== 'game' || toState.params.id === $rootScope.user.gid) {
                    redirectToGame();
                }
            }
        });

        $rootScope.$on('$routeChangeSuccess', function(event, toState, fromState) {

            $('[autoscroll]').scrollTop(0);

            setTitle(toState.title);

            $rootScope.currentRoute = toState.name;

            hideModal();
            closeDrawer();
            
            // Used for refresh user when join home if true
            if (fromState && $rootScope.user && !$rootScope.user.refresh) {
                $rootScope.user.refresh = true;
            }
        });

        
        function closeDrawer () {

            var drawer = angular.element('.mdl-layout__drawer');
            if (!drawer || !drawer.hasClass('is-visible')) {
                return;
            }

            var layout = document.querySelector('.mdl-layout.is-small-screen').MaterialLayout;
            if (!layout) {
                return;
            }

            layout.toggleDrawer();
        }

        $rootScope.closeDrawer = closeDrawer;

        $rootScope.facebookLogin = function () {
            facebook.login();
        };

        $rootScope.googleLogin = function () {
            google.login();
        };

        $rootScope.reconnect = function () {
            socket.connect();
        };

        $rootScope.logout = function () {
            if (facebook.isFacebookApp) {
                return;
            }

            logout();
        };

        $rootScope.$on('lang', function (event, value) {
            $rootScope.lang = value;
            setTitle($route.current.title);
        });

        $rootScope.$watchCollection('dataGame', function (value, oldValue) {
            if (value && oldValue) {
                user.setDataGame(value);
            }
        });

        $rootScope.inviteFriends = utils.inviteFriends;

        function setTitle(title) {
            if (typeof title !== 'string') {
                title = 'title';
            }
            $rootScope.title = title;

            angular.element('title').text(translator.translate($rootScope.title) + ' - World of Chess');
        }

        function logout() {
            delete $rootScope.connected;
            user.setLogin(false);
            socket.disconnect();
            initUser();
            modalConnect.show();
        }

        /**
         * Redirect to the game in progress of the user.
         */
        function redirectToGame () {
            $location.path('/game/' + $rootScope.user.gid);
        }

        function setLoginStatus() {
            facebookSetLoginStatus();
            googleSetLoginStatus();
        }

        function facebookSetLoginStatus () {
            facebook.setLoginStatus(callBackLoginStatus);
        }

        function googleSetLoginStatus () {
            google.setLoginStatus(callBackLoginStatus);
        }

        function callBackLoginStatus(service) {

            if (!service) {
                return;
            }

            var login = user.getLogin();

            if (facebook.isFacebookApp) {
                login = facebook.name;
            }

            if (!facebook.isFacebookApp && (!login || login === service.name && service.status !== 'connected')) {
                modalConnect.show();
                return;
            }


            if (login === service.name) {
                if (service.status === 'connected') {
                    service.handleLogin();
                } else if (facebook.isFacebookApp) {
                    facebook.login();
                }
            }
        }

        function initUser() {
            $rootScope.user = {
                friends: []
            };
        }

        function hideModal() {
            $('#modal-container').empty();
            modal('[data-modal]').hide();
        }

        socket.on('connect', function () {

            delete $rootScope.disconnectMultiSocket;

            var login = facebook.isFacebookApp ? 'facebook' : user.getLogin();

            if (!login) {
                logout();
                return;
            }

            var success = false

            if (login === 'facebook' && facebook.auth) {
                socket.emit('facebookConnect', facebook.auth);
                success = true;
            } else if (login === 'google' && google.auth) {
                socket.emit('googleConnect', google.auth);
                success = true;
            }

            if (success) {
                modalConnect.hide();
                $rootScope.loading = true;
                $rootScope.connected = true;
            }
        });

        socket.on('refreshAccessToken', function () {

            if ($rootScope.refreshAccessToken) {
                logout();
            }

            $rootScope.refreshAccessToken = true;

            socket.disconnect();

            setLoginStatus();
        });

        socket.on('disconnect', function (data) {
            delete $rootScope.ready;
            $rootScope.isDisconnected = true;
            if (data === 'io server disconnect') {
                hideModal();
                $rootScope.disconnectMultiSocket = true;
            } else if (!$rootScope.unauthorized) {
                $rootScope.loading = true;
            }
        });

        socket.on('unauthorized', function () {
            $rootScope.unauthorized = true;
            socket.disconnect();
        });

        socket.on('user', function (data) {
            angular.extend($rootScope.user, data);
        });

        socket.on('startGame', function (gid) {
            $rootScope.user.gid = gid;
            redirectToGame();
        });

        socket.on('connected', function (data) {

            translator.use(data.lang);

            if (data.gid) {
                $rootScope.user.gid = data.gid;
                redirectToGame();
            }

            if ($rootScope.isDisconnected) {
                $route.reload();
            } else {
                if (!data.dataGame) {
                    data.dataGame = {
                        color: null,
                        game: 0,
                        pointsMin: null,
                        pointsMax: null
                    };
                }

                user.setDataGame(data.dataGame);
                user.setColorGame(data.colorGame);
                user.setSound(data.sound);
            }

            angular.extend($rootScope.user, {
                uid: data.uid,
                name: data.name,
                avatar: data.avatar,
                lang: data.lang
            });

            delete $rootScope.refreshAccessToken;
            delete $rootScope.isDisconnected;
            delete $rootScope.loadModalProfile;
            delete $rootScope.loading;

            $rootScope.ready = true;
        });

        socket.on('trophies', function (data) {
            $timeout(function () {
                $rootScope.user.trophies = data.trophies;
                $rootScope.$emit('trophies', {
                    share: true,
                    trophies: data.newTrophies
                });
            }, 1000);
        });

        $rootScope.setFavorite = function (uid, value) {

            if (!$rootScope.user.favorites) {
                return;
            }

            var isFavorite = $rootScope.isFavorite(uid);
            
            if (value === isFavorite) {
                return;
            }
            
            if (value) {
                socket.emit('addFavorite', uid);
                $timeout(function () {
                    $rootScope.user.favorites.push(uid);
                });
            } else  {
                var index = $rootScope.user.favorites.indexOf(uid);
                socket.emit('removeFavorite', uid);
                $timeout(function () {
                    $rootScope.user.favorites.splice(index, 1);
                });
            }
        };

        $rootScope.isFavorite = function (uid) {
            return $rootScope.user.favorites && $rootScope.user.favorites.indexOf(uid) !== -1;
        };
        
        $window.onbeforeunload = function () {
            $rootScope.$emit('unload');
            if ($rootScope.isDisconnected) {
                return;
            }
            socket.emit('updateUser', {
                dataGame: user.getDataGame(),
                colorGame: user.getColorGame(),
                sound: user.getSound()
            });
        };

        $window.onhashchange = function () {
            hideModal();
            closeDrawer();
        };

        $window.fbAsyncInit = function () {

            facebook.init();

            facebookSetLoginStatus();
        };

        var modalConnect = modal('#modal-connect');

        facebook.isFacebookApp = angular.element('html').data('facebook');

        $rootScope.isFacebookApp = facebook.isFacebookApp;

        if (!facebook.isFacebookApp && typeof gapi !== 'undefined' && gapi.load) {
            gapi.load('client', function () {
                google.init().then(googleSetLoginStatus);
            });
        }

        initUser();

        translator.use(translator.navigator);
        
        (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        $window.twttr = (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
            t = $window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function(f) {
            t._e.push(f);
            };

            return t;
        }(document, 'script', 'twitter-wjs'));
    }
]).

config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider
        .when('/', {
            name : 'home',
            templateUrl: '/app/home/templates/home.html',
            controller: 'homeCtrl'
        })
        .when('/game/:id', {
            name : 'game',
            templateUrl: '/app/game/templates/game.html',
            controller: 'gameCtrl'
        })
        .when('/ranking/:type/:page?', {
            name : 'ranking',
            title: 'ranking',
            templateUrl: '/app/ranking/templates/ranking.html',
            controller: 'rankingCtrl'
        })
        .when('/trophies', {
            name : 'trophies',
            title: 'trophies.title',
            templateUrl: '/app/trophies/templates/trophies.html',
            controller: 'trophiesCtrl'
        })
        .when('/profile/:id', {
            name : 'profile',
            templateUrl: '/app/profile/templates/profile.html',
            controller: 'profileCtrl',
            reloadOnSearch: false
        })
        .otherwise({
            redirectTo: '/'
        });

        $locationProvider.html5Mode(true);
    }
]);
