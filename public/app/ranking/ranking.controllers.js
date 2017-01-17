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
        
        $scope.friends = false;

        socket.emit('leaveHome');

        socket.on('ranking', function (data) {

            if (!data) {
                return;
            }

            var usersId = [],
                usersName;

            $scope.pages = false;

            if (data.pages) {
                $scope.pages = data.pages;
                $scope.page  = data.pages.page;
            }

            $scope.ranking = data.ranking;

            angular.forEach($scope.ranking, function (value) {
                usersId.push(value.uid);
            });

            $rootScope.loading = false;
        }, $scope);

        $scope.setPage = function (page) {
            page = parseInt(page);
            if (!page || page < 0 || page === $scope.pages.page || page > $scope.pages.last) {
                $scope.page = $scope.pages.page;
                return;
            }
            emit(page);
        };

        function emit(page) {
            $rootScope.loading = true;
            socket.emit('ranking', {
                page: page,
                friends: $scope.friends ? $rootScope.user.friends : false
            });
        }

        emit();
    }
]);
