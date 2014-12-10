(function () {
    
    'use strict';

    angular.module('components.services', []).

    factory('loading', ['$rootScope',

        function ($rootScope) {
            return {
                show: function () {
                    $rootScope.loading = true;
                },
                hide: function () {
                    $rootScope.loading = false;
                }
            };
        }
    ]).

    factory('utils', function () {

        return {
            colors: ['white', 'black'],
            sprintf: function(value) {
                return (value.toString().length == 1 ? '0' : '') + value;
            }
        };
    }).

    factory('lfstmedia', function () {

        return {
            init: function () {
                if (typeof (LSM_Slot) === 'undefined') {
                    return;
                }

                LSM_Slot({
                    adkey: '826',
                    ad_size: '728x90',
                    slot: 'slot64668',
                    _render_div_id: 'header'
                });

                LSM_Slot({
                    adkey: '467',
                    ad_size: '300x250',
                    slot: 'slot61890',
                    _render_div_id: 'pub'
                });
            }
        };
    });
})();