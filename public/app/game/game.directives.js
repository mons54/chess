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
                if (!scope.isPlayerTurn() || piece.color !== scope.game.turn || (!piece.deplace.length && !piece.capture.length)) {
                    return;
                }
                $(element).draggable({
                    helper: 'clone',
                    zIndex: '99999',
                    start: start,
                    stop: stop
                });

                function start(event, ui) {
                    angular.forEach(piece.deplace.concat(piece.capture), function (value) {
                        droppable(value);
                    });
                }

                function stop(event, ui) {
                    angular.forEach(piece.deplace.concat(piece.capture), function (value) {
                        angular.element('#' + value).droppable('destroy')
                    });
                }

                function droppable(position) {
                    angular.element('#' + position).droppable({
                        drop: function (event, ui) {
                           $('.piece').draggable({
                                disabled: true
                            }).removeClass('ui-draggable');

                            $(event.target).append(ui.draggable);

                            scope.move(piece, attr.position, position);
                        }
                    });
                }
            }
        };
    });
    
})();
