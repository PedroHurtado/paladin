'use strict';
angular.module('paladinApp')
    .directive('bookingDetailedCtaButton',[
        '$rootScope',
        'enums',
        'appStateManager',
        'apiService',
        'ptUtils',
        'toastService',
        'ptLog',
        'transactionService',
        'productReviewService',
        function ($rootScope,
                  enums,
                  appStateManager,
                  apiService,
                  ptUtils,
                  toastService,
                  ptLog,
                  transactionService,
                  productReviewService) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/bookingDetailedCTAButton.tpl.html',
                scope: {
                    booking: '='
                },
                link: function ($scope, elem, attr) {
                    $scope.btns = [];

                    const getTextAndCTAforTransactionStatus = (status,isLender,booking,isTryAndBuy) => {
                        $scope.btns = [];
                        switch (status) {
                            case enums.productRentalStatus.notVerified: {
                                if (!isLender) {
                                    $scope.btns.push({ // Verify ID
                                        text: 'VERIFY_ID',
                                        BL: (booking) => {
                                            $rootScope.$emit(enums.busNavigation.idVerification,{bookingId:booking.Booking_Id});
                                        },
                                        isEnabled: true,
                                    })
                                }
                                break;
                            }
                            case enums.productRentalStatus.requested: {
                                if (!isLender) {
                                    $scope.btns.push({ // Cancel Request
                                        text: 'CANCEL_REQUEST',
                                        BL: (booking) => transactionService.rejectRental(booking,false) ,
                                        isEnabled: true,
                                        isDestructive: true,
                                    })
                                } else {
                                    $scope.btns.push({
                                        text: 'DECLINE_REQUEST',
                                        BL: (booking) => transactionService.rejectRental(booking,true),
                                        isEnabled: true,
                                        isDestructive: true,
                                    });
                                    $scope.btns.push({
                                        text: 'ACCEPT_REQUEST',
                                        BL: (booking) => transactionService.acceptRental(booking),
                                        isEnabled: true,
                                    });

                                }
                                break;
                            }

                            case enums.productRentalStatus.canceled: {
                                if (!isLender) {
                                    $scope.btns.push({
                                        text: 'REQUEST_AGAIN',
                                        BL: (booking) => $rootScope.$emit(enums.busNavigation.productDetailed,{product: booking}),
                                        isEnabled: true,
                                    })
                                }
                                break;
                            }
                            case enums.productRentalStatus.accepted: {
                                if (!isLender) {
                                    $scope.btns.push({
                                        text: 'CANCEL_BOOKING',
                                        BL:(booking) => transactionService.cancelRental(booking,false),
                                        isEnabled: true,
                                        isDestructive: true,
                                    });
                                    $scope.btns.push({
                                        text: 'START_RENTAL',
                                        BL:(booking) => transactionService.startRental(booking),
                                        isEnabled: true,
                                    });
                                } else {
                                    $scope.btns.push({
                                        text: 'CANCEL_BOOKING',
                                        BL:(booking) => transactionService.cancelRental(booking,true),
                                        isEnabled: true,
                                        isDestructive: true,
                                    });
                                }
                                break;
                            }

                            case enums.productRentalStatus.timeout: {
                                if (!isLender) {
                                    if (booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBorrower &&
                                        booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBoth) {
                                        $scope.btns.push({
                                            text: 'REVIEW_LENDER',
                                            BL: (booking) => productReviewService.startReviewFlow(booking, true),
                                            isEnabled: true,
                                        });
                                    } else {

                                        $scope.btns.push({
                                            text: 'REQUEST_AGAIN',
                                            BL: (booking) => $rootScope.$emit(enums.busNavigation.productDetailed,{product: booking}),
                                            isEnabled: true,
                                        });
                                    }   
                                }
                                break;
                            }

                            case enums.productRentalStatus.denied: {
                                $scope.btns.push({
                                    text: 'REQUEST_AGAIN',
                                    BL: (booking) => $rootScope.$emit(enums.busNavigation.productDetailed,{product: booking}),
                                    isEnabled: true,
                                });
                             
                                break;
                            }
                            case enums.productRentalStatus.canceledByLender: {
                                if (!isLender && !isTryAndBuy) {
                                    $scope.btns.push({
                                        text: 'REVIEW_LENDER',
                                        BL: (booking) => productReviewService.startReviewFlow(booking, true),
                                        isEnabled: true,
                                    });
                                }
                                break;
                            }
                            case enums.productRentalStatus.criticalCancel:
                            case enums.productRentalStatus.moderateCancel: {
                                if (isLender) {
                                    $scope.btns.push({
                                        text: 'REVIEW_BORROWER',
                                        BL: (booking) => productReviewService.startReviewFlow(booking, false),
                                        isEnabled: true,
                                    });
                                }
                                break;
                            }
                            case enums.productRentalStatus.started: {
                                if (isLender) {
                                    $scope.btns.push({
                                        text: 'END_RENTAL',
                                        BL: (booking) => transactionService.endRental(booking),
                                        isEnabled: true,
                                    })
                                } else if (isTryAndBuy) {
                                    $scope.btns.push({
                                        text: 'BUY_NOW',
                                        BL: (booking) => $rootScope.$emit(enums.busNavigation.paymentDetailed,{productId: booking.Product_Id,  purchase: true, bookingId: booking.Booking_Id}),
                                        isEnabled: true,
                                    })
                                }
                                break;
                            }
                            case enums.productRentalStatus.ended: {
                                    if (!isLender) {
                                        if (booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBorrower &&
                                            booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBoth) {
                                                $scope.btns.push({
                                                    text: 'REVIEW_LENDER',
                                                    BL: (booking) => productReviewService.startReviewFlow(booking, true),
                                                    isEnabled: true,
                                                });
                                        } else {     
                                            $scope.btns.push({
                                                text: 'REQUEST_AGAIN',
                                                BL: (booking) => $rootScope.$emit(enums.busNavigation.productDetailed,{product: booking}),
                                                isEnabled: true,
                                            });
                                        }
                                        if (isTryAndBuy) {
                                            $scope.btns.push({
                                                text: 'BUY_NOW',
                                                BL: (booking) => $rootScope.$emit(enums.busNavigation.paymentDetailed,{ productId: booking.Product_Id, purchase: true, bookingId: booking.Booking_Id}),
                                                isEnabled: true,
                                            })
                                        }
                                    } else {
                                        if (booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByLender &&
                                            booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBoth) {
                                                $scope.btns.push({
                                                    text: 'REVIEW_BORROWER',
                                                    BL: (booking) => productReviewService.startReviewFlow(booking, false),
                                                    isEnabled: true,
                                                });
                                        }

                                        if (!booking.Lender_StripeAccount) {
                                            $scope.btns.push({
                                                text:'CREATE_STRIPE_ACCOUNT',
                                                BL:(booking) => transactionService.endRentalForStripeAccountOnly(booking),
                                                isEnabled: true,
                                            })
                                        }
                                    }
                                break;
                            }
                            case enums.productRentalStatus.timeoutByBorrower: {
                                if (isLender) {
                                        $scope.btns.push({
                                            text: 'REVIEW_BORROWER',
                                            BL: () => productReviewService.startReviewFlow(booking, false),
                                            isEnabled: true,
                                        })
                                }
                                break;
                            }
                        }
                    };
                    $scope.init = () => {
                        const userId = appStateManager.getUserId();
                        const isUserLender = $scope.booking.Lender_Id == userId;
                        const bookingStatus = $scope.booking.BookingStatus[$scope.booking.BookingStatus.length - 1].Status_TrackId;
                        let { color, text } = ptUtils.getDisplayDataForTransactionStatus(bookingStatus);
                        $scope.mainColor = color;
                        getTextAndCTAforTransactionStatus(bookingStatus,isUserLender,$scope.booking, $scope.booking.IsTryAndBuy);
                    };
                    $scope.ctaClicked = () => {

                    };

                    $scope.init()
                }
            }}]);