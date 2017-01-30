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
controller('trophiesCtrl', ['$rootScope', '$scope', 'socket',
    
    function ($rootScope, $scope, socket) {

        $scope.trophies = [];
        for (var i = 1; i <= 25; i++) {
            $scope.trophies.push(i);
        };

        $scope.openTrophy = function (trophy) {
            $rootScope.$emit('trophies', [trophy]);
        };
    }
]);
