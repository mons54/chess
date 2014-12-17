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
                scope.dropdownFilterGameToggle = function () {
                    dropdown(element);
                };
            }
        };
    }).

    directive('dropdownFilterChallenger', function () {
        return {
            templateUrl: '/app/home/templates/dropdown-filter-challenger.html',
            link: function (scope, element) {
                scope.dropdownFilterChallengerToggle = function () {
                    dropdown(element);
                };
            }
        };
    });

    function dropdown (element) {
        var dropdown = element.find('.dropdown-menu'),
            toggle = dropdown.is(':visible');

        $('.dropdown-menu').hide();
        if (!toggle) {
            dropdown.show();
        }
    }
    
})();