angular.module('paladinPopups')
    .controller('forgotPasswordPopup',['$scope', '$rootScope', '$mdDialog', 'enums','apiService','$translate','ptLog','appStateManager',
        function ($scope,$rootScope,$mdDialog,enums,apiService,$translate,ptLog,appStateManager) {
            $scope.forgotPasswordMessage = '';
            $scope.forgotpasswordStatus = '';
            $scope.btnForgotPasswordStatus = 10;


            $scope.forgotPassword = (email) => {
                $scope.btnForgotPasswordStatus = 1;

                apiService.users.forgotPassword({email,currentLang: appStateManager.getCurrentLang()})
                    .then((response) => {
                        $scope.btnForgotPasswordStatus = 10;
                        $scope.forgotpasswordStatus = response.Status;
                        $scope.forgotPasswordMessage = response.Message;
                        ptLog.log(JSON.stringify(response))
                    })
                    .catch((err) => {
                        $scope.btnForgotPasswordStatus = 10;
                        $scope.forgotpasswordStatus = err.data.Status;
                        $scope.forgotPasswordMessage = err.data.Message;
                        ptLog.error(JSON.stringify(err))

                    })
            };

            $scope.cancel = () => {
                $mdDialog.cancel();
            };
        }]);