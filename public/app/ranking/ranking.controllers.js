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
            $rootScope.pages = false;
        });
        
        $scope.friends = false;

        socket.emit('leaveHome');

        socket.on('ranking', function (data) {

            $rootScope.loading = false;
            $rootScope.loadPage = false;

            if (!data) {
                return;
            }

            var usersId = [],
                usersName;

            if (data.pages) {
                $rootScope.pages = data.pages;
                $rootScope.page  = data.pages.page;
            }

            $scope.ranking = data.ranking;

            angular.forEach($scope.ranking, function (value) {
                usersId.push(value.uid);
            });
        }, $scope);

        $rootScope.$on('page', function ($event, page) {
            emit(page);
        });

        function emit(page) {
            if ($rootScope.loadPage) {
                return;
            }
            $rootScope.loadPage = true;
            socket.emit('ranking', {
                page: page,
                friends: $scope.friends ? $rootScope.user.friends : false
            });
        }

        $rootScope.loading = true;

        emit();
    }
]);
