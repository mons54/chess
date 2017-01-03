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
 * @requires app.service:utils
 * @requires components.service:modal
 */
controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', '$interval', 'socket', 'utils', 'modal', 'sound',
    
    function ($rootScope, $scope, $routeParams, $location, $filter, $interval, socket, utils, modal, sound) {

        socket.emit('initGame', $routeParams.id);

        socket.on('game', function (data) {
            $scope.$apply(applyGame(data));
        });

        socket.on('offerDraw', function (data) {
            modal.show(modal.get('modal-response-draw'));
        });

        $scope.getPieceClass = function (position) {
            if (!$scope.game.pieces[position]) {
                return;
            }
            return 'app-game__icon app-game__icon--' + $scope.game.pieces[position].color + ' app-game__icon--' + $scope.game.pieces[position].name;
        };

        $scope.isLastTurn = function (position) {
            if ($scope.game.lastTurn.start === position || $scope.game.lastTurn.end === position) {
                return 'last-turn';
            }
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

            if (sound.timer.played) {
                sound.timer.load();
            }

            if (game.finish) {
                $rootScope.user.gid = null;
                modal.show(modal.get('modal-finish-game'));
            }

            /**
             * Play sound if is not player turn and has last turn
             */
            if (!$scope.isPlayerTurn() &&
                $scope.game &&
                game.lastTurn && 
                game.lastTurn.start &&
                game.lastTurn.start !== $scope.game.lastTurn.start) {
                sound[$scope.game.pieces[game.lastTurn.end] ? 'capture' : 'deplace'].load().play();
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

        $interval.cancel($interval.stopTimeGame);
        $interval.stopTimeGame = $interval(function () {
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
 * @requires app.service:utils
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

        $scope.isStarted = function () {
            return $scope.$parent.game.played;
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
