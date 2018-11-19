angular.module('paladinApp')
    .service('productReviewService', [
        '$state',
        '$stateParams',
        '$window',
        'enums',
        'apiService',
        function (
            $state,
            $stateParams,
            $window,
            enums,
            apiService
        ) {

            let self = this;

            // save ref to the booking to be reviewed
            self.booking = null;

            const startReviewFlow = (booking, isLender) => {
                self.booking = booking;
                $state.go('app.products.productReview', {bookingId: booking.Booking_Id});
            };

            const leaveProductReviewPage = (toState = null) => {
                $window.history.back();
            };

            const submitTransactionReview = (params) => {
                apiService.reviews.submitTransactionReview(params)
                    .then((result)=>{
                        toastService.simpleToast($translate.instant('REVIEW_ADDED_SUCCESSFULLY'));
                    });
            };

            const getBookingToReview = () => {
                return self.booking;
            };

            return {
                startReviewFlow,
                leaveProductReviewPage,
                submitTransactionReview,
                getBookingToReview
            }
        }]);
