'use strict';

angular.module('ranking').

/**
 * @ngdoc controller
 * @name ranking.controller:rankingCtrl
 * @description 
 * The ranking controller.
 * @requires $rootScope
 * @requires $scope
 */
controller('rankingCtrl', ['$rootScope', '$scope', 'socket',
    
    function ($rootScope, $scope, socket) {

        $scope.$on('$destroy', function() {
            delete $rootScope.pages;
        });

        socket.on('ranking', function (data) {

            $rootScope.loadRanking = false;

            if (!data) {
                return;
            }

            var usersId = [],
                usersName;

            $rootScope.pages = data.pages;

            if (data.pages) {
                $rootScope.page = data.pages.page;
            }

            $scope.ranking = data.ranking;

            angular.forEach($scope.ranking, function (value) {
                usersId.push(value.uid);
            });
        }, $scope);

        $rootScope.$on('page', function ($event, page) {
            emit($scope.type, page);
        });

        function emit(type, page) {
            if ($rootScope.loadRanking) {
                return;
            }
            $rootScope.page = page;
            $rootScope.loadRanking = true;
            $scope.type = type;
            socket.emit('ranking', {
                type: type,
                page: page
            });
            return true;
        }

        $scope.top100 = function (type) {
            if ($rootScope.loadRanking) {
                return;
            }
            $scope.type = type + 'Top100';
            $rootScope.loadRanking = true;
            socket.emit('rankingTop100', type);
        };

        $scope.setType = function (type) {
            emit(type);
        };

        componentHandler.upgradeElement($('[data-spinner]')[0]);

        emit('blitz');
    }
]);
