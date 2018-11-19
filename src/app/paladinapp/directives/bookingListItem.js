'use strict';
angular.module('paladinApp')
    .directive('bookingListItem',[
        '$rootScope',
        'enums',
        'appStateManager',
        function ($rootScope,
                  enums,
                  appStateManager) {
            return {
                restrict: 'E',
                templateUrl: './views/templates/bookingsListItem.tpl.html',
                scope: {
                    booking: '=',
                    isLent: '=?',
                },
                link: function ($scope, elem, attr) {
                    $scope.isLent = appStateManager.getUserId() == $scope.booking.Lender_Id;
                }
            }
    }]);