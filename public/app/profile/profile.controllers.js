'use strict';

angular.module('profile').

/**
 * @ngdoc controller
 * @name game.controller:profileCtrl
 * @description 
 * The profile controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('profileCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$anchorScroll', 'socket',
    
    function ($rootScope, $scope, $routeParams, $window, $location, $timeout, $anchorScroll, socket) {

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
        socket.emit('profileGames', $routeParams.id);

        $scope.activeMenu = $location.hash() || 'games';

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

        socket.once('profileGames', function (data) {

            angular.forEach(data, function (game) {
                if (game.data.result.value === 1) {
                    game.data.white.isWinner = true;
                    game.data.white.resultPoints = $window.game.getPoints(game.data.white.points, game.data.black.points, 1, game.data.white.countGame);
                    game.data.black.resultPoints = $window.game.getPoints(game.data.black.points, game.data.white.points, 0, game.data.black.countGame);
                } else if (game.data.result.value === 2) {
                    game.data.black.isWinner = true;
                    game.data.white.resultPoints = $window.game.getPoints(game.data.white.points, game.data.black.points, 0, game.data.white.countGame);
                    game.data.black.resultPoints = $window.game.getPoints(game.data.black.points, game.data.white.points, 1, game.data.black.countGame);
                } else {
                    game.data.white.resultPoints = $window.game.getPoints(game.data.white.points, game.data.black.points, 0.5, game.data.white.countGame);
                    game.data.black.resultPoints = $window.game.getPoints(game.data.black.points, game.data.white.points, 0.5, game.data.black.countGame);
                }
            });

            $scope.games = data;

            scroll('games');

        }, $scope);

        $scope.$watch(function () {
            return location.hash;
        }, function (value) {
            $scope.activeMenu = $location.hash();
            $anchorScroll();
        });

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
    }
]);
