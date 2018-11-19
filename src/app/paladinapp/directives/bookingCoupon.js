'use strict';
angular.module('paladinApp')
    .directive('bookingCoupon',[
        '$rootScope',
        'enums',
        'apiService',
        'appStateManager',
        'ptUtils',
        function (
            $rootScope,
            enums,
            apiService,
            appStateManager,
            ptUtils
            ) {

                return {
                    restrict: 'E',
                    templateUrl: './views/templates/bookingCoupon.tpl.html',
                    scope: {
                        onCouponValidation: '&',
                    },
                    link: function ($scope, elem, attr) {
                        $scope.isAddingCoupon = false;
                        $scope.isLoading = false;
                        $scope.error = null;
                        $scope.coupon = { code:'' };
                        $scope.addCoupon = () => {
                            $scope.isAddingCoupon = true;
                        };
                        $scope.cancel = () => {
                            $scope.isAddingCoupon = false;
                        };

                        $scope.validateCoupon = () => {
                            // if (!ptUtils.regexPatterns.numbersOnly.test($scope.coupon.code)) {
                            //     return $scope.error = 'Please insert a valid coupon'
                            // }
                            $scope.isLoading = true;
                            const userId = appStateManager.getUserId();
                            const coupon = $scope.coupon.code;
                            apiService.payments.verifyCoupon({
                                userId,
                                coupon
                            })
                                .then((res) => {
                                    $scope.isLoading = false;
                                    $scope.onCouponValidation()(res.Data);
                                    $scope.isAddingCoupon = false;
                                    $scope.coupon.code = '';

                                })
                                .catch((err) => {
                                    $scope.isLoading = false;
                                    $scope.error = err.data.Message || 'PLEASE_INSERT_VALID_COUPON';
                                    // console.error(JSON.stringify(err))
                                })
                        }

                    }
                }
        }]);
