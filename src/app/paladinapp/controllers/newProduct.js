angular.module('paladinApp')
    .controller('newProductController',[
        '$rootScope',
        '$scope',
        'enums',
        'appStateManager',
        'apiService',
        'uploadHandler',
        'toastService',
        '$translate',
        'gtmService',
        'ptUtils',
        function ($rootScope,
                  $scope,
                  enums,
                  appStateManager,
                  apiService,
                  uploadHandler,
                  toastService,
                  $translate,
                  gtmService,
                  ptUtils) {
            $scope.isLoading = true;
            $scope.emptyProductImage = enums.categoriesBannersPaths.addProduct;
            $scope.subCategories = [];

            $scope.userAddress =  undefined;
            $scope.isUseUserAddress = { value: false };


            $scope.newProductModel = {
                Product_Title:'',
                Product_Description:'',

                Product_ItemCategory_Id: 0,
                Product_SubCategoryId: 0,
                Product_LenduserId: appStateManager.getUserId(),
                Product_TryAndBuy: false,
                Product_IsShop: false,
                Product_ShopURL: '',
                Product_Price_Perday: null,
                Product_City: '',
                Price7Day: null,
                Price15Day: null,
            };


            $scope.onUploadClicked = () => {
                $scope.$$postDigest(() => {
                    angular.element(document.getElementById('uploadImageBtn'))[0].click();
                })
            };

            $scope.onUploaded = (inputElement) => {
                toastService.simpleToast($translate.instant('UPLOADING_IMAGE'));
                // Resize
                canvasResize(inputElement.files[0], {
                    quality: 75,
                    isPreprocessing: true,
                    cardType: '',
                    maxW: 2048,
                    maxH: 2008,
                    isiOS: ptUtils.isMobile.iOS(),
                    callback: function (data, width, height) {
                        $scope.$evalAsync(() => {
                            $scope.tmpUlpoadedImg = data;
                            $scope.newProductModel.ProductImage_Image1 = data.split(',')[1];
                            toastService.simpleToast($translate.instant('IMAGE_UPLOADED'));
                        })
                    }
                });
            };

            $scope.validator = () => {
                let valid = true;
                let errMsg = '';
                if (!$scope.newProductModel.Product_Title) {
                    valid = false;
                    // Please select title
                    if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_TITLE');
                }

                if (!$scope.newProductModel.Product_Description) {
                    valid = false;
                    // Please select description
                    if (!errMsg)
                        errMsg = $translate.instant('PRODUCT_INVALID_DESCRIPTION');
                }

                if ($scope.newProductModel.Product_Latitude &&
                    $scope.newProductModel.Product_Longitude ||
                    ($scope.isUseUserAddress.value && $scope.userAddress && $scope.userAddress.lat && $scope.userAddress.lng)) {

                } else {
                    valid = false;
                    // Please select address
                    if (!errMsg)
                        errMsg = $translate.instant('PRODUCT_INVALID_ADDRESS');
                }

                if (!$scope.newProductModel.ProductImage_Image1) {
                    valid = false;
                    // Please upload image
                    if (!errMsg)
                        errMsg = $translate.instant('PRODUCT_INVALID_IMAGE');
                }

                if (!$scope.newProductModel.Product_ItemCategory_Id) {
                    valid = false;
                    // Please select category
                    if (!errMsg)
                        errMsg = $translate.instant('PRODUCT_INVALID_CATEGORY');
                }

                if (!$scope.newProductModel.Product_Price_Perday) {
                    valid = false;
                    // Please select price per day
                    if (!errMsg)
                        errMsg = $translate.instant('PRODUCT_INVALID_PRICE_PER_DAY');
                }

                if ($scope.newProductModel.Product_TryAndBuy && !$scope.newProductModel.Product_ShopURL) {
                    valid = false;
                    // Try and buy must have url
                    if (!errMsg)
                       errMsg = $translate.instant('PRODUCT_INVALID_TRY_AND_BUY_URL');
                }
                if (!valid)
                    toastService.simpleToast(errMsg);
                return valid
            };

            $scope.onCategorySelected = (categoryId) => {
                $scope.subCategories = [];
                $scope.newProductModel.Product_SubCategoryId = 0;
                if ($scope.categories) {
                    const selectedCategory = $scope.categories.find((cat) => cat.Category_Id == categoryId);
                    if (selectedCategory && selectedCategory.Category_SubCatrgories && selectedCategory.Category_SubCatrgories.length > 0) {
                        $scope.subCategories = selectedCategory.Category_SubCatrgories;
                    } else {
                        $scope.subCategories = [];
                    }
                }
            };

            $scope.addProduct = () => {
                if (!$scope.validator())
                    return;
                $scope.isLoading = true;
                let newProduct = angular.copy($scope.newProductModel);
                if ($scope.isUseUserAddress.value) {
                    delete newProduct.Product_LocationId;
                    newProduct.Product_Latitude = $scope.userAddress.lat;
                    newProduct.Product_Longitude = $scope.userAddress.lng;
                }
                $rootScope.$emit(enums.busEvents.scrollMainScrollerToTop);
                apiService.products.addProduct(newProduct)
                    .then((response) => {
                        gtmService.trackEvent('add-product', 'new-product-added');
                        apiService.products.getUserProducts({
                            userId: appStateManager.getUserId(),
                            productsFilter: enums.userProductsFilter.myProductsToBorrow
                        })
                            .then((res) => {
                                $scope.isLoading = false;
                                if (res && res.Data && res.Data.User_AllProducts && res.Data.User_AllProducts.length > 0) {
                                    const newProduct = res.Data.User_AllProducts[res.Data.User_AllProducts.length-1];
                                    $rootScope.$emit(enums.busNavigation.productDetailed,{product: newProduct});
                                }
                                console.log(res)
                            })
                            .catch((err) => {
                                $scope.isLoading = false;
                                console.error(err)
                            })
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        // toastService.simpleToast(JSON.stringify(err));
                    })
            };

            const formValuesInit = () => {
                if (appStateManager.user && appStateManager.user.User_Address && appStateManager.user.User_Latitude && appStateManager.user.User_Longitude && !$scope.userAddress) {
                    $scope.userAddress = {
                        address: appStateManager.user.User_Address,
                        lat: appStateManager.user.User_Latitude,
                        lng: appStateManager.user.User_Longitude,
                    }
                }
                if (appStateManager.categoriesDict && !$scope.categories) {
                    let tnBCategories = [];
                    let i = 0;
                    Object.values(appStateManager.categoriesDict)
                        .forEach((category) => {
                            if (!category.IsTryAndBuy) 
                                 tnBCategories[i++] = category;
                        });
                    $scope.categories = tnBCategories;
                    }
            };


            formValuesInit();
            $scope.isLoading = false;

            let deregs = [];
            deregs.push($rootScope.$on(enums.busEvents.categoriesUpdate,() => {
                formValuesInit();
            }));

            deregs.push($rootScope.$on(enums.busEvents.updatedUser,() => {
                formValuesInit();
            }));

            deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged,(event,data) => {
                if (data.elementId == 'newProductAddress') {
                    let { place } = data, { geometry } = place;

                    $scope.newProductModel.Product_Latitude = geometry.location.lat();
                    $scope.newProductModel.Product_Longitude = geometry.location.lng();
                    $scope.newProductModel.Product_LocationId = place.id;
                }
            }));
            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()();
            })

        }]);