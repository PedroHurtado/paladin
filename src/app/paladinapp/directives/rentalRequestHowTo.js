angular.module('paladinApp')
.directive('rentalRequestHowTo',[function () {
    return {
        restrict: 'E',
        templateUrl: './views/templates/rentalRequestHowTo.tpl.html',
        scope: {
            isTryAndBuy: '=?',
            isBuy: '=?',
        },
        link: function ($scope, elem, attr) {

        }
    }
}]);