angular.module('paladinApp')
.directive('productTeaserListItem',['$rootScope','enums','ptUtils', function ($rootScope,enums, ptUtils) {
    return {
        restrict:'E',
        scope: {
            product:'<',
            onSwipe: '&',
        },
        templateUrl:'./views/templates/productTeaserListItem.tpl.html',
        link: function ($scope, elem, attr) {
            $scope.onItemClick = () => {
                $rootScope.$emit(enums.busNavigation.productDetailed,{product: $scope.product})
            };

            $scope.getProductUrl = () => {
                if ($scope.product)
                    return ptUtils.getProductDetailUrl($scope.product);
                return "#";
            }

            
            $scope.onItemSwipe = (isLeft,$event,$target) => {
              if ($scope.onSwipe)
                  $scope.onSwipe()(isLeft,$event,$target);
            }
        }
    }
}]);