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


                scope.$watch('game', function (game) {

                    var piece = game.pieces[attr.position];

                    if (!piece || !scope.isPlayerTurn() || piece.color !== game.turn || (!piece.deplace.length && !piece.capture.length)) {
                        return;
                    }

                    element.draggable({
                        disabled: false,
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
                                angular.element('.piece').draggable({
                                    disabled: true
                                }).removeClass('ui-draggable');

                                $(this).find('.piece').removeClass().addClass(element.attr('class'));

                                element.removeClass();

                                scope.move(attr.position, position);
                            }
                        });
                    }
                });
            }
        };
    });
    
})();
