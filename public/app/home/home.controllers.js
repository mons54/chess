(function () {

    'use strict';

    angular.module('home.controllers', []).

    controller('homeCtrl', ['$rootScope', '$scope', 'utils', 'paramsGame',
        
        function ($rootScope, $scope, utils, paramsGame) {

            $rootScope.socket.emit('initUser');
            
            $rootScope.socket.on('listGames', function (data) {
                
                $scope.$apply(function () {
                    $scope.createdGames = [];
                
                    angular.forEach(data, function (value, key) {
                        value.uid = key;

                        if (checkGame(value)) {
                            $scope.createdGames.push(value);
                        }
                    });
                });
            });

            $rootScope.socket.on('challenges', function (data) {
                $scope.$apply(function () {
                    $scope.challenges = [];
                
                    angular.forEach(data, function (value, key) {
                        value.uid = key;
                        $scope.challenges.push(value);
                    });
                });
            });

            $rootScope.socket.on('challengers', function (data) {

                $scope.$apply(function () {
                    $scope.challengers = data;
                    
                    $scope.challengers.sort(function (a, b) {
                        return a.points > b.points;
                    });
                });
            });

            $scope.resetSearchGame = function () {
                $scope.searchGame = {
                    color: '',
                    time: '',
                    pointsMin: 0,
                    pointsMax: 0
                };
            };

            $scope.filtersGame = function () {
                return function (game) {
                    if (filtersGame($scope.searchGame, game)) {
                        return true;
                    }
                    return false;
                };
            };

            $scope.hasFiltersGame = function () {
                return $scope.searchGame.color || $scope.searchGame.time || $scope.searchGame.pointsMin || $scope.searchGame.pointsMax;
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

                if (search.pointsMin && search.pointsMin > game.points) {
                    return false;
                }

                if (search.pointsMax && search.pointsMax < game.points) {
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

            function checkGame (game) {
                return game.uid == $rootScope.user.uid || 
                       ((!game.pointsMin || $rootScope.user.points >= game.pointsMin) && 
                       (!game.pointsMax || $rootScope.user.points <= game.pointsMax));
            }

            function setPointsMinMax () {
                var pointsMin = [],
                    pointsMax = [],
                    value;

                for (value = paramsGame.pointsMin; value <= paramsGame.pointsMax; value += 100) {
                    if (value > paramsGame.pointsMin) {
                        pointsMax.push(value);
                    }
                    if (value < paramsGame.pointsMax) {
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

            function getTime() {
                
                var date = new Date();

                $scope.time = utils.sprintf(date.getHours()) + ':' + utils.sprintf(date.getMinutes());
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

            $scope.resetSearchGame();

            $scope.challenges = [];

            getTime();

            setTimeout(function () {
                getTime();
            }, 1000);     
        }
    ]);
})();
