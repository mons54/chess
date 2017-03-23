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

        if ($rootScope.user.gid && $rootScope.user.gid !== $routeParams.id) {
            $location.path('/game/' + $rootScope.user.gid);
            return;
        }

        $rootScope.loading = true;
        $rootScope.isGame = true;

        socket.emit('initGame', $routeParams.id);

        $scope.$on('$destroy', function() {
            if ($scope.game && !$scope.game.archived) {
                socket.emit('leaveGame', $scope.game.id);
            }
            cancelInterval();
            delete $rootScope.isGame;
        });

        $rootScope.$watch('disconnectMultiSocket', function (value) {
            if (value) {
                cancelInterval();
            }
        });

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
        $scope.sound = user.getSound();

        socket.on('game', function (game) {

            var gameCopy;

            $rootScope.loading = false;

            if (!game) {
                delete $rootScope.user.gid;
                $location.path('/');
                return; 
            }

            if (!game.finish) {
                game.lastTime = new Date().getTime();
            } else {

                if (!game.archived) {
                    $timeout(function () {
                        modal('[modal-game]').hide();
                        modal('#modal-finish-game').show();
                        delete $rootScope.user.gid;
                    }, 500);
                }

                if (!game.lastTime) {
                    game.time *= 1000;
                    game.increment *= 1000;
                    game.timeTurn *= 1000;
                    game.white.time *= 1000;
                    game.white.timeTurn *= 1000;
                    game.black.time *= 1000;
                    game.black.timeTurn *= 1000;
                }

                gameCopy = $window.game.newGame(game.id, game.white, game.black, game.type);

                if (game.result.value === 1) {
                    game.white.isWinner = true;
                    game.white.resultPoints = $window.game.getPoints(game.white.points, game.black.points, 1, game.white.countGame);
                    game.black.resultPoints = $window.game.getPoints(game.black.points, game.white.points, 0, game.black.countGame);
                    game.result.print = '1-0';
                } else if (game.result.value === 2) {
                    game.black.isWinner = true;
                    game.white.resultPoints = $window.game.getPoints(game.white.points, game.black.points, 0, game.white.countGame);
                    game.black.resultPoints = $window.game.getPoints(game.black.points, game.white.points, 1, game.black.countGame);
                    game.result.print = '0-1';
                } else {
                    game.white.resultPoints = $window.game.getPoints(game.white.points, game.black.points, 0.5, game.white.countGame);
                    game.black.resultPoints = $window.game.getPoints(game.black.points, game.white.points, 0.5, game.black.countGame);
                    game.result.print = '½-½';
                }

                shareResultData(game);
            }

            var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
                numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

            /**
             * Play sound if is not player turn and has last turn
             */
            if (!$scope.isPlayerTurn() &&
                $scope.game &&
                game.played.length !== $scope.game.played.length &&
                game.played[game.played.length - 1]) {

                sound[$scope.game.pieces[game.played[game.played.length - 1].end] ? 'capture' : 'deplace'].play();
            }

            setLostPieces(game);

            $scope.played = [];

            var time = game.startTime;

            angular.forEach(game.played, function (value, index) {

                var data = angular.copy(value);

                data.index = index;

                if (gameCopy) {

                    gameCopy = new $window.chess.engine(gameCopy, value.start, value.end, value.promotion);

                    value.pieces = angular.copy(gameCopy.pieces);

                    if (!game.played[index + 1]) {
                        value.playersTime = {
                            black: game.black.time,
                            white: game.white.time
                        };
                    } else if (index % 2) {
                        value.playersTime = {
                            black: (game.played[index - 2] ? game.played[index - 2].playersTime.black : game.time) - (data.time - time) + game.increment,
                            white: game.played[index - 1].playersTime.white
                        };
                    } else {
                        value.playersTime = {
                            white: (game.played[index - 2] ? game.played[index - 2].playersTime.white : game.time) - (data.time - time) + game.increment,
                            black: game.played[index - 1] ? game.played[index - 1].playersTime.black : game.time
                        };
                    }
                }

                data.time = ((data.time - time) / 1000).toFixed(2);

                time = value.time;

                if (index % 2) {
                    $scope.played[$scope.played.length - 1].black = data;
                } else {
                    $scope.played.push({
                        white: data
                    });
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
                letters.reverse();
                numbers.reverse();
            } else {
                $scope.player1 = game.white;
                $scope.player2 = game.black;
                $scope.player1.color = 'white';
                $scope.player2.color = 'black';
            }

            if ($rootScope.user.lang === 'ar') {
                letters.reverse();
            }

            if (!game.finish) {
                game.white.currentTime = game.white.time;
                game.white.currentTimeTurn = game.white.timeTurn;
                game.black.currentTime = game.black.time;
                game.black.currentTimeTurn = game.black.timeTurn;
            }

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

        $scope.isCheck = function(position) {
            var piece;
            if (!$scope.game.check ||
                $scope.game.played.length - 1 !== $scope.lastTurn ||  
                !(piece = $scope.game.pieces[position])) {
                return false;
            }
            return piece.color === $scope.game.turn && piece.name === 'king';
        };

        $scope.move = function (start, end, promotion) {

            sound[$scope.game.pieces[end] ? 'capture' : 'deplace'].play();

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
            return !$scope.game.finish && $scope.game.played.length >= 4;
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
            
            if (!$scope.game.finish) {
                return;
            }

            setTurn($scope.game, index);

            $scope.game.pieces = $scope.game.played[index].pieces;

            setLostPieces($scope.game);

            var played = $scope.game.played[index],
                lastTime = $scope.game.played[index - 1] ? $scope.game.played[index - 1].time : $scope.game.startTime;

            $scope.game.white.time = played.playersTime.white;
            $scope.game.black.time = played.playersTime.black;
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
            $scope.sound = !$scope.sound;
            user.setSound($scope.sound);
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
                        $scope.showColors = false;
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

        $scope.rematch = function () {
            socket.emit('createChallenge', {
                uid: $scope.game.white.uid === $rootScope.user.uid ? $scope.game.black.uid : $scope.game.white.uid,
                color: $scope.game.rematch.color,
                game: $scope.game.rematch.game
            });
        };

        function setTurn(game, index) {

            var length = game.played.length;

            $scope.turn = {
                index: game.played[index] ? index : null,
                first: index !== 0 && game.played[0] ? 0 : null,
                prev: game.played[index - 1] ? index - 1 : null,
                next: game.played[index + 1] ? index + 1 : null,
                last: index !== length - 1 && game.played[length - 1] ? length - 1 : null
            };
        }

        function setLostPieces(game) {
            game.black.lostPieces = angular.copy(defaultPieces);
            game.white.lostPieces = angular.copy(defaultPieces);

            angular.forEach(game.pieces, function (piece) {
                if (!game[piece.color].lostPieces[piece.name]) {
                    return;
                }
                game[piece.color].lostPieces[piece.name]--;
            });
        }

        function setColorGame(color) {
            var index = colorsGame.indexOf(color);
            if (index !== -1) {
                colorsGame.splice(index, 1);
                colorsGame.unshift(color);
            }

            $scope.colorGame = color;
        }

        function shareResultData(game) {
            $scope.shareResultData = {
                title: $filter('translate')(game.type) + ' · ' + game.time / 60000 + '+' + game.increment / 1000 + ' · ' + $filter('translate')(game.result.name),
                description: game.white.name + ' ' + game.white.points + ' · ' + game.result.print + ' · ' + game.black.name + ' ' + game.black.points,
                link: '/game/' + game.id
            };

            if (typeof domtoimage !== 'object') {
                return;
            }

            $timeout(function() {
                var div = $('<div/>').css({
                    position: 'absolute',
                    'z-index': '-9',
                    width: '300px',
                    height: '300px'
                }).addClass('app-game__board app-game__board--' + $scope.colorGame).append($('.app-game__board').clone().html()).appendTo($('body'));
                
                domtoimage.toPng(div[0]).
                then(function (data) {
                    $scope.shareResultData.picture = '/?data=' + encodeURIComponent(data.split(',')[1]);
                    div.remove();
                }, div.remove);

            });
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

        function setShowPlayed(value) {
            $scope.showPlayed = value;
            $scope.hideFixedButton = value;
        }

        function setShowMessages(value) {
            $scope.showMessages = value;
        }

        function cancelInterval() {
            $interval.cancel($interval.stopTimeGame);
            sound.timer.stop();
        }

        var interval = 100;

        $interval.stopTimeGame = $interval(function () {

            var game = $scope.game;

            if (!game || game.finish) {
                sound.timer.stop();
                return;
            }

            var player = game[game.turn],
                diff = new Date().getTime() - game.lastTime;

            if (player.currentTimeTurn - diff < interval) {
                player.time = 0;
                player.timeTurn = 0;
            } else {
                player.time = player.currentTime - diff;
                player.timeTurn = player.currentTimeTurn - diff;
            }

            if (!$scope.isPlayerTurn()) {
                sound.timer.stop();
            } else if (player.time < 10000 || player.timeTurn < 10000) {
                sound.timer.play();
            }

        }, interval);
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

        $scope.$parent.$watch('game', function(value) {
            $scope.game = value;
        });

        $scope.isPlayerTurn = function (player) {
            return $scope.game && $scope.game.turn === player.color;
        };

        $scope.getLostPieces = function(number) {
            var pieces = [];
            for (var i = 0; i < number; i++) {
                pieces.push(i);
            }
            return pieces;   
        };
        
        $scope.formatTime = function (time) {
            if (typeof time === 'undefined') {
                return;
            }
            
            var date = new Date(time),
                minute = date.getMinutes(),
                seconde = date.getSeconds(),
                msecondes = Math.floor(date.getMilliseconds() / 100);

            return utils.sprintf(minute) + ':' + utils.sprintf(seconde) + '.' + msecondes;
        };
    }
]);
