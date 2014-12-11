(function () {

    'use strict';

    angular.module('home.controllers', []).

    controller('homeCtrl', ['$rootScope', '$scope', 'utils', 'paramsGame',
        
        function ($rootScope, $scope, utils, paramsGame) {

            $rootScope.socket.emit('initUser');
            
            $rootScope.socket.on('listGames', function (data) {
                $scope.games = data.games;
            });


            $scope.paramsGame = angular.copy(paramsGame);

            $scope.createGame = {
                color: $scope.paramsGame.colors[0],
                time: $scope.paramsGame.times[0],
                pointsMin: 0,
                pointsMax: 0
            };

            $scope.$watch('createGame.pointsMin', function (value) {
                setPointsMax(value);
            });

            $scope.$watch('createGame.pointsMax', function (value) {
                setPointsMin(value);
            });

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
