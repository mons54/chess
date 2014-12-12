(function () {

    'use strict';

    angular.module('home.directives', []).

    directive('modalCreateGame', function () {
        return {
            templateUrl: '/app/home/templates/modal-create-game.html'
        };
    });
})();