angular.module('paladinApp')
    .directive('productsTeaser',[
        '$rootScope',
        'apiService',
        'enums',
        'dataService',
        'appStateManager',
        'toastService',
        '$timeout',
        function (
            $rootScope,
            apiService,
            enums,
            dataService,
            appStateManager,
            toastService,
            $timeout
        ) {
            return {
                restrict:'E',
                templateUrl:'./views/templates/productsTeaser.tpl.html',
                scope: {
                    customTitle: '<?',
                    categoryId: '<?',
                    categoryName: '<?',
                    subCategoryId: '<?',
                    categoryDescription: '<?',
                    descriptionLink:'<?',
                    isPopularItems:'<?',
                    isRecentItems: '<?',
                    isTryAndBuy: '<?',
                    productIds: '<?',
                    userId: '<?',
                    products: '<?',
                    currentProductId: '<?',
                },
                link: function ($scope, elem, attr) {
                    $scope.isLoading = true;
                    $scope.isPopularItems = $scope.isPopularItems || false;
                    $scope.isRecentItems = $scope.isRecentItems || false;
                    $scope.category = null;
                    $scope.products = $scope.products || [];
                    $scope.scrollArrows = { isRightVisible: false,  isLeftVisible: false };

                    const init = () => {

                        if ($scope.products) {
                            $scope.isLoading = false;
                            $timeout( () => {
                                $scope.validateScrollingArrows();
                            },300);
                            return;
                        }
                            

                        if ($scope.categoryId) {                      
                            if (!appStateManager.categoriesDict) {
                                return dataService.getCategories()
                            }
                            $scope.category = appStateManager.categoriesDict[$scope.categoryId];
                        }

                        fetchProducts();
                    };

                    const getData = () => {
                        //get products via productID list
                        if ($scope.products) {
                            return 
                        }
                        if ($scope.productIds) {
                            return apiService.products.getSearchedProducts({
                                productPerPage: 20,
                                sortBy: enums.productsSortOptions.bestProduct,
                                productIDs: $scope.productIds,
                            });
                        }

                        if ($scope.isTryAndBuy) {
                               return apiService.products.getPopularTryAndBuy();
                        } else if ($scope.userId) {
                                let requestParams = {
                                    userId: $scope.userId,
                                    productsFilter: enums.userProductsFilter.myProductsToBorrow,
                                };
                                return apiService.products.getUserProducts(requestParams)
                                    .then((res) => {
                                        return {Data:[res.Data.User_AllProducts]}
                                    })
                        } else {
                            
                            let requestParams = {
                                productPerPage: 20,
                            };

                            if ($scope.categoryId) {
                                requestParams.categoryId = $scope.categoryId;
                                requestParams.sortBy = enums.productsSortOptions.bestProduct;
                                if ($scope.subCategoryId) {
                                    requestParams.subCategoryId = $scope.subCategoryId;
                                }
                            } else if ($scope.isPopularItems) {
                                requestParams.sortBy = enums.productsSortOptions.popularity;
                            } else if ($scope.isRecentItems) {
                                requestParams.sortBy = enums.productsSortOptions.recent;
                            }
                            return apiService.products.getSearchedProducts(requestParams);
                        }
                        // return new Promise((resolve,reject)=> reject('Method not implemented'))
                    };
                    const fetchProducts = () => {
                        $scope.isLoading = true;
                        getData()
                            .then((response) => {
                                $scope.isLoading = false;
                                $scope.products = response.Data[0].filter((product) => product.Product_Id != $scope.currentProductId);
                                $timeout( () => {
                                    $scope.validateScrollingArrows();
                                },300);
                            })
                            .catch((err) => {
                                $scope.isLoading = false;
                                $scope.products = [];
                            })
                    };



                    $scope.onSwipe = (isLeft, $event, $target) => {
                        // button-overlay -> products-teaser-list-item -> products-teaser-list -> div#productsTeaserList + categoryId
                        let objToScroll = $target.current.parentElement.parentElement.parentElement;
                        if (objToScroll) {


                            const minScrollOffset = 0,
                                visibleWidth = objToScroll.clientWidth,
                                maxScrollOffset = objToScroll.scrollWidth - visibleWidth,
                                currentOffset = objToScroll.scrollLeft,
                                itemWidth = $target.current.clientWidth,
                                itemsInPage = visibleWidth / itemWidth;


                            let newScrollTo = isLeft ? currentOffset + (visibleWidth - (itemWidth / itemsInPage) ): currentOffset - (visibleWidth - (itemWidth / itemsInPage) );
                            if (newScrollTo > maxScrollOffset)
                                newScrollTo = maxScrollOffset;
                            else if (newScrollTo < minScrollOffset)
                                newScrollTo = minScrollOffset;

                            let initialTimes = 30;
                            let times = 0;
                            let offset = currentOffset > newScrollTo ? currentOffset - newScrollTo : newScrollTo - currentOffset;
                            let step = offset / initialTimes;
                            let lastOffset = currentOffset < newScrollTo ? currentOffset + step : currentOffset - step;
                            // objToScroll.scrollTo(newScrollTo, objToScroll.scrollTop);


                            const id = setInterval(() => {
                                lastOffset = currentOffset < newScrollTo ? lastOffset + step : lastOffset - step;
                                objToScroll.scrollTo(lastOffset, objToScroll.scrollTop);
                                if (times == initialTimes) {
                                    clearInterval(id);
                                    $scope.validateScrollingArrows();
                                }
                                times++
                            }, step*0.4);

                        }


                    };

                    $scope.onArrowClick = (isLeft) => {
                        // 'productTeaserItem-' + $scope.products[0].Product_Id
                        const firstItem = angular.element(document.querySelector(`#productTeaserItem-${$scope.products[0].Product_Id} .products-teaser-list-item-v2 .button-overlay`))[0];
                        $scope.onSwipe(isLeft,null,{current: firstItem});
                    };

                    $scope.validateScrollingArrows = () => {
                        $scope.instantiateScroller();
                        if ($scope.products.length > 0) {
                            const firstItem = angular.element(document.querySelector(`#productTeaserItem-${$scope.products[0].Product_Id} .products-teaser-list-item-v2 .button-overlay`))[0];
                                // if (firstItem) {
                                    const scroller = angular.element(document.getElementById('productsTeaserList' + ( $scope.categoryId || ($scope.isRecentItems ? 'Recent' : $scope.isPopularItems ? 'Popular' : ''))));
                                    if (scroller[0]) {
                                        const visibleWidth = scroller[0].clientWidth,
                                            maxScrollOffset = scroller[0].scrollWidth - visibleWidth,
                                            currentOffset = scroller[0].scrollLeft;
                                        $scope.$evalAsync(() => {
                                            $scope.scrollArrows.isLeftVisible = Math.round(currentOffset) != 0;
                                            $scope.scrollArrows.isRightVisible = Math.round(currentOffset) != maxScrollOffset;
                                        })
                                    }

                                // }

                        } else {
                            $scope.$evalAsync(() => {
                                $scope.scrollArrows.isLeftVisible = false;
                                $scope.scrollArrows.isRightVisible = false;
                            })
                        }
                    };
                    $scope.seeAll = () => {
                        if ($scope.categoryId) {
                            $rootScope.$emit(enums.busNavigation.browseCategory, {categoryName: $scope.categoryName});
                        }
                        else if ($scope.isPopularItems || $scope.isRecentItems)
                            $rootScope.$emit(enums.busNavigation.browseSort,{sortBy: $scope.isRecentItems ? enums.productsSortOptions.recent : enums.productsSortOptions.popularity});
                        else if ($scope.userId) {
                            $rootScope.$emit(enums.busNavigation.userProfile,{userId:$scope.userId})
                        } else if ($scope.isTryAndBuy != undefined) {
                            $rootScope.$emit(enums.busNavigation.switchBrowseMode, {isTryAndBuy: $scope.isTryAndBuy})  
                        }

                    };

                    $scope.getHrefLink = () => {
                        let href='';
                
                        if ($scope.categoryId) {
                            href = window.globals.ROOT_PATH + appStateManager.currentLang + "/categorie/"+ $scope.categoryName;
                        
                            // $rootScope.$emit(enums.busNavigation.userProfile,{userId:$scope.userId})
                        } else if ($scope.isTryAndBuy != undefined) {
                            href = window.globals.ROOT_PATH + appStateManager.currentLang + "/categorie/"+ 
                                    ($scope.isTryAndBuy ? '' : "privato/") +
                                    (appStateManager.currentLang == 'it'? "Tutte-le-Categorie" : "All-Categories")+ "?sortBy=SortByBestProduct&pageIndex=1";
                        } else if ($scope.userId) {

                        }

                        return href.length > 0 ? href.split(' ').join('-') : "javascript:void(0);";
                    }

                    $scope.instantiateScroller = () => {
                        if (!$scope.scroller) {
                            $scope.scroller = angular.element(document.getElementById('productsTeaserList' + ( $scope.categoryId || ($scope.isRecentItems ? 'Recent' : $scope.isPopularItems ? 'Popular' : ''))));

                            $scope.scroller.bind('resize',function () {
                                $scope.validateScrollingArrows();
                            });
                        }
                    };

                    let deregs = [];


                    deregs.push($rootScope.$on(enums.busEvents.categoriesUpdate,(event,data) => {
                        init();
                    }));


                    $scope.$on('$destroy',function () {
                        if ($scope.scroller)
                            $scope.scroller.unbind('resize');
                        while (deregs.length)
                            deregs.pop()();
                    });
                    init();
                }
            }
        }]);