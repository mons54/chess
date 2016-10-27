'use strict';

angular.module('home').

/**
 * @ngdoc controller
 * @name home.controller:homeCtrl
 * @description 
 * The home controller.
 * @requires $rootScope
 * @requires $scope
 * @requires app.service:utils
 * @requires app.constant:paramsGame
 */
controller('homeCtrl', ['$rootScope', '$scope', 'utils', 'paramsGame',
    
    function ($rootScope, $scope, utils, paramsGame) {

        $rootScope.socket.emit('initUser');
        
        $rootScope.socket.on('listGames', function (data) {
            $scope.$apply(applyGames(data));
        });

        function applyGames(data) {
            $scope.createdGames = [];
            
            angular.forEach(data, function (value, key) {
                value.uid = key;

                if (checkGame(value)) {
                    $scope.createdGames.push(value);
                }
            });
        }

        $rootScope.socket.on('challenges', function (data) {
            $scope.$apply(applyChallenges(data));
        });

        function applyChallenges(data) {
            $scope.challenges = [];
            
            angular.forEach(data, function (value, key) {
                value.uid = key;
                $scope.challenges.push(value);
            });
        }

        $rootScope.socket.on('challengers', function (data) {
            $scope.$apply(applyChallenger(data));
        });

        function applyChallenger(data) {
            $scope.challengers = [];
            $scope.friends = [];

            angular.forEach(data, function (value) {
                if ($rootScope.user.uid == value.uid) {
                    return;
                }
                
                if ($rootScope.user.friends.indexOf(value.uid) !== -1) {
                    $scope.friends.push(value);
                }

                $scope.challengers.push(value);
            });
            
            $scope.challengers.sort(function (a, b) {
                return a.points > b.points;
            });

            $scope.friends.sort(function (a, b) {
                return a.points > b.points;
            });
        }

        $scope.createGame = function () {
            $rootScope.socket.emit('createGame', $scope.game);
        };

        $scope.removeGame = function () {
            $rootScope.socket.emit('removeGame');
        };

        $scope.startGame = function (uid) {
            $rootScope.socket.emit('startGame', uid);
        };

        $scope.startChallenge = function (uid) {
            $rootScope.socket.emit('startChallenge', uid);
        };

        $scope.setChallenger = function (challenger) {
            $scope.challenger = challenger;
        };

        $scope.challenge = function (uid) {
            $rootScope.socket.emit('challenge', {
                uid: uid,
                color: $scope.game.color,
                time: $scope.game.time
            });
        };

        $scope.removeChallenge = function (uid) {
            $rootScope.socket.emit('removeChallenge', uid);
        };

        $scope.$watch('game.pointsMin', function (value) {
            $scope.paramsGame.pointsMax = getPointsMax(value);
        });

        $scope.$watch('game.pointsMax', function (value) {
            $scope.paramsGame.pointsMin = getPointsMin(value);
        });

        function checkGame (game) {
            return game.uid == $rootScope.user.uid || 
                   ((!game.pointsMin || $rootScope.user.points >= game.pointsMin) && 
                   (!game.pointsMax || $rootScope.user.points <= game.pointsMax));
        }

        function setPointsMinMax () {
            var pointsMin = [],
                pointsMax = [],
                value;

            for (value = paramsGame.points.min; value <= paramsGame.points.max; value += 100) {
                if (value > paramsGame.points.min) {
                    pointsMax.push(value);
                }
                if (value < paramsGame.points.max) {
                    pointsMin.push(value);
                }
            }

            paramsGame.pointsMin = pointsMin;
            paramsGame.pointsMax = pointsMax;
        }

        function getPointsMin (pointsMax) {
            var data = [];
            
            if (pointsMax > 0) {
                angular.forEach(paramsGame.pointsMin, function (value) {
                    if (value < pointsMax) {
                        data.push(value);
                    }
                });
            } else {
                data = paramsGame.pointsMin;
            }

            return data;
        }

        function getPointsMax (pointsMin) {
            var data = [];

            if (pointsMin > 0) {
                angular.forEach(paramsGame.pointsMax, function (value) {
                    if (value > pointsMin) {
                        data.push(value);
                    }
                });
            } else {
                data = paramsGame.pointsMax;
            }

            return data;
        }

        setPointsMinMax();

        $scope.paramsGame = angular.copy(paramsGame);

        $scope.game = {
            color: $scope.paramsGame.colors[0],
            time: $scope.paramsGame.times[0],
            pointsMin: null,
            pointsMax: null
        };

        $scope.challenges = [];    
    }
]);
