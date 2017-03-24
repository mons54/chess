/**
 * @ngdoc overview
 * @name home
 * @description 
 * Management of home
 */
angular.module('home', [])

.directive('enableCreatedGame', function() {
    return {
        restrict: 'A',
        link: function (scope) {
            if (scope.$last) {
                delete scope.$parent.disableCreatedGame;
            }
        }
    };
});
