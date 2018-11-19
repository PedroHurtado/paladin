angular.module('paladinApp')
    .directive('userListingsListItem',[
        '$rootScope',
        'enums',
        function (
            $rootScope,
            enums) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/userListingsListItem.tpl.html',
                scope: {
                    product: '<',
                    isMinified: '=?'
                },
                link: function ($scope, elem, attr) {
                    $scope.isMinified = $scope.isMinified || false;
                }
            }
        }]);