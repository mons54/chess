'use strict';

/**
 * @ngdoc overview
 * @name trophies
 * @description 
 * Management of trophies
 */
angular.module('trophies', []).


/**
 * @ngdoc directive
 * @name trophies.directive:modalTrophy
 * @description 
 * Show modal trophy.
 * @requires $rootScope
 * @requires components.service:modal
 * @requires trophies
 * @restrict E
 * @scope
 */
directive('modalTrophy', ['$rootScope', '$timeout', '$filter', 'modal',
    function ($rootScope, $timeout, $filter, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: '/app/trophies/templates/modal-trophy.html',
            link: function (scope, element) {

                var modalTrophy = modal(element),
                    load = false;

                function show(data) {

                    if (!data || !data.length) {
                        load = false;
                        return;
                    }

                    var trophy = data.shift();

                    scope.trophy = trophy;
                    scope.shareData = {
                        title: $filter('translate')('trophies.content.' + trophy + '.title'),
                        description: $filter('translate')('trophies.content.' + trophy + '.description'),
                        picture: 'trophies/trophy-' + trophy + '.png'
                    };

                    modalTrophy.show();

                    element.one('hide', function () {
                        $timeout(function () {
                            show(data);
                        });
                    });
                }

                $rootScope.$on('trophies', function (event, data) {
                    if (load) {
                        return;
                    }
                    load = true;
                    show(data);
                });
            }
        };
    }
]);
