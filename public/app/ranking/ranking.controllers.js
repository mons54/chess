(function () {

    'use strict';

    angular.module('ranking.controllers', []).

    controller('rankingCtrl', ['$rootScope', '$scope',
        
        function ($rootScope, $scope) {
            
            $scope.friends = false;

            $rootScope.socket.emit('leaveHome');

            $rootScope.socket.on('ranking', function (data) {
                $scope.$apply(apply(data));
            });

            $scope.rankingType = function () {
                $scope.friends = !$scope.friends;
                emit();
            };

            $scope.setPage = function (page) {
                page = parseInt(page);
                if (!page || page < 0 || !$scope.pages || page === $scope.pages.page || page > $scope.pages.last) {
                    return;
                }
                emit(page);
            };

            function emit(page) {
                $rootScope.loading = true;
                $rootScope.socket.emit('ranking', {
                    page: page,
                    friends: $scope.friends ? $rootScope.user.friends : false
                });
            }

            function apply(data) {

                $rootScope.loading = false;

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

                FB.api('?ids=' + usersId.join() + '&fields=name', function (response) {
                    if (!response) {
                        return;
                    }
                    $scope.$apply(setUsersName(response));
                });

                $rootScope.loading = false;
            }

            function setUsersName (data) {

                angular.forEach($scope.ranking, function (value) {
                    if (!data[value.uid]) {
                        return;
                    }
                    value.name = data[value.uid].name; 
                });
            }

            emit();
        }
    ]);
    
})();
