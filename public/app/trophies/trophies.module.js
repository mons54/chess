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
         * @name #hasTrophy
         * @methodOf trophies.service:trophies
         * @description 
         * Check if user has trophy
         * @param {string} id Id of trophy
         * @returns {bool} Response
         */
        hasTrophy: function (id) {
            return $rootScope.user && $rootScope.user.trophies && $rootScope.user.trophies.indexOf(parseInt(id)) !== -1;
        },
        /**
         * @ngdoc function
         * @name #getUserClass
         * @methodOf trophies.service:trophies
         * @description 
         * If user has trophy return image
         * @param {string} id Id of trophy
         * @returns {string} Class
         */
        getUserClass: function (id) {
            return 'app-trophy__badge-' + (this.hasTrophy(id) ? this.trophies[id] : 'unknown');
        },
        /**
         * @ngdoc function
         * @name #getUserImage
         * @methodOf trophies.service:trophies
         * @description 
         * If user has trophy return class
         * @param {string} id Id of trophy
         * @returns {string} Image
         */
        getUserImage: function (id) {
            return 'trophies/' + (this.hasTrophy(id) ? this.trophies[id] : 'unknown') + '.png';
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
directive('modalTrophy', ['$rootScope', 'modal',
    function ($rootScope, modal) {
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

                    element.one('hide', show);
                }

                $rootScope.$on('trophies', function (event, data) {
                    scope.data = data;
                    show();
                });
            },
            controller: ['$scope', '$filter', 'utils', 'trophies',

                function ($scope, $filter, utils, trophies) {

                    $scope.getUserClass = function (id) {
                        if (!id) {
                            return;
                        }
                        return trophies.getUserClass(id);
                    };

                    $scope.hasTrophy = function (id) {
                        return trophies.hasTrophy(id);
                    };

                    $scope.shareTrophy = function (id) {
                        if (!id || !trophies.hasTrophy(id)) {
                            return;
                        }

                        utils.share({
                            name: $filter('translate')('trophies.content.' + id + '.title'),
                            description: $filter('translate')('trophies.content.' + id + '.description'),
                            picture: trophies.getUserImage(id)
                        });
                    };
                }
            ]
        };
    }
]);
