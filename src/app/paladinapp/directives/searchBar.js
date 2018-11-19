angular.module('paladinApp')
.directive('searchBar',[function () {
    return {
        restrict:'E',
        scope: {
            isOpen: '=?',
            isGreenBackground:'=?',
        },
        templateUrl:'./views/templates/searchBar.tpl.html',
        link: function ($scope, elem, attr) {

        }
    }
}]);