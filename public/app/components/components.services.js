'use strict';

angular.module('components').

/**
 * @ngdoc service
 * @name components.service:modal
 * @description 
 * Modal service management.
 */
service('modal', function () {

    /**
     * Show modal
     * @param {object} modal Modal element
     */
    function showModal(modal) {
        modal.addClass('app-modal--active');
    }

    /**
     * Hide modal
     * @param {object} modal Modal element
     */
    function hideModal(modal) {
        modal.removeClass('app-modal--active');
    }

    return {
        /**
         * @ngdoc function
         * @name #get
         * @methodOf components.service:modal
         * @description 
         * Get the modal element by id.
         * @param {string} id Id of modal
         * @return {object} Modal element
         */
        get: function (id) {
            return angular.element('#' + id);
        },

        /**
         * @ngdoc function
         * @name #show
         * @methodOf components.service:modal
         * @description 
         * Show modal.
         * @param {object} modal Modal element
         */
        show: function (modal) {

            showModal(modal);

            modal.find('[modal-close]').on('click', function (event) {
                hideModal(modal);
            });

            angular.element('[modal-close-bg]').on('click', function (event) {
                if (!this || event.target !== this) {
                    return;
                }
                hideModal(modal);
            });
        },

        /**
         * @ngdoc function
         * @name #hide
         * @methodOf components.service:modal
         * @description 
         * Hide modal.
         * @param {object} modal Modal element
         */
        hide: hideModal
    };
});
