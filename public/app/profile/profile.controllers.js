angular.module('profile').

/**
 * @ngdoc controller
 * @name game.controller:profileCtrl
 * @description 
 * The profile controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('profileCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', 'socket', 'user',
    
    function ($rootScope, $scope, $routeParams, $window, $location, $timeout, socket, user) {

        $rootScope.loading = true;

        $scope.$on('$destroy', function () {
            delete $rootScope.loading;
            if (!$scope.profile) {
                return;
            }
            $rootScope.setFavorite($scope.profile.uid, $scope.isFavorite);
        });

        $scope.menu = ['blitz', 'rapid', 'trophies'];

        $scope.letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        $scope.numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

        socket.emit('profile', $routeParams.id);

        socket.emit('profileGames', {
            uid: $routeParams.id,
            type: 'blitz',
            offset: 0
        });

        socket.emit('profileGames', {
            uid: $routeParams.id,
            type: 'rapid',
            offset: 0
        });

        socket.once('profile', function (data) {

            $scope.profile = data;

            var userTrophies = data.trophies || {};

            $scope.trophies = [];
            for (var i = 1; i <= 25; i++) {
                $scope.trophies.push({
                    id: i,
                    value: userTrophies[i] || 0
                });

            };

            delete $rootScope.loading;

        }, $scope);

        $scope.colorGame = user.getColorGame();

        $rootScope.$watch('user.colorGame', function (value) {
            if (value) {
                $scope.colorGame = value;;
            }
        });

        $scope.games = {
            blitz: {
                data: [],
                offset: null,
                count: 0
            },
            rapid: {
                data: [],
                offset: null,
                count: 0
            }
        };

        socket.on('profileGames', function (data) {

            var games = $scope.games[data.type];

            if (!games) {
                return;
            }

            angular.forEach(data.games, function (game) {

                if (game.data.result.value === 1) {
                    game.data.white.isWinner = true;
                    game.data.white.resultPoints = $window.game.getPoints(game.data.white.points, game.data.black.points, 1, game.data.white.countGame);
                    game.data.black.resultPoints = $window.game.getPoints(game.data.black.points, game.data.white.points, 0, game.data.black.countGame);
                } else if (game.data.result.value === 2) {
                    game.data.black.isWinner = true;
                    game.data.white.resultPoints = $window.game.getPoints(game.data.white.points, game.data.black.points, 0, game.data.white.countGame);
                    game.data.black.resultPoints = $window.game.getPoints(game.data.black.points, game.data.white.points, 1, game.data.black.countGame);
                } else if (game.data.result.value === 0) {
                    game.data.white.resultPoints = $window.game.getPoints(game.data.white.points, game.data.black.points, 0.5, game.data.white.countGame);
                    game.data.black.resultPoints = $window.game.getPoints(game.data.black.points, game.data.white.points, 0.5, game.data.black.countGame);
                }

                if (!game.data.lastTime) {
                    game.data.time *= 1000;
                    game.data.increment *= 1000;
                    game.data.timeTurn *= 1000;
                    game.data.white.time *= 1000;
                    game.data.white.timeTurn *= 1000;
                    game.data.black.time *= 1000;
                    game.data.black.timeTurn *= 1000;
                }

                games.data.push(game);
            });

            games.count = data.count;
            games.offset = data.offset;

            delete games.load;

        }, $scope);

        if ($scope.menu.indexOf($location.hash()) === -1) {
            $location.hash('blitz');
            return;
        }

        $scope.$watch(function () {
            return $location.hash();
        }, function (value) {
            if (!value) {
                return;
            }

            if (value && $scope.menu.indexOf(value) === -1) {
                $location.hash('blitz');
            }
            $scope.activeMenu = $location.hash();
        });

        
        $scope.activeMenu = $location.hash();

        $scope.goGame = function (id) {
            $location.path('/game/' + id);
        };

        $scope.openTrophy = function (trophy) {
            var trophies = {};

            trophies[trophy.id] = trophy.value;

            $rootScope.$emit('trophies', {
                share: $rootScope.user.uid === $scope.profile.uid,
                trophies: trophies
            });
        };

        $scope.showMenu = function (menu) {
            $scope.activeMenu = menu;

            if ($location.hash() !== menu) {
                $location.hash(menu);
            }
        };

        $('.app-content').on('scroll', function () {

            var type = $scope.activeMenu,
                games = $scope.games[type];

            if (!games ||
                !games.offset ||
                games.offset >= games.count ||
                games.load ||
                this.scrollTop + this.offsetHeight + $('.app-footer').height() < this.scrollHeight) {
                return;
            }

            games.load = true;
            $scope.$apply();

            socket.emit('profileGames', {
                uid: $routeParams.id,
                type: type,
                offset: games.offset
            });
        });

        componentHandler.upgradeElement($('[data-spinner]')[0]);
    }
]);
