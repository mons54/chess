'use strict';

/**
 * @ngdoc overview
 * @name trophies
 * @description 
 * Management of trophies
 */
angular.module('trophies', [])

/**
 * @ngdoc service
 * @name trophies.service:trophies
 * @description 
 * Service trophies
 */
.service('trophies', ['$rootScope', function ($rootScope) {
    return {
        trophies: {
            1: 'game-1',
            2: 'game-10',
            3: 'game-500',
            4: 'game-1000',
            5: 'game-5000',
            6: 'win-1',
            7: 'win-50',
            8: 'win-250',
            9: 'win-500',
            10: 'win-2000',
            11: 'game-day-5',
            12: 'game-day-10',
            13: 'game-day-25',
            14: 'game-day-50',
            15: 'game-day-100',
            16: 'win-cons-3',
            17: 'win-cons-5',
            18: 'win-cons-10',
            19: 'win-cons-20',
            20: 'lose-cons-3'
        },
        /**
         * @ngdoc function
         * @name #getUserClass
         * @methodOf trophies.service:trophies
         * @description 
         * If user has trophy display class
         * @param {string} id Id of trophy
         * @returns {string} Class to display to the user
         */
        getUserClass: function (id) {
            return 'app-trophy__badge-' + ($rootScope.user.trophies.indexOf(parseInt(id)) !== -1 ? this.trophies[id] : 'unknown');
        }
    };
}]).

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
directive('modalTrophy', ['$rootScope', 'modal', 'trophies',
    function ($rootScope, modal, trophies) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: '/app/trophies/templates/modal-trophy.html',
            link: function (scope, element) {

                function show() {

                    if (!scope.data || !scope.data.length) {
                        return;
                    }

                    scope.trophy = scope.data.shift();
                    modal.show(element);

                    element.one('hide', function () {
                        scope.$apply(show);
                    });
                }

                $rootScope.$on('trophies', function (event, data) {
                    scope.data = data;
                    show();
                });

                scope.getUserClass = function () {
                    if (!scope.trophy) {
                        return;
                    }
                    return trophies.getUserClass(scope.trophy);
                };
            }
        };
    }
]);
