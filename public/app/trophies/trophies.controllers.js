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

        $rootScope.loadingContent = true;

        $scope.uid = $routeParams.uid;

        $scope.activeMenu = 'trophies';

        $scope.$watch('profile', function (data) {

            if (!data) {
                return;
            }

            var userTrophies = data.trophies || {};

            $scope.trophies = [];

            for (var i = 1; i <= 25; i++) {

                $scope.trophies.push({
                    id: i,
                    value: userTrophies[i] || 0
                });
            };

            var trophy = $scope.trophies.filter(function(value) {
                return value.id === parseInt($routeParams.tid);
            })[0];

            if (trophy) {
                $scope.openTrophy(trophy);
            }

            delete $rootScope.loadingContent;
        });

        $scope.openTrophy = function (trophy) {
            
            var trophies = {};

            trophies[trophy.id] = trophy.value;

            $rootScope.$emit('trophies', {
                share: $rootScope.user.uid === $scope.profile.uid,
                trophies: trophies
            });
        };
    }
]);
