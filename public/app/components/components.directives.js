(function () {

    'use strict';

    angular.module('components.directives', []).

    directive('profile', ['$rootScope',
        function ($rootScope) {
            return {
                scope: {
                    'user': '='
                },
                link: function (scope, element) {
                    element.bind('click', function () {
                        $rootScope.socket.emit('profile', {
                            uid: scope.user.uid,
                            name: scope.user.name
                        });
                    });
                } 
            }
        }
    ]).

    directive('modalProfile', ['$rootScope',
        function ($rootScope) {
            return {
                scope: true,
                templateUrl: '/app/components/templates/modal-profile.html',
                link: function (scope, element) {
                    $rootScope.$watch('socket', function (socket) {
                        if (!socket) {
                            return;
                        }
                        socket.on('profile', function (data) {
                            scope.$apply(function () {
                                scope.data = data;
                            });
                            element.modal('show');
                        });
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

    directive('loading', [
        function () {
            return {
                templateUrl: '/app/components/templates/loading.html'
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
                        return $route.current.regexp.test(path);
                    };
                }
            };
        }
    ]);
})();
