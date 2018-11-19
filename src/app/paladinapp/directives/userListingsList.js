angular.module('paladinApp')
    .directive('userListingsList',[
        '$rootScope',
        'enums',
        'apiService',
        function ($rootScope,
                  enums,
                  apiService) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/userListingsList.tpl.html',
                scope: {
                    userId: '=',
                    isMinified: '=?',
                },
                link: function ($scope, elem, att) {
                    $scope.isMinified = $scope.isMinified || false;
                    $scope.isLoading = false;
                    $scope.userProducts = [];
                    $scope.fetchUserListings = () => {
                        $scope.isLoading = true;
                        apiService.products.getUserProducts({
                            productsFilter: enums.userProductsFilter.lentProduct,
                            userId: $scope.userId,
                        })
                            .then((res) => {
                                $scope.userProducts = res.Data.User_AllProducts;
                                $scope.isLoading = false;
                            })
                    };

                    $scope.listItemClick = (product) => {
                        $rootScope.$emit(enums.busNavigation.productDetailed,{ product })
                    };

                    $scope.fetchUserListings();
                }
            }
        }]);