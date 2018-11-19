angular.module('paladinApp')
    .controller('homeV2Controller',[
        '$rootScope',
        '$scope',
        'enums',
        'apiService',
        'appStateManager',
        '$mdToast',
        '$translate',
        'popupService',
        'ngMeta',
        '$timeout',
        'referralsService',
        'validReferralCode',
        function (
            $rootScope,
            $scope,
            enums,
            apiService,
            appStateManager,
            $mdToast,
            $translate,
            popupService,
            ngMeta,
            $timeout,
            referralsService,
            validReferralCode // from resolve
        ) {
            $scope.isLoading = true;

            $scope.isPromo = window.globals.IS_PROMO;

            $scope.lendTutorial = {
                title: $translate.instant('MAKE_MONEY'),
                description: 'ITEMS_ARE_INSURED',
                // imgUrl: 'https://picsum.photos/400/250/?random',
                imgUrl: '/assets/lend_tutorial_image.png',
                steps: [
                    'UPLOAD_AN_ITEM',
                    'WAIT_FOR_REQUEST',
                    'LEND_YOUR_ITEM'
                ]
            };

            $scope.borrowTutorial = {
                title: $translate.instant('SAVE_MONEY'),
                description: 'ITEMS_ARE_INSURED',
                // imgUrl: 'https://picsum.photos/400/250/?random',
                imgUrl: '/assets/browse-banner-hp.jpg',
                steps: [
                    'FIND_THE_ITEM',
                    'MAKE_A_REQUEST',
                    'PICK_UP_OR_DELIVER',
                ]
            };

            $scope.promoFixCoupon1 = {
                title:  $translate.instant('PROMO_TITLE_1'),
                description: $translate.instant('OFERTA_VALIDA', {couponValue: window.globals.COUPON_VALUE}),
                // imgUrl: 'https://picsum.photos/400/250/?random',
                imgUrl: enums.categoriesBannersPaths.promo1,
                steps: [
                    'STEP1',
                    $translate.instant('STEP2', {couponCode: window.globals.COUPON_CODE}),
                    'STEP3',
                ]
            };
            $scope.promoFixCoupon2 = {
                title: $translate.instant('PROMO_TITLE_2'), 
                description: $translate.instant('OFERTA_VALIDA', {couponValue: window.globals.COUPON_VALUE}),
                // imgUrl: 'https://picsum.photos/400/250/?random',
                imgUrl: enums.categoriesBannersPaths.promo2,
                steps: [
                    'STEP1',
                    $translate.instant('STEP2', {couponCode: window.globals.COUPON_CODE}),
                    'STEP3',
                ]
            };

            $scope.productTeasers = {
                tryAndBuy: {
                    description: 'TRY_AND_BUY_INFO',
                    link: `https://paladintrue.com/${appStateManager.currentLang}/${window.globals.SUPPORTED_LANGS.find((lang) => appStateManager.currentLang == lang.code).tryAndBuyWordPressPath}/`,
                },
                homeAppliance: {
                    categoryId: enums.categoriesIds.homeAppliance,
                },
                smartMobility: {
                    categoryId: enums.categoriesIds.smartMobility,
                },
                hiTech: {
                    categoryId: enums.categoriesIds.hiTech,
                },
                outdoor: {
                    categoryId: enums.categoriesIds.outdoor,
                },
                
                kids: {
                    categoryId: enums.categoriesIds.kids,
                }

            };

            $scope.takingAboutUsImages = [
                {
                    img: "assets/talkingAboutUs/nuvola_testata-black-white_squared.jpg",
                    link: 'http://nuvola.corriere.it/2017/04/26/paladin-lapp-di-noleggio-di-oggetti-tra-privati/',
                },
                {
                    img: 'assets/talkingAboutUs/corriere-sera-square-1.jpg',
                    link: 'http://www.corriere.it/tecnologia/app-software/17_aprile_27/paladin-l-app-mettere-noleggio-oggetti-che-non-usiamo-750154f0-2b76-11e7-9442-4fba01914cee.shtml',
                },
                {
                    img: "assets/talkingAboutUs/deejay_Logo-black-white.jpg",
                    link: 'https://www.deejay.it/audio/20170430-4/520066/',
                },
                {
                    img: "assets/talkingAboutUs/green-me-black-white.jpg",
                    link: 'https://www.greenme.it/tecno/cellulari/23899-paladin-app-affitto-oggetti',
                },
                {
                    img: 'assets/talkingAboutUs/webnews-black-white.jpg',
                    link: 'http://www.webnews.it/2017/05/05/paladin-sharing-applicazione-economia-startup/',
                },
                {
                    img:'assets/talkingAboutUs/logo-lifegate-radio-black-white.jpeg',
                    link:'https://www.lifegate.it/radio-sound'
                },
                {
                    img:'assets/talkingAboutUs/logo-radio-popolare-black-white.jpeg',
                    link:'http://www.radiopopolare.it/podcast/pionieri-di-lun-2310/'
                },
                {
                    img:'assets/talkingAboutUs/green-planner-black-white.jpeg',
                    link:'https://www.greenplanner.it/2017/10/10/paladin-noleggio-strumenti/'
                },
                {
                    img:'assets/talkingAboutUs/logo-Rai3-black-white.jpeg',
                    link:'http://www.rai.it/rai3/',
                }

            ];

            $scope.getHomePageData = () => {
                $scope.isLoading = true;
                apiService.pages.getHomePageData([
                    $scope.productTeasers.hiTech.categoryId,
                    $scope.productTeasers.smartMobility.categoryId,
                    $scope.productTeasers.homeAppliance.categoryId,
                    $scope.productTeasers.outdoor.categoryId,
                    $scope.productTeasers.kids.categoryId,
                    ].toString())
                    .then((response) => {
                        $scope.isLoading = false;
                        $scope.data = response.Data;
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        $scope.data = {};
                    })
            };

            $scope.getCategoryName = (categoryId) => {
                const category = $scope.data.Categories.find((item) => item.CategoryId == categoryId);
                if (category)
                    return category.CategoryName;
            }

            $scope.getProductList = (categoryId, isTryAndBuy) => {
                if (categoryId == 0) {
                    return isTryAndBuy ? $scope.data.TryAndBuyProducts : $scope.data.P2PProducts;
                }

                const category = $scope.data.Categories.find((item) => item.CategoryId == categoryId);
                if (category)
                    return category.ProductList;
            }

            $scope.getPopularTryAndBuy = () => {
                $scope.isLoading = true;
                apiService.products.getPopularTryAndBuy()
                    .then((response) => {
                        $scope.isLoading = false;
                        $scope.tryAndBuy = response.Data
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        $scope.tryAndBuy = [];
                    })
            } ;
            $scope.getHomePageData();

            // $scope.getPopularTryAndBuy();

            ngMeta.setTitle($translate.instant('HOME_TITLE'));
            ngMeta.setTag('description', $translate.instant('DEFAULT_META_DESC'));
            ngMeta.setTag('imagePath', '../../assets/paladin-logo-300x300.png');

            $scope.promoTimeout = $timeout( () => {
                if(!$scope.isCrawler()){
                    if (appStateManager.user == null && !angular.element(document.body).hasClass('md-dialog-is-showing')) {
                        popupService.showLoginSignupPopup(true);
                    }
                }
            }, referralsService.referralCode ? 0 : window.globals.PROMO_SIGNUP_TIMER);

            $scope.isCrawler = () => {
                
                return /bot|prerender|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
                
            }
            $scope.$on('$destroy', () => {

                // while (deregs.length)
                //     deregs.pop()();

                $timeout.cancel($scope.promoTimeout);
            });

            $scope.showToast = (message,delay = 3000) => {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .hideDelay(delay)
                );
            };

        }]);

