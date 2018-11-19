'use strict';
angular.module('paladinApp')
    .service('stripeService',[
        '$rootScope',
        'enums',
        'appStateManager',
        '$q',
        '$http',
        function (
            $rootScope,
            enums,
            appStateManager,
            $q,
            $http) {

            const self = this;
            self.ENV = window.globals.STRIPE_URL;

            self.JSON_to_URLEncoded = (element, key, list) => {
                list = list || [];
                if ( typeof ( element ) == 'object' ) {
                    for (let idx in element)
                        self.JSON_to_URLEncoded(element[idx], key ? key + '['+idx+']' : idx, list);
                } else {
                    list.push(key+'='+encodeURIComponent(element));
                }
                return list.join('&');
            };

            self.getHttpConfig = (params, headers) => {
                let config = {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'X-Requested' : null,
                        'Content-Type' : 'application/x-www-form-urlencoded; charset=utf-8',
                        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
                        'Authorization': `Bearer ${window.globals.STRIPE_SK}`
                    }
                };

                if (headers) {
                    Object.keys(headers).forEach((headerKey) => {
                        config.headers[headerKey] = headers[headerKey];
                    });
                }

                if (params) { config.params = params; }
                return config;
            };

            self.postRequest = function (path, data, headers) {
                // let deferred = $q.defer();
                const config = self.getHttpConfig(null, headers);
                return $http({
                    method: 'POST',
                    url: self.ENV + path,
                    headers: config.headers,
                    params: config.params,
                    transformRequest: function(obj) {
                        return self.JSON_to_URLEncoded(obj)
                    },
                    data,
                })
                // return deferred.promise;
            };

            self.getRequest = function (path, params, headers) {
                const config = self.getHttpConfig(null, headers);
                return $http({
                    method: 'GET',
                    url: self.ENV + path,
                    headers: config.headers,
                    params: config.params,
                    transformRequest: function(obj) {
                        return self.JSON_to_URLEncoded(obj)
                    },
                })
            };

            self.apiMethods = {
                createToken: function ({number,exp_month,exp_year,cvc,name}) {
                    return self.postRequest('/tokens',{
                        card: {
                            number,
                            exp_month,
                            exp_year,
                            cvc,
                            name
                        }
                    })
                },
                getCustomer: function (customerId) {
                    return self.getRequest(`/customers/${customerId}`)
                },
                getCustomerSources: function (customerId) {
                    return self.getRequest(`/customers/${customerId}/sources`)
                }
            };

            return self.apiMethods
    }]);