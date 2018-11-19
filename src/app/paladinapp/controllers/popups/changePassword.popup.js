angular.module('paladinPopups')
    .controller('changePasswordPopup', [
        '$scope',
        '$mdDialog',
        'locals',
        'appStateManager',
        'apiService',
        function (
            $scope,
            $mdDialog,
            locals,
            appStateManager,
            apiService) {

            $scope.isProcessing = false;
            $scope.statusError = null;
            $scope.changePassModel = {
                oldPassword: '',
                newPassword: '',
                newPasswordConfirmation:''
            };


            $scope.cancel = () => {
                $mdDialog.cancel();
            };

            $scope.validator = () => {
                let isValid = true;
                if ($scope.changePassModel.oldPassword &&
                    $scope.changePassModel.newPassword &&
                    $scope.changePassModel.newPasswordConfirmation) {

                    if ($scope.changePassModel.newPassword != $scope.changePassModel.newPasswordConfirmation) {
                        isValid = false;
                        $scope.statusError = 'PASSES_DONT_MATCH';
                    }
                } else {
                    $scope.statusError = 'FILL_ALL_FIELDS';
                    isValid = false;
                }
                return isValid;
            };
            $scope.changePass = () => {
                $scope.statusError = null;
                if ($scope.validator()) {
                    $scope.isProcessing = true;

                    apiService.users.changePassword({
                        newPassword: $scope.changePassModel.newPassword,
                        oldPassword: $scope.changePassModel.oldPassword,
                        userId: appStateManager.getUserId(),
                    })
                        .then((response) => {
                            $mdDialog.hide()
                        })
                        .catch((err) => {
                            $scope.statusError = err.data.Message || 'DEFAULT_ERROR';
                            $scope.isProcessing = false;
                        })
                }
            }
        }]);