'use strict';

angular.module('components').

/**
 * @ngdoc directive
 * @name components.directive:button
 * @description 
 * Disable blur after clicking a button.
 * @restrict E
 */
directive('button', function () {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                element.blur();
            });
        }
      };
}).

/**
 * @ngdoc directive
 * @name components.directive:showModal
 * @description 
 * Add a click event to an item to show a modal.
 * @requires components.service:modal
 * @restrict A
 * @param {string} showModal Id of modal
 */
directive('showModal', ['modal',
    function (modal) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function (event) {
                    var element = modal.get(attrs.showModal);
                    modal.show(element);
                });
            }
        };
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:showProfile
 * @description 
 * Add an click event to the directive element to show modal profile.
 * @requires socket
 * @restrict A
 * @scope
 * @param {object} user User data {uid: uid, name: name}
 */
directive('showProfile', ['socket',
    function (socket) {
        return {
            scope: {
                showProfile: '='
            },
            link: function (scope, element) {
                element.bind('click', function () {
                    socket.emit('profile', {
                        uid: scope.showProfile.uid,
                        name: scope.showProfile.name
                    });
                });
            } 
        }
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:modalProfile
 * @description 
 * Show modal profile when receives an socket event.
 * @requires socket
 * @requires components.service:modal
 * @restrict E
 * @scope
 */
directive('modalProfile', ['socket', 'modal',
    function (socket, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: '/app/components/templates/modal-profile.html',
            link: function (scope, element) {
                socket.on('profile', function (data) {
                    scope.$apply(function () {
                        scope.data = data;
                    });
                    modal.show(element);
                });
            },
            controller: ['$scope', function ($scope) {
                var options = {
                    animate:{
                        duration: 0,
                        enabled: false
                    },
                    size: 150,
                    trackColor: '#2E3138',
                    scaleColor: false,
                    lineWidth: 10,
                    lineCap: 'circle'
                };

                $scope.options = {
                    win: angular.extend({
                        barColor: '#54c08b'
                    }, options),
                    draw: angular.extend({
                        barColor: '#565d6d'
                    }, options),
                    lose: angular.extend({
                        barColor: '#f5716e'
                    }, options),
                };

                $scope.getPercent = function(data) {
                    if (!$scope.data) {
                        return;
                    }
                    return 100 * data / $scope.data.games;
                };
            }]
        }
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:friendsRequests
 * @description 
 * Add an click event to the directive element to invite friends facebook.
 * @requires $translate
 * @restrict A
 */
directive('friendsRequests', ['$translate',
    function ($translate) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.bind('click', function () {
                    FB.ui({
                        method: 'apprequests',
                        title: $translate('title'),
                        message: $translate('description'),
                    });
                });
            }
        };
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:buttonSound
 * @description 
 * Add an click event to the directive element to manage sound
 * @requires $rootScope
 * @restrict E
 */
directive('buttonSound', ['$rootScope',
    function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/app/components/templates/button-sound.html',
            link: function (scope, element) {
                element.on('click', function () {
                    $rootScope.$apply(function () {
                        $rootScope.sound = !$rootScope.sound;
                    });
                });
            }
        };
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:sortable
 * @description 
 * Use this directive to make a sortable column
 * @requires $rootScope
 * @requires orderByFilter
 * @restrict A
 * @param {array} expression The sort order. Example: ['points', 'time', 'color']
 * @param {array} collection The list that sort
 * @param {string} icon The icon to display for this column
 */
directive('sortable', ['$rootScope', 'orderByFilter',
    function ($rootScope, orderBy) {
        return {
            restrict: 'A',
            scope: {
                expression: '='
            },
            templateUrl: '/app/components/templates/sortable.html',
            link: function (scope, element, attrs) {
                var collection = scope.$parent[attrs.collection];
                scope.icon = attrs.icon;
                scope.sort = function () {
                    if (!scope.$parent[attrs.collection]) {
                        return;
                    }
                    scope.reverse = !scope.reverse;
                    scope.$parent[attrs.collection] = orderBy(scope.$parent[attrs.collection], scope.expression, scope.reverse);
                };
            }
        };
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:elementToggle
 * @description 
 * Use this directive to make a toggle element
 * @requires $rootScope
 * @requires orderByFilter
 * @restrict E
 */
directive('elementToggle', [
    function () {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: '/app/components/templates/element-toggle.html',
            link: function (scope, element, attrs) {
                scope.toggle = function () {
                    scope.open = !scope.open;
                    element.parents('[element]').find('[element-content]').toggle();
                }
            }
        };
    }
]);
