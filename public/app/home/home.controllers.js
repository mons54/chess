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
controller('homeCtrl', ['$rootScope', '$scope', 'socket', 'user', 'utils', 'paramsGame', 'orderByFilter',
    
    function ($rootScope, $scope, socket, user, utils, paramsGame, orderByFilter) {

        $scope.orderByFilter = {
            createdGames: {
                expression: ['points', 'time', 'color'],
                reverse: true
            },
            challenges: {
                expression: ['points', 'time', 'color'],
                reverse: true
            },
            challengers: {
                expression: ['blitz.points', 'rapid.points'],
                reverse: true
            },
            friends: {
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

        socket.on('listChallenges', function (data) {
            var challenges = [];
            
            angular.forEach(data, function (value, key) {
                value.uid = key;
                challenges.push(value);
            });

            $scope.challenges = orderByFilter(challenges, $scope.orderByFilter.challenges.expression, $scope.orderByFilter.challenges.reverse);

        }, $scope);

        socket.on('challengers', function (data) {
            var challengers = [],
                friends = [];

            angular.forEach(data, function (value) {
                if ($rootScope.user.uid == value.uid) {
                    return;
                }
                
                if ($rootScope.user.friends.indexOf(value.facebookId) !== -1) {
                    friends.push(value);
                }

                challengers.push(value);
            });

            $scope.challengers = orderByFilter(challengers, $scope.orderByFilter.challengers.expression, $scope.orderByFilter.challengers.reverse);
            $scope.friends = orderByFilter(friends, $scope.orderByFilter.friends.expression, $scope.orderByFilter.friends.reverse);

        }, $scope);

        $scope.removeGame = function () {
            socket.emit('removeGame');
        };

        $scope.startGame = function (uid) {
            socket.emit('startGame', uid);
        };

        $scope.startChallenge = function (uid) {
            socket.emit('startChallenge', uid);
        };

        $scope.setChallenger = function (challenger) {
            $scope.challenger = challenger;
        };

        $scope.createChallenge = function (uid) {
            socket.emit('createChallenge', angular.extend($scope.challenge, {
                uid: uid
            }));
        };

        $scope.removeChallenge = function (uid) {
            socket.emit('removeChallenge', uid);
        };

        $scope.getClassColorGame = function (color) {
            return {'app-table__color--white': color === 'white', 'app-table__color--black': color === 'black' };
        };

        $scope.blackList = blackList;

        function blackList (data) {
            return $rootScope.user.blackList.indexOf(data.uid) !== -1 || data.blackList.indexOf($rootScope.user.uid) !== -1;
        }

        $scope.paramsGame = paramsGame;

        $scope.challenge = user.getDataChallenge();

        $scope.$watchCollection('challenge', function (value) {
            if (value) {
                user.setDataChallenge(value);
            }
        });

        $scope.challenges = [];    
    }
]);
