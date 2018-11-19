angular.module('paladinApp')
    .controller('productReviewController', [
        '$scope',
        '$state',
        '$location',
        '$rootScope',
        'appStateManager',
        'apiService',
        'productReviewService',
        'toastService',
        '$translate',
        function (
            $scope,
            $state,
            $location,
            $rootScope,
            appStateManager,
            apiService,
            productReviewService,
            toastService,
            $translate
        ) {
            let self = this;
            // normally done through "controllerAs: 'vm'" property but didn't want to
            // break the code style outside this file;
            // there's a lot to gain from proper namespacing...
            let vm = {};

            vm.review = {
                text: null,
                rating: null
            };

            vm.booking = productReviewService.getBookingToReview();

            vm.isLoading = false;
            vm.onRating = (rating) => {
                vm.review.rating = rating;
            }
            vm.submitReview = (transactionId = null) => {
                // validate
                if (!vm.booking) {
                    
                    console.error('Invalid booking: ', vm.booking)
                    return;
                } else if (vm.review.stars === undefined) {
                    toastService.simpleToast($translate.instant('REVIEW_VALIDATION_NO_STARS')); 
                    return;
                } else if (vm.review.text === null ) {
                    toastService.simpleToast($translate.instant('REVIEW_VALIDATION_NO_COMMENT'));
                    return;
                }

                // keep transactionId out of prereqData in case this controller
                // needs to be reused in other context
                let params = {
                    Review_Precnt: vm.review.stars * 2,
                    Review_ProductId: vm.booking.Product_Id,
                    Review_UserId: vm.booking.Borrower_Id,
                    LanguageCode: appStateManager.getCurrentLang(),
                    ReviewDetail_Comment: vm.review.text || '',
                    Review_BookingId: vm.booking.Booking_Id
                };

                apiService.reviews.submitTransactionReview(params)
                    .then((result) => {
                            console.log('submit review result ', result)
                            // show a toast message
                            toastService.simpleToast($translate.instant('REVIEW_ADDED_SUCCESS'));
                        
                        },
                        (err) => {
                            toastService.simpleToast($translate.instant('REVIEW_ADDED_FAILED'));
                        
                            console.error(err);
                        });


                $scope.vm.closeProductReview();
            };

            vm.closeProductReview = () => {
                // done through service to make it easily accessible
                productReviewService.leaveProductReviewPage();
            };

            // booking already has a rating
            // only the borrower ca review the product
/*
            if (vm.booking.Booking_ReviewStatus
                || vm.booking.Borrower_Id !== appStateManager.getUserId()) {
                // maybe display a toast message or some other error handling here
                vm.closeProductReview();
            }

*/
            /** it's always a good idea to namespace properties in $scope */
            $scope.vm = vm;
        }
    ]);
