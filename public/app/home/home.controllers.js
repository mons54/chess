'use strict';

angular.module('home').

/**
 * @ngdoc controller
 * @name home.controller:homeCtrl
 * @description 
 * The home controller.
 * @requires $rootScope
 * @requires $scope
 * @requires global.service:utils
 * @requires global.constant:paramsGame
 */
controller('homeCtrl', ['$rootScope', '$scope', 'socket', 'utils', 'paramsGame', 'orderByFilter',
    
    function ($rootScope, $scope, socket, utils, paramsGame, orderByFilter) {

        $scope.orderByFilter = {
            createdGames: {
                expression: ['points', 'time', 'color'],
                reverse: true
            },
            challengers: {
                expression: ['blitz.points', 'rapid.points'],
                reverse: true
            },
            favorites: {
                expression: ['blitz.points', 'rapid.points'],
                reverse: true
            }
        };
        
        socket.emit('joinHome', $rootScope.user.refresh);
        
        socket.on('listGames', function (data) {
            var createdGames = [],
                userGame;
            
            angular.forEach(data, function (value, key) {
                value.uid = key;

                if (key === $rootScope.user.uid) {
                    userGame = value;
                } else if (!blackList(value) &&
                   ((!value.pointsMin || $rootScope.user[value.game.type].points >= value.pointsMin) && 
                   (!value.pointsMax || $rootScope.user[value.game.type].points <= value.pointsMax))) {
                    createdGames.push(value);
                }
            });

            $scope.createdGames = orderByFilter(createdGames, $scope.orderByFilter.createdGames.expression, $scope.orderByFilter.createdGames.reverse);

            if (userGame) {
                $scope.createdGames.unshift(userGame);
            }

        }, $scope);

        socket.on('challengers', function (data) {
            var challengers = [];

            angular.forEach(data, function (value) {
                if ($rootScope.user.uid == value.uid) {
                    return;
                }

                challengers.push(value);
            });

            $scope.challengers = orderByFilter(challengers, $scope.orderByFilter.challengers.expression, $scope.orderByFilter.challengers.reverse);

            setFavorites();

        }, $scope);

        $rootScope.$watchCollection('user.favorites', function (value) {
            if (!value || typeof value !== 'object') {
                return;
            }

            setFavorites();
        });

        function setFavorites() {

            var favorites = [];

            angular.forEach($scope.challengers, function (challenger) {
                if ($rootScope.user.uid == challenger.uid) {
                    return;
                }

                if ($rootScope.user.favorites.indexOf(challenger.uid) !== -1 ||
                    $rootScope.user.friends.indexOf(challenger.facebookId) !== -1) {
                    favorites.push(challenger);
                }
            });

            $scope.favorites = orderByFilter(favorites, $scope.orderByFilter.favorites.expression, $scope.orderByFilter.favorites.reverse);
        }


        $scope.removeGame = function () {
            socket.emit('removeGame');
        };

        $scope.startGame = function (uid) {
            socket.emit('startGame', uid);
        };

        $scope.setChallenger = function (challenger) {
            $scope.challenger = challenger;
        };

        $scope.createChallenge = function (uid) {
            socket.emit('createChallenge', angular.extend($scope.challenge, {
                uid: uid
            }));
        };

        $scope.blackList = blackList;

        function blackList (data) {
            return $rootScope.user.blackList &&
                   $rootScope.user.blackList.indexOf(data.uid) !== -1 ||
                   data.blackList.indexOf($rootScope.user.uid) !== -1;
        }

        $scope.paramsGame = paramsGame;

        $rootScope.$watchCollection('dataGame', function (value, oldValue) {
            if (value) {
                $scope.challenge = value;
            }
        });  
    }
]);
