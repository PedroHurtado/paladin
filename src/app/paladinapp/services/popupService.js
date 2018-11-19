angular.module('paladinPopups',[
    'ngMaterial',
    'ngMessages',
    'ngMaterialDateRangePicker',
    'angularMoment',
    '720kb.socialshare'
])
    .config(['$mdDialogProvider',function ($mdDialogProvider) {
        $mdDialogProvider.addPreset('confirmPreset', {
            options: function () {
                return {
                    templateUrl: './views/popups/confirm.popup.html',
                    controller: 'confirmPopup',
                    bindToController: true,
                    controllerAs: 'confirmCtrl',
                    clickOutsideToClose: true,
                    escapeToClose: true
                }
            }
        });

        $mdDialogProvider.addPreset('loginSignup', {
            options: function () {
                return {
                    templateUrl:'./views/popups/loginSignup.popup.html',
                    controller: 'loginSignUpPopup',
                    bindToController: true,
                    controllerAs: 'loginSignupCtrl',
                    clickOutsideToClose: true,
                    escapeToClose: true,
                }
            }
        });

        $mdDialogProvider.addPreset('forgotPassword',{
            options: function () {
                return {
                    templateUrl: './views/popups/forgotPassword.popup.html',
                    controller: 'forgotPasswordPopup',
                    controllerAs: 'forgotPasswordCtrl',
                    clickOutsideToClose: true,
                    escapeToClose: true,
                }
            }
        });

        $mdDialogProvider.addPreset('idVerificationFailureHandler',{
            options: function () {
                return {
                    templateUrl: './views/popups/idVerificationFailureHandler.popup.html',
                    controller: 'idVerificationFailureHandlerPopup',
                    controllerAs: 'idVerificationFailureHandlerPopup',
                    clickOutsideToClose: false,
                    escapeToClose: false
                }
            }
        });

        $mdDialogProvider.addPreset('emailVerification',{
            options: function () {
                return {
                    templateUrl: './views/popups/emailVerification.popup.html',
                    controller: 'emailVerificationPopup',
                    controllerAs: 'emailVerificationCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false

                }
            }
        });

        $mdDialogProvider.addPreset('shareReferralLink',{
            options: function () {
                return {
                    templateUrl: './views/popups/shareToSocialMedia.popup.html',
                    controller: 'shareToSocialMediaPopup',
                    controllerAs: 'shareToSocialMediaCtrl',
                    clickOutsideToClose: true,
                    escapeToClose: true
                }
            }
        });

        $mdDialogProvider.addPreset('changePassword',{
            options: function () {
                return {
                    templateUrl:'./views/popups/changePassword.popup.html',
                    controller: 'changePasswordPopup',
                    controllerAs: 'changePasswordCtrl',
                    clickOutsideToClose: true,
                    escapeToClose: true
                }
            }
        });

        $mdDialogProvider.addPreset('transactionStatusChange',{
            options: function () {
                return {
                    templateUrl: './views/popups/transactionStatusChange.popup.html',
                    controller: 'transactionStatusChangePopup',
                    controllerAs: 'transactionStatusChangeCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false,
                }
            }
        });

        $mdDialogProvider.addPreset('inputField',{
            options: function () {
                return {
                    templateUrl: './views/popups/inputField.popup.html',
                    controller:'inputFieldPopup',
                    controllerAs: 'inputFieldCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false,
                }
            }
        });

        $mdDialogProvider.addPreset('loader',{
            options: function () {
                return {
                    templateUrl: './views/popups/loader.popup.html',
                    controller: 'loaderPopup',
                    controllerAs: 'loaderCtrl',
                    panelClass: 'loaderOverlay',
                    clickOutsideToClose: false,
                    escapeToClose: false,
                }
            }
        });

        $mdDialogProvider.addPreset('bookingTrackerInfoMobile', {
            options: function () {
                return {
                    templateUrl: './views/popups/bookingTrackerInfoMobile.popup.html',
                    controller: 'bookingTrackerInfoMobilePopup',
                    controllerAs: 'bookingTrackerInfoMobilePopupCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false,
                }
            }
        })
    }])


    .service('popupService', [
        
        '$mdDialog',
        '$mdDateRangePicker',
        'moment',
        'ptUtils',
        function (
            $mdDialog,
            $mdDateRangePicker,
            moment,
            ptUtils) {

            this.showAlert = function (title, message, okBtn = 'POPUP_OK') {
                return new Promise((resolve,reject) => {
                    const confirm2 = $mdDialog.confirmPreset({
                        locals: {
                            title,
                            message,
                            isConfirm: false,
                            okBtn: okBtn,
                        }
                    });

                    $mdDialog.show(confirm2)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showConfirm = function (title,message,yesButton = 'POPUP_YES', noButton = 'POPUP_NO') {
                return new Promise((resolve,reject) => {
                    const confirm2 = $mdDialog.confirmPreset({
                        locals: {
                            title,
                            message,
                            yesButton,
                            noButton,
                            isConfirm: true,
                        }
                    });

                    $mdDialog.show(confirm2)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showLoginSignupPopup = function (isSignUp = false) {
                return new Promise((resolve,reject) => {
                    const loginSignup = $mdDialog.loginSignup({
                        locals: {
                            selectedTab: isSignUp ? 1 : 0
                        },
                    });
                    $mdDialog.show(loginSignup)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showForgotPassword = function () {
                return new Promise((resolve,reject) => {
                    $mdDialog.show($mdDialog.forgotPassword())
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showIdVerificationFailureHandler = function (data) {
                console.log('idVerificationFailureHandler locals ', data)
                return new Promise((resolve,reject) => {
                    const idVerificationHandler = $mdDialog.idVerificationFailureHandler({
                        locals: data
                    });
                    $mdDialog.show(idVerificationHandler)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showEmailVerification = function (userId/* Must be provided for verification*/) {
                return new Promise((resolve,reject) => {
                    const emailVerification = $mdDialog.emailVerification({
                        locals: {
                            userId,
                        }
                    });
                    $mdDialog.show(emailVerification)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showShareReferralLink = function (referralLink) {
                return new Promise((resolve,reject) => {
                    const shareReferralLink = $mdDialog.shareReferralLink({
                        locals: {
                            referralLink
                        }
                    });
                    $mdDialog.show(shareReferralLink)
                        .then(resolve)
                        .catch((err)=>{
                            // closing the modal on click-outside will reject so catch it here
                            console.log('close modal err ', err)
                        })
                })
            };

            this.showDateRangePicker = function (productBookingDetails,product) {
                return new Promise((resolve,reject) => {
                    const dateRanges = ptUtils.getBookedDateRanges(productBookingDetails);

                    $mdDateRangePicker.show({
                        onePanel: true,
                        autoConfirm: true,
                        model: {},
                        localizationMap: ptUtils.getTranslationDictForDatePicker(),
                        maxRange: product.MaxRentalPeriod || undefined,
                        isDisabledDate: ($date) => {
                            const momentDate = moment($date);
                            for (let i = 0; i < dateRanges.length ; i++)
                                if (momentDate.isBetween(dateRanges[i].startDate,dateRanges[i].endDate) ||
                                    momentDate.isSame(dateRanges[i].startDate) ||
                                    momentDate.isSame(dateRanges[i].endDate))
                                    return true;

                            if (moment().isBefore($date)) return false; // TODO: - Check if product available for rent at dates

                            return true;
                        }
                    })
                        .then((result) => {
                            resolve(result)
                        })
                        .catch(() => {
                            reject()
                        })
                });
            };

            this.showChangePassword = function () {
                return new Promise((resolve,reject) => {
                    const changePass = $mdDialog.changePassword({
                        locals: {
                            wot: 'no',
                        }
                    });
                    $mdDialog.show(changePass)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showTransactionStatusChange = function ({ booking, apiMethod, title }) {
                return new Promise((resolve,reject) => {
                    const statusChange = $mdDialog.transactionStatusChange({
                        locals: {
                            booking,
                            apiMethod,
                            title,
                        }
                    });

                    $mdDialog.show(statusChange)
                        .then(resolve)
                        .catch(reject)
                })
            };

            this.showInputField = function ({title,
                message,
                initialValue,
                inputRegexValidation = undefined,
                validationErrorMessage = 'PLEASE_ENTER_A_VALID_INPUT'}) {
                return new Promise((resolve,reject) => {
                    const inputField = $mdDialog.inputField({
                        locals: {
                            title,
                            message,
                            value: initialValue,
                            inputRegexValidation,
                            validationErrorMessage
                        }
                    });

                    $mdDialog.show(inputField)
                        .then(resolve)
                        .catch(reject)
                })
            };
            this.showLoader = function () {
                $mdDialog.show($mdDialog.loader());
            };
            this.hideLoader = function () {
                $mdDialog.hide();
            };

            this.showBookingTrackerInfoMobilePopup = function (booking) {
                return new Promise((resolve => {
                    const bookingTracker = $mdDialog.bookingTrackerInfoMobile({
                        locals: {
                            booking: booking
                        }
                    });
                    $mdDialog.show(bookingTracker)
                        .then(resolve)
                        .catch(resolve)
                }))
            }

        }]);
