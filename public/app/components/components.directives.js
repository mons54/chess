(function () {

    'use strict';

    angular.module('components.directives', []).

    directive('location', function ($location) {
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
    });
})();