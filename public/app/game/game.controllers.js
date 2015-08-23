(function () {

    'use strict';

    angular.module('game.controllers', []).

    controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location',
        
        function ($rootScope, $scope, $routeParams, $location) {

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

                console.log($scope.player1);

                $scope.game = game;
            }

            $scope.move = function (position) {
                $rootScope.socket.emit('move', position);
            };
        }
    ]);
})();
