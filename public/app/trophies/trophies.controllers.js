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

        $scope.trophies = trophies.trophies;

        $scope.getUserClass = trophies.getUserClass;

        $scope.openTrophy = function (trophy) {
            $rootScope.$emit('trophies', [trophy]);
        };
    }
]);
