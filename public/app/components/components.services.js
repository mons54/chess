'use strict';

angular.module('components').

/**
 * @ngdoc service
 * @name components.service:modal
 * @description 
 * Modal service management.
 */
service('modal', function () {

    return function (element) {

        if (typeof element === 'string') {
            var element = angular.element(element);
        }

        element.show = function () {

            if (!element.parent().is('body')) {
                element.defaultParent = element.parent();
                $('body').prepend(element);
            }
            element.addClass('app-modal--active').trigger('show');

            element.find('[modal-close]').one('click', function (event) {
                element.hide();
            });

            angular.element('[modal-close-bg]').one('click', function (event) {
                if (!this || event.target !== this) {
                    return;
                }
                element.hide();
            });

            return this;
        };

        element.hide = function hideModal() {
            if (element.defaultParent) {
                element.defaultParent.append(element);
            }
            element.removeClass('app-modal--active').trigger('hide', element.data);
        };

        return element;
    };
});
