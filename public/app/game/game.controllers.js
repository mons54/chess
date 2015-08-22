(function () {

    'use strict';

    angular.module('game.controllers', []).

    controller('gameCtrl', ['$rootScope', '$scope', '$routeParams', '$location',
        
        function ($rootScope, $scope, $routeParams, $location) {

            $rootScope.socket.emit('initGame', $routeParams.id);

            $rootScope.socket.on('initGame', function (data) {
                $scope.$apply(applyGame(data));
            });

            function applyGame(data) {
                if (!data) {
                   $location.path('/');
                    return; 
                }
                $scope.game = data;
            }

            $scope.move = function (position) {
                $rootScope.socket.emit('move', position);
            };
        }
    ]);
})();
