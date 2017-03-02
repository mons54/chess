angular.module('profile').

/**
 * @ngdoc controller
 * @name game.controller:profileCtrl
 * @description 
 * The profile controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('profileCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$anchorScroll', 'socket', 'user',
    
    function ($rootScope, $scope, $routeParams, $window, $location, $timeout, $anchorScroll, socket, user) {

        $rootScope.loading = true;

        $scope.$on('$destroy', function () {
            delete $rootScope.loading;
            if (!$scope.profile) {
                return;
            }
            $rootScope.setFavorite($scope.profile.uid, $scope.isFavorite);
        });

        $scope.letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        $scope.numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

        socket.emit('profile', $routeParams.id);
        socket.emit('profileGames', {
            uid: $routeParams.id,
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

            scroll('trophies');

        }, $scope);

        $scope.colorGame = user.getColorGame();

        $rootScope.$watch('user.colorGame', function (value) {
            if (value) {
                $scope.colorGame = value;;
            }
        });

        $scope.games = [];

        socket.on('profileGames', function (data) {

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

                $scope.games.push(game);
            });

            if (data.offset === 0) {
                scroll('games');
            }

            $scope.countGames = data.count;
            $scope.offsetGames = data.offset;

            delete $scope.loadGames;

        }, $scope);

        $scope.$watch(function () {
            return location.hash;
        }, function (value) {
            $scope.activeMenu = !!$location.hash() ? $location.hash() : 'games';
            $anchorScroll();
        });

        $scope.goGame = function (id) {
            $location.path('/game/' + id);
        };

        function scroll (menu) {
            if ($location.hash() === menu) {
                $timeout(function() {
                    $anchorScroll();
                });
            }
        }

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
            } else {
                $anchorScroll();
            }
        };

        $('.app-content').on('scroll', function () {

            if ($scope.activeMenu !== 'games' || 
                $scope.offsetGames >= $scope.countGames ||
                $scope.loadGames ||
                this.scrollTop + this.offsetHeight + $('.app-footer').height() < this.scrollHeight) {
                return;
            }

            $scope.loadGames = true;
            $scope.$apply();

            socket.emit('profileGames', {
                uid: $routeParams.id,
                offset: $scope.offsetGames
            });
        });

        componentHandler.upgradeElement($('[data-spinner]')[0]);
    }
]);
