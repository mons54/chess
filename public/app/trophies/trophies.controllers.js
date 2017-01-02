'use strict';

angular.module('trophies').

/**
 * @ngdoc controller
 * @name trophies.controller:trophiesCtrl
 * @description 
 * The trophies controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('trophiesCtrl', ['$rootScope', '$scope', 'socket', 'trophies',
    
    function ($rootScope, $scope, socket, trophies) {

        socket.emit('leaveHome');

        var userTrophies = {};

        angular.forEach($rootScope.user.trophies, function (data) {
            userTrophies[data.trophy] = true;
        });

        $scope.trophies = [];

        angular.forEach(trophies, function (value, key) {
            $scope.trophies.push({
                id: key,
                css: userTrophies[key] ? value : 'unknown'
            });
        });

        $scope.openTrophy = function (trophy) {
            $rootScope.$emit('trophy', trophy);
        };
    }
]);
