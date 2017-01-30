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
controller('homeCtrl', ['$rootScope', '$scope', 'socket', 'utils', 'paramsGame',
    
    function ($rootScope, $scope, socket, utils, paramsGame) {
        
        socket.emit('joinHome', $rootScope.user.refresh);
        
        socket.on('listGames', function (data) {
            $scope.createdGames = [];
            
            angular.forEach(data, function (value, key) {
                value.uid = key;

                if (key === $rootScope.user.uid) {
                    $scope.createdGames.unshift(value);
                } else if (!blackList(value) &&
                   ((!value.pointsMin || $rootScope.user.points >= value.pointsMin) && 
                   (!value.pointsMax || $rootScope.user.points <= value.pointsMax))) {
                    $scope.createdGames.push(value);
                }
            });
        }, $scope);

        socket.on('listChallenges', function (data) {
            $scope.challenges = [];
            
            angular.forEach(data, function (value, key) {
                value.uid = key;
                $scope.challenges.push(value);
            });
        }, $scope);

        socket.on('challengers', function (data) {
            $scope.challengers = [];
            $scope.friends = [];

            angular.forEach(data, function (value) {
                if ($rootScope.user.uid == value.uid) {
                    return;
                }
                
                if ($rootScope.user.friends.indexOf(value.facebookId) !== -1) {
                    $scope.friends.push(value);
                }

                $scope.challengers.push(value);
            });
            
            $scope.challengers.sort(function (a, b) {
                return a.points > b.points;
            });

            $scope.friends.sort(function (a, b) {
                return a.points > b.points;
            });
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
            socket.emit('challenge', angular.extend($scope.challenge, {
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

        $scope.challenge = {
            color: null,
            game: 0
        };

        $scope.challenges = [];    
    }
]);
