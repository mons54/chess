(function () {

    'use strict';

    angular.module('components.directives', []).

    directive('location', ['$location',
        function ($location) {
            return {
                scope: {
                    path: '='
                },
                link: function (scope, element) {
                    element.bind('click', function () {
                        scope.$apply(function () {
                            $location.path(scope.path);
                        });
                    });
                }
            };
        }
    ]).

    directive('thSortable', ['$rootScope',
        function ($rootScope) {
            return {
                scope: {
                    name: '='
                },
                templateUrl: '/app/components/templates/th-sortable.html',
                link: function (scope, element, attrs) {
                    scope.text = $rootScope.text;
                    scope.$watch('reverse', function (value) {
                        scope.$parent.predicate = scope.predicate;
                        scope.$parent.reverse = scope.reverse;
                    });
                }
            };
        }
    ]);
})();