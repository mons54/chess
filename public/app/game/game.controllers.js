'use strict';

angular.module('game').

/**
 * @ngdoc controller
 * @name game.controller:gameCtrl
 * @description 
 * The game controller.
 * @requires $rootScope
 * @requires $scope
 * @requires $routeParams
 * @requires $location
 * @requires $filter
 * @requires $interval
 * @requires global.service:utils
 * @requires components.service:modal
 */
controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', '$interval', 'socket', 'utils', 'modal', 'sound',
    
    function ($rootScope, $scope, $routeParams, $location, $filter, $interval, socket, utils, modal, sound) {
        
        socket.emit('initGame', $routeParams.id);

        var defaultPieces = {
            pawn: 8,
            bishop: 2,
            knight: 2,
            rook: 2,
            queen: 1
        };

        socket.on('game', function (game) {
            if (!game) {
                $rootScope.user.gid = null;
                $location.path('/');
                return; 
            }

            if (sound.timer.played) {
                sound.timer.load();
            }

            if (game.finish) {
                $rootScope.user.gid = null;
                modal.show(modal.get('modal-finish-game'));
            }

            var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
                numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

            /**
             * Play sound if is not player turn and has last turn
             */
            if (!$scope.isPlayerTurn() &&
                $scope.game &&
                game.played.length && 
                game.played.start &&
                game.played[0] !== $scope.game.played[0]) {
                sound[$scope.game.pieces[game.played[0].end] ? 'capture' : 'deplace'].load().play();
            }

            game.black.lostPieces = angular.copy(defaultPieces);
            game.white.lostPieces = angular.copy(defaultPieces);

            angular.forEach(game.pieces, function (piece) {
                if (!game[piece.color].lostPieces[piece.name]) {
                    return;
                }
                game[piece.color].lostPieces[piece.name]--;
            });

            game.notations = [];

            var time = game.startTime;

            angular.forEach(game.played, function (value, index) {
                var data = {
                    text: value.notation,
                    time: ((value.time - time) / 1000).toFixed(2)
                };
                time = value.time;
                if (index % 2 === 0) {
                    game.notations.push({
                        white: data
                    });
                } else {
                    game.notations[game.notations.length - 1].black = data;
                }
            });

            if ($rootScope.user.uid === game.black.uid) {
                $scope.player1 = game.black;
                $scope.player2 = game.white;
                $scope.player1.color = 'black';
                $scope.player2.color = 'white';
                $scope.orientation = 'black';
                numbers.reverse();
            } else {
                $scope.player1 = game.white;
                $scope.player2 = game.black;
                $scope.player1.color = 'white';
                $scope.player2.color = 'black';
                $scope.orientation = 'white';
            }

            $scope.game = game;

            $scope.letters = letters;
            $scope.numbers = numbers;
        });

        socket.on('offerDraw', function (data) {
            $scope.game[$scope.getPlayerColor()].possibleDraw = true;
            modal.show(modal.get('modal-response-draw'));
        });

        socket.on('possibleDraw', function (data) {
            modal.show(modal.get('modal-possible-draw'));
        });

        $scope.isLastTurn = function (position) {
            if (!$scope.game.played || !$scope.game.played.length) {
                return;
            }
            var lastTurn = $scope.game.played[$scope.game.played.length - 1];
            return lastTurn.start === position || lastTurn.end === position;
        };

        $scope.move = function (start, end, promotion) {

            sound.timer.load();
            sound[$scope.game.pieces[end] ? 'capture' : 'deplace'].load().play();

            socket.emit('moveGame', {
                id: $scope.game.id,
                start: start,
                end: end,
                promotion: promotion
            });
        };

        $scope.isPlayerTurn = function() {
            return $scope.game && $scope.game[$scope.game.turn].uid === $rootScope.user.uid;
        };

        $scope.isPlayer = function () {
            return $scope.game && ($scope.game.white.uid === $rootScope.user.uid || $scope.game.black.uid === $rootScope.user.uid);
        };
        
        $scope.getPlayerColor = function () {
            if ($scope.game.white.uid === $rootScope.user.uid) {
                return 'white';
            } else if ($scope.game.black.uid === $rootScope.user.uid) {
                return 'black';
            }

            return false;
        };

        $scope.resign = function () {
            socket.emit('resign', $scope.game.id);
        };

        $scope.offerDraw = function () {
            if (!$scope.game[$scope.getPlayerColor()]) {
                return;
            }
            $scope.game[$scope.getPlayerColor()].hasOfferDraw = true;
            socket.emit('offerDraw', $scope.game.id);
        };

        $scope.acceptDraw = function () {
            socket.emit('acceptDraw', $scope.game.id);
        };

        $scope.possibleResign = function () {
            return $scope.game.played.length >= 4 && $scope.game.timestamp >= 60;
        };

        $scope.possibleOfferDraw = function () {
            var player = $scope.game[$scope.getPlayerColor()];
            return player && !player.possibleDraw && !player.hasOfferDraw && player.offerDraw < $scope.game.maxOfferDraw;
        };

        $scope.possibleDraw = function () {
            var player = $scope.game[$scope.getPlayerColor()];
            return player && player.possibleDraw;
        };

        $scope.shareResult = function () {
            if (!$scope.game.finish) {
                return;
            }

            var description = $filter('translate')($scope.game.result.name);

            if ($scope.game.result.value === 1) {
                description += ' - ' + $filter('translate')('winner') + ': ' + $scope.game.white.name;
            } else if ($scope.game.result.value === 2) {
                description += ' - ' + $filter('translate')('winner') + ': ' + $scope.game.black.name;
            }

            utils.share({
                name: $scope.game.white.name + ' VS ' + $scope.game.black.name,
                description: description,
            });
        };

        $interval.cancel($interval.stopTimeGame);
        $interval.stopTimeGame = $interval(function () {
            if (!$scope.game || $scope.game.finish) {
                return;
            }

            $scope.game.timestamp++;

            var player = $scope.game[$scope.game.turn];

            if (player.time > 0) {
                player.time--;
            }

            if (player.timeTurn > 0) {
                player.timeTurn--;
            }

            if ($scope.isPlayerTurn() && (player.time < 10 || player.timeTurn < 10)) {
                sound.timer.play();
            }

        }, 1000);
    }
]).

/**
 * @ngdoc controller
 * @name game.controller:profileGameCtrl
 * @description 
 * The profile game controller.
 * @requires $rootScope
 * @requires $scope
 * @requires global.service:utils
 */
controller('profileGameCtrl', ['$rootScope', '$scope', 'socket', 'utils',
    
    function ($rootScope, $scope, socket, utils) {

        $scope.getLostPieces = function(number) {
            var pieces = [];
            for (var i = 0; i < number; i++) {
                pieces.push(i);
            };
            return pieces;   
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
