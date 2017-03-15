angular.module('ranking').

/**
 * @ngdoc controller
 * @name ranking.controller:rankingCtrl
 * @description 
 * The ranking controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('rankingCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'socket',
    
    function ($rootScope, $scope, $routeParams, $location, socket) {

        componentHandler.upgradeElement($('[data-spinner]')[0]);

        $rootScope.loadRanking = true;

        if ($routeParams.type === 'blitz-100') {
            $scope.type = 'blitzTop100';
            socket.emit('rankingTop100', 'blitz');
        } else if ($routeParams.type === 'rapid-100') {
            $scope.type = 'rapidTop100';
            socket.emit('rankingTop100', 'rapid');
        } else if ($routeParams.type === 'blitz' || $routeParams.type === 'rapid') {
            $scope.type = $routeParams.type;
            socket.emit('ranking', {
                type: $routeParams.type,
                page: $routeParams.page 
            });
        } else {
            $location.path('ranking/blitz');
            return;
        }

        $scope.$on('$destroy', function() {
            if ($routeParams.type !== $scope.type) {
                delete $rootScope.pages;
            }
        });

        socket.on('ranking', function (data) {

            $rootScope.loadRanking = false;

            if (!data) {
                $location.path('ranking/' + $routeParams.type);
                return;
            }

            $rootScope.pages = data.pages;

            if (data.pages) {
                $rootScope.page = data.pages.page;
            }

            $scope.ranking = data.ranking;
            $scope.count = data.count;

        }, $scope);

        $rootScope.$on('page', function ($event, page) {
            $location.path('ranking/' + $scope.type + '/' + page);
        });
    }
]);
