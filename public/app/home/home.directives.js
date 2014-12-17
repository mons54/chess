(function () {

    'use strict';

    angular.module('home.directives', []).

    directive('modalCreateGame', function () {
        return {
            templateUrl: '/app/home/templates/modal-create-game.html'
        };
    }).

    directive('modalChallenge', function () {
        return {
            templateUrl: '/app/home/templates/modal-challenge.html'
        };
    }).

    directive('dropdownFilterGame', function () {
        return {
            templateUrl: '/app/home/templates/dropdown-filter-game.html',
            link: function (scope, element) {
                scope.dropdownToggle = function () {
                    $('.dropdown-menu').hide();
                    scope.toggle = !scope.toggle;
                    if (scope.toggle) {
                        element.find('.dropdown-menu').show();
                    }
                };
            }
        };
    });
})();