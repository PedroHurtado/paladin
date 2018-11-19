angular.module('paladinApp')
    .directive('userItem',[
        '$rootScope',
        'enums',
        'appStateManager',
        function (
            $rootScope,
            enums,
            appStateManager) {

            return {
                restrict: 'E',
                templateUrl: './views/templates/userItem.tpl.html',
                scope: {
                    userId: '=?',
                    userName:'=?',
                    userImage: '=?',
                    reviews: '=?',
                    stars: '=?',
                    picSize: '=?',
                },
                link: function ($scope, elem, attr) {
                    $scope.picSize = $scope.picSize || 50;
                    $scope.goToProfile = () => {
                        if ($scope.userId)
                            $rootScope.$emit(enums.busNavigation.userProfile,{userId: $scope.userId})
                    }
                }
            }

        }]);