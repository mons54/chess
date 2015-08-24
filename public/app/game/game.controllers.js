(function () {

    'use strict';

    angular.module('game.controllers', []).

    controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'utils',
        
        function ($rootScope, $scope, $routeParams, $location, utils) {

            $rootScope.socket.emit('initGame', $routeParams.id);

            $rootScope.socket.on('game', function (data) {
                $scope.$apply(applyGame(data));
            });

            function applyGame(game) {
                if (!game) {
                    $rootScope.user.gid = null;
                    $location.path('/');
                    return; 
                }

                if ($rootScope.user.uid === game.black.uid) {
                    $scope.player1 = game.black;
                    $scope.player2 = game.white;
                } else {
                    $scope.player1 = game.white;
                    $scope.player2 = game.black;
                }

                $scope.game = game;

                countdown();
            }

            function countdown() {

                setTimeout(function() {
                    $scope.$apply(countdown);
                }, 1000);
                
                if (!$scope.game) {
                    return;
                }

                var player = $scope.game[$scope.game.turn];

                if (player.time >= 0) {
                    player.time--;
                }

                if (player.timeTurn >= 0) {
                    player.timeTurn--;
                }
            }

            $scope.formatTime = function (time) {
                var minute = Math.floor(time / 60),
                    seconde = Math.floor(time - (minute * 60));
                return utils.sprintf(minute) + ':' + utils.sprintf(seconde);
            };

            $scope.move = function (position) {
                $rootScope.socket.emit('move', position);
            };
        }
    ]);
})();
