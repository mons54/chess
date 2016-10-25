(function () {
    
    'use strict';

    angular.module('components.services', []).

    service('modal', function () {
        return function (id) {
            var modal = angular.element('#' + id);
            return {
                open: function () {

                    var self = this;

                    modal.addClass('app-modal--active');

                    modal.find('[modal-close]').on('click', function (event) {
                        self.close()
                    });

                    angular.element('.app-modal__bg').on('click', function (event) {
                        if (!this || event.target !== this) {
                            return;
                        }
                        self.close();
                    });
                },
                close: function () {
                    modal.removeClass('app-modal--active');
                }
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
