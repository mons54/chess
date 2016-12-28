'use strict';

angular.module('components').

/**
 * @ngdoc service
 * @name components.service:socket
 * @description 
 * Socket service management.
 * @requires $rootScope
 */
service('socket', ['$rootScope', function ($rootScope) {

    var socket;

    function connect () {
        socket = io.connect();
        socket.on('connect', function (data) {
            $rootScope.$emit('connect', data);
        });
        socket.on('disconnect', function (data) {
            $rootScope.$emit('disconnect', data);
        });
        socket.on('ready', function (data) {
            $rootScope.$emit('ready', data);
        });
        socket.on('infosUser', function (data) {
            $rootScope.$emit('infosUser', data);
        });
        socket.on('startGame', function (data) {
            $rootScope.$emit('startGame', data);
        });
        socket.on('trophy', function (data) {
            $rootScope.$emit('trophy', data);
        });
        socket.on('profile', function (data) {
            $rootScope.$emit('profile', data);
        });
        socket.on('game', function (data) {
            $rootScope.$emit('game', data);
        });
        socket.on('offerDraw', function (data) {
            $rootScope.$emit('offerDraw', data);
        });
        socket.on('listGames', function (data) {
            $rootScope.$emit('listGames', data);
        });
        socket.on('listChallenges', function (data) {
            $rootScope.$emit('listChallenges', data);
        });
        socket.on('challengers', function (data) {
            $rootScope.$emit('challengers', data);
        });
        socket.on('ranking', function (data) {
            $rootScope.$emit('ranking', data);
        });
    }

    function on (name, callback) {
        $rootScope.$on(name, function (event, data) {
            callback(data);
        });
    }

    function emit (name, data) {
        if (!socket) {
            return;
        }
        socket.emit(name, data);
    }

    return {
        connect: connect,
        emit: emit,
        on: on
    };
}]).

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
