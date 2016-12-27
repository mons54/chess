'use strict';

angular.module('game').

/**
 * @ngdoc directive
 * @name game.directive:profileGame
 * @description 
 * Shows the profile of a player.
 * @restrict A
 * @scope
 * @param {object} player Object with the data of the player.
 */
directive('profileGame', ['utils',
    function (utils) {
        return {
            restrict: 'A',
            scope: { 
                player: '=' 
            },
            replace: true,
            templateUrl: '/app/game/templates/profile-game.html',
            controller: 'profileGameCtrl'
        };
    }
])

/**
 * @ngdoc directive
 * @name game.directive:pieceDraggable
 * @description 
 * Makes a piece draggable piece.
 * @restrict A
 * @scope
 * @param {string} position The position of the piece.
 */
.directive('pieceDraggable', ['modal', function (modal) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {

            var modalPromotion = modal.get('modal-promotion');

            scope.$watch('game', function (game) {

                if (game.finish && element.draggable) {
                    element.draggable({
                        disabled: true
                    });
                    return;
                }

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
                        angular.element('#' + value).droppable('destroy');
                    });
                }

                function droppable(position) {
                    angular.element('#' + position).droppable({
                        drop: function (event, ui) {
                            drop(angular.element(this), position);
                        }
                    });
                }

                function drop(elementBox, position) {

                    var classes = element.attr('class');

                    elementBox.find('[piece-draggable]').removeClass();

                    if (isPromotion(position)) {
                        modal.show(modalPromotion);
                        modalPromotion.find('[data-icon]').click(function() {
                            var promotion = angular.element(this).data('icon');
                            modalPromotion.find('[data-icon]').unbind('click');
                            move(elementBox, classes.replace('pawn', promotion), position, promotion);
                        });
                    } else {
                        move(elementBox, classes, position);
                    }

                    angular.element('[piece-draggable]').draggable({
                        disabled: true
                    });
                }

                function move(elementBox, classes, position, promotion) {
                    elementBox.find('[piece-draggable]').addClass(classes);
                    scope.move(attr.position, position, promotion);
                }

                function isPromotion(position) {
                    return piece.name === 'pawn' && (position.substr(-1) === '1' || position.substr(-1) === '8');
                }
            });
        }
    };
}]);
