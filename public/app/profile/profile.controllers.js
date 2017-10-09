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

        $rootScope.loadingContent = true;

        $scope.$on('$destroy', function () {
            delete $rootScope.loadingContent;
            if (!$scope.profile) {
                return;
            }
            $rootScope.setFavorite($scope.profile.uid, $scope.isFavorite);
            $rootScope.setBlackList($scope.profile.uid, $scope.isBlackList);
        });

        if ($routeParams.type !== 'blitz' &&
            $routeParams.type !== 'rapid') {
            $routeParams.type = 'blitz';
        }

        $scope.uid = $routeParams.uid;

        $scope.type = $scope.activeMenu = $routeParams.type;

        $scope.letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        $scope.numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

        $scope.colorGame = user.getColorGame();

        $scope.games = {
            data: [],
            offset: null,
            count: 0,
            load: true
        };

        socket.emit('profileGames', {
            uid: $routeParams.uid,
            type: $routeParams.type,
            offset: 0
        });

        $scope.$watch('profile', function (data) {

            if (!data) {
                return;
            }

            $rootScope.title = data.name;

            delete $rootScope.loadingContent;
        });

        $rootScope.$watch('user.colorGame', function (value) {
            if (value) {
                $scope.colorGame = value;;
            }
        });

        socket.on('profileGames', function (data) {

            var games = $scope.games;

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

                $scope.games.data.push(game);
            });

            $scope.games.count = data.count;
            $scope.games.offset = data.offset;

            delete $scope.games.load;

        }, $scope);

        $scope.goGame = function (id) {
            $location.path('/game/' + id);
        };

        $('.app-content').on('scroll', function () {

            var type = $routeParams.type,
                games = $scope.games;

            if (!$scope.games.offset ||
                $scope.games.offset >= $scope.games.count ||
                $scope.games.load ||
                this.scrollTop + this.offsetHeight + $('.app-footer').height() < this.scrollHeight) {
                return;
            }

            $scope.games.load = true;
            $scope.$apply();

            socket.emit('profileGames', {
                uid: $routeParams.id,
                type: type,
                offset: $scope.games.offset
            });
        });

        componentHandler.upgradeElement($('[data-spinner]')[0]);
    }
]);
