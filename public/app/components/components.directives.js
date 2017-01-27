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
                    modal(attrs.showModal).show();
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
directive('showProfile', ['$rootScope', 'socket',
    function ($rootScope, socket) {
        return {
            scope: {
                showProfile: '='
            },
            link: function (scope, element) {
                element.bind('click', function () {

                    if ($rootScope.loadProfile) {
                        return;
                    }

                    $rootScope.loadProfile = true;

                    socket.emit('profile', {
                        uid: scope.showProfile.uid,
                        name: scope.showProfile.name,
                        avatar: scope.showProfile.avatar
                    });
                });
            } 
        }
    }
]).

directive('modalCreateGame', ['$route', 'modal', 'socket', 'paramsGame', 

    function ($route, modal, socket, paramsGame) {
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            templateUrl: '/app/components/templates/modal-create-game.html',
            link: function (scope, element) {

                var pointsMin = [],
                    pointsMax = [],
                    value;

                for (value = paramsGame.points.min; value <= paramsGame.points.max; value += 100) {
                    if (value > paramsGame.points.min) {
                        pointsMax.push(value);
                    }
                    if (value < paramsGame.points.max) {
                        pointsMin.push(value);
                    }
                }

                scope.paramsGame = paramsGame;

                scope.game = {
                    color: paramsGame.colors[0],
                    color: null,
                    time: paramsGame.times[0],
                    pointsMin: null,
                    pointsMax: null
                };

                scope.$watch('game.pointsMin', function (value) {

                    if (!value) {
                        value = pointsMin[0];
                    }

                    var data = [];

                    angular.forEach(pointsMax, function (max) {
                        if (value < max) {
                            data.push(max);
                        }
                    });

                    scope.paramsGame.pointsMax = data;
                });

                scope.$watch('game.pointsMax', function (value) {

                    if (!value) {
                        value = pointsMax[pointsMax.length - 1];
                    }

                    var data = [];

                    angular.forEach(pointsMin, function (min) {
                        if (value > min) {
                            data.push(min);
                        }
                    });

                    scope.paramsGame.pointsMin = data;
                });

                scope.removeGame = function () {
                    socket.emit('removeGame');
                };

                scope.createGame = function () {
                    socket.emit('createGame', scope.game);
                    if ($route.current.name === 'home') {
                        modal(element).hide();
                    } else {
                        scope.loadGame = true;
                    }
                };

                scope.getColorClass = function (color) {
                    if (!color) {
                        return;
                    }
                    return game.color === 'white' ? 'app-search__game-color--white' : 'app-search__game-color--black';
                };

                element.on('hide', function () {
                    delete scope.loadGame;
                });
            }
        };
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
directive('modalProfile', ['$rootScope', 'socket', 'modal',
    function ($rootScope, socket, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: '/app/components/templates/modal-profile.html',
            link: function (scope, element) {

                var defaultOptions = {
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

                var options = {
                    win: angular.extend({
                        barColor: '#54c08b'
                    }, defaultOptions),
                    draw: angular.extend({
                        barColor: '#565d6d'
                    }, defaultOptions),
                    lose: angular.extend({
                        barColor: '#f5716e'
                    }, defaultOptions),
                };

                socket.on('profile', function (data) {

                    delete $rootScope.loadProfile;

                    scope.charts = [];

                    angular.forEach(['win', 'draw', 'lose'], function (name) {
                        scope.charts.push({
                            name: name,
                            value: data[name],
                            percent: 100 * data[name] / data.games,
                            options: options[name]
                        });
                    });

                    scope.data = data;

                    modal(element).show();

                }, scope);
            }
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
directive('friendsRequests', ['$filter',
    function ($filter) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.bind('click', function () {
                    FB.ui({
                        method: 'apprequests',
                        title: $filter('translate')('title'),
                        message: $filter('translate')('description'),
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
                    scope.close = !scope.close;
                    element.parents('[element]').find('[element-content]').toggle();
                }
            }
        };
    }
]).

/**
 * @ngdoc directive
 * @name components.directive:scrollDown
 * @description 
 * Scroll Down
 * @restrict A
 * @scope
 * @param {string} scrollDown Name of scope data (ex: played for $scope.played)
 */
directive('scrollDown', ['$timeout', function ($timeout) {
    return {
        scope: {
            scrollDown: '=',
            scrollDownShow: '='
        },
        restrict: 'A',
        link: function(scope, element, attrs) {
            var scrollDown = true,
                el = element[0];

            element.on('scroll', function () {
                var el = element[0];
                scrollDown = (el.scrollTop + el.clientHeight + 1) > el.scrollHeight;
            });

            scope.$parent.$watchCollection(scope.scrollDown, function (newValue) {
                if (newValue && scrollDown) {
                    element.scrollTop(el.scrollHeight);
                }
            });

            if (scope.scrollDownShow) {
                scope.$parent.$watch(scope.scrollDownShow, function (newValue) {
                    if (newValue && scrollDown) {
                        $timeout(function() {
                            element.scrollTop(el.scrollHeight);
                        });
                    }
                });
            }
        }
    };
}]).

directive('pagination', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: '/app/components/templates/pagination.html',
        controller: ['$scope', function ($scope) {
            $scope.setPage = function (page) {
                page = parseInt(page);
                if (!page || page < 0 || page === $rootScope.pages.page || page > $rootScope.pages.last) {
                    $rootScope.page = $rootScope.pages.page;
                    return;
                }
                $rootScope.page = page;
                $rootScope.$emit('page', page);
            };
        }]
    };
}]).

directive('share', ['$window', '$filter', 'host', 'facebookRedirectUri', 'googleClientId',
    function ($window, $filter, host, facebookRedirectUri, googleClientId) {
        return {
            restrict: 'A',
            scope: {
                share: '=',
            },
            templateUrl: '/app/components/templates/share.html',
            link: function(scope, element) {

                var gindex = 1;

                scope.url = 'https://' + host;

                scope.$watch('share', function (value) {

                    if (value) {

                        if (!value.picture) {
                            value.picture = 'logo.png';
                        }

                        if (!value.name) {
                            value.name = $filter('translate')('title');
                        }

                        if (!value.description) {
                            value.description = $filter('translate')('description');
                        }

                        if (!value.caption) {
                            value.caption = $filter('translate')('title');
                        }

                        scope.picture = value.picture;
                        scope.title = value.title;
                        scope.description = value.description;
                        scope.caption = value.caption;

                        if (gapi && gapi.interactivepost) {

                            var gid = 'ginteractivepost-' + scope.$id + gindex;

                            element.find('[data-google]').attr('id', gid);
                            
                            gapi.interactivepost.render(gid, {
                                contenturl: scope.url,
                                contentdeeplinkid: '/',
                                clientid: googleClientId,
                                cookiepolicy: 'single_host_origin',
                                prefilltext: scope.title + ' - ' + scope.description,
                                calltoactionlabel: 'PLAY',
                                calltoactionurl: scope.url,
                                calltoactiondeeplinkid: '/'
                            });

                            gindex++;
                        }
                    }
                });

                scope.facebook = function () {
                    if (!FB) {
                        return;
                    }

                    FB.ui({
                        method: 'feed',
                        redirect_uri: facebookRedirectUri,
                        link: facebookRedirectUri,
                        picture: 'https://' + host + '/images/' + scope.picture,
                        name: scope.title,
                        caption: scope.caption,
                        description: scope.description
                    });
                };
            }
        };
    }
]);

