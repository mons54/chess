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

    .directive('modalPromotion', function () {
        return {
            templateUrl: '/app/game/templates/modal-promotion.html'
        };
    })

    .directive('modalOfferDraw', function () {
        return {
            templateUrl: '/app/game/templates/modal-offer-draw.html'
        };
    })

    .directive('modalResign', function () {
        return {
            templateUrl: '/app/game/templates/modal-resign.html'
        };
    })

    .directive('draggable', function () {
        return {
            link: function (scope, element, attr) {

                var modalPromotion = angular.element('#modal-promotion');

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
                        angular.element('.piece').draggable({
                            disabled: true
                        });

                        var classes = element.attr('class');

                        elementBox.children().removeClass();
                        element.removeClass().addClass('piece');

                        if (isPromotion(position)) {
                            modalPromotion.modal('show').find('.piece').click(function() {
                                var promotion = angular.element(this).data('value');
                                modalPromotion.find('.piece').unbind('click');
                                move(elementBox, classes.replace('pawn', promotion), position, promotion);
                            });
                        } else {
                            move(elementBox, classes, position);
                        }
                    }

                    function move(elementBox, classes, position, promotion) {
                        elementBox.children().addClass(classes);
                        scope.move(attr.position, position, promotion);
                    }

                    function isPromotion(position) {
                        return piece.name === 'pawn' && (position.substr(-1) === '1' || position.substr(-1) === '8');
                    }
                });
            }
        };
    });
    
})();
