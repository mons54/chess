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

directive('modalCreateGame', ['$rootScope', '$route', 'modal', 'socket', 'paramsGame', 

    function ($rootScope, $route, modal, socket, paramsGame) {
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            templateUrl: '/app/components/templates/modal-create-game.html',
            link: function (scope, element) {

                var pointsMin = paramsGame.pointsMin,
                    pointsMax = paramsGame.pointsMax,
                    value;

                paramsGame.pointsMin = [];
                paramsGame.pointsMax = [];

                scope.paramsGame = paramsGame;

                scope.game = {
                    color: paramsGame.colors[0],
                    color: null,
                    game: 0,
                    pointsMin: null,
                    pointsMax: null
                };

                $rootScope.$watch('user.points', function (value, oldValue) {

                    value = Math.floor(value / 100) * 100;

                    paramsGame.pointsMin = [];
                    paramsGame.pointsMax = [];

                    for (var i = pointsMin; i <= pointsMax; i += 100) {
                        if (value >= i && i < pointsMax) {
                            paramsGame.pointsMin.push(i);
                        }
                        if (value <= i && i > pointsMin) {
                            paramsGame.pointsMax.push(i);
                        }
                    };

                    if (!oldValue) {
                        return;
                    }

                    var diff = value - Math.floor(oldValue / 100) * 100;

                    if (scope.game.pointsMin) {
                        scope.game.pointsMin += diff;
                    }

                    if (scope.game.pointsMax) {
                        scope.game.pointsMax += diff;
                    }

                    if (paramsGame.pointsMin.indexOf(scope.game.pointsMin) === -1) {
                        scope.game.pointsMin = diff > 0 ? paramsGame.pointsMin[paramsGame.pointsMin.length - 1] : null;
                    }

                    if (paramsGame.pointsMax.indexOf(scope.game.pointsMax) === -1) {
                        scope.game.pointsMax = diff < 0 ? paramsGame.pointsMax[0] : null;
                    }
                });

                scope.$watch('game.pointsMin', function (value) {
                    if (value && value === scope.game.pointsMax) {
                        scope.game.pointsMax += 100;
                    }
                });

                scope.$watch('game.pointsMax', function (value) {
                    if (value && value === scope.game.pointsMin) {
                        scope.game.pointsMin -= 100;
                    }
                });

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
                    return color === 'white' ? 'app-search__game-color--white' : 'app-search__game-color--black';
                };

                scope.stopLoad = stopLoad;

                element.on('hide', stopLoad);

                function stopLoad () {
                    if (scope.loadGame) {
                        socket.emit('removeGame');
                        delete scope.loadGame;
                    }
                }
            }
        };
    }
]).

directive('gameChoices', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            data: '=',
            model: '='
        },
        templateUrl: '/app/components/templates/games-choices.html'
    };
}).

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
                    showTooltips: false
                };

                var colors = {
                    win: '#4CAF50',
                    draw: '#1E88E5',
                    lose: '#E53935'
                };

                function drawChart(value) {
                    new Chart($('[data-chart="' + value.type + '-' + value.name + '"]'), {
                        type: 'doughnut',
                        data: {
                            showTooltips: false,
                            datasets: [{
                                data: value.data,
                                backgroundColor: [
                                    value.color,
                                    '#9E9E9E'
                                ],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            cutoutPercentage : 85
                        }
                    });
                }

                function getData(data, name, type) {
                    var percentage = data.games ? Math.round((data[name] / data.games) * 100) : 0;
                    return {
                        type: type,
                        name: name,
                        value: data[name],
                        data: [percentage, 100 - percentage],
                        color: colors[name]
                    };
                }

                socket.on('profile', function (data) {

                    delete $rootScope.loadProfile;

                    scope.charts = {
                        blitz: [],
                        rapid: []
                    };

                    angular.forEach(['win', 'draw', 'lose'], function (name) {
                        scope.charts.blitz.push(getData(data.blitz, name, 'blitz'));
                        scope.charts.rapid.push(getData(data.rapid, name, 'rapid'));
                    });

                    scope.data = data;

                    Chart.defaults.global.tooltips.enabled = false;
                    Chart.defaults.global.hover = false;

                    modal(element).show(function () {
                        angular.forEach(scope.charts.blitz, drawChart);
                        angular.forEach(scope.charts.rapid, drawChart);
                    });

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

directive('pagination', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: '/app/components/templates/pagination.html',
        link: function (scope, element) {

            $rootScope.page = false;

            scope.setPage = function (page) {
                page = parseInt(page);
                if (!page || page < 0 || page === $rootScope.pages.page || page > $rootScope.pages.last) {
                    $rootScope.page = $rootScope.pages.page;
                    return;
                }
                $rootScope.page = page;
                $rootScope.$emit('page', page);
            };

            $rootScope.$watch('page', function (value) {
                if (!value) {
                    return;
                }
                element.find('[ng-model="page"]').val(value);
            });
        }
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

