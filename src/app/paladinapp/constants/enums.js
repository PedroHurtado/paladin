angular.module('paladinApp')
    .constant('enums', {
        busEvents: {
            onAppOnlineState: 'PT_BE_onAppOnlineState',
            $routeChangeError:'$routeChangeError',
            userLogin: 'PT_BE_userLogin',
            userSignup: 'PT_BE_userSignup',
            userLogout: 'PT_BE_userLogout',
            preferredLanguageChange: 'PT_BE_preferredLanguageChange',
            updatedUser: 'PT_BE_updatedUser',
            facebookApiLoad: 'PT_BE_facebookApiLoad',
            tokenRefresh:'PT_BE_tokenRefresh',
            triggerEmailValidation: 'PT_BE_triggerEmailValidation',
            locationUpdate: 'PT_BE_locationUpdate',
            categoriesUpdate: 'PT_BE_categoriesUpdate',
            googlePlacesAutocompletePlaceChanged: 'PT_BE_googlePlacesAutocompletePlaceChanged',
            reloadDetailedBooking: 'PT_BE_reloadDetailedBooking',
            footerExtraHeight: 'PT_BE_footerExtraHeight',
            scrollMainScrollerToTop: 'PT_BE_scrollMainScrollerToTop',
            rentalRequestPickerUpdateDates: 'PT_BE_rentalRequestPicker',
        },
        busNavigation: {
            homePage:'PT_BN_homePage',
            productDetailed: 'PT_BN_productDetailed',
            browseCategory: 'PT_BN_browseCategory',
            browseKeyword: 'PT_BN_browseKeyword',
            browseSort: 'PT_BN_browseSort',
            switchBrowseMode: 'PT_BN_browseModeSwitch',
            userProfile: 'PT_BN_userProfile',
            userListings: 'PT_BN_userListings',
            newProduct: 'PT_BN_newProduct',
            rentals: 'PT_BN_rentals',
            transactionDetailed: 'PT_BN_transactionDetailed',
            idVerification: 'PT_BN_idVerification',
            userReview: 'PT_BN_userReview',
            paymentDetailed: 'PT_BN_paymentDetailed',
            chat: 'PT_BN_chat',
        },
        busChatEvents: {
            updateUnreadCount: 'PT_BCE_updateUnreadCount',
            newMessage: 'PT_BCE_newMessage',
            detailedChatSelected: 'PT_BCE_detailedChatSelected',
            startNewMessagesPoller: 'PT_BCE_startNewMessagesPoller',
            selectPendingChat: 'PT_BCE_selectPendingChat',
        },
        ngMetaValues: {
            currentUrl: (langCode) => `currentUrl_${langCode}`, // APPEND LANG
        },
        categoriesBannersPaths: {
            all: {
                en: '/assets/banner-try-and-buy-en.jpg',
                it: '/assets/banner-try-and-buy-it.jpg'
            },
            promo: "/assets/promo-banner-"+window.globals.PROMO_VERSION+".jpg",
            promo1: "/assets/promo1-"+window.globals.PROMO_VERSION+".jpg",
            promo2: "/assets/promo2-"+window.globals.PROMO_VERSION+".jpg",
            addProduct: '/assets/all-categories-banner-3.png',
            allP2P: '/assets/all-categories-banner-3.png',

        },
        localStorageKeys: {
            jwtToken: 'PT_LSK_jwt_token',
            refreshToken: 'PT_LSK_refreshToken',
            preferredLanguage: 'PT_LSK_preferredLanguage',
            userId: 'PT_persistAuth',
            locationLatLong: 'PT_LSK_locationLatLong',
            pendingPrivateState: 'PT_LSK_pendingPrivateState',
        },
        allCategories: {
            'en':'All Categories',
            'it':'Tutte le Categorie',
            'de':'Alle Kategorien'
        },
        secret: 'd05ac55661e27663c025aca7047c825908ae1562',
        inAppSideNavsIds: {
          mainMobileNav: 'main-mobile-side-nav',
          chatSideNav: 'chat-list-side-nav'
        },
        categoriesIds: {
            tryAndBuy: window.globals.isProd() ? 11 : 15,
            outdoor: window.globals.isProd() ? 20 : 12,
            homeAppliance: window.globals.isProd() ? 18 : 8,
            hiTech: window.globals.isProd() ? 17 : 2,
            smartMobility: window.globals.isProd() ? 19 : 4,
            kids: window.globals.isProd() ? 22 : 16,
        },
        productsSortOptions: {
            geoLocation:'SortByGeoLocation',
            popularity: 'SortByPopularity',
            bestProduct: 'SortByBestProduct',
            review: 'SortByReview',
            lowPrice: 'SortByLowPrice',
            highPrice: 'SortByHighPrice',
            recent: 'SortByRecent',
        },
        productsSortByTextCode: {
            SortByPopularity: 'POPULARITY',
            SortByRecent: 'MREC',
            SortByGeoLocation: 'NEAREST',
            SortByBestProduct: 'RELEVANCE',
            SortByLowPrice: 'LP',
            SortByHighPrice: 'HP'
        },
        userProductsFilter: {
            borrowedProducts: 'BorrowedProduct',
            lentProduct: 'LentProduct',
            allProducts:'AllProduct',
            myProductsToBorrow: 'MyProductsToBorrow',
        },
        productRentalStatus: {
            available: -1,
            requested: 1,
            notVerified: 2,
            verified: 3,
            timeout: 4,
            denied: 5,
            canceled: 6,
            accepted: 7,
            started: 8,
            ended: 9,
            criticalCancel: 10,
            moderateCancel: 11,
            canceledByLender: 12,
            timeoutByBorrower: 13,
            verifying: 14,
            booked: 15,

        },
        productRentalStatusNames: {
            requested: 'requested',
            notVerified: 'notverified',
            verified: 'verified',
            timeout: 'timeout',
            denied: 'denied',
            cancelled: 'cancelled',
            criticalCancel: 'cancellation-Critical',
            moderateCancel: 'cancellation-Moderate',
            accepted: 'accepted',
            started: 'started',
            ended: 'ended',
            canceledByLender: 'cancelled-By-Lender',
            timeoutByBorrower: 'card_not_verified_timeout'
        },
        trackingStep: {
            pending: 0,
            success: 1,
            failure: 2,
        },
        bookingReviewStatus: {
            noReview: 0, // booking_ReviewStatus 0 // no-review
            reviewByBorrower: 1, // booking_ReviewStatus 1 // review by lender
            reviewByLender: 2,
            reviewByBoth: 3, // booking_ReviewStatus 2 // review by borrower
        },
        idVerificationMethod: {
            passport: 'passport',
            driverLicense: 'driverLicense',
            id: 'id',
        },
        acuantImageSource: {
            mobileCropped: 101,
            scanShellTwain: 102,
            SnapShell: 103,
            Other: 105,
        },
        acuantRegions: {
            USA: 0,
            Canada: 1,
            SouthAmerica: 2,
            Europe: 3,
            Australia: 4,
            Asia: 5,
            GeneralDocs: 6,
            Africa: 7.
        }
    });

/*
Prod
"Category_Id": 11,"Category_Name": "Try the brands",
"Category_Id": 2,"Category_Name": "Hi-Tech",
"Category_Id": 4,"Category_Name": "Music",
"Category_Id": 9,"Category_Name": "Outdoor",
"Category_Id": 7,"Category_Name": "Home & Garden",
"Category_Id": 1,"Category_Name": "Sports",
"Category_Id": 8,"Category_Name": "Clothes",
"Category_Id": 13,"Category_Name": "Events",
"Category_Id": 12,"Category_Name": "Props",
"Category_Id": 10,"Category_Name": "Other",

Test
"Category_Id": 12,"Category_Name": "Sports",
"Category_Id": 15,"Category_Name": "Try & Buy",
"Category_Id": 8,"Category_Name": "Clothes",
"Category_Id": 2,"Category_Name": "Hi-Tech",
"Category_Id": 7,"Category_Name": "Home & Garden",
"Category_Id": 4,"Category_Name": "Music",
 */