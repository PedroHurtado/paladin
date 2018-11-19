angular.module('paladinApp')
    .directive('productStatusLabel',[
        '$rootScope',
        'enums',
        'ptUtils',
        function (
            $rootScope,
            enums,
            ptUtils) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/productStatusLabel.tpl.html',
                scope: {
                    statusId: '=',
                },
                link: function ($scope, elem, attr) {
                    /*
                      "PRODUCT_STATUS_REQUESTED": "Requested",
                      "PRODUCT_STATUS_ACCEPTED": "Accepted",
                      "PRODUCT_STATUS_CANCELED": "Canceled",
                      "PRODUCT_STATUS_DECLINED": "Declined",
                      "PRODUCT_STATUS_TIMEOUT": "Timeout",
                      "PRODUCT_STATUS_STARTED": "Started",
                      "PRODUCT_STATUS_ENDED": "Ended"

                '50': '#69C187', //available,
                '100': '#fb814a', // requested
                '200': '#ee4e4a', // timeout / canceled (pre accept) / canceled by lender / canceled by borrower / declined
                '300': '#4ec07e', // accepted
                '400': '#0d87f6', // started
                '500': '#8d72f4', // ended
                'A100': '#fff', // not in use (must have for palette definition)
                'A200': '#fff', // not in use (must have for palette definition)
                'A400': '#fff', // not in use (must have for palette definition)
                'A700': '#fff', // not in use (must have for palette definition)
                    */
                    $scope.setDataForStatusId = () => {
                        let {
                            text,
                            color
                        } = ptUtils.getDisplayDataForTransactionStatus($scope.statusId);
                        $scope.mainColor = color;
                        $scope.statusLabel = text;
                    };

                    $scope.setDataForStatusId();

                }
            }
        }]);