angular.module('paladinPopups')
    .controller('confirmPopup',['$scope','$mdDialog','locals',function ($scope,$mdDialog,locals) {
        $scope.title = locals.title;
        $scope.message = locals.message;
        $scope.isConfirm = locals.isConfirm;
        if ($scope.isConfirm) {
            $scope.yesButton = locals.yesButton;
            $scope.noButton = locals.noButton;
        } else {
            $scope.okBtn = locals.okBtn || 'POPUP_OK';
        }

        $scope.closeDialog = (isConfirm) => {
            if (isConfirm)
                $mdDialog.hide();
            else
                $mdDialog.cancel();
        }
    }]);