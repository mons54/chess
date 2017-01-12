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

        var gameCopy;

        function game(game) {
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
                if ($scope.games.indexOf(index) === -1) {
                    gameCopy = new window.chess.engine(gameCopy, value.start, value.end, value.promotion);
                    $scope.games.push(angular.extend({played: played}, angular.copy(gameCopy)));
                }
                var data = {
                    notation: value.notation,
                    time: ((value.time - time) / 1000).toFixed(2)
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
        };

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

        game(JSON.parse('{"id":1,"startTime":1484127719147,"time":300,"timeTurn":120,"timestamp":83,"finish":false,"turn":"black","turn50":0,"maxOfferDraw":3,"played":[{"time":1484127722591,"hash":"1810637654","start":"f2","end":"f4","notation":"f2 f4"},{"time":1484127724206,"hash":"406768468","start":"e7","end":"e5","notation":"e7 e5"},{"time":1484127726983,"hash":"-769315435","start":"f4","end":"e5","notation":"f4xe5"},{"time":1484127728770,"hash":"-1440509094","start":"b8","end":"c6","notation":"b8 c6"},{"time":1484127731107,"hash":"-1008005649","start":"b1","end":"c3","notation":"b1 c3"},{"time":1484127733131,"hash":"-399928786","start":"g7","end":"g6","notation":"g7 g6"},{"time":1484127735954,"hash":"1630418045","start":"g1","end":"f3","notation":"g1 f3"},{"time":1484127737347,"hash":"623495356","start":"d7","end":"d6","notation":"d7 d6"},{"time":1484127739699,"hash":"-784715395","start":"a2","end":"a3","notation":"a2 a3"},{"time":1484127742362,"hash":"1334567560","start":"d6","end":"e5","notation":"d6xe5"},{"time":1484127744380,"hash":"-478097686","start":"f3","end":"e5","notation":"f3xe5"},{"time":1484127746873,"hash":"-834679393","start":"c6","end":"e5","notation":"c6xe5"},{"time":1484127750034,"hash":"851220542","start":"e2","end":"e3","notation":"e2 e3"},{"time":1484127754906,"hash":"-1905961046","start":"c8","end":"g4","notation":"c8 g4"},{"time":1484127758136,"hash":"-510787183","start":"d1","end":"g4","notation":"d1xg4"}],"result":{},"white":{"uid":"587410c15fdd153368b76c44","name":"David Mendes","avatar":"https://scontent.xx.fbcdn.net/v/t1.0-1/c15.0.50.50/p50x50/10354686_10150004…6_220367501106153455_n.jpg?oh=978df650af5b925f321fe4050af2869f&oe=5911542F","points":1491,"ranking":4,"time":279,"timeTurn":120,"possibleDraw":false,"king":{"position":"e1","moveForbidden":[]},"nbPieces":14,"offerDraw":0,"lostPieces":{"pawn":1,"bishop":0,"knight":1,"rook":0,"queen":0},"color":"white"},"black":{"uid":"587410c05fdd153368b76c43","name":"Julien Simonet","avatar":"https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/14568136_1175331085838431_1693540271083860709_n.jpg?oh=25ccad73d5500bf7c9f7330c5f32d582&oe=59109AFD","points":1509,"ranking":1,"time":238,"timeTurn":76,"possibleDraw":false,"king":{"position":"e8","moveForbidden":[]},"nbPieces":13,"offerDraw":0,"lostPieces":{"pawn":2,"bishop":1,"knight":0,"rook":0,"queen":0},"color":"black"},"pieces":{"e1":{"name":"king","color":"white","deplace":["e2","f2","d1"],"capture":[],"moved":false},"e8":{"name":"king","color":"black","deplace":["e7"],"capture":[],"moved":false},"d8":{"name":"queen","color":"black","deplace":["d7","d6","d5","d4","d3","c8","b8","e7","f6","g5","h4"],"capture":["d2"],"moved":false},"a1":{"name":"rook","color":"white","deplace":["a2","b1"],"capture":[],"moved":false},"h1":{"name":"rook","color":"white","deplace":["g1"],"capture":[],"moved":false},"a8":{"name":"rook","color":"black","deplace":["b8","c8"],"capture":[],"moved":false},"h8":{"name":"rook","color":"black","deplace":[],"capture":[],"moved":false},"c1":{"name":"bishop","color":"white","deplace":[],"capture":[],"moved":false},"f1":{"name":"bishop","color":"white","deplace":["e2","d3","c4","b5","a6"],"capture":[],"moved":false},"f8":{"name":"bishop","color":"black","deplace":["e7","d6","c5","b4","g7","h6"],"capture":["a3"],"moved":false},"g8":{"name":"knight","color":"black","deplace":["e7","h6","f6"],"capture":[],"moved":false},"b2":{"name":"pawn","color":"white","deplace":["b3","b4"],"capture":[],"moved":false},"c2":{"name":"pawn","color":"white","deplace":[],"capture":[],"moved":false},"d2":{"name":"pawn","color":"white","deplace":["d3","d4"],"capture":[],"moved":false},"g2":{"name":"pawn","color":"white","deplace":["g3"],"capture":[],"moved":false},"h2":{"name":"pawn","color":"white","deplace":["h3","h4"],"capture":[],"moved":false},"a7":{"name":"pawn","color":"black","deplace":["a6","a5"],"capture":[],"moved":false},"b7":{"name":"pawn","color":"black","deplace":["b6","b5"],"capture":[],"moved":false},"c7":{"name":"pawn","color":"black","deplace":["c6","c5"],"capture":[],"moved":false},"f7":{"name":"pawn","color":"black","deplace":["f6","f5"],"capture":[],"moved":false},"h7":{"name":"pawn","color":"black","deplace":["h6","h5"],"capture":[],"moved":false},"e5":{"name":"knight","color":"black","deplace":["c4","c6","f3","d3","d7"],"capture":["g4"],"moved":true},"c3":{"name":"knight","color":"white","deplace":["a2","a4","e4","e2","d5","d1","b1","b5"],"capture":[],"moved":true},"g6":{"name":"pawn","color":"black","deplace":["g5"],"capture":[],"moved":true},"a3":{"name":"pawn","color":"white","deplace":["a4"],"capture":[],"moved":true},"e3":{"name":"pawn","color":"white","deplace":["e4"],"capture":[],"moved":true},"g4":{"name":"queen","color":"white","deplace":["g5","h4","g3","f4","e4","d4","c4","b4","a4","h5","f3","e2","d1","h3","f5","e6","d7","c8"],"capture":["g6"],"moved":true}},"notations":[{"white":{"value":"f2 f4","time":null},"black":{"value":"e7 e5","time":1615},"$$hashKey":"object:325"},{"white":{"value":"f4xe5","time":2777},"black":{"value":"b8 c6","time":1787},"$$hashKey":"object:326"},{"white":{"value":"b1 c3","time":2337},"black":{"value":"g7 g6","time":2024},"$$hashKey":"object:327"},{"white":{"value":"g1 f3","time":2823},"black":{"value":"d7 d6","time":1393},"$$hashKey":"object:328"},{"white":{"value":"a2 a3","time":2352},"black":{"value":"d6xe5","time":2663},"$$hashKey":"object:329"},{"white":{"value":"f3xe5","time":2018},"black":{"value":"c6xe5","time":2493},"$$hashKey":"object:330"},{"white":{"value":"e2 e3","time":3161},"black":{"value":"c8 g4","time":4872},"$$hashKey":"object:331"},{"white":{"value":"d1xg4","time":3230},"$$hashKey":"object:332"}]}'));
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
