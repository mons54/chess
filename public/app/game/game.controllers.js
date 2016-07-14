(function () {

    'use strict';

    angular.module('game.controllers', []).

    controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', 'utils',
        
        function ($rootScope, $scope, $routeParams, $location, $filter, utils) {

            $rootScope.socket.emit('initGame', $routeParams.id);

            $rootScope.socket.on('game', function (data) {
                $scope.$apply(applyGame(data));
            });

            $rootScope.socket.on('offerDraw', function (data) {
                angular.element('#modal-response-draw').modal('show');
            });

            $scope.getPieceClass = function (position) {
                if (!$scope.game.pieces[position]) {
                    return;
                }
                return 'piece icon icon-' + $scope.game.pieces[position].color + ' icon-chess-' + $scope.game.pieces[position].name;
            };

            $scope.isLastTurn = function (position) {
                if ($scope.game.lastTurn.start === position || $scope.game.lastTurn.end === position) {
                    return 'last-turn';
                }
            };

            $scope.acceptDraw = function () {
                $rootScope.socket.emit('acceptDraw', $scope.game.id);
            };

            $scope.move = function (start, end, promotion) {
                $rootScope.socket.emit('moveGame', {
                    id: $scope.game.id,
                    start: start,
                    end: end,
                    promotion: promotion
                });
            };

            $scope.isPlayerTurn = function() {
                return $scope.game[$scope.game.turn].uid === $rootScope.user.uid;
            };

            $scope.shareResult = function () {
                if (!$scope.game.finish) {
                    return;
                }

                var caption = $scope.game.white.name + ' VS ' + $scope.game.black.name + ' - ' + $filter('translate')($scope.game.result.name);

                if ($scope.game.result.winner === 1) {
                    caption += ' - ' + $filter('translate')('winner') + ': ' + $scope.game.white.name;
                } else if ($scope.game.result.winner === 2) {
                    caption += ' - ' + $filter('translate')('winner') + ': ' + $scope.game.black.name;
                }

                utils.share(caption);
            };

            function applyGame(game) {
                if (!game) {
                    $rootScope.user.gid = null;
                    $location.path('/');
                    return; 
                }

                if (game.finish) {
                    $rootScope.user.gid = null;
                    angular.element('#modal-finish-game').modal('show');
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
            }

            function countdown() {

                setTimeout(function() {
                    $scope.$apply(countdown);
                }, 1000);
                
                if (!$scope.game || $scope.game.finish) {
                    return;
                }

                var player = $scope.game[$scope.game.turn];

                if (player.time > 0) {
                    player.time--;
                }

                if (player.timeTurn > 0) {
                    player.timeTurn--;
                }
            }

            countdown();
        }
    ]).
    
    controller('profileGameCtrl', ['$rootScope', '$scope', 'utils',
        
        function ($rootScope, $scope, utils) {

            $scope.resign = function () {
                $rootScope.socket.emit('resign', $scope.$parent.game.id);
            };

            $scope.offerDraw = function () {
                $scope.player.disableOfferDraw = true;
                $rootScope.socket.emit('offerDraw', $scope.$parent.game.id);
            };

            $scope.isPlayerUser = function () {
                return $scope.player && $scope.player.uid && $scope.player.uid === $rootScope.user.uid;
            };

            $scope.isFinish = function () {
                return $scope.$parent.game.finish;
            };

            $scope.canOfferDraw = function () {
                return !$scope.player.disableOfferDraw && $scope.player.offerDraw < $scope.$parent.game.maxOfferDraw;
            };
            
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
