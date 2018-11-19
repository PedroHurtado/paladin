'use strict';
angular.module('paladinApp')
    .directive('focusMe',['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, elem, attr) {
                $timeout(() => {
                    if (!elem[0].disabled) {
                        elem[0].focus();
                    }
                },300)

            }
        }
    }]);