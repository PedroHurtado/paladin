angular.module('paladinApp')
.directive('reviewsListItem',[
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'E',
            templateUrl:'./views/templates/reviewsListItem.tpl.html',
            scope: {
                review:'=',
            },
            link: function ($scope, elem, attr) {

            }
        }
    }]);