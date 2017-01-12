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
controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', '$interval', 'socket', 'utils', 'modal', 'sound', 'evaluation',
    
    function ($rootScope, $scope, $routeParams, $location, $filter, $interval, socket, utils, modal, sound, evaluation) {
        
        socket.emit('initGame', $routeParams.id);

        var defaultPieces = {
            pawn: 8,
            bishop: 2,
            knight: 2,
            rook: 2,
            queen: 1
        };

        var gameCopy;

        socket.on('game', function game(game) {
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

            var played = [],
                time = game.startTime;

            if (!$scope.games || game.played.length === 0) {
                gameCopy = new window.chess.game(game.id, game.white, game.black, game.time, game.startTime);
                $scope.games = [angular.copy(gameCopy)];
            }

            angular.forEach(game.played, function (value, index) {
                if (!$scope.games[index]) {
                    value.score = evaluation.getScore(gameCopy);
                    gameCopy = new window.chess.engine(gameCopy, value.start, value.end, value.promotion);
                    gameCopy.played[gameCopy.played.length - 1] = angular.copy(value);
                    $scope.games.push(angular.copy(gameCopy));
                }
                var data = {
                    notation: value.notation,
                    time: ((value.time - time) / 1000).toFixed(2),
                    score: value.score
                };
                time = value.time;
                if (index % 2 === 0) {
                    played.push({
                        white: data
                    });
                } else {
                    played[played.length - 1].black = data;
                }
            });

            console.log($scope.games)

            game.played = played;

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
            modal.show(modal.get('modal-response-draw'));
        });

        socket.on('possibleDraw', function (data) {
            modal.show(modal.get('modal-possible-draw'));
        });

        $scope.isLastTurn = function (position) {
            return $scope.game.played.length && $scope.game.played[0].start === position || $scope.game.played[0].end === position;
        };

        $scope.acceptDraw = function () {
            socket.emit('acceptDraw', $scope.game.id);
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

        $scope.resign = function () {
            socket.emit('resign', $scope.$parent.game.id);
        };

        $scope.offerDraw = function () {
            $scope.player.disableOfferDraw = true;
            socket.emit('offerDraw', $scope.$parent.game.id);
        };

        $scope.isPlayerUser = function () {
            return $scope.player && $scope.player.uid && $scope.player.uid === $rootScope.user.uid;
        };

        $scope.isFinish = function () {
            return $scope.$parent.game.finish;
        };

        $scope.canResign = function () {
            return $scope.$parent.game.played.length >= 4 && $scope.$parent.game.timestamp >= 60;
        };

        $scope.canOfferDraw = function () {
            return !$scope.player.disableOfferDraw && $scope.player.offerDraw < $scope.$parent.game.maxOfferDraw;
        };

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
