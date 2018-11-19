// angular.module('productPreview', ['resources.products', 'resources.filters','directives.header','directives.footer','resources.constants',
//     'uiGmapgoogle-maps','ui.bootstrap','ngMeta','ngMap','pascalprecht.translate','angularReverseGeocode'])
//
//     .config(['$routeProvider', function ($routeProvider,GoogleMapApi) {
//
//         $routeProvider.when('/:languageCode/product/:productId', {
//             templateUrl:'/script/productPreview/productPreview.tpl.html',
//             reloadOnSearch: false,
//             controller:'PreviewController'
//         }).when('/product/:productId', {
//             templateUrl:'/script/productPreview/productPreview.tpl.html',
//             reloadOnSearch: false,
//             controller:'PreviewController'
//         });
//
//
//     }])

angular.module('paladinApp')
    .controller('PreviewController', ['$scope','$sce','$window','$rootScope','$translate','$stateParams', '$location',
        'Products','ngMeta','$filter','$anchorScroll','ZendeskWidget','Filters','enums',
        function ($scope,$sce,$window,$rootScope,$translate,$stateParams, $location,Products,ngMeta,NgMap, $anchorScroll,ZendeskWidget,Filters,enums) {

            var scope = $scope;

            scope.getCurrentLanguageCode = function(){
                return $translate.proposedLanguage()?$translate.proposedLanguage(): $translate.preferredLanguage();
            };
            //Lender rating
            scope.rating = 0;
            scope.ratingRounded = 0;
            //Profile default image path
            scope.profileDefaultImage="../../assets/profile.png";


            //console.log('ROOT SCOPE : ')
            //console.log($routeParams);

            var product_id = $stateParams.productId.split('-')[ $stateParams.productId.split('-').length-1 ];
            var languageCode = $stateParams.languageCode ? $stateParams.languageCode : scope.getCurrentLanguageCode();
            updateHreflang();
            //updating language code globally if user comes directly to this page
            $translate.use(languageCode);
            $rootScope.lang = languageCode;
            ZendeskWidget.setLocale(languageCode);
            $rootScope.$broadcast('updateLanguage',languageCode);

            var searchedLocation = $rootScope.searchedLocation;// $location.search().searchedLocation;

            scope.allCategory = $translate.instant('ACTG');
            if(scope.allCategory == scope.selectedCategoryName)scope.selectedCategoryName=null;

            //console.log( scope.selectedCategoryName)
            //console.log(scope.allCategory)
            //console.log(scope.allCategory == scope.selectedCategoryName);

            scope.selectedSubCategoryName =$rootScope.subcategory;//$location.search().subcategory?$location.search().subcategory.replace(/-/g, ' '):null;

            scope.productDetail={};
            scope.productImageBaseUrl = window.globals.PRODUCT_IMAGE_URL;
            scope.userImageBaseUrl = window.globals.PROFILE_IMAGE_URL;
            scope.rentNowUrl = window.globals.RENT_NOW_URL;
            scope.h1 = '';
            scope.h2 = '';
            scope.productAddress='';
            scope.sample =1;

            function updateBreadcrumb(){
                if (scope.productDetail.Product_CategoryId) {
                    scope.selectedCategoryName = Filters.getCategoryById(scope.productDetail.Product_CategoryId, languageCode).Category_Name;
                }

                if (scope.productDetail.Product_SubCategoryId) {
                    scope.selectedSubCategoryName = Filters.getSubcategoryById(scope.productDetail.Product_SubCategoryId, languageCode).SubCategory_Name;
                }
            }


            scope.fetchProductAddress = function(){
                var data = {};

                data.location = {};
                //console.log(scope.productDetail.Product_Latitude);
                data.location.lat = Number(scope.productDetail.Product_Latitude);
                data.location.lng = Number(scope.productDetail.Product_Longitude);

                geocoder = new google.maps.Geocoder();
                var _scope = scope;
                geocoder.geocode(data, function(results, status) {
                    if(results && results.length > 0){
                        scope.productLocation = results[0];
                        scope.setProductAddress(results[0]);
                    }
                });
            }

            scope.setProductAddress= function(loc){
                $scope.productDetail.productAddress= loc.formatted_address;
                scope.sample = 2;
                scope.productLocation = loc;
                //console.log('SETTING ADD : '+$scope.productDetail.productAddress);
                scope.updateMetaTags();
                $scope.$apply();
            }

            scope.getCity = function(result){
                var country='',state='',city='';
                for(var i=0 ;i<result.address_components.length;i++){
                    var types = result.address_components[i].types;
                    for(var j=0;j<types.length;j++){
                        var type = types[j];
                        if(type=='country' || type=="political"){
                            country = result.address_components[i].long_name;
                            break;
                        }else if(type=='administrative_area_level_1'){
                            state = result.address_components[i].long_name;
                            break;
                        }else if((type=='administrative_area_level_2' && !city) || type=='locality'){
                            city = result.address_components[i].long_name;
                            break;
                        }

                    }
                }
                return city;

                //var shortAddress = (city ? city+',':'' )+(state ? state+',':'' )+(country ? country:'' );
                //return shortAddress;
            }

            scope.$on('languageChanged', function(event,data){
                $location.update_path($location.path().replace('/' + languageCode+'/','/'+data+'/'), true);
                languageCode = data;
                scope.refreshProductDetail();
                ZendeskWidget.setLocale(languageCode);
                updateBreadcrumb();
            });
            scope.getPageTitle= function(){
                var title = $translate.instant('RENT')+' ';

                //console.log('meta tag :')
                //console.log(scope.selectedCategoryName);

                if(scope.selectedCategoryName && !scope.selectedSubCategoryName){
                    title +=scope.selectedCategoryName+ ' ';
                }else if(scope.selectedSubCategoryName){
                    title += scope.selectedSubCategoryName + ' ';
                }

                if(scope.productDetail && scope.productDetail.Product_Title){
                    title += scope.productDetail.Product_Title +'  ';
                }

                if(scope.productLocation){
                    title += $translate.instant('IN')+' '+scope.getCity(scope.productLocation);
                }

                return title;
            }

            scope.getMetaTags= function(){
                var tag = $translate.instant('RENT')+' ';

                if(scope.selectedCategoryName){
                    tag += scope.selectedCategoryName+ ' ';
                }
                if(scope.selectedSubCategoryName){
                    tag += scope.selectedSubCategoryName + ' ';
                }

                if(scope.productDetail && scope.productDetail.Product_Title){
                    tag += scope.productDetail.Product_Title +'  ';
                }


                if(scope.productLocation){
                    tag += $translate.instant('IN')+' '+scope.getCity(scope.productLocation);
                }
                return tag;
            }

            scope.updateH1 = function(){
                scope.h1 = $translate.instant('RENT')+' ';

                /*
                if(scope.selectedCategoryName && !scope.selectedSubCategoryName){
                  scope.h1 += capitalizeFilter(scope.selectedCategoryName)+ ' ';
                }else if(scope.selectedSubCategoryName){
                  scope.h1 += capitalizeFilter(scope.selectedSubCategoryName) + ' ';
                }
                */

                if(scope.productDetail && scope.productDetail.Product_Title){
                    scope.h1 +='<span class="greenText">'+scope.productDetail.Product_Title +'</span> ';
                }


                if(scope.productLocation){
                    scope.h1 += $translate.instant('IN')+' '+scope.getCity(scope.productLocation);
                }

                //console.log('setting h1 = '+scope.h1)
                scope.h1 =$sce.trustAsHtml(scope.h1);
            }

            scope.updateH2 = function(){
                scope.h2 = scope.getPageTitle();
            }

            scope.updateMetaTags= function(){
                if(scope.productDetail){

                    ngMeta.setTitle(scope.getPageTitle());
                    ngMeta.setTag('description',scope.getMetaTags());
                    ngMeta.setTag('imagePath', window.globals.PRODUCT_IMAGE_URL + scope.productDetail.ProductImage_Image1);

                    scope.updateH1();

                    scrollToH1();
                    //scope.updateH2();
                }
            }
            scope.refreshProductDetail = function(){
                //console.log('PRODUCT ID IS : '+product_id);

                if(product_id){
                    Products.getDetail(product_id,languageCode,function(response){
                        scope.productDetail = response.data.Data;
                        scope.rating=scope.productDetail.User_ReviewAsLender>0
                            ? parseFloat(scope.productDetail.User_ReviewAsLender/2).toFixed(1)
                            : 0;
                        scope.ratingRounded = Math.round(scope.rating);
                        scope.fetchProductAddress();

                        if (!$rootScope.categoriesMap) {
                            $rootScope.categoriesMap = new Map();
                            Filters.get('it', function(response){
                                $rootScope.categoriesMap.set('it', response.data.Data);
                                Filters.get('en', function(response){
                                    $rootScope.categoriesMap.set('en', response.data.Data);
                                    Filters.get('de', function(response){
                                        $rootScope.categoriesMap.set('de', response.data.Data);
                                        updateBreadcrumb();
                                        scope.updateMetaTags();
                                    });

                                });

                            });
                        } else {
                            updateBreadcrumb();
                        }
                    })
                }
            }

            scope.goToAllCategory = function(){
                if ($rootScope.filter) {
                    $rootScope.filter.category.selectedCategoryId = null;
                    $rootScope.filter.category.selectedCategoryDesc =null;
                    $rootScope.filter.category.selectedCategoryName =$translate.instant('ACTG');
                    $rootScope.filter.category.selectedCategoryImagePath=null;
                    $rootScope.filter.category.selectedCategoryBannerImage = enums.categoriesBannersPaths.all;

                    $rootScope.filter.category.selectedSubCategoryId = null;
                    $rootScope.filter.category.selectedSubCategoryDesc =null;
                    $rootScope.filter.category.selectedSubCategoryName =null;
                    $rootScope.filter.category.selectedSubCategoryImagePath = null;
                    $rootScope.filter.category.selectedSubCategoryBannerImage = null;

                    $rootScope.filter.currentPage = 1;
                }

                $location.search('key', null)
                $location.url('/'+languageCode+'/'+$translate.instant('ACTG').replace(/ /g,'-'));
            }


            scope.goToCategory = function(){

                if ($rootScope.filter) {
                    var category = Filters.getCategoryById(scope.productDetail.Product_CategoryId,languageCode);
                    $rootScope.filter.category.selectedCategoryId = scope.productDetail.Product_CategoryId;
                    $rootScope.filter.category.selectedCategoryDesc =$sce.trustAsHtml(category.Category_Description);
                    $rootScope.filter.category.selectedCategoryName =category.Category_Name;
                    $rootScope.filter.category.selectedCategoryImagePath=category.Category_ImagePath;
                    $rootScope.filter.category.selectedCategoryBannerImage = category.Category_BannerPath;

                    $rootScope.filter.category.selectedSubCategoryId = null;
                    $rootScope.filter.category.selectedSubCategoryDesc =null;
                    $rootScope.filter.category.selectedSubCategoryName =null;
                    $rootScope.filter.category.selectedSubCategoryImagePath = null;
                    $rootScope.filter.category.selectedSubCategoryBannerImage = null;

                    $rootScope.filter.currentPage = 1;
                }

                $location.search('key', null);
                //$location.url('/'+languageCode+'/'+scope.selectedCategoryName);
                $location.url('/'+languageCode+'/'+scope.selectedCategoryName.replace(/ /g, '-'));

            }

            scope.goToSubCategory = function(){
                if ($rootScope.filter) {
                    var category = Filters.getCategoryById(scope.productDetail.Product_CategoryId,languageCode);
                    $rootScope.filter.category.selectedCategoryId = scope.productDetail.Product_CategoryId;
                    $rootScope.filter.category.selectedCategoryDesc =$sce.trustAsHtml(category.Category_Description);
                    $rootScope.filter.category.selectedCategoryName =category.Category_Name;
                    $rootScope.filter.category.selectedCategoryImagePath=category.Category_ImagePath;
                    $rootScope.filter.category.selectedCategoryBannerImage = category.Category_BannerPath;

                    var subCategory = Filters.getSubcategoryById(scope.productDetail.Product_SubCategoryId, languageCode);
                    $rootScope.filter.category.selectedSubCategoryId = scope.productDetail.Product_SubCategoryId;
                    $rootScope.filter.category.selectedSubCategoryDesc =$sce.trustAsHtml(subCategory.SubCategory_Description);
                    $rootScope.filter.category.selectedSubCategoryName =subCategory.SubCategory_Name;
                    $rootScope.filter.category.selectedSubCategoryImagePath = subCategory.SubCategory_ImagePath;
                    $rootScope.filter.category.selectedSubCategoryBannerImage = subCategory.SubCategory_BannerPath;

                    $rootScope.filter.currentPage = 1;
                }
                $location.search('key', null);
                $location.url('/'+languageCode+'/'+scope.selectedCategoryName.replace(/ /g, '-')+'/'+scope.selectedSubCategoryName.replace(/ /g, '-'));
                //$window.history.back();
            };

            function updateHreflang() {
                ngMeta.setTag('currentUrl_en', $location.absUrl().replace('/' + languageCode+'/','/en/'));
                ngMeta.setTag('currentUrl_it', $location.absUrl().replace('/' + languageCode+'/','/it/'));
                ngMeta.setTag('currentUrl_de', $location.absUrl().replace('/' + languageCode+'/','/de/'));
            }

            scope.go = function ( path ) {
                $location.$$search = {};
                $location.path( path );
            };

            scope.rentNow = function(){
                var url  = scope.rentNowUrl.replace('{0}',languageCode).replace('{1}',scope.productDetail.Product_Id);

                $window.location.href =  url ;
            };

            scope.rentNowDesktop = function(){
                $window.location.href = $translate.instant('URL_DOWNLOAD');
            };

            var scrollToH1 = function() {
                //scroll preview page up at startup
                var oldAnchor = $location.hash();
                $location.hash("breadcrumb-pr-detail");
                $anchorScroll();
                $location.hash(oldAnchor);
            };

            scope.refreshProductDetail();
            /*
               $scope.$on('$routeChangeSuccess', function () {
                scrollToH1();
              });
              */
        }]);

