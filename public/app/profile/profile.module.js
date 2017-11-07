'use strict';

/**
 * @ngdoc overview
 * @name profile
 * @description 
 * Management of profile
 */
angular.module('profile', []).

directive('profileHeader', ['$rootScope', 'socket',
    function ($rootScope, socket) {
        return {
            templateUrl: '/app/profile/templates/profile-header.html',
            link: function (scope, element, attrs) {

                scope.uid = attrs.uid;

                socket.emit('profile', attrs.uid);

                socket.once('profile', function (data) {

                    scope.profile = data;
                    
                    $rootScope.title = data.name;

                    delete $rootScope.loadingContent;

                }, scope);
            }
        };
    }
]).

/**
 * @ngdoc directive
 * @name profile.directive:showProfile
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
                    $rootScope.$emit('showProfile', scope.showProfile);
                });
            } 
        };
    }
]).

directive('profileActions', ['$rootScope',
    function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/app/profile/templates/profile-actions.html',
            link: function (scope) {

                scope.$watch('profile', function (profile) {

                    if (!profile) {
                        return;
                    }

                    scope.isFavorite = $rootScope.isFavorite(profile.uid);
                    scope.isBlackList = $rootScope.isBlackList(profile.uid);
                    scope.isFriend = isFriend(profile);
                    
                    scope.toogleFavorite = function () {
                        scope.isFavorite = !scope.isFavorite;
                    };

                    scope.toogleBlackList = function () {
                        scope.isBlackList = !scope.isBlackList;
                    };

                    $rootScope.$on('unload', function () {
                        $rootScope.setFavorite(scope.profile.uid, scope.isFavorite);
                        $rootScope.setBlackList(scope.profile.uid, scope.isBlackList);
                    });

                    function isFriend(profile) {
                        return $rootScope.user &&
                               $rootScope.user.uid !== profile.uid &&
                               $rootScope.user.friends.indexOf(profile.facebookId) !== -1;
                    }
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
            templateUrl: 'modal-profile.html',
            link: function (scope, element) {

                componentHandler.upgradeElement($('[data-spinner]')[0]);

                var elementModal = modal(element);

                $rootScope.$on('showProfile', function (event, value) {

                    if (!value || scope.load) {
                        return;
                    }

                    scope.profile = value;

                    socket.emit('profile', value.uid);

                    elementModal.show();

                    scope.load = true;
                });

                socket.on('profile', function (value) {

                    if (!scope.load) {
                        return;
                    }

                    delete scope.load;

                    scope.profile = value;

                    scope.profile.ready = true;

                    elementModal.one('hide', function () {

                        scope.$apply(function () {
                            delete scope.profile;
                        });

                        $rootScope.setFavorite(value.uid, scope.isFavorite);
                        $rootScope.setBlackList(value.uid, scope.isBlackList);
                    });

                }, scope);
            }
        };
    }
]).


directive('progressBarProfile', [function () {
    return {
        restrict: 'A',
        scope: {
            value: '='
        },
        link: function (scope, element, attrs) {
            scope.$watchCollection('value', function (value) {
                new ProgressBar.Circle(element[0], {
                    strokeWidth: 6,
                    trailWidth: 6,
                    trailColor: '#9E9E9E',
                    color: attrs.color
                }).animate(value / 100);
            });
        }
    };
}]).

/**
 * @ngdoc directive
 * @name profile.directive:modalProfile
 * @description 
 * Show modal profile when receives an socket event.
 * @requires socket
 * @requires components.service:modal
 * @restrict E
 * @scope
 */
directive('profileGame', ['$rootScope', '$timeout', 'socket', 'modal',
    function ($rootScope, $timeout, socket, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                gameType: '=',
                gameData: '=',
                showMore: '=',
                uid: '='
            },
            templateUrl: '/app/profile/templates/profile-game.html',
            link: function (scope, element, attrs) {

                var colors = {
                    wins: '#4CAF50',
                    draws: '#1E88E5',
                    losses: '#E53935'
                };

                function getData(data, name, type) {
                    var percentage = data.games ? Math.round((data[name] / data.games) * 100) : 0;
                    return {
                        type: type,
                        name: name,
                        value: data[name],
                        data: percentage,
                        color: colors[name]
                    };
                }

                scope.$watchCollection('gameData', function (value) {
                    if (!value) {
                        return;
                    }

                    scope.stats = [];

                    value.games = value.wins + value.draws + value.losses;
                    
                    angular.forEach(['wins', 'draws', 'losses'], function (name) {
                        scope.stats.push(getData(value, name, attrs.gameType));
                    });
                });

                scope.$watch('uid', function () {
                    $timeout(componentHandler.upgradeAllRegistered);
                });
            }
        };
    }
]);
