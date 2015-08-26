(function () {

    'use strict';

    angular.module('game.controllers', []).

    controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location',
        
        function ($rootScope, $scope, $routeParams, $location) {

            $rootScope.socket.emit('initGame', $routeParams.id);

            $rootScope.socket.on('game', function (data) {
                $scope.$apply(applyGame(data));
            });

            $scope.getPieceClass = function (position) {
                if (!$scope.game.pieces[position]) {
                    return;
                }
                return 'piece icon icon-' + $scope.game.pieces[position].color + ' icon-chess-' + $scope.game.pieces[position].name;
            };

            function applyGame(game) {
                if (!game) {
                    $rootScope.user.gid = null;
                    $location.path('/');
                    return; 
                }

                $scope.letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                $scope.numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

                if ($rootScope.user.uid === game.black.uid) {
                    $scope.player1 = game.black;
                    $scope.player2 = game.white;
                    $scope.orientation = 'black';
                    $scope.numbers.reverse();
                } else {
                    $scope.player1 = game.white;
                    $scope.player2 = game.black;
                    $scope.orientation = 'white';
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

                if (player.timeTurn > player.time) {
                    player.timeTurn = player.time;
                }

                if (player.time > 0) {
                    player.time--;
                }

                if (player.timeTurn > 0) {
                    player.timeTurn--;
                }
            }

            $scope.isPlayerTurn = function() {
                return $scope.game[$scope.game.turn].uid === $rootScope.user.uid;
            }

            $scope.move = function (start, end) {
                // add promotion if need
                $rootScope.socket.emit('move', {
                    id: $scope.game.id,
                    start: start,
                    end: end,
                    //promotion: promotion
                });
            };
        }
    ]).
    
    controller('profileGameCtrl', ['$rootScope', '$scope', 'utils',
        
        function ($rootScope, $scope, utils) {
            
            $scope.formatTime = function (time) {
                if (typeof time === 'undefined') {
                    return;
                }

                var minute = Math.floor(time / 60),
                    seconde = Math.floor(time - (minute * 60));

                return utils.sprintf(minute) + ':' + utils.sprintf(seconde);
            };
        }
    ]);
})();
