angular.module('paladinApp')
.directive('homeStepsTutorial',['$rootScope','$sce',function ($rootScope,$sce) {
    return {
        restrict: 'E',
        scope: {
            stepsList: '<', /* strings[]*/
            imgUrl: '<',
            tutorialTitle: '<',
            tutorialDescription:'<',
        },
        templateUrl:'./views/templates/homeStepsTutorial.tpl.html',
        link: function ($scope, elem, attt) {
            $scope.tutorialTitle = $sce.trustAsHtml($scope.tutorialTitle);
        }
    }
}]);
// /views/templates/homeStepsTutorial.tpl.html