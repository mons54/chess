(function () {

    'use strict';

    angular.module('ranking.controllers', []).

    controller('rankingCtrl', ['$rootScope', '$scope',
        
        function ($rootScope, $scope) {
            
            $scope.friends = false;

            $rootScope.socket.emit('leaveHome');

            $rootScope.socket.on('ranking', function (data) {

                if (!data) {
                    return;
                }

                $scope.$apply(apply(data));
            });

            $scope.rankingType = function () {
                $scope.friends = !$scope.friends;
                emit();
            };

            $scope.setPagePrev = function () {
                setPage($scope.pagePrev);
            };

            $scope.setPageNext = function () {
                setPage($scope.pageNext);
            };

            $scope.setPage = function (page) {
                setPage(page);
            };

            function emit(page) {
                $scope.loading = true;
                $rootScope.socket.emit('ranking', {
                    page: page,
                    friends: $scope.friends ? $rootScope.user.friends : false
                });
            }

            function apply(data) {

                var usersId = [],
                    usersName;
                
                $scope.pagination = false;

                if (data.pages) {
                    $scope.pagination = true;
                    $scope.currentPage = data.pages.page;
                    $scope.page = $scope.currentPage;
                    $scope.pagePrev = data.pages.prev;
                    $scope.pageNext = data.pages.next;
                    $scope.pageLast = data.pages.last;
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

                $scope.loading = false;
            }

            function setUsersName (data) {

                angular.forEach($scope.ranking, function (value) {
                    if (!data[value.uid]) {
                        return;
                    }
                    value.name = data[value.uid].name; 
                });
            }

            function setPage (page) {
                page = parseInt(page);
                if (!page || page == $scope.currentPage || page < 0 || page > $scope.pageLast) {
                    return;
                }
                emit(page);
            }

            emit();
        }
    ]);
    
})();
