'use strict';

/**
 * @ngdoc overview
 * @name profile
 * @description 
 * Management of profile
 */
angular.module('profile', []).

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

                    if ($rootScope.loadModalProfile) {
                        return;
                    }

                    $rootScope.loadModalProfile = true;

                    socket.emit('profile', scope.showProfile);
                });
            } 
        }
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
                    scope.isFriend = isFriend(profile);
                    
                    scope.toogleFavorite = function () {
                        scope.isFavorite = !scope.isFavorite;
                    };

                    $rootScope.$on('unload', function () {
                        $rootScope.setFavorite(scope.profile.uid, scope.isFavorite);
                    });

                    function isFriend(profile) {
                        return $rootScope.user &&
                               $rootScope.user.uid !== profile.uid &&
                               $rootScope.user.friends.indexOf(profile.facebookId) !== -1;
                    }
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
directive('modalProfile', ['$rootScope', 'socket', 'modal',
    function ($rootScope, socket, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: 'modal-profile.html',
            link: function (scope, element) {

                socket.on('profile', function (profile) {

                    if (!$rootScope.loadModalProfile) {
                        return;
                    }

                    delete $rootScope.loadModalProfile;

                    scope.profile = profile;

                    modal(element).show().one('hide', function () {
                        $rootScope.setFavorite(profile.uid, scope.isFavorite);
                    });

                }, scope);
            }
        }
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
    }
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
                    angular.forEach(['wins', 'draws', 'losses'], function (name) {
                        scope.stats.push(getData(value, name, attrs.gameType));
                    });
                });

                scope.$watch('uid', function () {
                    $timeout(componentHandler.upgradeAllRegistered);
                });
            }
        }
    }
]);
