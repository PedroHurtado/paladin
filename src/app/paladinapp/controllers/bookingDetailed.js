'use strict';
angular.module('paladinApp')
    .controller('bookingDetailedController',[
        '$rootScope',
        '$scope',
        'enums',
        'appStateManager',
        'apiService',
        '$stateParams',
        'ptLog',
        'popupService',
        'ptUtils',
        '$sce',
        function ($rootScope,
                  $scope,
                  enums,
                  appStateManager,
                  apiService,
                  $stateParams,
                  ptLog,
                  popupService,
                  ptUtils,
                  $sce) {
            $scope.isLoading = false;
            $scope.bookingId = $stateParams.bookingId;
            $scope.booking = null;
            $scope.address = {
                title: undefined,
                address: undefined,
                lat: undefined,
                lng: undefined
            };
            $scope.fetchDetailedBooking = () => {
                $scope.isLoading = true;
                apiService.bookings.getBookingDetailed({
                    bookingId: $scope.bookingId,
                    userId: appStateManager.getUserId(),
                })
                    .then((res) => {
                        $scope.booking = res.Data;
                        $scope.booking.Product_Description = $sce.trustAsHtml($scope.booking.Product_Description);
                        $scope.fetchProduct();
                    })
                    .catch((err) => {
                        ptLog.error(JSON.stringify(err))
                    })
            };


            $scope.fetchProduct = () => {
                apiService.products.getDetailedProduct($scope.booking.Product_Id)
                    .then((res) => {
                        $scope.product = res.Data;
                        $scope.fetchProductBookingDetails();
                    })
                    .catch((err) => {
                        ptLog.error(JSON.stringify(err))
                    })
            };

            $scope.fetchProductBookingDetails = () => {
                apiService.products.getProductBookingDetails({
                    productId: $scope.product.Product_Id,
                    userId: appStateManager.getUserId()
                })
                    .then((response) => {
                        $scope.productBookingDetails = response.Data;

                        ptUtils.getAddressToDisplayForBooking({
                            product: $scope.product,
                            productBookingDetails: $scope.productBookingDetails,
                            booking: $scope.booking,

                        })
                            .then((address) => {
                                $scope.$evalAsync(() => {
                                    $scope.address = address;
                                    $scope.isLoading = false;
                                    if (ptUtils.isMobile.any()) {
                                        popupService.showBookingTrackerInfoMobilePopup($scope.booking)
                                    }
                                })
                            })
                            .catch((err) => {
                                $scope.$evalAsync(() => {
                                    $scope.isLoading = false;
                                })
                            });
                    })
                    .catch((err) => {
                        ptLog.error(err);
                    })
            };

            $scope.goToProduct = () => {
                  $rootScope.$emit(enums.busNavigation.productDetailed,{product:$scope.booking})
            };

            $scope.fetchDetailedBooking();

            let deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.reloadDetailedBooking,(event,{ bookingId }) => {
                    if (bookingId == $scope.bookingId) {
                        $scope.fetchDetailedBooking();
                    }
            }));

            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()();
            })

        }]);