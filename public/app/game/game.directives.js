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
]).

/**
 * @ngdoc directive
 * @name game.directive:pieceDraggable
 * @description 
 * Makes a piece draggable piece.
 * @restrict A
 * @scope
 * @param {string} position The position of the piece.
 */
directive('pieceDraggable', ['modal', 'isTouch', function (modal, isTouch) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {

            var modalPromotion = modal.get('modal-promotion'),
                touch = isTouch(),
                droppableClass =  'ui-droppable';

            scope.$watch('game', function (game) {

                if (game.finish) {
                    if (touch) {
                        element.unbind('click');
                    } else if (element.draggable) {
                        element.draggable({
                            disabled: true
                        });
                    } 
                    return;
                }

                var piece = game.pieces[attr.position];

                if (!piece || 
                    !scope.isPlayerTurn() || 
                    piece.color !== game.turn || 
                    (!piece.deplace.length && !piece.capture.length)) {
                    return;
                }

                if (touch) {
                    element.click(function () {
                        var isOpen = $(this).data('open');
                        $('[piece-draggable]').data('open', false);
                        $('.' + droppableClass).removeClass(droppableClass).unbind('click');
                        if (isOpen) {
                            $(this).data('open', false);
                            $('.' + droppableClass).removeClass(droppableClass).unbind('click');
                        } else {
                            $(this).data('open', true);
                            getMovements(function (position) {
                                $('#' + position).addClass(droppableClass).click(function () {
                                    element.data('open', false);
                                    $('.' + droppableClass).removeClass(droppableClass).unbind('click');
                                    move($(this), position);
                                });
                            });
                        }
                    });
                } else {
                    element.draggable({
                        disabled: false,
                        helper: 'clone',
                        zIndex: '99999',
                        start: function (event, ui) {
                            getMovements(function (position) {
                                $('#' + position).droppable({
                                    drop: function (event, ui) {
                                        move($(this), position);
                                    }
                                });
                            });
                        },
                        stop: function (event, ui) {
                            getMovements(function (position) {
                                $('#' + position).droppable('destroy');
                            });
                        }
                    });
                }

                function getMovements (callback) {
                    angular.forEach(piece.deplace.concat(piece.capture), callback);
                }

                function move(elementBox, position) {

                    var classes = element.attr('class');

                    elementBox.find('[piece-draggable]').removeClass();

                    if (isPromotion(position)) {
                        modal.show(modalPromotion);
                        modalPromotion.find('[data-icon]').click(function() {
                            var promotion = $(this).data('icon');
                            modalPromotion.find('[data-icon]').unbind('click');
                            sendMove(elementBox, classes.replace('pawn', promotion), position, promotion);
                        });
                    } else {
                        sendMove(elementBox, classes, position);
                    }

                    if (touch) {
                        $('[piece-draggable]').unbind('click'); 
                    } else {
                        $('[piece-draggable]').draggable({
                            disabled: true
                        }); 
                    }
                }

                function sendMove(elementBox, classes, position, promotion) {
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
