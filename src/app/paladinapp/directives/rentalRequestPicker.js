'use strict';
angular.module('paladinApp')
    .directive('rentalRequestPicker', [
        '$rootScope',
        'appStateManager',
        'enums',
        'apiService',
        'moment',
        '$translate',
        'ptUtils',
        'gtmService',
        function (
            $rootScope,
            appStateManager,
            enums,
            apiService,
            moment,
            $translate,
            ptUtils,
            gtmService,
        ) {
            return {
                restrict: 'E',
                templateUrl: './views/templates/rentalRequestPicker.tpl.html',
                scope: {
                    product: '=',
                    productBookingDetails: '=',
                    onRequestRent: '&',
                    onDatesUpdated: '&',
                },
                link: function ($scope, elem, attr) {
                    console.log('rentalRequestPicker: ', elem[0].id);

                    $scope.userCredit = null;

                    $scope.calculatePrice = (isShowErrorOnFaiure = true) => {
                        $scope.statusError = undefined;

                        let calculateTransactionPrice = () => {
                            ptUtils.calculatePricingListForProduct(
                                $scope.startDate,
                                $scope.endDate,
                                $scope.product,
                                $scope.productBookingDetails,
                                true,
                                $scope.userCredit
                            )
                                .then((prices) => {
                                    $scope.$evalAsync(() => {
                                        $scope.statusError = undefined;
                                        $scope.prices = prices
                                    })
                                })
                                .catch((err) => {
                                    $scope.$evalAsync(() => {
                                        $scope.prices = [];
                                        if (isShowErrorOnFaiure) {
                                            if (err && err.message) {
                                                $scope.statusError = err.message;
                                            }
                                        }
                                    })
                                })
                        };

                        // TODO: Refactor this and make sure credit is not requested more than necessary
                        // maybe move the credit object to appStateManager

                        let userId = appStateManager.getUserId();
                        if (userId) {
                            apiService.users.getUserCredit({userId})
                                .then((result) => {
                                    $scope.userCredit = result.Data;
                                    calculateTransactionPrice();
                                })
                                .catch((err) => {
                                    console.error('getuserCredit failed ', err)
                                })
                        }
                    };
                    $scope.bookingPickerId = attr.id + '-bookingPicker';

                    $scope.init = () => {
                        // const dates = ptUtils.getProductFirstAvailableDatesToRent($scope.productBookingDetails);
                        $scope.statusError = undefined;
                        $scope.startDate = undefined; //dates.startDate;
                        $scope.endDate = undefined; //dates.endDate;
                        $scope.calculatePrice(false);
                    };
                    // scope.validateDates = () => {
                    //
                    // };
                    $scope.onDatesSelected = ({startDate, endDate}) => {
                        if ($scope.startDate != startDate || $scope.endDate != endDate) {
                            $scope.startDate = startDate;
                            $scope.endDate = endDate;
                            $scope.calculatePrice();

                            if ($scope.onDatesUpdated)
                                $scope.onDatesUpdated()
                                ({
                                    startDate: $scope.startDate,
                                    endDate: $scope.endDate,
                                    componentId: elem[0].id,
                                })
                        }
                    };

                    $scope.onBuyBtnClicked = () => {
                        $rootScope.$emit(enums.busNavigation.paymentDetailed,{
                            productId: $scope.product.Product_Id,
                            purchase: true
                        })                    
                    }

                    $scope.onRequestRentBtnClicked = () => {
                        if ($scope.prices == undefined || $scope.prices.length == 0) {
                            $scope.$$postDigest(() => {
                                angular.element(document.querySelector(`#${elem[0].id} #desktopPicker span.md-select-value`))[0].click();
                            })
                            return;
                        }
                        $scope.onRequestRent()
                        ({
                            startDate: $scope.startDate,
                            endDate: $scope.endDate,
                            componentId: elem[0].id,
                        });

                        gtmService.trackEvent('booking', 'request-now-button-post-calendar', 'productDetailpage', 'value');

                    };

                    $scope.init();

                    let deregs = [];

                    deregs.push($rootScope.$on(enums.busEvents.rentalRequestPickerUpdateDates, (event, data) => {
                        if (data && data.startDate && data.endDate && data.componentId == elem[0].id) {
                            $scope.onDatesSelected(data);
                        }
                    }));

                    $scope.$on('$destroy', () => {
                        while (deregs.length)
                            deregs.pop()();
                    })
                }
            }
        }]);
