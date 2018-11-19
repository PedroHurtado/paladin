'use strict';
angular.module('paladinApp')
    .controller('userVerificationController',[
        '$rootScope',
        '$scope',
        'enums',
        'apiService',
        'appStateManager',
        'toastService',
        'uploadHandler',
        '$timeout',
        'ptUtils',
        'acuantService',
        'dataService',
        '$stateParams',
        'popupService',
        '$base64',
        '$translate',
        'gtmService',
        function (
            $rootScope,
            $scope,
            enums,
            apiService,
            appStateManager,
            toastService,
            uploadHandler,
            $timeout,
            ptUtils,
            acuantService,
            dataService,
            $stateParams,
            popupService,
            $base64,
            $translate,
            gtmService) {

            if ($stateParams.bookingId) {
                $scope.bookingId = $stateParams.bookingId
            }
            $scope.isLoading = false;
            $scope.statusError = null;
            $scope.selectedUploadMethod = enums.idVerificationMethod.passport;

            $scope.uploadMethods = [
                {
                    title: 'UPLOAD_METHOD_PASS',
                    value: enums.idVerificationMethod.passport,
                },
                {
                    title: 'UPLOAD_METHOD_DL',
                    value: enums.idVerificationMethod.driverLicense,
                },
                {
                    title: 'UPLOAD_METHOD_NATIONAL_ID',
                    value: enums.idVerificationMethod.id,
                }
            ];

            $scope.uploadData = {};

            let idVerificationMethodPassportTmpl =  [
                {
                    elementId: 'passportUpload',
                    title: 'TAP_TO_UPLOAD_PASS',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:'Passport',
                },
                {
                    elementId: 'idSelfie',
                    title: 'TAKE_SELFIE',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:''
                }
            ];

            let idVerificationMethodDriverLicenceTmpl = [
                {
                    elementId: 'driverLicenseFront',
                    title: 'DL_FRONT',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:'DriversLicenseDuplex'
                },
                {
                    elementId: 'driverLicenseBack',
                    title: 'DL_BACK',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:'DriversLicenseDuplex'
                },
                {
                    elementId: 'driverLicenseSelfie',
                    title: 'TAKE_SELFIE',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:''
                }
            ];

            let idVerificationMethodIdTmpl =  [
                {
                    elementId: 'idFront',
                    title: 'NATIONAL_ID_FRONT',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:'DriversLicenseDuplex'
                },
                {
                    elementId: 'idBack',
                    title: 'NATIONAL_ID_BACK',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:'DriversLicenseDuplex'
                },
                {
                    elementId: 'idSelfie',
                    title: 'TAKE_SELFIE',
                    imgData: null,
                    isProcessingImg: false,
                    cardType:''
                }
            ];

            $scope.selectUploadMethod = (method) => {
                $scope.selectedUploadMethod  = method;
            };

            $scope.clickToUpload = (elementId) => {
                $scope.$$postDigest(() => {
                    angular.element(document.getElementById(elementId))[0].click();
                })
            };

            const setFreshForm = () => {
                // remove selected images
                $scope.uploadData[enums.idVerificationMethod.passport] = angular.copy(idVerificationMethodPassportTmpl);
                $scope.uploadData[enums.idVerificationMethod.driverLicense] = angular.copy(idVerificationMethodDriverLicenceTmpl);
                $scope.uploadData[enums.idVerificationMethod.id] = angular.copy(idVerificationMethodIdTmpl);
            };
            setFreshForm();

            $scope.verifyId = async () => {
                const {
                    uploadData,
                    selectedUploadMethod,
                } = $scope;

                let isValid = true;
                uploadData[selectedUploadMethod].forEach((item) => {
                    isValid = isValid && (item.imgData != undefined && item.imgBlob != undefined)
                });

                if (!isValid) {
                    toastService.simpleToast($translate.instant('UPLOAD_MISSING_DOCS'));
                    return
                }
                $scope.isLoading = true;
                $scope.statusError = null;
                try {
                    if (selectedUploadMethod === enums.idVerificationMethod.passport) {
                        const selfie = uploadData[selectedUploadMethod][1].imgBlob;
                        const acuantPassUploadRes = await acuantService.processPassportImage({
                            imageToProcess: uploadData[selectedUploadMethod][0].imgBlob,
                            imageSource: enums.acuantImageSource.Other,
                            usePreprocessing: true
                        });

                        if (acuantPassUploadRes && acuantPassUploadRes.data) {
                            const { WebResponseCode , WebResponseDescription,FaceImage} = acuantPassUploadRes.data;
                            if (WebResponseCode == 1) {
                                if (FaceImage == null || FaceImage == '') {
                                    throw new Error('COULD_NOT_EXTRACT_IMAGE_FROM_DATA');
                                } else {
                                    const base64FaceImage = goog.crypt.base64.encodeByteArray(FaceImage);
                                    const faceImgBlob = ptUtils.dataUrlToBlob(`data:image/jpg;base64,${base64FaceImage}`);
                                    const facialMatchRes = await acuantService.processFacialMatch({
                                        idFaceImage: faceImgBlob,
                                        selfie,
                                    });

                                    const {
                                        ResponseCodeAuthorization,
                                        ResponseMessageAuthorization,
                                        WebResponseCode,
                                        WebResponseDescription
                                    } = facialMatchRes.data;

                                    if (ResponseCodeAuthorization < 0)
                                        throw new Error(ResponseMessageAuthorization);
                                    else if (WebResponseCode < 0)
                                        throw new Error(WebResponseDescription);
                                    else {
                                        $scope.uploadVerifiedImageToPaladinServers();
                                    }
                                }
                            } else {
                                throw new Error(WebResponseDescription);
                            }
                        } else {
                            throw new Error('DEFAULT_ERROR')
                        }

                    } else if (selectedUploadMethod === enums.idVerificationMethod.driverLicense ||
                        selectedUploadMethod === enums.idVerificationMethod.id) {

                        const frontImage = uploadData[selectedUploadMethod][0].imgBlob;
                        const backImage = uploadData[selectedUploadMethod][1].imgBlob;
                        const selfie = uploadData[selectedUploadMethod][2].imgBlob;

                        const acuantDuplexUpload = await acuantService.processNICDLDuplexImage({
                            frontImage,
                            backImage,
                            selectedRegion: enums.acuantRegions.Europe,
                            imageSource: enums.acuantImageSource.Other,
                            usePreprocessing: true,
                        });

                        // const acuantDuplexUpload = await acuantService.processDriversLicense({
                        //     imageToProcess: frontImage,
                        //     selectedRegion: enums.acuantRegions.Europe,
                        //     imageSource: enums.acuantImageSource.Other,
                        //     usePreprocessing: true,
                        // });

                        const {
                            ResponseCodeAuthorization,
                            ResponseMessageAuthorization,
                            ResponseCodeAutoDetectState,
                            ResponseCodeAutoDetectStateDesc,
                            ResponseCodeProcState,
                            ResponseCodeProcessStateDesc,
                            WebResponseCode,
                            WebResponseDescription,
                            FaceImage
                        } = acuantDuplexUpload.data;

                        if (ResponseCodeAuthorization < 0)
                            throw new Error(ResponseMessageAuthorization);
                        else if (ResponseCodeAutoDetectState < 0)
                            throw new Error(ResponseCodeAutoDetectStateDesc);
                        else if (ResponseCodeProcState < 0)
                            throw new Error(ResponseCodeProcessStateDesc);
                        else if (WebResponseCode < 0)
                            throw new Error(WebResponseDescription);
                        else if (FaceImage == null || FaceImage == '') {
                            throw new Error('COULD_NOT_EXTRACT_IMAGE_FROM_DATA');
                        } else {
                            const base64FaceImage = goog.crypt.base64.encodeByteArray(FaceImage);
                            const faceImgBlob = ptUtils.dataUrlToBlob(`data:image/jpg;base64,${base64FaceImage}`);
                            const facialMatchRes = await acuantService.processFacialMatch({
                                idFaceImage: faceImgBlob,
                                selfie,
                            });

                            const {
                                ResponseCodeAuthorization,
                                ResponseMessageAuthorization,
                                WebResponseCode,
                                WebResponseDescription
                            } = facialMatchRes.data;

                            if (ResponseCodeAuthorization < 0)
                                throw new Error(ResponseMessageAuthorization);
                            else if (WebResponseCode < 0)
                                throw new Error(WebResponseDescription);
                            else {
                                $scope.uploadVerifiedImageToPaladinServers();
                                gtmService.trackEvent('id-verification', 'id-verification-successful');
                            }
                        }

                    } else {
                        // toastService.simpleToast('upload shit');
                        new Error('Operation not supported') // will never happen
                    }
                } catch (err) {
                    $scope.isLoading = false;
                    gtmService.trackEvent('id-verification', 'id-verification-failed');

                    // let requestManualVerification = () => {
                        // make api call with same documents
                        console.log('requestManualVerification ', $scope)
                        if (selectedUploadMethod === enums.idVerificationMethod.passport) {
                            apiService.verification.sendToManualVerification({
                                passportImage: uploadData[selectedUploadMethod][0].imgData.split(',')[1],
                                selfie: uploadData[selectedUploadMethod][1].imgData.split(',')[1],
                                userId: appStateManager.getUserId(),
                                bookingId: $scope.bookingId
                            }).then((result)=>{
                                    // redirect to rental status page
                                    $scope.finishVerificationManual();
                                    toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_SUCCESS'))
                                },
                                (err)=>{
                                    console.log('sendToManualVerification error', err)
                                    setFreshForm();
                                    toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_FAIL'))
                                });
                        } else if (selectedUploadMethod === enums.idVerificationMethod.driverLicense ||
                            selectedUploadMethod === enums.idVerificationMethod.id){

                            apiService.verification.sendToManualVerification({
                                NICDLFront: uploadData[selectedUploadMethod][0].imgData.split(',')[1],
                                NICDLBack: uploadData[selectedUploadMethod][1].imgData.split(',')[1],
                                selfie: uploadData[selectedUploadMethod][2].imgData.split(',')[1],
                                userId: appStateManager.getUserId(),
                                bookingId: $scope.bookingId
                            }).then((result)=>{
                                    // redirect to rental status page
                                    $scope.finishVerificationManual();
                                    toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_SUCCESS'))
                                },
                                (err)=>{
                                    console.log('sendToManualVerification err', err)
                                    setFreshForm();
                                    toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_FAIL'))
                                });
                        }
                    // };

                    // console.log('??????????? ', err.data, ' ... ', err.message, ' ... ', 'DEFAULT_ERROR')
                    // $scope.statusError = (err.data || {}).Message || err.message || $translate.instant('DEFAULT_ERROR');
                    // popupService.showIdVerificationFailureHandler({
                    //     message: $scope.statusError,
                    //     retryClb: () => {
                    //         setFreshForm();
                    //     },
                    //     sendToManualClb: requestManualVerification
                    // });
                    // $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true  });
                    $scope.$apply();
                }
            };

            $scope.uploadVerifiedImageToPaladinServers = async () => {
                const {
                    uploadData,
                    selectedUploadMethod
                } = $scope;

                if (selectedUploadMethod === enums.idVerificationMethod.passport) {

                    const passportImage = uploadData[selectedUploadMethod][0].imgData.split(',')[1];
                    const selfie = uploadData[selectedUploadMethod][1].imgData.split(',')[1];
                    const passUploadRes = await apiService.verification.uploadPassport({
                        passportImage,
                        selfie,
                        userId: appStateManager.getUserId()
                    });

                    if (passUploadRes && passUploadRes.Status === 'success') {
                        $scope.finishVerification()
                    } else {
                        throw new Error(passUploadRes.Message || 'DEFAULT_ERROR');
                    }
                } else if (selectedUploadMethod === enums.idVerificationMethod.driverLicense ||
                    selectedUploadMethod === enums.idVerificationMethod.id) {

                    const NICDLFront = uploadData[selectedUploadMethod][0].imgData.split(',')[1];
                    const NICDLBack = uploadData[selectedUploadMethod][1].imgData.split(',')[1];
                    const selfie = uploadData[selectedUploadMethod][2].imgData.split(',')[1];

                    const NICDLUploadRes = await  apiService.verification.uploadNICDL({
                        NICDLFront,
                        NICDLBack,
                        selfie,
                        userId: appStateManager.getUserId()
                    });

                    if (NICDLUploadRes && NICDLUploadRes.Status === 'success') {
                        $scope.finishVerification()
                    } else {
                        throw new Error(NICDLUploadRes.Message || 'DEFAULT_ERROR');
                    }
                }
            };

            $scope.finishVerification = () => {
                $scope.isLoading = false;
                $scope.statusError = null;

                popupService.showAlert('SUCCESS','ID_SUCCESSFULLY_VERIFIED')
                    .finally(() => {
                        if ($scope.bookingId)
                            $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true  });
                        else
                            $rootScope.$emit(enums.busNavigation.userProfile,{ userId: appStateManager.getUserId() });
                    })
            };

            $scope.finishVerificationManual = () => {
                $scope.isLoading = false;
                $scope.statusError = null;
                //show popup only for Desktop
                if (ptUtils.isMobile.any()) {
                    if ($scope.bookingId)
                        $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true  });
                    else
                        $rootScope.$emit(enums.busNavigation.userProfile,{ userId: appStateManager.getUserId() });
                } else {
                popupService.showAlert('ID_VER_MANUAL_POPUP','ID_VER_MANUAL_POPUP_TEXT')
                    .finally(() => {
                        if ($scope.bookingId)
                            $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true  });
                        else
                            $rootScope.$emit(enums.busNavigation.userProfile,{ userId: appStateManager.getUserId() });
                    })
                }
                
            };

            $scope.skipVerification = () => {
                $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true });
            };

            $scope.onUploaded = (inputElement) => {
                if (inputElement.files && inputElement.files.length > 0) {
                    const {
                        uploadData,
                        selectedUploadMethod
                    } = $scope;
                    const photoIndex = uploadData[selectedUploadMethod].findIndex((item) => item.elementId === inputElement.id);
                    if (photoIndex != undefined) {
                        $scope.$evalAsync(() => {
                            uploadData[selectedUploadMethod][photoIndex].isProcessingImg = true;
                            // Resize
                            canvasResize(inputElement.files[0], {
                                quality: 75,
                                isPreprocessing: true,
                                cardType: uploadData[selectedUploadMethod][photoIndex].cardType,
                                maxW: 2048,
                                maxH: 2008,
                                isiOS: ptUtils.isMobile.iOS(),
                                callback: function (data, width, height) {
                                    $scope.$evalAsync(() => {
                                        uploadData[selectedUploadMethod][photoIndex].imgData = data;
                                        uploadData[selectedUploadMethod][photoIndex].imgBlob = ptUtils.dataUrlToBlob(data);
                                        uploadData[selectedUploadMethod][photoIndex].isProcessingImg = false;
                                    })
                                }
                            });
                            // uploadHandler.convertInputElementToBas64(inputElement)
                            //     .then((data) => {
                            //         $scope.$evalAsync(() => {
                            //             uploadData[selectedUploadMethod][photoIndex].imgData = data.original64;
                            //             uploadData[selectedUploadMethod][photoIndex].imgBlob = ptUtils.dataUrlToBlob(data.original64);
                            //             uploadData[selectedUploadMethod][photoIndex].isProcessingImg = false;
                            //         })
                            //     })
                            //     .catch((err) => {
                            //         toastService.simpleToast(JSON.stringify(err));
                            //         console.error(err);
                            //     })
                        })
                    }
                }
            }

            $scope.showToast = (message, delay = 3000) => {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .hideDelay(delay)
                );
            };


        }
    ]);