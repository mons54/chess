angular.module('trophies').

/**
 * @ngdoc controller
 * @name trophies.controller:trophiesCtrl
 * @description 
 * The trophies controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('trophiesCtrl', ['$rootScope', '$scope', '$routeParams', 'socket',
    
    function ($rootScope, $scope, $routeParams, socket) {

        $scope.uid = $routeParams.uid;
    }
]);
