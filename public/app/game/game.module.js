'use strict';

/**
 * @ngdoc overview
 * @name components
 * @description 
 * Management of a chess game.
 */
angular.module('game', []).

/**
 * @ngdoc parameters
 * @name global.constant:paramsGame
 * @description
 * The params games data
 */
constant('paramsGame', chess.game.options).
constant('colorsGame', ['default', 'green', 'blue', 'red', 'brown', 'orange', 'pink', 'lime']);
