angular.module('paladinApp')
    .controller('myListingsController',[
        '$rootScope',
        '$scope',
        'enums',
        'appStateManager',
        'apiService',
        '$mdMedia',
        function (
            $rootScope,
            $scope,
            enums,
            appStateManager,
            apiService,
            $mdMedia) {
            $scope.isLoading = false;
            $scope.userId = appStateManager.getUserId();
            $scope.addNewItem = () => {
                $rootScope.$emit(enums.busNavigation.newProduct);
            };


            $scope.isGtMd = $mdMedia('gt-md');

            let deregs = [];

            deregs.push(
                $scope.$watch(function () {return $mdMedia('gt-md') },function (mgMd) {
                    $scope.isGtMd = mgMd;
                })
            );

            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()()
            })

        }
    ]);