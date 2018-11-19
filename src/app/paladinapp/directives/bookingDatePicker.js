angular.module('paladinApp')
    .directive('bookingDatePicker',[
        '$rootScope',
        'moment',
        'popupService',
        'ptUtils',
        '$mdMedia',
        function ($rootScope,moment,popupService,ptUtils,$mdMedia) {
            return {
                restrict: 'E',
                templateUrl: './views/templates/bookingDatePicker.tpl.html',
                scope: {
                    resultCallback: '&',
                    defaultValue: '=?',
                    startDate: '=?',
                    endDate:'=?',
                    dateRange: '=?',
                    productBookingDetails: '=?',
                    product:'=?'
                },
                link: function ($scope, elem, attr) {
                    // const dates = ptUtils.getProductFirstAvailableDatesToRent($scope.productBookingDetails);
                    
                    const updateDateRanges = () => {
                        if ($scope.productBookingDetails != null) {
                            dateRanges = ptUtils.getBookedDateRanges($scope.productBookingDetails);
                        } 
                    }
                    
                    let dateRanges = []; 
                    updateDateRanges();

                    $scope.isDateAvailable = ($date) => {
                        const momentDate = moment($date);
                        for (let i = 0; i < dateRanges.length ; i++)
                            if (momentDate.isBetween(dateRanges[i].startDate,dateRanges[i].endDate) ||
                                momentDate.isSame(dateRanges[i].startDate) ||
                                momentDate.isSame(dateRanges[i].endDate))
                                return true;

                        if (moment().isBefore($date)) return false; // TODO: - Check if product available for rent at dates

                        return true;
                    };
                    $scope.startDate = $scope.startDate || undefined;
                    $scope.endDate = $scope.endDate || undefined;
                    $scope.dateRange = {};

                    $scope.advancedModel = { selectedTemplate: 'Last 3 Days' };
                    $scope.pickerModel = {
                        selectedTemplate:	false,
                        dateStart: $scope.startDate,
                        dateEnd: undefined,
                    };

                    $scope.pickerTranslations = ptUtils.getTranslationDictForDatePicker();

                    $scope.selectDate = () => {
                        if (!$mdMedia('gt-sm')) {
                            popupService.showDateRangePicker($scope.productBookingDetails, $scope.product)
                                .then((data) => {
                                    if ($scope.resultCallback) {
                                        $scope.resultCallback()({
                                            startDate: moment(data.dateStart),
                                            endDate: moment(data.dateEnd),
                                        });
                                    }
                                })
                                .catch(() => console.log('canceled date picking'))
                        } else {
                            $scope.$$postDigest(() => {
                                angular.element(document.querySelector(`#${elem[0].id} #desktopPicker span.md-select-value`))[0].click();
                            })
                        }
                    };
                    $scope.onDesktopSelect = ($dates) => {
                        if ($dates && $dates.length > 0) {
                            const dateStart = moment($dates[0]);
                            const dateEnd = moment($dates[$dates.length - 1]);
                            $scope.pickerModel.dateStart = undefined;
                            $scope.pickerModel.dateEnd = undefined;
                            if ($scope.resultCallback) {
                                $scope.resultCallback()({
                                    startDate:moment(dateStart),
                                    endDate: moment(dateEnd),
                                });
                            }
                        }
                    }


                    // deregs.push($scope.$watchGroup([
                    //     'startDate',
                    //     'endDate'
                    // ],function () {
                    //     // $scope.pickerModel.dateStart = undefined;
                    //     // $scope.pickerModel.dateEnd = undefined;
                    // }));
                    let deregs = [];

                    deregs.push($scope.$watch('productBookingDetails',() => {
                        updateDateRanges();
                    }));

                    $scope.$on('$destroy', () => {
                        while (deregs.length)
                            deregs.pop()();
                    })
                }
            }
        }]);