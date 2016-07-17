(function () {

    'use strict';

    angular.module('trophies.controllers', []).

    controller('trophiesCtrl', ['$rootScope', '$scope', 'trophies',
        
        function ($rootScope, $scope, trophies) {

            $rootScope.socket.emit('leaveHome');

            var userTrophies = {};

            angular.forEach($rootScope.user.trophies, function (data) {
                userTrophies[data.trophy] = true;
            });

            $scope.trophies = [];

            angular.forEach(trophies, function (value, key) {
                $scope.trophies.push({
                    id: key,
                    css: userTrophies[key] ? value : 'no-trophy'
                });
            });
        }
    ]);

})();
