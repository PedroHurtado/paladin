angular.module('paladinPopups')
    .controller('loginSignUpPopup',
        [
            '$scope',
            '$rootScope',
            '$mdDialog',
            'enums',
            'apiService',
            '$translate',
            'ptLog',
            'appStateManager',
            'popupService',
            '$timeout',
            'locals',
            'ptUtils',
            'gtmService',
            'referralsService',
            function ($scope,
                $rootScope,
                $mdDialog,
                enums,
                apiService,
                $translate,
                ptLog,
                appStateManager,
                popupService,
                $timeout,
                locals,
                ptUtils,
                gtmService,
                referralsService
            ) {
                $scope.selectedTab = locals.selectedTab;
                $scope.currentLang = $translate.proposedLanguage() ? $translate.proposedLanguage() : $translate.preferredLanguage();
                if ($rootScope.currentLang)
                    $scope.currentLang = $rootScope.currentLang;
                $scope.loginMessage = '';
                $scope.loginFacebookMessage = '';
                $scope.signupFacebookMessage = '';
                $scope.signupFacebookStatus = '';
                $scope.signupMessage = '';
                $scope.signupStatus = '';
                $scope.registerFacebookStatus = '';
                $scope.btnStatus = 10;
                $scope.isLoading = false;
                $scope.isFacebookApiLoaded = $rootScope.facebookApiLoaded;

                // if referralsService.referralCode is defined, it has alredy been validated
                let referralData = referralsService.getReferralData();
                let referralCode = referralData.code;

                $scope.promoMessage = referralsService.getReferralData().code
                    ? $translate.instant('PROMO_MESSAGE_REGISTER_REFERRED', {ambassadorUserName: referralData.userName})
                    : window.globals.IS_PROMO ? $translate.instant('PROMO_MESSAGE_REGISTER_PROMO', {startDate: window.globals.START_DATE, endDate: window.globals.END_DATE, couponValue: window.globals.COUPON_VALUE}) 
                    : $translate.instant('PROMO_MESSAGE_REGISTER');


                $scope.register = (username, password, email, location) => {
                    const currentLang = appStateManager.currentLang === 'it' ? 'it-IT' : appStateManager.currentLang;
                    if (!ptUtils.regexPatterns.minMaxLength(6).test(password)) {
                        $scope.signupStatus = 'error';
                        $scope.signupMessage = 'SIGN_UP_ERROR_PASSWORD_RESTRICTION';
                        return
                    }
                    $scope.btnStatus = 1;

                    apiService.users.signUp({
                        email,
                        username,
                        password,
                        location,
                        currentLang,
                        referralCode
                    })
                        .then((response) => {
                            $scope.btnStatus = 10;
                            $scope.signupMessage = response.Message;
                            $scope.signupStatus = response.Status;
                            popupService.showAlert('ACTIVATION_EMAIL_SENT_TITLE','ACTIVATION_EMAIL_SENT_DESCR');
                            ptLog.log(JSON.stringify(response));
                            gtmService.trackEvent('registration', 'click-on-sign-up-button', 'email signup');
                        })
                        .catch((err) => {
                            $scope.btnStatus = 10;
                            $scope.signupMessage = err.data.Message;
                            $scope.signupStatus = err.data.Status;
                            ptLog.error(JSON.stringify(err));
                        })
                };

                $scope.login = (username,password) => {
                    const currentLang = appStateManager.currentLang === 'it' ? 'it-IT' : appStateManager.currentLang;
                    $scope.isLoading = true;
                    let loginObj = {username,password,currentLang};
                    if (ptUtils.regexPatterns.email.test(username)) {
                        //    username is actually email address, edit loginObj
                        delete loginObj.username;
                        loginObj.email = username
                    }
                    apiService.users.login(loginObj)
                        .then((response) => {
                            $scope.isLoading = false;
                            ptLog.log(JSON.stringify(response));
                            $rootScope.$emit(enums.busEvents.userLogin,response.Data);
                            $mdDialog.hide();
                        })
                        .catch((err) => {
                            $scope.isLoading = false;
                            $scope.loginStatus = err.data.Status;
                            $scope.loginMessage = err.data.Message;
                            ptLog.error(JSON.stringify(err))
                        })
                };

                $scope.registerFacebook = () => {
                    if($rootScope.facebookApiLoaded) {

                        $scope.btnStatus = 1;

                        apiService.users.signupFacebook({
                            facebookName:$rootScope.facebook_user.name,
                            email: $rootScope.facebook_user.email,
                            address: $rootScope.facebook_user.address,
                            currentLang:appStateManager.getCurrentLang(),
                            facebookUserId: $rootScope.facebook_user.id,
                            referralCode: referralCode
                        })
                            .then((response) => {
                                $scope.btnStatus = 10;
                                $scope.signupFacebookStatus = response.Status;
                                ptLog.log(JSON.stringify(response));
                                $rootScope.$emit(enums.busEvents.userLogin,response.Data);
                                $mdDialog.hide();
                                //only track event if its the first facebook signup and not login
                                if (response.Data.FbSignup && response.Data.FbSignup == true) {
                                    gtmService.trackEvent('registration', 'click-on-facebook-signup', 'facebook signup');
                                }
                            })
                            .catch((err) => {
                                $scope.btnStatus = 10;
                                $scope.signupFacebookStatus = err.data.Status;
                                $scope.signupFacebookMessage = err.data.Message;

                            });
                    } else {
                        $scope.signupFacebookStatus = 'error';
                        $scope.signupFacebookMessage =  $translate.instant('FACEBOOK_LOADING');
                        $timeout( () => {
                            $scope.registerFacebook();
                        }, 2000 );
                    }
                };

                $scope.cancel = () => {
                    $mdDialog.hide();
                };

                $scope.showTabDialogForgotPassword = () => {
                    popupService.showForgotPassword();
                };

                let deregs = [];

                deregs.push($rootScope.$on(enums.busEvents.facebookApiLoad),(event,data) => {
                    // $scope.isFacebookApiLoaded = data.isLoaded;
                });

                $scope.$on('$destroy', function() {
                    while (deregs.length)
                        deregs.pop()();
                });

                // $scope.
            }]);
