'use strict';
angular.module('paladinPopups')
    .controller('transactionStatusChangePopup',[
        '$scope',
        '$mdDialog',
        'locals',
        function ($scope,$mdDialog,locals) {
            $scope.title = locals.title;
            $scope.apiMethod = locals.apiMethod;
            $scope.isLoading = true;

            $scope.runApiMethod = () => {
                $scope.apiMethod()
                    .then((res) => {
                        $mdDialog.hide(res)
                    })
                    .catch((err) => {
                        $mdDialog.cancel(err)
                    })
            };

            $scope.runApiMethod();
    }]);
