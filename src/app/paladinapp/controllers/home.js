angular.module('paladinApp')
.controller('homeController', [
    '$scope',
    '$http',
    '$location',
    '$cookies',
    '$rootScope',
    '$sce',
    '$route',
    'Filters',
    '$translate',
    'ZendeskWidget',
    'ngMeta',
    '$mdDialog',
    'enums',
    '$state',
    '$stateParams',
    'popupService',
    '$timeout',
    'appStateManager',
    function ($scope,
              $http,
              $location,
              $cookies,
              $rootScope,
              $sce,
              $route,
              Filters,
              $translate,
              ZendeskWidget,
              ngMeta,
              $mdDialog,
              enums,
              $state,
              $stateParams,
              popupService,
              $timeout,
              appStateManager) {


        $scope.verificationMessage = "Processing ...";
        let geocoder;
        const cat = $stateParams.category;
        let categoryParam =  cat && cat.toString().replace(/-/g, ' ')!=$translate.instant('ACTG') ? cat :$translate.instant('ACTG');
        let subCategoryParam = $stateParams.subCategory ? $stateParams.subCategory :'';
        let initialSortBy = $state.params.sortBy || undefined;
        let pageIndex = $state.params.pageIndex || 1;

        let city = $stateParams.city || ($rootScope.filter || {}).glCity || undefined;

         const languageCode = $stateParams.languageCode;
        $rootScope.lang = languageCode;
        $translate.use(languageCode);

        ZendeskWidget.setLocale(languageCode);

        var scope = $scope;
        if ($state.params.search != undefined) {
            $rootScope.searchKey = $state.params.search;
        } else if ($location.search().search != undefined) {
            $rootScope.searchKey = $location.search().search;
        }
        if ($stateParams.isResetSearch) {
            $rootScope.searchKey = '';
        }

        $rootScope.isTryAndBuy = $stateParams.isTryAndBuy;
      

        function initCategories() {
            Filters.get('it', function(response){
                $rootScope.categoriesMap.set('it', response.data.Data);
                Filters.get('en', function(response){
                    $rootScope.categoriesMap.set('en', response.data.Data);
                    // Filters.get('de', function(response){
                    //     $rootScope.categoriesMap.set('de', response.data.Data);
                        scope.selectCategory();
                        scope.findLatLong();
                    // });

                });

            });
        }

        function updateHreflangTags() {
            updateHreflang("it");
            // updateHreflang("de");
            updateHreflang("en");

        }

        scope.filter = {
            categories: [],
            languageCode: languageCode,
            priceRange: [0,1000],
            search:{
                lat: undefined,
                lng: undefined,
                searchStr: ''
            },
            currentPage:1,
            distanceRange: city? 10 : null,
            sortBy: enums.productsSortOptions.bestProduct,
            sortByCode: enums.productsSortByTextCode.SortByBestProduct,
            category : {
                defaultCategoryName : $translate.instant('ACTG'),
                defaultCategoryDesc : $translate.instant('ACTG'),
                selectedCategoryName :$translate.instant('ACTG'),
                isTryAndBuy: $rootScope.isTryAndBuy,
                selectedCategoryBannerImage: window.globals.IS_PROMO ? enums.categoriesBannersPaths.promo : enums.categoriesBannersPaths.all[languageCode],
                selectedSubCategoryName: null
            },
            gl: null, //google location object when location searched this will be accessible to all
            glString: '',
            glCity: ''
        };

        scope.prepareUrl = function(){
            let url = $rootScope.isTryAndBuy ? `/${appStateManager.currentLang}/categorie` : `/${appStateManager.currentLang}/categorie/privato`;
            if(scope.filter.category.selectedCategoryName && scope.filter.category.selectedCategoryName.toString()){
                url +='/'+scope.filter.category.selectedCategoryName.toString();
                if(scope.filter.category.selectedSubCategoryName && scope.filter.category.selectedSubCategoryName.toString()){
                    url +='/'+scope.filter.category.selectedSubCategoryName.toString();
                    if (city) {
                        url+='/'+city;
                    }
                    //if(scope.filter.glCity){
                    //	url +='/'+scope.filter.glCity;
                    //}
                }
            }
            return url.split(' ').join('-');
        };

        scope.prepareQuery = () => {
            let obj = {};
            if (scope.filter.search.searchStr) {
                obj.search = scope.filter.search.searchStr
            }
            if (scope.filter.sortBy) {
                obj.sortBy = scope.filter.sortBy;
            }
            if (scope.filter.currentPage) {
                obj.pageIndex = scope.filter.currentPage;
            }
        
        return obj;
        };

        function updateHreflang(lang) {
            const metaTag = enums.ngMetaValues.currentUrl(lang);
            if (lang == languageCode) {
                ngMeta.setTag(metaTag, $location.absUrl());
                return;
            }

            var url = '/'+lang+'/categorie/';
            if (scope.filter.category.selectedCategoryId == null) {
                url += enums.allCategories[lang].replace(/ /g, '-')+ '/';
            } else {
                url += Filters.getCategoryById(scope.filter.category.selectedCategoryId, lang).Category_Name.replace(/ /g, '-');
            }

            if (scope.filter.category.selectedSubCategoryId && scope.filter.category.selectedSubCategoryId != null) {
                url += '/' + Filters.getSubcategoryById(scope.filter.category.selectedSubCategoryId, lang).SubCategory_Name.replace(/ /g, '-');

                if (city) {
                    url += '/'+city;
                }
            }
            ngMeta.setTag(metaTag, $location.absUrl().split('/' + languageCode+'/')[0] + url);
        }

        //method needed to init the app. We will determine the location based on either
        //0. previous location stored (in rootscope)
        //1. city in url
        //2. GPS loc
        //3. Default loc
        function init() {

            //dont need to reload if $rootscope has already filter stored
            if (initialSortBy) {
                scope.filter.sortBy = initialSortBy;
                scope.filter.sortByCode = enums.productsSortByTextCode[initialSortBy];
                // scope.filter.search.searchStr = '';
                if ($stateParams.isResetSearch) {
                    scope.filter.search.searchStr = $rootScope.searchKey;
                    scope.filter.search.currentSearchStr = $rootScope.searchKey;
                }
            } else if ($rootScope.searchKey != undefined) {
                scope.filter.search.searchStr = $rootScope.searchKey;
                scope.filter.search.currentSearchStr = $rootScope.searchKey;
            }

            if (pageIndex) {
                scope.filter.currentPage = pageIndex;
            }

            if ($rootScope.filter) {
                //case where we press back button from product preview page or to breadcrumb
                scope.filter = $rootScope.filter; //!important for not loading again all data
                //dont need to reload if $rootscope has already filter stored
                if (initialSortBy) {
                    scope.filter.sortBy = initialSortBy;
                    scope.filter.sortByCode = enums.productsSortByTextCode[initialSortBy];

                    if ($stateParams.isResetSearch) {
                        scope.filter.search.searchStr = '';
                        scope.filter.search.currentSearchStr = '';
                    }
                    // scope.filter.search.searchStr = '';
                } else if ($rootScope.searchKey != undefined) {
                    scope.filter.search.searchStr = $rootScope.searchKey;
                    scope.filter.search.currentSearchStr = $rootScope.searchKey;
                }
                registerUpdateUrlListener();
                scope.selectCategory();
                scope.findLatLong();
            } else {
                //case where we init/refresh website
                if (!$rootScope.categoriesMap) {
                    $rootScope.categoriesMap = new Map();
                    initCategories(languageCode);
                } else {

                    scope.selectCategory();
                    scope.findLatLong();
                }
            }

            
            scope.promoTimeout = $timeout( () => {
                if (appStateManager.user == null && !angular.element(document.body).hasClass('md-dialog-is-showing')) {    
                    popupService.showLoginSignupPopup(true);
                }
            },window.globals.PROMO_SIGNUP_TIMER);
            
        }

        scope.findLatLong = function() {
            //location already defined
            if (scope.filter.glString) {
                scope.geocodeNow(null,null,scope.filter.glString)
            } else if(!city) {
                //asking for location access
                if (navigator.geolocation) {
                    scope.geocodeNow(null,null,null);
                    navigator.geolocation.getCurrentPosition(function(position) {
                        scope.geocodeNow(position.coords.latitude,position.coords.longitude,null);
                    }, function() {
                        scope.geocodeNow(null,null,null);
                    });
                } else {
                    // Browser doesn't support Geolocation
                    scope.geocodeNow(null,null,null);
                }
            }else{
                scope.geocodeNow(null,null,null);
            }

        };

        scope.geocodeNow = function(lat,lng,address) {
            var data= {};
            if(lat && lng){
                data.location = {};
                data.location.lat = lat;
                data.location.lng = lng;
            }else if(address){
                data.address = address;
            }else{
                if(languageCode == 'it' || languageCode == 'en'){
                    data.address = 'milan italy';
                }else if(languageCode == 'de'){
                    data.address = 'berlin germany';
                }else{
                    data.address = 'berlin germany';
                }
            }

            geocoder = new google.maps.Geocoder();
            geocoder.geocode(data, function(results, status) {
                if (results && results.length > 0) {
                    saveLocationToScope(results[0]);
                }

                $rootScope.$broadcast('filtersUpdated',scope.filter);
            });
        }



        function saveLocationToScope(place) {
            scope.filter.gl = place;
            scope.filter.search.lat = place.geometry.location.lat();
            scope.filter.search.lng = place.geometry.location.lng();
            scope.filter.glCity = getCity(place);
            scope.filter.glString = place.formatted_address;
        }

        function getCity(result){
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

        scope.selectCategory = function(){

            scope.filter.categories = $rootScope.categoriesMap.get(languageCode);

            let category = Filters.getCategoryByName(categoryParam,languageCode, $rootScope.isTryAndBuy);

            let tempCategory = scope.filter.category;
            if (category) {
                tempCategory.selectedCategoryId = category.Category_Id;
                tempCategory.selectedCategoryDesc=$sce.trustAsHtml(category.Category_Description);
                tempCategory.selectedCategoryName=category.Category_Name;
                tempCategory.selectedCategoryImagePath=category.Category_ImagePath;
                tempCategory.selectedCategoryBannerImage = category.Category_BannerPath;

                if (category.Category_SubCatrgories && category.Category_SubCatrgories.length>0) {
                    for (var i=0;i<category.Category_SubCatrgories.length;i++) {
                        var subCategory = category.Category_SubCatrgories[i];

                        tempCategory.selectedSubCategoryId = undefined;
                        tempCategory.selectedSubCategoryDesc = undefined;
                        tempCategory.selectedSubCategoryName = undefined;
                        tempCategory.selectedSubCategoryImagePath = undefined;
                        tempCategory.selectedSubCategoryBannerImage	= undefined;

                        if(subCategory.SubCategory_Name.toLowerCase().replace(/ /g,'-') == subCategoryParam.toLowerCase()) {
                            tempCategory.selectedSubCategoryId = subCategory.SubCategory_Id;
                            tempCategory.selectedSubCategoryDesc = $sce.trustAsHtml(subCategory.SubCategory_Description );
                            tempCategory.selectedSubCategoryName = subCategory.SubCategory_Name ;
                            tempCategory.selectedSubCategoryImagePath = subCategory.SubCategory_ImagePath ;
                            tempCategory.selectedSubCategoryBannerImage	= subCategory.SubCategory_BannerPath;
                            break;
                        }
                    }
                }
            } else {
                //all categories selected
                tempCategory.selectedCategoryId = null;
                tempCategory.selectedCategoryDesc = $sce.trustAsHtml(categoryParam);
                tempCategory.selectedCategoryName = $translate.instant('ACTG');
                tempCategory.selectedCategoryImagePath = null;
                tempCategory.selectedCategoryBannerImage = window.globals.IS_PROMO ? enums.categoriesBannersPaths.promo : enums.categoriesBannersPaths.all[languageCode];
                tempCategory.selectedSubCategoryId = undefined;
                tempCategory.selectedSubCategoryDesc = undefined;
                tempCategory.selectedSubCategoryName = undefined;
                tempCategory.selectedSubCategoryImagePath = undefined;
                tempCategory.selectedSubCategoryBannerImage	= undefined;
                tempCategory.isTryAndBuy = $rootScope.isTryAndBuy;
            }
            scope.filter.category = tempCategory ; // this is required because if we set only one param than immediately list directive will be loaded and fetch data ;


            //$rootScope.$broadcast('filtersUpdated',scope.filter);


            //when city is in url, we select distance "In the City (10km)"
            if (city) {
                let radius = {
                    "l_id": 3,
                    "distance":10,
                    "name": "IC"
                };
                $rootScope.$broadcast('distanceChanged', radius);
            }
            //listen to any filter changes in order to update url
            registerUpdateUrlListener();
        };

        let deregs = [];
        //here is where we start everything
        init();

        // var off = $scope.$on('$stateChangeStart', function(e) {
        //     e.preventDefault();
        //     off();
        // });

        deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged, function(events, args){
            if(args && args.place && (args.elementId == 'search-location-bar-desktop' || args.elementId == 'search-location-bar-mobile')) {
                saveLocationToScope(args.place);
                city = null;
                $rootScope.$broadcast('filtersUpdated',scope.filter);
            }
        }));

        deregs.push(scope.$on('languageChanged', function(event,data){
            scope.filter.languageCode = data;
            ZendeskWidget.setLocale(data);
        }));

        function registerUpdateUrlListener() {
            //listen to any filter changes in order to update url
            deregs.push(scope.$watchGroup([
                'filter.languageCode',
                'filter.sortBy',
                'filter.currentPage',
                'filter.category.selectedCategoryName',
                'filter.category.selectedSubCategoryName',
                'search.lat',
                'search.lng',
            ],function(value) {
                if(value) {
                    $rootScope.filter = scope.filter;
                    $location.search(scope.prepareQuery());
                    $location.update_path(scope.prepareUrl(), false);
                    // $scope
                    updateHreflangTags();
                }
            }))
        }



        $scope.$on('$destroy', () => {
            
            while (deregs.length) {
                deregs.pop()();
            }

            $timeout.cancel(scope.promoTimeout);
            
        })

    }]);

angular.module('paladinApp')
    .directive('googleplaceAutocomplete', ['$rootScope','enums', function ($rootScope,enums) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            googleplaceAutocompletePlace: '=?',
            googleplaceAutocomplete: '=',
        },
        link: function postLink(scope, element, attrs, model) {
            var options = scope.googleplaceAutocomplete || {};
            options.placeholder = '';
            options.componentRestrictions = {country: 'it'};
            var autocomplete = new google.maps.places.Autocomplete(element[0], options);
            delete element[0].placeholder;
            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                delete element[0].placeholder;
                scope.$apply(function () {
                    scope.googleplaceAutocompletePlace = autocomplete.getPlace();
                    model.$setViewValue(element.val());
                    $rootScope.$emit(enums.busEvents.googlePlacesAutocompletePlaceChanged, {
                        place: scope.googleplaceAutocompletePlace,
                        elementId: element[0].attributes.id.nodeValue,
                    });
                });
            });

            scope.$on('$destroy', function () {
                google.maps.event.clearInstanceListeners(element[0]);
            });
        }
    };
}]);