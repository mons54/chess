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
    ])

    .directive('draggable', function () {
        return {
            link: function (scope, element, attr) {
                var piece = scope.game.pieces[attr.position];
                if (scope.isPlayerTurn() && piece.color === scope.game.turn && (piece.deplace.length || piece.capture.length)) {
                    $(element).draggable({
                        helper: 'clone',
                        zIndex: '99999',
                        start: function (event, ui) {
                            angular.forEach(piece.deplace, function (value) {
                                if (value) {
                                    //deplace(position, value, piece);
                                }
                            });
                            angular.forEach(piece.capture, function (value) {
                                if (value) {
                                    //capture(position, value, piece);
                                }
                            });
                        },
                        stop: function (event, ui) {
                            angular.forEach(piece.deplace, function (value) {
                                if (value) {
                                    //destroyDroppable(value);
                                }
                            });
                            angular.forEach(piece.capture, function (value) {
                                if (value) {
                                    //destroyDroppable(value);
                                }
                            });
                        }
                    });
                }
            }
        };
    });
    
})();
