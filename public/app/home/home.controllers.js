(function () {

    'use strict';

    angular.module('home.controllers', []).

    controller('homeCtrl', ['$rootScope', '$scope', 'utils',
        
        function ($rootScope, $scope, utils) {

            $rootScope.socket.emit('initUser');
            
            $rootScope.socket.on('listGames', function (data) {
                $scope.games = data.games;
            });


            $scope.colors = utils.colors;
           
            getTime();

            function getTime() {
                
                var date = new Date();

                $scope.time = utils.sprintf(date.getHours()) + ':' + utils.sprintf(date.getMinutes());
            } 

            setTimeout(function () {
                getTime();
            }, 1000);     
        }
    ]);
})();
