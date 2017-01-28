'use strict';

angular.module('components').

/**
 * @ngdoc service
 * @name components.service:modal
 * @description 
 * Modal service management.
 */
service('modal', ['$timeout', function ($timeout) {

    return function (element) {

        if (typeof element === 'string') {
            var element = angular.element(element);
        }

        element.show = function (callback) {

            if (!element.parent().is('body, [data-layout]')) {
                element.defaultParent = element.parent();
                $('[data-layout]').prepend(element);
            }
            element.addClass('app-modal--active').trigger('show');

            element.find('[modal-close]').one('click', function (event) {
                element.hide();
            });

            angular.element('[modal-close-bg]').on('click', function (event) {
                if (!this || event.target !== this) {
                    return;
                }
                $(this).unbind('click');
                element.hide();
            });

            $timeout(callback);

            return this;
        };

        element.hide = function () {
            if (element.defaultParent) {
                element.defaultParent.append(element);
            }
            element.removeClass('app-modal--active').trigger('hide', element.data);
        };

        return element;
    };
}]);
