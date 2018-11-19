'use strict';
angular.module('paladinApp')
    .directive('bookingDetailedStatus',[
        '$rootScope',
        'enums',
        'appStateManager',
        'apiService',
        'ptUtils',
        function ($rootScope,
                  enums,
                  appStateManager,
                  apiService,
                  ptUtils) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/bookingDetailedStatus.tpl.html',
                scope: {
                    booking: '=',
                    // productBookingDetails: '=',
                    // product: '='
                },
                link: function ($scope, elem, attr) {
                    $scope.prices = [];
                    $scope.youWontBeChargedText = undefined;

                    const init = () => {

                        if ($scope.booking && $scope.booking.BookingStatus && $scope.booking.BookingStatus.length > 0)
                            $scope.youWontBeChargedText =
                                $scope.booking.BookingStatus[$scope.booking.BookingStatus.length - 1].Status_TrackId == enums.productRentalStatus.requested ?
                                'YOU_WONT_BE_CHARGED_MSG':
                                undefined;

                        // Booking_PickupProduct
                        // FullEndDate
                        // FullStartDate
                        // Discount
                        // ptUtils.calculatePricingListForProduct($scop)

                        ptUtils.calculatePriceingListForBooking($scope.booking)
                            .then((prices) => {
                                $scope.$evalAsync(() => {
                                    $scope.prices = prices;
                                })
                            })
                    };

                    init();
                }
            }
        }
    ])