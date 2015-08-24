(function () {

    'use strict';

    angular.module('game.directives', []).

    directive('profileGame', ['utils',
        function (utils) {
            return {
                scope: { player: '=' },
                templateUrl: '/app/game/templates/profile-game.html',
                controller: 'profileGameCtrl'
            };
        }
    ]);
    
})();
