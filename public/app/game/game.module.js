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
constant('colorsGame', ['default', 'green', 'pink', 'grey', 'brown', 'black', 'orange', 'blue']);
