angular.module('paladinPopups')
.controller('emailVerificationPopup',['$scope', '$rootScope', '$mdDialog', 'enums','apiService','$translate','ptLog','appStateManager','locals',
    function ($scope,$rootScope,$mdDialog,enums,apiService,$translate,ptLog,appStateManager,locals) {
            $scope.welcome_message_dialog = $translate.instant("WELCOME");
            $scope.isProcessing = true;
            $scope.isSuccess = true;
            $scope.message = $translate.instant('PLEASE_WAIT');

            $scope.hide = function() {
                $mdDialog.hide();
            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.answer = function(answer) {
                $mdDialog.hide(answer);
            };

            $scope.retry = function () {
                $scope.verifyUser();
            };

            $scope.verifyUser = () => {
                $scope.message = $translate.instant('PLEASE_WAIT');
                $scope.isProcessing = true;
                $scope.isSuccess = true;
                apiService.users.emailVerification({userId:locals.userId})
                    .then((response) => {
                        $scope.isProcessing = false;
                        $scope.isSuccess = true;
                        $scope.message = $translate.instant('REGISTRATION_SUCCESS');
                        $rootScope.$emit(enums.busEvents.userLogin,response.Data);
                    })
                    .catch((err) => {
                        $scope.isProcessing = false;
                        $scope.isSuccess = false;
                        $scope.message = $translate.instant('REGISTRATION_ERROR');
                    })
            };

            $scope.verifyUser();
    }]);