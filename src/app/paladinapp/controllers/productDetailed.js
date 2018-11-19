angular.module('paladinApp')
    .controller('productDetailedController',[
        '$rootScope',
        '$scope',
        'enums',
        'apiService',
        '$stateParams',
        'toastService',
        'appStateManager',
        'dataService',
        '$sce',
        'NgMap',
        'popupService',
        '$timeout',
        'moment',
        'ngMeta',
        '$translate',
        'ptUtils',
        '$anchorScroll',
        '$location',
        'referralsService',
        function ($rootScope,
                  $scope,
                  enums,
                  apiService,
                  $stateParams,
                  toastService,
                  appStateManager,
                  dataService,
                  $sce,
                  NgMap,
                  popupService,
                  $timeout,
                  moment,
                  ngMeta,
                  $translate,
                  ptUtils,
                  $anchorScroll,
                  $location,
                  referralsService) {
            $scope.isLoading = false;
            if ($stateParams.productNameAndId) {
                $scope.productId = $stateParams.productNameAndId.split('-') [$stateParams.productNameAndId.split('-').length - 1];
            }
            $scope.category = null;
            $scope.subCategory = null;
            $scope.rentPickersIds = {
                mobile: 'rental-request-picker-mobile',
                desktop: 'rental-request-picker-desktop',
            };
            $scope.productAddress = {
                address: undefined,
                lat: undefined,
                lng: undefined,

            };
            $scope.productBookingDetails = null;

            $scope.isLoggedInUser = () => {
                return appStateManager.getUserId();
            }
            $scope.updateMetaTags = () => {
                if($scope.product){

                    ngMeta.setTitle($scope.getPageTitle());
                    ngMeta.setTag('description',$scope.getPageTitle());
                    ngMeta.setTag('imagePath', window.globals.PRODUCT_IMAGE_URL + $scope.product.ProductImage_Image1);

                }
            }

            $scope.getPageTitle= () => {
                var title = $translate.instant('RENT')+' ';

                // if($scope.category && !$scope.subCategory) {
                //     title +=$scope.category.Category_Name + ' ';
                // }else if($scope.subCategory){
                //     title += $scope.subCategory.SubCategory_Name + ' ';
                // }

                if($scope.product && $scope.product.Product_Title){
                    title += $scope.product.Product_Title +'  ';
                }

                // if(scope.productLocation){
                //     title += $translate.instant('IN')+' '+scope.getCity(scope.productLocation);
                // }

                return title + "| Paladintrue";
            }

            $scope.fetchDetailedProduct = () => {
                $scope.isLoading = true;
                apiService.pages.getProductDetailData($scope.productId)
                    .then((response) => {
                        $scope.product = response.Data;
                        $scope.isMyProduct = $scope.product.Lender_UserId == appStateManager.getUserId();
                        $scope.product.Product_Description = $sce.trustAsHtml($scope.product.Product_Description);


                        ptUtils.extractAndGeoLocateAddressFromObjectForFieldNames({
                            object: $scope.product,
                            addressFieldName: 'Product_Address',
                            latFieldName: 'Product_Latitude',
                            lngFieldName: 'Product_Longitude'
                        })
                            .then((location) => {
                                $scope.productAddress = location;
                            });

                        if (appStateManager.getUserId()) {
                            $scope.productBookingDetails = $scope.product.UserData_ProductBooking;
                        }    
                        
                        $scope.getCategory();
                        $scope.updateMetaTags();
                        $scope.isLoading = false;
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        toastService.simpleToast(JSON.stringify(err));
                        console.error(err)
                    })
            };
       

            $scope.getCategory = () => {
                if (!appStateManager.categoriesDict) {
                    return dataService.getCategories()
                }
                if ($scope.product) {
                    $scope.category = appStateManager.categoriesDict[$scope.product.Product_CategoryId];
                    if ($scope.category && $scope.product.Product_SubCategoryId > 0) {
                        const subCat = $scope.category.Category_SubCatrgories.find((subCat) => subCat.SubCategory_Id == $scope.product.Product_SubCategoryId);
                        if (subCat)
                            $scope.subCategory = subCat;
                    }
                }
            };

            $scope.requestRentalDates = () => {
                popupService.showDateRangePicker($scope.productBookingDetails,$scope.product)
                    .then((data) => {
                        const startDate = moment(data.dateStart);
                        const endDate = moment(data.dateEnd);
                        const days = ptUtils.getRentalPeriodInDays({
                            startRentDate: data.dateStart,
                            endRentDate: data.dateEnd
                        });
                        if ($scope.product.MinRentalPeriod > 0 && days < $scope.product.MinRentalPeriod) {
                             return popupService.showAlert('OOPS',$translate.instant('INVALID_MIN_RENTAL_PERIOD', {days: $scope.product.MinRentalPeriod}))
                                .finally(() => {
                                    $scope.requestRentalDates();
                                
                            })
                        }
                               
                        $scope.onRequestRent({
                            startDate,
                            endDate
                        });
                    })
            };

            $scope.onRequestRent = function ({startDate,endDate,componentId}) {
                if (startDate && endDate) {
                    $rootScope.$emit(enums.busNavigation.paymentDetailed,{
                        startDate,
                        endDate,
                        productId: $scope.productId,
                    })
                }
                // toastService.simpleToast(`Rental request not implemented yet, startDate: ${moment(startDate).format('DD/MM/YY')} endDate ${moment(endDate).format('DD/MM/YY')}`);
            };

            $scope.onDatesUpdated = ({startDate,endDate,componentId}) => {
                const compToUpdate = componentId == $scope.rentPickersIds.desktop ? $scope.rentPickersIds.mobile : $scope.rentPickersIds.desktop
                $rootScope.$emit(enums.busEvents.rentalRequestPickerUpdateDates,
                    {startDate,endDate, componentId : compToUpdate })
            };

            $scope.browseCategory = (cat, subCat) => {
                $rootScope.$emit(enums.busNavigation.browseCategory,{categoryName: cat,subCategoryName: subCat});
            } ;

            $scope.getCategoriesUrl = (cat, subCat) => {

                return ptUtils.getCategoriesUrl(cat, subCat, $scope.product.Product_TryAndBuy, $translate.use());
            }

            $scope.onStartEndDateSelected = ({startDate, endDate}) => {};


            let deregs = [];
            deregs.push($rootScope.$on(enums.busEvents.categoriesUpdate,(event,data) => {
                $scope.getCategory();
            }));

            // deregs.push($scope.$on('$viewContentLoaded', function() {
            // }));
   
            $scope.fetchDetailedProduct();
            
            $scope.promoTimeout = $timeout( () => {
                if(!ptUtils.isCrawler()){
                    if (appStateManager.user == null && !angular.element(document.body).hasClass('md-dialog-is-showing')) {
                        popupService.showLoginSignupPopup(true);
                    }
                }
            }, referralsService.referralCode ? 0 : window.globals.PROMO_SIGNUP_TIMER);
            
            $scope.$on('$destroy',() => {
                while (deregs.length) {
                    deregs.pop()()
                }
                $timeout.cancel($scope.promoTimeout);
            });
            
            //scroll to top (workaround)
            var oldAnchor = $location.hash();
            $location.hash("main-product-image");
            $anchorScroll();
            $location.hash(oldAnchor);
        }]);