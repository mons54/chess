(function () {

    'use strict';

    angular.module('components.directives', []).

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

    directive('modal', [ 
        function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    
                    var modal = $('#' + attrs.modal);
                    
                    element.on('click', function(event) {
                        modal.addClass('app-modal--active');
                    });

                    modal.find('[modal-close]').on('click', closeModal);

                    $('.app-modal__bg').on('click', function close(event) {
                        if (!this || event.target !== this) {
                            return;
                        }
                        closeModal(event);
                    });

                    function closeModal(event) {
                        modal.removeClass('app-modal--active');
                    }
                }
            };
        }
    ]).

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

    directive('sortable', ['$rootScope', 'orderByFilter',
        function ($rootScope, orderBy) {
            return {
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
