(function () {

    'use strict';

    angular.module('ranking.controllers', []).

    controller('rankingCtrl', ['$rootScope', '$scope',
        
        function ($rootScope, $scope) {
            
            $scope.friends = false;

            $rootScope.socket.emit('leaveHome');

            $rootScope.socket.on('ranking', function (data) {
                getDataRanking(data);
            });

            $scope.rankingType = function () {
                $scope.friends = !$scope.friends;
                ranking();
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

            function ranking (page) {
                $scope.loading = true;
                $rootScope.socket.emit('ranking', {
                    page: page,
                    friends: $scope.friends ? $rootScope.user.friends : false
                });
            }

            function getDataRanking (data) {
                
                if (!data) {
                    return;
                }

                $scope.$apply(function () {

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
                    setUsersName();
                    $scope.loading = false;
                });
            }

            function setUsersName () {
                angular.forEach($scope.ranking, function (value) {
                    setUserName(value);
                });
            }

            function setUserName (data) {
                FB.api('/' + data.uid + '?fields=name', function (response) {
                    if (!response || !response.name) {
                        return;
                    }
                    applyUserName(data, response);
                });
            }

            function applyUserName (data, response) {
                $scope.$apply(function () {
                    data.name = response.name;
                });
            }


            function setPage (page) {
                page = parseInt(page);
                if (!page || page == $scope.currentPage || page < 0 || page > $scope.pageLast) {
                    return;
                }
                ranking(page);
            }

            ranking();
        }
    ]);
    
})();
