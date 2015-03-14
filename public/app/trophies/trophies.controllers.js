(function () {

    'use strict';

    angular.module('trophies.controllers', []).

    controller('trophiesCtrl', ['$rootScope', '$scope',
        
        function ($rootScope, $scope) {

            $rootScope.socket.emit('leaveHome');

            var userTrophies = {};

            angular.forEach($rootScope.user.trophies, function (trophy) {
                userTrophies[trophy.badge] = true;
            });

            $scope.trophies = [];

            angular.forEach($rootScope.text.trophies.content, function (trophy, id) {
                if (!userTrophies[id]) {
                    trophy.class = 'no-trophy';
                }
                trophy.id = id;
                $scope.trophies.push(trophy);
            });
        }
    ]);

})();