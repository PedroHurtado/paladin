angular.module('paladinPopups')
    .controller('idVerificationFailureHandlerPopup',
        [
            '$scope',
            '$mdDialog',
            '$translate',
            'locals',
        function (
            $scope,
            $mdDialog,
            $translate,
            locals
        ) {
            $scope.popupTitle = $translate.instant("ID_VERIFY_FAIL_POPUP_TITLE");
            $scope.isProcessing = false;
            $scope.isSuccess = true;
            $scope.message = locals.message; // already translated in userVerification controller

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.retry = function () {
                // close popup and clear form data
                locals.retryClb();
                $scope.cancel();
            };

            $scope.sendToManualVerification = () => {
                locals.sendToManualClb();
                $scope.cancel();
            };

        }]);