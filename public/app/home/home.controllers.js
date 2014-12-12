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
                        $scope.createdGames.push(value);
                    });
                    
                    $scope.createdGames.sort(function (a, b) {
                        return a.points < b.points;
                    });
                });
            });


            setPointsMinMax();

            $scope.paramsGame = angular.copy(paramsGame);

            $scope.predicate = 'name';

            $scope.game = {
                color: $scope.paramsGame.colors[0],
                time: $scope.paramsGame.times[0],
                pointsMin: 0,
                pointsMax: 0
            };

            $scope.createGame = function () {
                $rootScope.socket.emit('createGame', $scope.game);
            };

            $scope.$watch('game.pointsMin', function (value) {
                setPointsMax(value);
            });

            $scope.$watch('game.pointsMax', function (value) {
                setPointsMin(value);
            });

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

            function setPointsMin (pointsMax) {
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

                $scope.paramsGame.pointsMin = data;
            }

            function setPointsMax (pointsMin) {
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

                $scope.paramsGame.pointsMax = data;
            }

            function getTime() {
                
                var date = new Date();

                $scope.time = utils.sprintf(date.getHours()) + ':' + utils.sprintf(date.getMinutes());
            }

            getTime();

            setTimeout(function () {
                getTime();
            }, 1000);     
        }
    ]);
})();
