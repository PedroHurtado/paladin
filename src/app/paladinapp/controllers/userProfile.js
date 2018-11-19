angular.module('paladinApp')
    .controller('userProfileController',[
        '$rootScope',
        '$scope',
        'appStateManager',
        'apiService',
        '$stateParams',
        '$state',
        'toastService',
        'enums',
        'popupService',
        '$translate',
        'ptLog',
        'ptUtils',
        function ($rootScope,
            $scope,
            appStateManager,
            apiService,
            $stateParams,
            $state,
            toastService,
            enums,
            popupService,
            $translate,
            ptLog,
            ptUtils) {

            console.log('userProfileController $scope ', $scope);

            $scope.isLoading = false;
            $scope.isMyProfile = false;
            $scope.isEditing = false;
            $scope.isUpdating = false;
            $scope.userId = $stateParams.userId;
            $scope.editableProfile = null;
            $scope.tempBas64Image = null;

            if ($state.includes('app.profiles.myProfile')) {
                $scope.isMyProfile = true;
                if (!$scope.userId) {
                    if (appStateManager.getUserId())
                        $scope.userId = appStateManager.getUserId();
                    else
                        $state.go('app.home');
                }
            } else if ($scope.userId == appStateManager.getUserId())
            $state.go('app.profiles.myProfile',{userId: $scope.userId});

            $scope.fetchUserProfile = () => {
                $scope.profile = null;
                $scope.isLoading = true;
                let {
                    userId
                } = $scope;
                apiService.users.getUserProfile({userId})
                    .then((response) => {
                        $scope.profile = response.Data;

                        getUserCredit();

                        ptUtils.extractAndGeoLocateAddressFromObjectForFieldNames({
                            object: $scope.profile,
                            addressFieldName: 'User_Address',
                            latFieldName: 'User_Latitude',
                            lngFieldName: 'User_Longitude'
                        })
                            .then((location) => {
                                $scope.profile.User_Address = location.address;
                            });
                        $scope.isLoading = false;
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        toastService.simpleToast(err.data.Message || $translate.instant('DEFAULT_ERROR'));
                    })
            };

            $scope.editProfile = () => {
                let {
                    User_Address,
                    User_FullName
                } = $scope.profile;
                $scope.editableProfile = angular.copy($scope.profile);
                const fullName = User_FullName.split(' ');
                $scope.editableProfile.userFirstName = fullName[0];
                $scope.editableProfile.userLastName = fullName.length > 1 ? fullName[1] : '';
                $scope.isEditing = true;
            };

            $scope.submitProfileEdit = () => {
                $scope.editableProfile.User_FullName = $scope.editableProfile.userFirstName + ' ' + ($scope.editableProfile.userLastName || '');
                const objToSend = angular.copy($scope.editableProfile);
                delete objToSend.userFirstName;
                delete objToSend.userLastName;
                $scope.isUpdating = true;
                apiService.users.editProfile(objToSend)
                    .then(() => {
                        apiService.users.updateNotificaton({
                            userId: $scope.userId,
                            emailNotif: objToSend.Notification_Email || false,
                            chatNotif: objToSend.Notification_Chat || false,
                        })
                            .then((res) => {
                                location.reload();
                            })
                            .catch((err) => {
                                $scope.isUpdating = false;
                                toastService.simpleToast(err.data.Message);
                                console.error(err);
                            })
                    })
                    .catch((err) => {
                        $scope.isUpdating = false;
                        toastService.simpleToast(err.data.Message);
                    })
            };


            $scope.uploadImage = () => {
                angular.element(document.getElementById('uploadImageBtn'))[0].click();
            };

            $scope.onUploaded = (inputElement) => {
                toastService.simpleToast($translate.instant('UPLOADING_IMAGE'));
                if (inputElement && inputElement.files && inputElement.files.length > 0) {
                    canvasResize(inputElement.files[0], {
                        quality: 75,
                        isPreprocessing: true,
                        cardType: '',
                        maxW: 2048,
                        maxH: 2008,
                        isiOS: ptUtils.isMobile.iOS(),
                        callback: function (data, width, height) {
                            $scope.$evalAsync(() => {
                                $scope.editableProfile.User_DisplayPicture = data.split(',')[1];
                                $scope.tempBas64Image = data;
                                toastService.simpleToast($translate.instant('IMAGE_UPLOADED'));
                            })
                        }
                    });
                } else {
                    // No file uploaded
                }
            };


            $scope.changePassword = () =>  {
                popupService.showChangePassword()
                    .then(() => toastService.simpleToast($translate.instant('PASSWORD_SUCCESSFULLY_CHANGED')))
                    .catch(() => ptLog.log('pass change Canceled'))
            };

            $scope.logout = () => {
                $rootScope.$emit(enums.busEvents.userLogout);
            };


            $scope.deleteAccount = () => {
                popupService.showConfirm(
                    $translate.instant('WARN'),
                    $translate.instant('DEL_ACCOUNT_CONFIRM_MESSAGE'))
                    .then(() => {
                        //TODO: - delete account
                        $scope.isLoading = true;
                        apiService.users.deleteAccount($scope.userId)
                            .then(() => {
                                $scope.isLoading = false;
                                popupService.showAlert($translate.instant('DEL_ACCOUNT'),
                                    $translate.instant('DEL_ACCOUNT_SUCCESS'))
                                    .finally(() => {
                                        $rootScope.$emit(enums.busEvents.userLogout);
                                    })
                            })
                            .catch((err) => {
                                $scope.isLoading = false;
                                popupService.showAlert(
                                    $translate.instant('DEL_ACCOUNT'),
                                    err.data.Message || $translate.instant('DEFAULT_ERROR'))
                                    .finally(() => {
                                    })
                            })
                    })
                    .catch(() => {
                        // Delete account canceled
                    })
            };

            let copyReferralLink = (containerid) => {
                // TODO: make this a directive or utility

                if (document.selection) {
                    var range = document.body.createTextRange();
                    range.moveToElementText(document.getElementById(containerid));
                    range.select().createTextRange();
                    document.execCommand("copy");

                } else if (window.getSelection) {
                    var range = document.createRange();
                    range.selectNode(document.getElementById(containerid));
                    window.getSelection().addRange(range);
                    document.execCommand("copy");
                    console.info("text copied")
                }
            }


            let shareReferralLink = () => {
                // open popup with social media buttons
                console.log('open share referral link popup ', popupService, ' .. ', $scope.referralLink);

                popupService.showShareReferralLink($scope.credit.ReferralCode);

            };

            let getUserCredit = () => {
                let {
                    userId
                } = $scope;

                apiService.users.getUserCredit({userId})
                    .then(
                        (result) => {
                            console.log('user.credit ', result)

                            $scope.credit = result.Data;

                            $scope.credit.shareReferralLink = shareReferralLink;
                        },
                        (reason) => {
                            console.log('getUserCredit failed because: ', reason);

                        });

            };

           $scope.fetchUserProfile();


            let deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged,(event,data) => {
                if (data.elementId == 'editProfileAddressField') {
                    let { place } = data, { geometry } = place;

                    $scope.editableProfile.User_Latitude = geometry.location.lat();
                    $scope.editableProfile.User_Longitude = geometry.location.lng();
                    $scope.editableProfile.User_LocationId = place.id;
                }
            }));

            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()()
            });
        }
    ]);
