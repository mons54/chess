(function () {

    'use strict';

    angular.module('components.directives', []).

    directive('loading', [
        function () {
            return {
                templateUrl: '/app/components/templates/loading.html'
            };
        }
    ]).

    directive('location', ['$location',
        function ($location) {
            return {
                link: function (scope, element, attrs) {
                    element.bind('click', function () {
                        scope.$apply(function () {
                            $location.path(attrs.location);
                        });
                    });
                }
            };
        }
    ]).

    directive('apprequests', ['$translate',
        function ($translate) {
            return {
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

    directive('buttonSound', ['$rootScope',
        function ($rootScope) {
            return {
                templateUrl: '/app/components/templates/button-sound.html',
                link: function (scope, element) {
                    element.bind('click', function () {
                        $rootScope.$apply(function () {
                            $rootScope.sound = !$rootScope.sound;
                        });
                    });
                }
            };
        }
    ]).

    directive('modalShop', ['$rootScope', '$translate', 'utils', 'host',
        function ($rootScope, $translate, utils, host) {
            return {
                templateUrl: '/app/components/templates/modal-shop.html',
                link: function (scope) {
                    scope.tokens = utils.getTokens();

                    scope.buy = function (token) {
                        FB.ui({
                            method: 'pay',
                            action: 'purchaseitem',
                            product: 'https://' + host + '/item/' + token.id + '/' + $translate('tokens') + '/' +  $translate('buyTokens'),
                            quantity: 1
                        }, function (response) {
                            if (response.status !== 'completed' || !response.signed_request) {
                                return;
                            }
                            $rootScope.socket.emit('payment', response);
                        });
                    };
                }
            };
        }
    ]).

    directive('sortable', ['$rootScope',
        function ($rootScope) {
            return {
                scope: {},
                templateUrl: '/app/components/templates/sortable.html',
                link: function (scope, element, attrs) {
                    scope.predicate = attrs.sortable;
                    scope.$watch('reverse', function (value) {
                        scope.$parent.predicate = scope.predicate;
                        scope.$parent.reverse = scope.reverse;
                    });
                }
            };
        }
    ]).

    directive('toggleElement', [
        function () {
            return {
                scope: {},
                templateUrl: '/app/components/templates/toggle-element.html',
                link: function (scope, element, attrs) {
                    scope.showHide = function () {
                        scope.open = !scope.open;
                        element.parents('.element').find('section').toggle();
                    }
                }
            };
        }
    ]).

    directive('colRight', ['$route',
        function ($route) {
            return {
                templateUrl: '/app/components/templates/col-right.html',
                link: function (scope) {
                    scope.isCurrentRoute = function (path) {
                        return !$route.current.regexp.test(path);
                    };
                }
            };
        }
    ]);
})();
