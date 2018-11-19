'use strict';
angular.module('paladinApp')
    .directive('bookingTrackerInfo',[
        '$rootScope',
        'enums',
        'appStateManager',
        'apiService',
        'ptUtils',
        '$sce',
        '$translate',
        'productReviewService',
        function (
            $rootScope,
            enums,
            appStateManager,
            apiService,
            ptUtils,
            $sce,
            $translate,
            productReviewService) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/bookingTrackerInfo.tpl.html',
                scope: {
                    booking:'=',
                },
                link: function ($scope, elem, attr) {

                    const getTutorialHTMLTemplate = (translationId) => {
                        return ptUtils.parseBookingStepTutorialHTMLTemplateForTranslationId(translationId);
                    };

                    $scope.getStaticBookingStepsP2P = (isLender) => {

                        if (isLender) {
                            return [
                                {
                                    label:'BOOKING_TRACK_INFO_REQUEST_RECEIVED',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusRequested_Lender'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.requested]
                                },
                                {
                                    label : 'BOOKING_TRACK_INFO_REQUEST_ACCEPTED',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusAccepted_Lender'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.accepted]
                                },
                                {
                                    label: 'BOOKING_TRACK_INFO_START',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusStarted_Lender'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.started]
                                },
                                {
                                    label: 'BOOKING_TRACK_INFO_END',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusEnded_Lender'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.ended]
                                }
                            ]
                        } else {

                          return [
                              {
                                  label:'BOOKING_TRACK_INFO_CARD_VERIFICATION',
                                  status: enums.trackingStep.failure,
                                  description: getTutorialHTMLTemplate('BookingStatusNotVerified_Borrower'),
                                  date: undefined,
                                  isCurrent: true,
                                  rentalStatus: [enums.productRentalStatus.verified, enums.productRentalStatus.verifying]
                              },
                              {
                                  label:'BOOKING_TRACK_INFO_REQUEST_SENT',
                                  status: enums.trackingStep.pending,
                                  description: getTutorialHTMLTemplate('BookingStatusRequested_Borrower'),
                                  date: undefined,
                                  isCurrent: false,
                                  rentalStatus: [enums.productRentalStatus.requested]
                              },
                              {
                                  label:'BOOKING_TRACK_INFO_AWAIT_ACCEPT',
                                  status: enums.trackingStep.pending,
                                  description: getTutorialHTMLTemplate('BookingStatusAccepted_Borrower'),
                                  date: undefined,
                                  isCurrent: false,
                                  rentalStatus: [enums.productRentalStatus.accepted]
                              },
                              {
                                  label: 'BOOKING_TRACK_INFO_START',
                                  status: enums.trackingStep.pending,
                                  description: getTutorialHTMLTemplate('BookingStatusStarted_Borrower'),
                                  date: undefined,
                                  isCurrent: false,
                                  rentalStatus: [enums.productRentalStatus.started]
                              },
                              {
                                  label: 'BOOKING_TRACK_INFO_END',
                                  status: enums.trackingStep.pending,
                                  description: getTutorialHTMLTemplate('BookingStatusEnded_Borrower'),
                                  date: undefined,
                                  isCurrent: false,
                                  rentalStatus: [enums.productRentalStatus.ended]
                              }
                          ]
                        }
                    };

                    $scope.getStaticBookingStepsTnB = (isLender) => {
                        //lender steps
                        if (isLender) {
                            return [
                                {
                                    label:'BOOKING_TRACK_INFO_BOOKED',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusBooked_Borrower'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.booked]
                                },
                                {
                                    label: 'BOOKING_TRACK_INFO_START',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusStarted_Lender'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.started]
                                },
                                {
                                    label: 'BOOKING_TRACK_INFO_END',
                                    status: enums.trackingStep.pending,
                                    description: getTutorialHTMLTemplate('BookingStatusEnded_Lender'),
                                    date: undefined,
                                    isCurrent: false,
                                    rentalStatus: [enums.productRentalStatus.ended]
                                }
                            ]
                        //borrower steps    
                        } else {

                          return [
                              {
                                  label:'BOOKING_TRACK_INFO_CARD_VERIFICATION',
                                  status: enums.trackingStep.failure,
                                  description: getTutorialHTMLTemplate('BookingStatusNotVerified_Borrower_TnB'),
                                  date: undefined,
                                  isCurrent: true,
                                  rentalStatus: [enums.productRentalStatus.verified, enums.productRentalStatus.verifying]
                              },
                              {
                                label:'BOOKING_TRACK_INFO_BOOKED',
                                status: enums.trackingStep.pending,
                                description: getTutorialHTMLTemplate('BookingStatusBooked_Borrower'),
                                date: undefined,
                                isCurrent: false,
                                rentalStatus: [enums.productRentalStatus.booked]
                              },
                              {
                                  label: 'BOOKING_TRACK_INFO_START',
                                  status: enums.trackingStep.pending,
                                  description: getTutorialHTMLTemplate('BookingStatusStarted_Borrower_TnB'),
                                  date: undefined,
                                  isCurrent: false,
                                  rentalStatus: [enums.productRentalStatus.started]
                              },
                              {
                                  label: 'BOOKING_TRACK_INFO_END',
                                  status: enums.trackingStep.pending,
                                  description: getTutorialHTMLTemplate('BookingStatusEnded_Borrower_TnB'),
                                  date: undefined,
                                  isCurrent: false,
                                  rentalStatus: [enums.productRentalStatus.ended]
                              }
                          ]
                        }
                    };
                    // Lender steps
                    // Request received
                    // Request Accepted
                    // Start Rental (chat)
                    // End Rental (chat)


                    // Borrower steps
                    // Card Verification
                    // ID Verification
                    // Request sent
                    // await accept
                    // Start Rental (chat)
                    // End Rental (chat)

                    let trackId = null;
                    let cases = [
                        enums.productRentalStatus.timeout,
                        enums.productRentalStatus.denied,
                        enums.productRentalStatus.canceled,
                        enums.productRentalStatus.criticalCancel,
                        enums.productRentalStatus.moderateCancel
                    ];

                    $scope.setStaticStepAtIndexAsCurrent = (staticSteps,atIndex) => {
                        staticSteps.forEach((step,index) => {
                            step.isCurrent = index === atIndex;
                        })
                    };
                    $scope.getCurrentStep = () => {
                        return $scope.steps.find((item) => item.isCurrent == true)
                    };
                    $scope.updateSteps = (staticSteps) => {
                        let statuses = $scope.booking.BookingStatus;
                        //special handling for Verifying status
                        if (statuses[statuses.length-1].Status_TrackId == enums.productRentalStatus.verifying) {
                            let currentStatus = statuses[statuses.length-1];
                            staticSteps[0].status = enums.trackingStep.pending;
                            staticSteps[0].date = ptUtils.stringToDate(`${currentStatus.CreatedDate} ${currentStatus.CreatedTime}`);
                            staticSteps[0].label = 'BOOKING_TRACK_INFO_ID_VERIFICATION';
                            staticSteps[0].description = getTutorialHTMLTemplate('BookingStatusVerifying_Borrower');
                            $scope.setStaticStepAtIndexAsCurrent(staticSteps,0);
                            return staticSteps;
                        }
                        for (let i = 0; i < statuses.length; i++) {
                            let currentStatus = statuses[i];
                            //lookup static step matching the status and update date and status
                            for (let j = 0; j < staticSteps.length; j++) {
                                if (staticSteps[j].rentalStatus.includes(currentStatus.Status_TrackId)) {
                                    staticSteps[j].status = enums.trackingStep.success;
                                    staticSteps[j].date = ptUtils.stringToDate(`${currentStatus.CreatedDate} ${currentStatus.CreatedTime}`);
                                    //if its the last status, show description
                                    if (i == statuses.length-1) {
                                        $scope.setStaticStepAtIndexAsCurrent(staticSteps, j);
                                    }
                                    break;
                                }
                            }
                        }

                        return staticSteps
                    };

                    $scope.init = () => {
                        $scope.userId = appStateManager.getUserId();
                        $scope.isLender = $scope.userId == $scope.booking.Lender_Id;
                        $scope.isTryAndBuy = $scope.booking.IsTryAndBuy;
                        let steps = angular.copy($scope.booking.IsTryAndBuy 
                            ? $scope.getStaticBookingStepsTnB($scope.isLender)
                            : $scope.getStaticBookingStepsP2P($scope.isLender) 
                        );
                        $scope.steps = $scope.updateSteps(steps);
                    };

                    $scope.init();
                }
            }
        }
    ]);
