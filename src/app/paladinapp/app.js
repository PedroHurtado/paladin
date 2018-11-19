const app = angular.module('paladinApp', [
    'ui.router',
    'ngMeta',
    'zendeskWidget',
    'pascalprecht.translate',
    'paladinPopups',
    'angularReverseGeocode',
    'ngLocationUpdate',
    'ngMaterial',
    'ngMessages',
    'material.svgAssetsCache',
    'ngCookies',
    'uiGmapgoogle-maps',
    'ngMap',
    'base64',
    'ngRoute',
    'angularMoment',
    'ngMaterialDateRangePicker',
    'credit-cards',
    'jkAngularRatingStars'
]);
app
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        '$httpProvider',
        '$locationProvider',
        'ZendeskWidgetProvider',
        '$mdThemingProvider',
        'enums',
        function (
            $stateProvider,
            $urlRouterProvider,
            $httpProvider,
            $locationProvider,
            ZendeskWidgetProvider,
            $mdThemingProvider,
            enums
        ) {

            const paladinTheme = $mdThemingProvider.extendPalette('green', {
                '500': '#69C187',
                '200': '#01b3eb',
                'A200': 'rgba(255,255,255,0.05)',
                'A300': '#484848',
                'A400': 'rgba(72,72,72,0.5)',
                'A500': '#ffffff',
                'A600': '#f6f6f6',
                'A700': '#000'
            });
            const rentOrderStatusTheme = $mdThemingProvider.definePalette('rentOrderStatusTheme', {
                '50': '#69C187', //available,
                '100': '#fb814a', // requested
                '200': '#ee4e4a', // timeout / canceled (pre accept) / canceled by lender / canceled by borrower / declined
                '300': '#4ec07e', // accepted
                '400': '#0d87f6', // started
                '500': '#8d72f4', // ended
                '600': '#fff', // not in use (must have for palette definition)
                '700': '#fff', // not in use (must have for palette definition)
                '800': '#fff', // not in use (must have for palette definition)
                '900': '#fff', // not in use (must have for palette definition)
                'A100': '#fff', // not in use (must have for palette definition)
                'A200': '#fff', // not in use (must have for palette definition)
                'A400': '#fff', // not in use (must have for palette definition)
                'A700': '#000000', // not in use (must have for palette definition)
            });
            $mdThemingProvider.definePalette('paladinTheme', paladinTheme);

            $mdThemingProvider.theme('default')
                .primaryPalette('paladinTheme')
                .accentPalette('paladinTheme');

            $mdThemingProvider.theme('rentOrderStatus')
                .primaryPalette('rentOrderStatusTheme')
                .accentPalette('rentOrderStatusTheme');

            ZendeskWidgetProvider.init({
                accountUrl: 'paladintrue.zendesk.com',
                beforePageLoad: function (zE) {
                    zE.hide();
                }
                // See below for more settings
            });
            //in URL patterns this ocde will disable # and ! before path name
            $locationProvider.html5Mode(true);
            /*
            $locationProvider.html5Mode({
              enabled: true,
              requireBase: false
            });
            */
            delete $httpProvider.defaults.headers.common['X-Requested-With'];


            $stateProvider
                .state('app', {
                    url: '/:languageCode',
                    templateUrl: './views/routes/app.html',
                    controller: 'appController',
                    isPublic: true,
                    abstract: true,
                    params: {
                        languageCode: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it',
                    }
                })
                .state('app.home', {
                    url: '/',
                    templateUrl: './views/routes/homeV2.html',
                    controller: 'homeV2Controller',
                    isPublic: true,
                    data: {
                        isCollapsingHeader: true,
                    },
                    resolve: {
                        validReferralCode: () => {
                            return false;
                        }
                    }
                })
                .state('app.emailVerification', {
                    url: '/email-validation',
                    templateUrl: './views/routes/homeV2.html',
                    controller: 'homeV2Controller',
                    isPublic: true,
                    data: {
                        isCollapsingHeader: true,
                    }
                })
                .state('app.referredRegistration', {
                    url: '/r/:referralNameCode',
                    templateUrl: './views/routes/homeV2.html',
                    controller: 'homeV2Controller',
                    isPublic: true,
                    resolve: {
                        validReferralCode: [
                            '$stateParams',
                            'appStateManager',
                            'referralsService',
                            function ($stateParams, appStateManager, referralsService) {
                                // console.log('###### ', $stateParams.referralNameCode, ' .. ', appStateManager, ' .. ' , referralsService)
                                return referralsService.validateReferralCode($stateParams.referralNameCode);
                            }]
                    }
                })
                .state('app.browse', {
                    url: '/categorie/:category/:subCategory/:city?search&sortBy&pageIndex',
                    templateUrl:'./views/routes/home.html',
                    controller:'homeController',
                    reloadOnSearch: false,
                    isPublic: true,
                    isCustomSEO: true,
                    params: {
                        category: { squash: true, value: null },
                        subCategory: { squash: true, value: null },
                        city: { squash: true, value: null },
                        search: { squash: true, value: null },
                        sortBy: { squash: true, value: null },
                        pageIndex: { squash: true, value: null },
                        isTryAndBuy: true,
                        isResetSearch: false,
                    }
                })
                .state('app.browsePrivate', {
                    url: '/categorie/privato/:category/:subCategory/:city?search&sortBy&pageIndex',
                    templateUrl:'./views/routes/home.html',
                    controller:'homeController',
                    reloadOnSearch: false,
                    isPublic: true,
                    isCustomSEO: true,
                    params: {
                        category: { squash: true, value: null },
                        subCategory: { squash: true, value: null },
                        city: { squash: true, value: null },
                        search: { squash: true, value: null },
                        sortBy: { squash: true, value: null },
                        pageIndex: { squash: true, value: null },
                        isTryAndBuy: false,
                        isResetSearch: false,
                    }
                })
                .state('app.products', {
                    url: '/product',
                    abstract: true,
                })
                // .state('app.blog', {
                //     url: '/blog',
                // })
                .state('app.products.selectedProduct', {
                    url: '/:productNameAndId',
                    templateUrl: './views/routes/productDetailed.html',
                    controller: 'productDetailedController',
                    isPublic: true,
                    params: {
                        productNameAndId: undefined,
                        productId: 0
                    }
                })
                .state('app.products.newProduct', {
                    url: '/new',
                    templateUrl: './views/routes/newProduct.html',
                    controller: 'newProductController'
                })
                .state('app.products.productReview', {
                    url: '/review/:bookingId',
                    templateUrl: './views/routes/productReview.html',
                    controller: 'productReviewController',
                    isPublic: true,
                    resolve: {
                        prereqData: [
                            '$stateParams',
                            'appStateManager',
                            function($stateParams, appStateManager){
                                // collect and validate transaction details
                                console.log('$state productReview params', $stateParams)

                                return {
                                    userId: $stateParams.Borrower_Id,
                                    productId: null,
                                    currentLang: appStateManager.getCurrentLang(),
                                }
                            }
                        ]
                    }
                })

                // .state('app.products.selectedProduct', {
                //         url: '/:productId',
                //         templateUrl:'./views/routes/productPreview.html',
                //         controller:'PreviewController'
                //     });
                .state('app.profiles', {
                    url: '/profiles',
                    abstract: true,
                })
                .state('app.profiles.myProfile', {
                    url: '/myProfile',
                    templateUrl: './views/routes/userProfile.html',
                    controller: 'userProfileController',
                    params: {
                        userId: null,
                    }
                })
                .state('app.profiles.publicProfile', {
                    url: '/:userId',
                    templateUrl: './views/routes/userProfile.html',
                    controller: 'userProfileController',
                    isPublic: true,
                    params: {
                        userId: null,
                    }
                })
                .state('app.myListings', {
                    url: '/myListings',
                    templateUrl: './views/routes/myListings.html',
                    controller: 'myListingsController',
                    isPublic: true,
                })
                .state('app.bookings', {
                    url: '/my-rentals',
                    abstract: true,
                })
                .state('app.bookings.userBookings', {
                    url: '',
                    templateUrl: './views/routes/userBookings.html',
                    controller: 'userBookingsController',
                })
                .state('app.bookings.bookingDetailed', {
                    url: '/:bookingId',
                    templateUrl: './views/routes/bookingDetailed.html',
                    controller: 'bookingDetailedController',
                    params: {
                        bookingId: null,
                    }
                })

                .state('app.bookings.paymentDetailed', {
                    url: '/payment',
                    templateUrl: './views/routes/paymentDetailed.html',
                    controller: 'paymentDetailedController',
                    params: {
                        productId: { squash: true, value: null },
                        startDate: { squash: true, value: null },
                        endDate: { squash: true, value: null },
                        purchase: { squash: true, value: null},
                        bookingId: { squash: true, value: null },
                    }
                })
                .state('verification', {
                    url: '/:languageCode/verification',
                    params: {
                        languageCode: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it',
                    },
                    template: '<div ui-view flex="100" layout="row" layout-align="start center" layout-fill></div>'
                })
                .state('verification.user', {
                    url: '/verifyMe/:bookingId',
                    templateUrl: './views/routes/userVerification.html',
                    controller: 'userVerificationController',
                    params: {
                        bookingId: null,
                    }
                })
                .state('app.chat', {
                    url: '/messaging/:chatId',
                    params: {
                        languageCode: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it',
                        chatId: null,
                    },
                    templateUrl: './views/routes/chat.html',
                    controller: 'chatController',
                    data: {
                        isHeaderHidden: true,
                    }
                })
           ;

            // Force urls with lang code
            $urlRouterProvider.rule(function ($injector, $location) {
                //what this function returns will be set as the $location.url
                let path = $location.path(),
                    langCode = path.split('/')[1], // 0 is "" cuz path begins with /
                    lang = window.globals.SUPPORTED_LANGS.find((lang) => lang.code === langCode.toLowerCase());
                if (!lang) {
                    // Return url appended by lang code
                    return `/${localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it'}${path}`;
                } else {
                    if (lang.code != localStorage.getItem(enums.localStorageKeys.preferredLanguage)) {
                        // $rootScope.$emit(enums.busEvents.preferredLanguageChange,{currentLang: lang});
                        // return
                        localStorage.setItem(enums.localStorageKeys.preferredLanguage, lang.code);
                        location.reload();
                        return path.replace(langCode, lang.code)
                    }
                }
            });
            // Default route case doesn't exit
            $urlRouterProvider.otherwise(function ($injector, $location) {
                if ($location.path().includes('/blog'))
                    return;
                let path = $location.path(),
                    langCode = path.split('/')[1], // 0 is "" cuz path begins with /
                    lang = window.globals.SUPPORTED_LANGS.find((lang) => lang.code === langCode.toLowerCase());
                return `/${localStorage.getItem(enums.localStorageKeys.preferredLanguage) || lang || 'it'}/`
            });

        }])
    .run([
        'ngMeta',
        '$window',
        '$rootScope',
        '$location',
        'facebook',
        'enums',
        '$trace',
        '$transitions',
        '$state',
        'navigationService',
        'dataService',
        'chatService',
        'appStateManager',
        function (ngMeta,
                  $window,
                  $rootScope,
                  $location,
                  facebook,
                  enums,
                  $trace,
                  $transitions,
                  $state,
                  navigationService,
                  dataService,
                  chatService,
                  appStateManager) {
            ngMeta.init();
            dataService.init();
            chatService.init();

            $rootScope.facebook_user = {};
            $rootScope.facebookApiLoaded = false;
            $rootScope.$emit(enums.busEvents.facebookApiLoad, {isLoaded: false});
            $window.fbAsyncInit = function () {
                FB.init({
                    appId: '1156274361103964',
                    channelUrl: 'channel.html',
                    status: true,
                    cookie: true,
                    xfbml: true,
                    version: 'v2.12'
                });

                FB.Event.subscribe('auth.authResponseChange', function (res) {
                    if (res.status === 'connected') {
                        FB.api('/me', {
                            fields: ['first_name', 'last_name', 'email', 'id', 'address', 'location', 'name']
                        }, function (res) {
                            $rootScope.$emit(enums.busEvents.facebookApiLoad, {isLoaded: true});
                            $rootScope.$apply(function () {
                                $rootScope.facebook_user = res;
                                $rootScope.facebookApiLoaded = true;

                            });
                        });
                    }
                });
            };

            $rootScope.stateData = {
                isCollapsingHeader: true,
                isHeaderHidden: false,
            };

            if (!window.globals.isProd()) {
                $trace.enable('TRANSITION');
                $transitions.onStart({}, function (trans) {
                    console.log('$transitions.onStart', trans);
                });
                $rootScope.$on('$stateChangeStart', function () {
                    console.log('$stateChangeStart', arguments)
                });
            }

            // Redirect for non public routes
            $transitions.onBefore({}, function (trans) {
                const nextState = trans.to();
                if (!nextState.isPublic && !appStateManager.getUserId()) {
                    dataService.forceLogin(trans);
                    return trans.router.stateService.target('app.home')
                }
            });

            $transitions.onSuccess({}, function (trans) {
                const nextState = trans.to();
                $rootScope.isMenuOpen = {value: false};
                $rootScope.currentState = {value: $state.current.name};

                if ($state.current.data) {
                    $rootScope.stateData.isCollapsingHeader = $state.current.data.isCollapsingHeader || false;
                    $rootScope.stateData.isHeaderHidden = $state.current.data.isHeaderHidden || false;
                }

                // Update update SEO if controller doesn't override it
                if (!nextState.isCustomSEO)
                    dataService.updateGeneralSEO();
            });

        }]);

angular.module('paladinApp').factory('facebook', function () {
    var facebookService = {};

    facebookService.GetFacebook = function () {
        var _self = this;

        FB.Event.subscribe('auth.statuschange', function (res) {
            if (res.status === 'connected') {
                FB.api('/me', function (res) {
                    $rootScope.$apply(function () {
                        $rootScope.user = _self.user = res;
                        console.log(res);
                    });
                });
            }
        });
        return 'success';
    };
    return 'done';
});

angular.module('paladinApp').directive("fbButton", function () {
    return {
        restrict: 'A',
        link: function (scope, iElement, iAttrs) {

            var languageCodeFacebook = 'en_EN';
            if (scope.currentLang == 'it') {
                languageCodeFacebook = 'it_IT';
            } else if (scope.currentLang == 'de') {
                languageCodeFacebook = 'de_DE';
            }
            (function (d) {
                var js,
                    id = 'facebook-jssdk',
                    ref = d.getElementsByTagName('script')[0];

                js = d.createElement('script');
                js.id = id;
                js.async = true;
                js.src = "//connect.facebook.net/" + languageCodeFacebook + "/sdk.js";

                if (d.getElementById(id)) {
                    ref.parentNode.replaceChild(js, d.getElementById(id));
                    var head = document.getElementsByTagName('head')[0];
                    head.appendChild(js);
                    //  ref.parentNode.insertBefore(js, ref);
                } else {
                    ref.parentNode.insertBefore(js, ref);

                }
                if (typeof FB != "undefined") {
                    if (FB) {
                        FB.XFBML.parse(iElement[0].parent);
                    }
                }
            }(document));
        }
    }
});

angular.module('paladinApp').run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
    var original = $location.path;
    $location.path = function (path, reload) {
        if (reload === false) {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }
        return original.apply($location, [path]);
    };
}]);


