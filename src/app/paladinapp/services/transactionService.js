'use strict';
angular.module('paladinApp')
    .service('transactionService',[
        '$rootScope',
        'appStateManager',
        'enums',
        'apiService',
        'popupService',
        'geoLocationService',
        'ptLog',
        'ptUtils',
        '$translate',
        'gtmService',
        'productReviewService',
        'moment',
        function ($rootScope,
                  appStateManager,
                  enums,
                  apiService,
                  popupService,
                  geoLocationService,
                  ptLog,
                  ptUtils,
                  $translate,
                  gtmService,
                  productReviewService,
                  moment) {
            const TAG = 'transactionService || ';
            const acceptRental = (booking) => {
                return new Promise((resolve,reject) => {
                    const apiMethod = () => {
                        return new Promise((resolve2,reject2) => {
                            apiService.bookings.acceptBookingRequest({bookingId:booking.Booking_Id,userId: booking.Lender_Id})
                                .then((res) => {
                                    gtmService.trackEvent('rental-status', 'request-accepted');
                                    popupService.showAlert('SUCCESS', 'BOOKING_ACCEPTED_SUCCESS')
                                        .finally(() => {
                                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                            resolve2()
                                        })
                                })
                                .catch((err) => {
                                    if (err && err.data && err.data.Data && err.data.Data == 403) {
                                        return showInvalidOperationError(booking)
                                    }
                                    popupService.showConfirm('ERROR', 'BOOKING_ACCEPTED_FAILURE','POPUP_TRY_AGAIN','POPUP_CANCEL')
                                        .then(() => {
                                            apiMethod()
                                                .then(resolve2)
                                                .catch(reject2)
                                        })
                                        .catch(() => {
                                            resolve2()
                                        })
                                })
                        })
                    };
                    popupService.showTransactionStatusChange({booking,apiMethod,title:'ACCEPT_REQUEST'})
                        .then(resolve)
                        .catch(reject)
                })
            };

            // Reject Rental is used for both lender and borrower prio request acceptance
            // Borrower: will see a cancel request CTA
            // Lender: will see decline request CTA
            // Both "Reject" the booking and don't "Cancel" it
            // transactionService.cancelBooking should be called only after a certain booking was accepted,
            // by either the borrower or the lender
            const rejectRental = (booking, isLender) => {
                return new Promise((resolve,reject) => {
                    const apiMethod = () => {
                        return new Promise((resolve2,reject2) => {
                            const userId = isLender ? booking.Lender_Id : booking.Borrower_Id;
                            apiService.bookings.rejectBookingRequest({
                                bookingId: booking.Booking_Id,
                                userId,
                                reason: ''
                            })
                                .then((res) => {
                                    gtmService.trackEvent('rental-status', isLender? 'request-declined' : 'request-cancelled-prior-approval');
                                    popupService.showAlert('SUCCESS', 'BOOKING_CANCELED_SUCCESS')
                                        .finally(() => {
                                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                            resolve2()
                                        })
                                })
                                .catch((err) => {
                                    if (err && err.data && err.data.Data && err.data.Data == 403) {
                                        return showInvalidOperationError(booking)
                                    }
                                    popupService.showConfirm('ERROR', 'BOOKING_CANCELED_FAILURE','POPUP_TRY_AGAIN','POPUP_CANCEL')
                                        .then(() => {
                                            apiMethod()
                                                .then(resolve2)
                                                .catch(reject2)
                                        })
                                        .catch(() => {
                                            resolve2()
                                        })
                                })
                        })
                    };

                   popupService.showConfirm('CONFIRM', isLender ? 'BOOKING_REJECT_WARNING' : 'CANCEL_REQUEST_WARNING')
                        .then(() => {
                            popupService.showTransactionStatusChange({booking, apiMethod, title: isLender ? 'DECLINE_REQUEST' : 'CANCEL_REQUEST'})
                                .then(resolve)
                                .catch((e)=> {
                                    console.log('...... ERR ', e, ' .... ', reject)
                                    reject();
                                })
                        })
                        .catch(() => {
                            resolve()
                        })
                })
            };


            const cancelRental = (booking,isLender) => {
                return new Promise((resolve,reject) => {
                    const apiMethod = () => {
                        return new Promise((resolve2,reject2) => {
                            const userId = isLender ? booking.Lender_Id : booking.Borrower_Id;
                            apiService.bookings.cancelBookingRequest({
                                bookingId: booking.Booking_Id,
                                userId,
                                reason: ''
                            })
                                .then((res) => {
                                    gtmService.trackEvent('rental-status', isLender ? 'booking-cancelled-by-lender' : 'booking-cancelled-by-borrower');
                                    popupService.showAlert('SUCCESS', 'BOOKING_CANCELED_SUCCESS')
                                        .finally(() => {
                                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                            resolve2()
                                        })
                                })
                                .catch((err) => {
                                    if (err && err.data && err.data.Data && err.data.Data == 403) {
                                        return showInvalidOperationError(booking)
                                    }
                                    popupService.showConfirm('ERROR', 'BOOKING_CANCELED_FAILURE','POPUP_TRY_AGAIN','POPUP_CANCEL')
                                        .then(() => {
                                            return apiMethod()
                                                .then(resolve2)
                                                .catch(reject2)
                                        })
                                        .catch(() => {
                                            resolve2()
                                        })
                                })
                        })
                    };
                    const {
                        FullStartDate,
                    } = booking;
                    const daysLeftBeforeBookingStarts = moment(new Date(FullStartDate)).diff(moment(),'days');
                    let msg = 'BOOKING_CANCELLATION_MODERATE_WARNING';
                    if (daysLeftBeforeBookingStarts <= 1) {
                        msg = 'BOOKING_CANCELLATION_CRITICAL_WARNING';
                    }

                    popupService.showConfirm('CONFIRM',msg)
                        .then(() => {
                            popupService.showTransactionStatusChange({booking, apiMethod, title: 'CANCEL_REQUEST'})
                                .then(resolve)
                                .catch(reject)
                        })
                        .catch(() => {
                            resolve()
                        })
                })
            };


            const startRental = (booking) => {
              return new Promise((resolve,reject) => {
                  const apiMethod = () => {
                      return new Promise((resolve2,reject2) => {
                            apiService.bookings.startRental({
                                bookingId: booking.Booking_Id,
                                userId: booking.Borrower_Id,
                            })
                                .then(() => {
                                    gtmService.trackEvent('rental-status', 'rental-started');
                                    popupService.showAlert('SUCCESS','BOOKING_START_RENTAL_SUCCESS')
                                        .finally(() => {
                                            resolve2();
                                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                        })
                                })
                                .catch((err) => {
                                    if (err && err.data && err.data.Data && err.data.Data == 403) {
                                        return showInvalidOperationError(booking)
                                    }

                                    popupService.showConfirm('ERROR','BOOKING_START_RENTAL_FAILURE','POPUP_TRY_AGAIN','POPUP_CANCEL')
                                        .then(() => {
                                            return apiMethod()
                                                    .then(resolve2)
                                                    .catch(reject2)
                                        })
                                        .catch(reject2)
                                })
                      })
                  };
                  popupService.showConfirm('CONFIRM','BOOKING_START_RENTAL_WARNING')
                      .then(() => {
                          popupService.showTransactionStatusChange({booking, apiMethod, title: 'START_RENTAL'})
                              .then(resolve)
                              .catch(reject)
                      })
              })
            };

            const endRental = (booking) => {
                return new Promise((resolve,reject) => {
                    const apiMethod = () => {
                        return new Promise((resolve2,reject2) => {
                            const user = appStateManager.user;
                            apiService.bookings.endRental({
                                bookingId: booking.Booking_Id,
                                userId: booking.Lender_Id
                            })
                                .then((res) => {
                                    gtmService.trackEvent('rental-status', 'rental-ended');
                                    if (!user.User_StripeAccount) {
                                        // user has no stripe account, call create stripe account to allow him to get paid
                                        createUserStripeAccount(booking)
                                            .then((res) => {
                                                gtmService.trackEvent('rental-status', 'stripe-account-created');
                                                popupService.showAlert('SUCCESS','BOOKING_END_RENTAL_SUCCESS_PAYMENT')
                                                    .finally(() => {
                                                        resolve2();
                                                        $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                                    })
                                            })
                                            .catch((err) => {
                                                if (err && err.isMissingAddress) {
                                                    popupService.showAlert('ERROR', 'PAYOUT_MISSING_ADDRESS')
                                                        .finally(() => {
                                                            reject2()
                                                        });
                                                } else {
                                                    reject2()
                                                }
                                            })
                                    } else {
                                        popupService.showAlert('SUCCESS','BOOKING_END_RENTAL_SUCCESS_PAYMENT')
                                            .finally(() => {
                                                resolve2();
                                                $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                            })
                                    }
                                })
                                .catch((err) => {
                                    if (err && err.data && err.data.Data && err.data.Data == 403) {
                                        return showInvalidOperationError(booking)
                                    }
                                    popupService.showConfirm('ERROR','BOOKING_END_RENTAL_FAILURE')
                                        .then(() => {
                                            return apiMethod()
                                                .then(resolve2)
                                                .catch(reject2)
                                        })
                                        .catch(() => {
                                            resolve2()
                                        })
                                })
                        })
                    };
                    popupService.showConfirm('CONFIRM','BOOKING_END_RENTAL_WARNING')
                        .then(() => {
                            popupService.showTransactionStatusChange({booking, apiMethod, title: 'END_RENTAL'})
                                .then(resolve)
                                .catch(reject)
                        })
                })

            };


            const endRentalForStripeAccountOnly = (booking) => {
                return new Promise((resolve,reject) => {
                    const apiMethod = () => createUserStripeAccount(booking);
                    popupService.showTransactionStatusChange({booking, apiMethod, title: 'CREATE_STRIPE_ACCOUNT'})
                        .then(() => {
                            gtmService.trackEvent('rental-status', 'stripe-account-created');
                            popupService.showAlert('SUCCESS', 'CREATE_STRIPE_ACCOUNT_SUCCESS')
                                .then(() => {
                                    $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                    resolve()
                                })
                        })
                        .catch((err) => {
                            if (err && err.isMissingAddress) {
                                popupService.showAlert('ERROR','PAYOUT_MISSING_ADDRESS')
                                    .finally(() => {
                                        resolve()
                                    });
                            } else {
                                popupService.showAlert('ERROR', 'CREATE_STRIPE_ACCOUNT_FAILURE')
                                    .then(() => {
                                        $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                                        resolve()
                                    })
                            }
                        })
                })
            };

            const createUserStripeAccount = (booking,email = undefined) => {
                return new Promise((resolve,reject) => {
                    const { user } = appStateManager;
                    const { User_Address, User_Email,User_Id } = user;

                    if (!User_Address) {
                        return reject({isMissingAddress: true})
                    }

                    geoLocationService.getUserCountryFromUserAddress(User_Address)
                        .then((country) => {
                            const {short_name} = country;
                            apiService.payments.createUserStripeAccount({
                                userId: User_Id,
                                email: email == undefined ? User_Email : email,
                                bookingId: booking.Booking_Id,
                                country: short_name
                            })
                                .then(resolve)
                                .catch((err) => {
                                    popupService.showInputField({
                                        title: 'ERROR',
                                        message: 'BOOKING_END_RENTAL_STRIPE_ACCOUNT_DUPLICATE_ERROR',
                                        initialValue: appStateManager.user.User_Email,
                                        inputRegexValidation: ptUtils.regexPatterns.email,
                                    })
                                        .then((res) => {
                                            const apiMethod = () => createUserStripeAccount(booking,res.value);
                                            popupService.showTransactionStatusChange({booking, apiMethod, title: 'END_RENTAL'})
                                                .then(resolve)
                                                .catch(reject)
                                        })
                                        .catch(reject)

                                })
                        })
                        .catch((err) => {
                            ptLog.error(`${TAG}, error getting user country, ${JSON.stringify(err)}`);
                            reject(err)
                        })
                })
            };

            const showInvalidOperationError = (booking) => {
                popupService.showAlert('ERROR','BOOKING_INVALID_OPERATION','REFRESH')
                    .finally(() => {
                        $rootScope.$emit(enums.busEvents.reloadDetailedBooking, {bookingId: booking.Booking_Id});
                    })
            };

            return {
                acceptRental,
                rejectRental,
                cancelRental,
                startRental,
                endRental,
                createUserStripeAccount,
                endRentalForStripeAccountOnly
            }

        }]);
