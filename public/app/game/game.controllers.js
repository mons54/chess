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
 * @requires $window
 * @requires global.service:socket
 * @requires global.service:user
 * @requires global.service:utils
 * @requires components.service:modal
 */
controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', '$interval', '$window', '$cookies', '$timeout', 'socket', 'user', 'modal', 'sound', 'colorsGame',
    
    function ($rootScope, $scope, $routeParams, $location, $filter, $interval, $window, $cookies, $timeout, socket, user, modal, sound, colorsGame) {

        $rootScope.isGame = true;

        $scope.$on('$destroy', function() {
            delete $rootScope.isGame;
            delete $rootScope.isGameFinish;
        });
        
        socket.emit('initGame', $routeParams.id);

        var defaultPieces = {
            pawn: 8,
            bishop: 2,
            knight: 2,
            rook: 2,
            queen: 1
        };

        setShowPlayed(user.getShowPlayed());
        setShowMessages(user.getShowMessages());
        setColorGame(user.getColorGame());

        $scope.colorsGame = colorsGame;
        $scope.sound = sound.sound;

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
                $scope.shareResultData = getShareResultData(game);
                $rootScope.isGameFinish = true;
                modal('#modal-finish-game').show();
                var gameCopy = $window.game.newGame(game.id, game.white, game.black, {
                    type: game.type,
                    time: game.time,
                    increment: game.increment
                });
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

            $scope.played = [];

            var time = game.startTime;

            angular.forEach(game.played, function (value, index) {
                var data = angular.copy(value);
                data.index = index;
                data.time = ((data.time - time) / 1000).toFixed(2);
                if (gameCopy) {
                    new $window.chess.engine(gameCopy, value.start, value.end, value.promotion);
                    value.pieces = angular.copy(gameCopy.pieces);
                }
                time = value.time;
                if (index % 2 === 0) {
                    $scope.played.push({
                        white: data
                    });
                } else {
                    $scope.played[$scope.played.length - 1].black = data;
                }
            });

            if (gameCopy) {
                setTurn(game, game.played.length - 1);
            }

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

            checkTime($scope.player1);
            checkTime($scope.player2);

            $scope.game = game;

            $scope.letters = letters;
            $scope.numbers = numbers;

        }, $scope);

        socket.on('offerDraw', function (data) {
            $scope.game[$scope.getPlayerColor()].possibleDraw = true;
            modal('#modal-response-draw').show();
        }, $scope);

        socket.on('messageGame', function (message) {
            if (!$scope.messages) {
                return;
            }
            $scope.messages.push(message);
            if ($scope.showMessages) {
                addReadMessage(message);
                setCookieReadMessages();
            } else if (isUnreadMessage(message)) {
                $scope.unreadMessages++;
            }
        }, $scope);

        socket.on('messagesGame', function (messages) {

            $scope.messages = messages;

            if ($scope.showMessages) {
                showMessages();
            } else {
                $scope.unreadMessages = 0;
                $scope.readMessages = getCookieReadMessages();
                angular.forEach(messages, function (message) {
                    if (isUnreadMessage(message) && $scope.readMessages.indexOf(getMessageId(message)) === -1) {
                        $scope.unreadMessages++;
                    }
                });
            }
        }, $scope);

        socket.on('possibleDraw', function (data) {
            modal('#modal-possible-draw').show();
        }, $scope);

        $scope.isLastTurn = function (position) {
            if ((!$scope.turn || $scope.turn.index === null) && (!$scope.game.played || !$scope.game.played.length)) {
                return;
            }

            var lastTurn, index;

            if ($scope.turn && $scope.turn.index !== null) {
                index = $scope.turn.index;
            } else {
                index = $scope.game.played.length - 1;
            }

            $scope.lastTurn = index;

            lastTurn = $scope.game.played[index];

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
            return !$scope.game.finish && $scope.game.played.length >= 4 && $scope.game.timestamp >= 60;
        };

        $scope.possibleOfferDraw = function () {
            if ($scope.game.finish) {
                return false;
            }
            var player = $scope.game[$scope.getPlayerColor()];
            return player && !player.possibleDraw && !player.hasOfferDraw && player.offerDraw < $scope.game.maxOfferDraw;
        };

        $scope.possibleDraw = function () {
            if ($scope.game.finish) {
                return false;
            }
            var player = $scope.game[$scope.getPlayerColor()];
            return player && player.possibleDraw;
        };

        $scope.getPoints = function (p1, p2, c) {
            return $window.game.getPoints(p1.points, p2.points, c, p1.countGame);
        };

        $scope.getPercentage = function (p1, p2) {
            return Math.round($window.game.getElo(p1.points, p2.points) * 100);
        };

        $scope.replay = function (index) {
            if ($scope.game.finish) {
                setTurn($scope.game, index);
            }
        };

        $scope.togglePlayed = function (isPhone) {
            if (isPhone || $scope.showPlayedPhone) {
                $scope.showPlayed = $scope.showPlayedPhone;
                $scope.showPlayedPhone = !$scope.showPlayedPhone;
                $rootScope.isToggle = $scope.showPlayedPhone;
            }
            var value = !$scope.showPlayed;
            setShowPlayed(value);
            user.setShowPlayed(value);
        };

        $scope.toggleMessages = function (isPhone) {
            if (isPhone || $scope.showMessagesPhone) {
                $scope.showMessages = $scope.showMessagesPhone;
                $scope.showMessagesPhone = !$scope.showMessagesPhone;
                $rootScope.isToggle = $scope.showMessagesPhone;
            }

            if ($scope.unreadMessages > 0) {
                showMessages();
            }

            var value = !$scope.showMessages;
            setShowMessages(value);
            user.setShowMessages(value);

            if ($scope.showMessages) {
                $timeout(function () {
                    angular.element('[ng-model="message"]').focus();
                });
            }
        };

        $scope.sendMessage = function () {
            if (!$scope.message) {
                return;
            }
            socket.emit('sendMessageGame', {
                gid: $scope.game.id,
                message: $scope.message
            });

            $scope.message = '';
        };

        $scope.getLocaleTime = function(time) {
            return new Date(time).toLocaleTimeString();
        };

        $scope.setSound = function () {
            $scope.sound = sound.change();
        };

        $scope.setColorGame = function (color) {

            var body = angular.element('body');

            if ((!$scope.colorGame || $scope.colorGame === color) && !$scope.showColors) {
                $scope.showColors = true;
                body.on('click', function (event) {
                    if (angular.element(event.target).closest('[data-colors-game]').length) {
                        return;
                    }
                    $timeout(function() {
                        $scope.showColors = false
                    });
                    $(this).unbind('click');
                });
            } else if ($scope.colorGame === color) {
                $scope.showColors = false;
                body.unbind('click');
            }

            if ($scope.colorGame !== color) {
                setColorGame(color);
                user.setColorGame(color);
            }
        };

        function setTurn(game, index) {

            var length = game.played.length,
                turn = {
                    index: game.played[index] ? index : null,
                    first: index !== 0 && game.played[0] ? 0 : null,
                    prev: game.played[index - 1] ? index - 1 : null,
                    next: game.played[index + 1] ? index + 1 : null,
                    last: index !== length - 1 && game.played[length - 1] ? length - 1 : null
                };

            if (turn.index !== null) {
                game.pieces = game.played[turn.index].pieces;
            }

            $scope.turn = turn;
        }

        function setColorGame(color) {
            var index = colorsGame.indexOf(color);
            if (index !== -1) {
                colorsGame.splice(index, 1);
                colorsGame.unshift(color);
            }

            $scope.colorGame = color;
        }

        function getShareResultData(game) {

            var description = $filter('translate')(game.result.name);

            if (game.result.value === 1) {
                description += ' - ' + $filter('translate')('winner') + ': ' + game.white.name;
            } else if (game.result.value === 2) {
                description += ' - ' + $filter('translate')('winner') + ': ' + game.black.name;
            }

            return {
                title: game.white.name + ' ~ ' + game.black.name,
                description: description
            };
        }

        function getMessageId(message) {
            return $scope.game.gid + '-' + message.time;
        }

        function isUnreadMessage(message) {
            return message.uid !== $rootScope.user.uid;
        }

        function addReadMessage(message) {
            $scope.readMessages.push(getMessageId(message));
        }

        function showMessages(messages) {
            $scope.unreadMessages = 0;
            $scope.readMessages = [];
            angular.forEach($scope.messages, addReadMessage);
            setCookieReadMessages();
        }

        function getCookieReadMessages() {
            return $cookies.getObject('gameReadMessages') || [];
        }

        function setCookieReadMessages() {
            var messages = $scope.readMessages || [],
                expires = new Date();
            expires.setDate(expires.getDate() + 1);
            $cookies.putObject('gameReadMessages', messages, {
                expires: expires
            });
        }

        function checkTime(player) {
            if (player.time < player.timeTurn) {
                player.timeTurn = player.time;
            }
        }

        function setShowPlayed(value) {
            $scope.showPlayed = value;
            if ($rootScope.lang() !== 'ar') {
                $scope.hideFixedButton = value;
            }
        }

        function setShowMessages(value) {
            $scope.showMessages = value;
            if ($rootScope.lang() === 'ar') {
                $scope.hideFixedButton = value;
            }
        }

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

        $scope.hasLostPieces = function (lostPieces) {
            if (typeof lostPieces === 'object') {
                for (var i in lostPieces) {
                    if (lostPieces[i]) {
                        return true;
                    }
                }
            }
            return false;
        }

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
