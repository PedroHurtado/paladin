angular.module('paladinApp')
.directive('loaderContainer',[
    function () {
        return {
            restrict: 'E',
            transclude: true,
            // scope: {
            //     isLoading: '=',
            //     loaderSize: '=?',
            // },
            templateUrl:'./views/templates/loaderContainer.tpl.html',
            link: function ($scope, elem, attr) {
                $scope.loaderSize = $scope.loaderSize || 50;
            }
        }
    }]);