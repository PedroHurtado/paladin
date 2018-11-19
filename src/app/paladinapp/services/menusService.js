angular.module('paladinApp')
    .service('menusService',[
        '$rootScope',
        'appStateManager',
        '$translate',
        'popupService',
        '$mdToast',
        '$state',
        'enums',
        'ZendeskWidget',
        function ($rootScope,
                  appStateManager,
                  $translate,
                  popupService,
                  $mdToast,
                  $state,
                  enums,
                  ZendeskWidget) {

        /**
         *
         About:
         How it works
         Try & Buy
         Blog
         FAQ
         Account (logged in):
         My profile
         My Listings
         My Rentals
         Log out
         Account (logged out)
         Log in
         Sign up
         Links:
         Contact us
         Terms and Conditions  → (not showing in header) → route to paladintrue.com/terms-and-conditions/
         */

            /**
             *
             * @type {{aboutMenu: {title: string, list: *[]}, accountLoggedOut: {title: string, shouldHide: function(), list: *[]}, accountLoggedIn: {title: string, shouldHide: function(), list: *[]}, linksMenu: {title: string, list: *[]}, common: {title: string, list: *[]}}}
             */
        const commonMenus = {
            aboutMenu: {
                title: 'ABOUT',
                list:[
                    // {
                    //     itemId:'menu-item-how-it-works',
                    //     title: 'HOW_IT_WORKS', // $translate directive
                    //     link:`https://paladintrue.com/${appStateManager.currentLang}/how-it-works/`
                    // },
                    {
                        itemId:'menu-item-try-n-buy',
                        title: 'TRY_AND_BUY',
                        link: `https://paladintrue.com/${appStateManager.currentLang}/${window.globals.SUPPORTED_LANGS.find((lang) => appStateManager.currentLang == lang.code).tryAndBuyWordPressPath}/`,
                    },
                    {
                        itemId:'menu-item-blog',
                        title: 'BLOG',
                        link:`https://paladintrue.com/${appStateManager.currentLang}/blog/`
                    },
                    {
                        itemId:'menu-item-faq',
                        title: 'FAQ',
                        link:`https://paladintrue.com/${appStateManager.currentLang}/faq/`
                    }
                ]
            },
            accountLoggedOut: {
                title: 'HEADER_MY_ACCOUNT',
                shouldHide: () => {
                    return (appStateManager.user != null)
                },
                list: [
                    {
                        itemId:'menu-item-login',
                        title: 'HEADER_LOGIN',
                        BL: () => popupService.showLoginSignupPopup(false),
                    },
                    {
                        itemId: 'menu-item-signup',
                        title: 'HEADER_SIGNUP',
                        BL: () => popupService.showLoginSignupPopup(true),
                    }
                ]
            },
            accountLoggedIn: {
                title: 'HEADER_MY_ACCOUNT',
                shouldHide: () => {
                    return (appStateManager.user == null)
                },
                list: [
                    {
                        itemId:'menu-item-my-profile',
                        title: 'MY_PROFILE',
                        BL: () => {
                            $rootScope.$emit(enums.busNavigation.userProfile, {userId: appStateManager.user.User_Id})
                        },
                    },
                    // {
                    //     itemId: 'menu-item-my-rentals',
                    //     title: 'MY_RENTAL',
                    //     BL: () => $rootScope.$emit(enums.busNavigation.rentals),
                    // },
                    {
                        itemId: 'menu-item-message',
                        title: 'MESSAGES',
                        BL: () => $rootScope.$emit(enums.busNavigation.chat),
                    },
                    {
                        itemId: 'menu-item-logout',
                        title: 'HEADER_LOGOUT',
                        BL: () => $rootScope.$emit(enums.busEvents.userLogout),
                    }
                ]
            },
            linksMenu: {
                title: 'LINKS',
                list:
                    [
                        {
                            itemId: 'menu-item-contact',
                            title:'CONTACT',
                            //link:`https://paladintrue.com/${appStateManager.currentLang}/contact/`
                            link: $translate.instant("URL_CONTACT")
                        },
                        {
                            itemId: 'menu-item-terms-n-conditions',
                            title: 'TANDC',
                            link: `https://paladintrue.com/${appStateManager.currentLang}/terms-and-conditions/`
                        },
                        {
                            itemId: 'menu-item-privacy-policy',
                            title: 'PRIVACY_POLICY',
                            link: `https://paladintrue.com/${appStateManager.currentLang}/privacy-policy/`
                        },
                        {
                            itemId: 'menu-item-help-support',
                            title: 'SUPPORT',
                            BL: () => {
                                ZendeskWidget.activate();
                            }
                        }
                    ]
            },
            common: {
                title: '', // no title
                list: [
                    {
                        itemId:'menu-item-browse',
                        title: 'BORROW',
                        BL: () => $state.go('app.browse'),
                        link: window.globals.ROOT_PATH + appStateManager.currentLang + "/categorie/"+ (appStateManager.currentLang == 'it'? "Tutte-le-Categorie" : "All-Categories")+ "?sortBy=SortByBestProduct&pageIndex=1",
                    },
                    {
                        itemId: 'menu-item-lend',
                        title: 'LEND',
                        BL: () => {
                            if (appStateManager.user == null) {
                                popupService.showLoginSignupPopup(false)
                            } else {
                                $rootScope.$emit(enums.busNavigation.userListings);
                            }
                        }
                    },
                    {
                        itemId: 'menu-item-my-rentals',
                        title: 'MY_RENTAL',
                        BL: () => {
                            if (appStateManager.user == null) {
                                popupService.showLoginSignupPopup(false)
                            } else {
                                $rootScope.$emit(enums.busNavigation.rentals);
                            }
                        }
                    }
                ]
            }

        };


        /**
         *
         * @param menuItem the clicked menu item
         *
         */
        const menuClickHandlerMethod = (menuItem) => {
            //bl has prio against link
            if (menuItem.BL) {
                menuItem.BL();
            } else if (menuItem.link) {
                window.open(menuItem.link,"_self");
            }
        };

        const shouldShowMenuItem = (menuItem) => {
            return menuItem.shouldHide == undefined || !menuItem.shouldHide();
        };


        const dummyNavNotImplementedToast = () => {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(`Navigation on menu item not implemented yet`)
                    .hideDelay(3000)
            );
        };
        return {
            commonMenus,
            menuClickHandlerMethod,
            shouldShowMenuItem,
        }
    }]);