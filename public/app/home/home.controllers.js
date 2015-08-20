(function () {

    'use strict';

    angular.module('home.controllers', []).

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

            $scope.resetSearchGame = function () {
                $scope.searchGame = {
                    color: '',
                    time: '',
                    pointsMin: 0,
                    pointsMax: 0
                };
            };

            $scope.resetSearchChallenger = function () {
                $scope.searchChallenger = {
                    pointsMin: 0,
                    pointsMax: 0
                };
            };

            $scope.filtersGame = function () {
                return function (game) {
                    return !!filtersGame($scope.searchGame, game);
                };
            };

            $scope.filtersChallenger = function () {
                return function (challenger) {
                    return !!filtersChallenger($scope.searchChallenger, challenger);
                };
            };

            $scope.hasFiltersGame = function () {
                return $scope.searchGame.color || $scope.searchGame.time || $scope.searchGame.pointsMin || $scope.searchGame.pointsMax;
            };

            $scope.hasFiltersChallenger = function () {
                return $scope.searchChallenger.pointsMin || $scope.searchChallenger.pointsMax;
            };

            function filtersGame(search, game) {

                if ($rootScope.user.uid == game.uid) {
                    return true;
                }

                if (search.color && search.color != game.color) {
                    return false;
                }

                if (search.time && search.time != game.time) {
                    return false;
                }

                if (search.pointsMin > 0 && search.pointsMin > game.points) {
                    return false;
                }

                if (search.pointsMax > 0 && search.pointsMax < game.points) {
                    return false;
                }

                return true;
            }

            function filtersChallenger(search, challenger) {

                if (search.pointsMin > 0 && search.pointsMin > challenger.points) {
                    return false;
                }

                if (search.pointsMax > 0 && search.pointsMax < challenger.points) {
                    return false;
                }

                return true;
            }

            $scope.createGame = function () {
                $rootScope.socket.emit('createGame', $scope.game);
            };

            $scope.removeGame = function () {
                $rootScope.socket.emit('removeGame');
            };

            $scope.startGame = function (uid, challenge) {
                $rootScope.socket.emit('startGame', {
                    uid: uid,
                    challenge: challenge
                });
            };

            $scope.openModalChallenge = function (challenger) {
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

            $scope.$watch('searchGame.pointsMin', function (value) {
                $scope.paramsSearchGame.pointsMax = getPointsMax(value);
            });

            $scope.$watch('searchGame.pointsMax', function (value) {
                $scope.paramsSearchGame.pointsMin = getPointsMin(value);
            });

            $scope.$watch('searchChallenger.pointsMin', function (value) {
                $scope.paramsSearchChallenger.pointsMax = getPointsMax(value);
            });

            $scope.$watch('searchChallenger.pointsMax', function (value) {
                $scope.paramsSearchChallenger.pointsMin = getPointsMin(value);
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

            function freeTime() {

                if (($rootScope.user.freeTime != 0 && !$rootScope.user.freeTime) || $rootScope.user.freeTime < 0) {
                    return;
                }

                if ($rootScope.user.freeTime == 0) {
                    $rootScope.socket.emit('initUser');
                }

                var time = $rootScope.user.freeTime,
                    hour = Math.floor(time / 3600);

                time -= (hour * 3600);

                var minute = Math.floor(time / 60),
                    seconde = Math.floor(time - (minute * 60));

                $scope.freeTime = {
                    hour: utils.sprintf(hour),
                    minute: utils.sprintf(minute),
                    seconde: utils.sprintf(seconde)
                };

                $rootScope.user.freeTime--;
            }

            setPointsMinMax();

            $scope.paramsGame = angular.copy(paramsGame);

            $scope.game = {
                color: $scope.paramsGame.colors[0],
                time: $scope.paramsGame.times[0],
                pointsMin: 0,
                pointsMax: 0
            };

            $scope.paramsSearchGame = angular.copy(paramsGame);

            $scope.paramsSearchChallenger = {
                pointsMin: angular.copy(paramsGame.pointsMin),
                pointsMax: angular.copy(paramsGame.pointsMax)
            };

            $scope.resetSearchGame();
            $scope.resetSearchChallenger();

            $scope.challenges = [];

            freeTime();

            setInterval(function () {
                $scope.$apply(freeTime);
            }, 1000);     
        }
    ]);
})();
