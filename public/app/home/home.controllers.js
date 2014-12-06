(function () {

    'use strict';

    angular.module('home.controllers', []).

    controller('HomeCtrl', ['$rootScope', '$scope',
        
        function ($rootScope, $scope) {

            $rootScope.socket.emit('initUser');
            
            $rootScope.socket.on('listGames', function (data) {
                $scope.games = data.games;
            });
            
        }
    ]);
})();
