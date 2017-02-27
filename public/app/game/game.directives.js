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
directive('pieceDraggable', ['modal', 'utils', function (modal, utils) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {

            var selectedClass = 'selected',
                droppableClass =  'ui-droppable',
                modalPromotion = modal('#modal-promotion');

            scope.$watch('game', function (game) {

                if (game.finish) {
                    element.draggable({
                        disabled: true
                    }).unbind('click').closest('[data-game-box]').removeClass(selectedClass);
                    $('.' + droppableClass).removeClass(droppableClass);
                    return;
                }

                var piece = game.pieces[attr.position];

                if (!piece || 
                    !scope.isPlayerTurn() || 
                    piece.color !== game.turn || 
                    (!piece.deplace.length && !piece.capture.length)) {
                    return;
                }

                element.click(function () {
                    var isOpen = $(this).data('open');
                    startMove();
                    if (isOpen) {
                        stopClickable($(this));
                        $('.' + droppableClass).removeClass(droppableClass).unbind('click');
                    } else {
                        $(this).data('open', true).closest('[data-game-box]').addClass(selectedClass);
                        getMovements(function (position) {
                            $('#' + position).addClass(droppableClass).click(function () {
                                stopClickable(element);
                                $('.' + droppableClass).removeClass(droppableClass).unbind('click');
                                move($(this), position);
                            });
                        });
                    }
                });

                element.draggable({
                    disabled: false,
                    helper: 'clone',
                    zIndex: '99999',
                    start: function (event, ui) {
                        startMove();
                        element.closest('[data-game-box]').addClass(selectedClass);
                        getMovements(function (position) {
                            $('#' + position).droppable({
                                drop: function (event, ui) {
                                    move($(this), position);
                                }
                            });
                        });
                    },
                    stop: function (event, ui) {
                        stopClickable(element);
                        getMovements(function (position) {
                            $('#' + position).droppable('destroy');
                        });
                    }
                });

                function startMove() {
                    stopClickable($('[piece-draggable]'));
                    $('.' + droppableClass).removeClass(droppableClass).unbind('click');
                }

                function stopClickable (element) {
                    element.data('open', false).closest('[data-game-box]').removeClass(selectedClass);
                }

                function getMovements (callback) {
                    angular.forEach(piece.deplace.concat(piece.capture), callback);
                }

                function move(elementBox, position) {

                    if (isPromotion(position)) {
                        modalPromotion.show();
                        modalPromotion.find('[data-icon]').click(function() {
                            var promotion = $(this).data('icon');
                            modalPromotion.find('[data-icon]').unbind('click');
                            sendMove(position, promotion);
                        });
                    } else {
                        sendMove(position);
                    }

                    $('[piece-draggable]').unbind('click'); 
                    $('[piece-draggable]').draggable({
                        disabled: true
                    });
                }

                function sendMove(position, promotion) {
                    scope.move(attr.position, position, promotion);
                }

                function isPromotion(position) {
                    return piece.name === 'pawn' && (position.substr(-1) === '1' || position.substr(-1) === '8');
                }
            });
        }
    };
}]).

/**
 * @ngdoc directive
 * @name components.directive:scrollGame
 * @description 
 * Scroll Game
 * @restrict A
 * @scope
 */
directive('scrollGame', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            var isScroll = true,
                direction = attrs.scrollGameDirection,
                el = element[0];

            element.on('scroll', function () {
                if (direction === 'left') {
                    isScroll = (el.scrollLeft + el.clientWidth + 1) > el.scrollWidth;
                } else {
                    isScroll = (el.scrollTop + el.clientHeight + 1) > el.scrollHeight;
                }
            });

            scope.$watchCollection(attrs.scrollGame, function (newValue) {
                if (newValue && isScroll) {
                    $timeout(function() {
                        if (direction === 'left') {
                            element.scrollLeft(el.scrollWidth);
                        } else {
                            element.scrollTop(el.scrollHeight);
                        }
                    });
                }
            });

            if (attrs.scrollGameActive) {
                scope.$watch(attrs.scrollGameActive, function (newValue) {
                    if (!scope.game || !scope.game.finish || typeof newValue === 'undefined') {
                        return;
                    }

                    $timeout(function() {

                        var active = element.find('[data-scroll-game-active="' + newValue + '"]');

                        if (!active.length) {
                            return;
                        }

                        if (typeof attrs.scrollGameActiveParent !== 'undefined') {
                            active = active.parent();
                        }

                        if (direction === 'left') {
                            var left = element.scrollLeft(),
                                right = element.scrollLeft() + element.width(),
                                offset = active.position().left,
                                width = active.outerWidth();

                            if (offset < left) {
                                element.scrollLeft(offset);
                            } else if (offset + width >= right) {
                                element.scrollLeft(offset + width - element.width());
                            }
                        } else {
                            var top = element.scrollTop(),
                                bottom = element.scrollTop() + element.height(),
                                offset = active.position().top,
                                height = active.outerHeight();

                            if (offset < top) {
                                element.scrollTop(offset);
                            } else if (offset + height >= bottom) {
                                element.scrollTop(offset + height - element.height());
                            }
                        }
                    });
                });
            }

            if (attrs.scrollGameShow) {
                scope.$watch(attrs.scrollGameShow, function (newValue) {
                    if (newValue && isScroll) {
                        $timeout(function() {
                            if (direction === 'left') {
                                element.scrollLeft(el.scrollWidth);
                            } else {
                                element.scrollTop(el.scrollHeight);
                            }
                        });
                    }
                });
            }
        }
    };
}]);
