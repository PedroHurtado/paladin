angular.module('paladinApp')
.directive('reviewsList',[
    '$rootScope',
    'appStateManager',
    function ($rootScope,
              appStateManager) {
            return {
                restrict: 'E',
                templateUrl: './views/templates/reviewsList.tpl.html',
                scope: {
                    reviews:'=',
                },
                link: function ($scope, elem, attr) {
                }
            }
    }]);