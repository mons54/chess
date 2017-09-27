/**
 * @ngdoc overview
 * @name trophies
 * @description 
 * Management of trophies
 */
angular.module('trophies', []).

directive('progressBarTrophy', function () {
    return {
        restrict: 'A',
        scope: {
            progressBarTrophy: '=',
        },
        link: function (scope, element, attrs) {
            if (attrs.progressBarTrophyWatch) {
                scope.$parent.$watch(attrs.progressBarTrophyWatch, function (value) {
                    if (value) {
                        element.empty();
                        progressBar(value.value);
                    }
                });
            } else {
                progressBar(scope.progressBarTrophy);
            }

            function progressBar(value) {
                new ProgressBar.Circle(element[0], {
                    strokeWidth: attrs.progressBarTrophyWidth,
                    color: '#388E3C',
                    trailWidth: attrs.progressBarTrophyTrailWidth,
                    trailColor: '#795548'
                }).set(value / 100);
            }
        }
    };
}).


/**
 * @ngdoc directive
 * @name trophies.directive:modalTrophy
 * @description 
 * Show modal trophy.
 * @requires $rootScope
 * @requires components.service:modal
 * @requires trophies
 * @restrict E
 * @scope
 */
directive('modalTrophy', ['$rootScope', '$timeout', '$filter', 'modal',
    function ($rootScope, $timeout, $filter, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            priority: 1000,
            templateUrl: 'modal-trophy.html',
            link: function (scope, element) {

                var modalTrophy = modal(element),
                    load = false;

                function show(data) {

                    if (!data || !Object.keys(data).length) {
                        load = false;
                        return;
                    }

                    var id = Object.keys(data)[0],
                        trophy = {
                            id: id,
                            value: data[id]
                        };

                    delete data[id];

                    scope.trophy = trophy;

                    scope.shareData = {
                        href: '/' + $rootScope.lang + '/trophy/' + trophy.id,
                        title: $filter('translate')('trophies.content.' + trophy.id + '.title'),
                        description: $filter('translate')('trophies.content.' + trophy.id + '.description'),
                        picture: '/trophies/trophy-' + trophy.id + '.png'
                    };

                    modalTrophy.show();

                    element.one('hide', function () {
                        $timeout(function () {
                            show(data);
                        });
                    });
                }

                $rootScope.$on('trophies', function (event, data) {
                    
                    if (load) {
                        return;
                    }

                    load = true;
                    scope.share = data.share;
                    
                    show(data.trophies);
                });
            }
        };
    }
]);
