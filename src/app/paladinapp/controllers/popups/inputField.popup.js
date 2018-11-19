'use strict';
angular.module('paladinPopups')
    .controller('inputFieldPopup',[
        '$scope',
        '$mdDialog',
        'locals',
        function ($scope,$mdDialog,locals) {
            $scope.isInvalid = false;
            $scope.message = locals.message;
            $scope.title = locals.title;
            $scope.inputRegexValidation = locals.inputRegexValidation;
            $scope.validationErrorMessage = locals.validationErrorMessage;
            $scope.inputField = { value: locals.value };
            $scope.closeDialog = (isConfirm) => {
                if (isConfirm) {
                    if ($scope.inputRegexValidation && $scope.inputRegexValidation.test($scope.inputField.value))
                        $mdDialog.hide($scope.inputField);
                    else
                        $scope.isInvalid = true;
                } else {
                    $mdDialog.cancel()
                }
            }
        }]);

