/**
 * @ngdoc overview
 * @name okru
 * @description 
 * Google module
 */
angular.module('okru', []).

/**
 * @ngdoc service
 * @name okru.service:okru
 * @description 
 * Google service.
 * @requires $rootScope
 * @requires okru.constant:okruApiId
 * @requires global.service:user
 * @requires global.service:socket
 * @requires global.service:translator
 */
service('okru', function () {

    var self = this;

    this.name = 'okru';

    this.init = function (callback) {

        self.status = 'connected';

        self.auth = {
            sig: self.data.auth_sig,
            uid: self.data.logged_user_id,
            key: self.data.session_key
        };

        var rParams = FAPI.Util.getRequestParameters();

        FAPI.init(rParams['api_server'], rParams['apiconnection'], function() {
            FAPI.Client.call({
                fields: 'first_name,last_name,location,pic128x128',
                method: 'users.getCurrentUser'
            }, function (method, response) {

                self.auth.user = {
                    name: response.first_name + ' ' + response.last_name,
                    picture: response.pic128x128,
                    lang: response.locale
                };

                callback(self);
            });
        });

    };

    return this;
});
