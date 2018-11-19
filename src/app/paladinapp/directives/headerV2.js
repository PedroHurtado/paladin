angular.module('paladinApp')
    .directive('headerV2',[
        '$rootScope',
        'appStateManager',
        'popupService',
        '$mdMenu',
        '$translate',
        'enums',
        '$mdSidenav',
        '$window',
        'menusService',
        'apiService',
        '$state',
        '$transitions',
        '$mdComponentRegistry',
        function (
            $rootScope,
            appStateManager,
            popupService,
            $mdMenu,
            $translate,
            enums,
            $mdSidenav,
            $window,
            menusService,
            apiService,
            $state,
            $transitions,
            $mdComponentRegistry) {
            return {
                restrict: 'E',
                scope: {
                    // isScrollOffsetZero: '=',
                },
                templateUrl: './views/templates/headerV2.tpl.html',
                link: function ($scope, elem, attr) {
                    $scope.isScrollOffsetZero = ($state.current.data || {}).isCollapsingHeader || false;
                    $scope.searchText = '';
                    $scope.searchItems = ['one','two','three','four','five'];

                    $scope.unreadBadge = 0;
                    $scope.aboutMenu = menusService.commonMenus.aboutMenu.list;

                    $scope.profileMenu = menusService.commonMenus.accountLoggedIn.list;
                    $scope.loggedOutMenu = menusService.commonMenus.accountLoggedOut.list;
                    $scope.commonMenu = menusService.commonMenus.common.list;
                    $scope.linksMenu = menusService.commonMenus.linksMenu;

                    $scope.loggedInMenu = [
                        {
                            title: $translate.instant('LENT_BORROWED'),
                            BL: (() => alert(`Navigate to ${$translate.instant('LENT_BORROWED')}`))
                        },
                        {
                            title: $translate.instant('LISTINGS'),
                            BL: (() => alert(`Navigate to ${$translate.instant('LISTINGS')}`))
                        },
                        {
                            title: $translate.instant('MESSAGES'),
                            BL: (() => alert(`Navigate to ${$translate.instant('MESSAGES')}`))
                        },

                    ];

                    $scope.loginSignUpPopupClick = (isSignUp) => {
                        popupService.showLoginSignupPopup(isSignUp);
                    };


                    $scope.querySearch = (textQuery) => {
                        const query = textQuery.toLowerCase();
                        return apiService.products.getSuggestions(query)
                            .then((response) => {
                                return [{Rank: Infinity, Keyword: textQuery},...response.Data.sort((a,b) => b.Rank - a.Rank)];
                            })
                    };

                    $scope.headerMenuClick = (item) => {
                        $scope.close();
                        menusService.menuClickHandlerMethod(item)
                    };

                    $scope.getMenuItemLink = (item) => {
                        return item.link || '#';
                    };

                    $scope.initiateSearch = (keyword) => {
                        if (keyword && keyword != '') {
                            $rootScope.$emit(enums.busNavigation.browseKeyword,{keyword});
                        }
                    };


                    $scope.searchBarOnKeyPress = ($event) => {
                        if ($event.which == 13 && $event.target.value && $event.target.value != '') {
                            $scope.initiateSearch($event.target.value);
                            $event.preventDefault();
                        }
                    };

                    $scope.toggleSideNav = () => {
                        if ($mdComponentRegistry.get(enums.inAppSideNavsIds.chatSideNav) && $mdSidenav(enums.inAppSideNavsIds.chatSideNav).isOpen())
                            $mdSidenav(enums.inAppSideNavsIds.chatSideNav).toggle();

                        $mdSidenav(enums.inAppSideNavsIds.mainMobileNav).toggle();
                    };

                    $scope.close = () => {
                        $mdSidenav(enums.inAppSideNavsIds.mainMobileNav).close()
                    };

                    if (appStateManager.user) { //TODO here user is always undefined 
                        $scope.user = appStateManager.user;  
                    }

                    $scope.updateCreditButton = () => {
                        let userId = appStateManager.getUserId();
                        if (userId) {            
                            apiService.users.getUserCredit({userId})
                            .then(
                                (result) => {
                                    $scope.currentCredit = result.Data.User_Credit;
                                    $scope.currentCreditText = ($scope.currentCredit && $scope.currentCredit>0) 
                                        ? $translate.instant('CREDIT_MENU_ITEM') + ": " + $scope.currentCredit + "€"
                                        : $translate.instant('GET_FREE_CREDIT'); 
                                },
                                (reason) => {
                                    console.log('getUserCredit failed because: ', reason);
        
                                });
                        }
                    }

                    
                    
                    $scope.creditMenuClick = () => {
                        $scope.close();
                        $rootScope.$emit(enums.busNavigation.userProfile, {userId: $scope.user.User_Id})
                    }
                    

                    let deregs = [];
                    deregs.push($rootScope.$on(enums.busEvents.updatedUser,(event,data) => {
                        $scope.user = appStateManager.user;
                        $scope.updateCreditButton();
                    }));

                    deregs.push($rootScope.$on(enums.busChatEvents.updateUnreadCount,(event,data) => {
                        $scope.unreadBadge = data.total || 0;
                        $scope.$apply();
                    }));

                    $transitions.onSuccess({to: 'app.**'}, function() {
                        $scope.isScrollOffsetZero = ($state.current.data || {}).isCollapsingHeader || false;
                        $scope.hideSearch = $state.includes('app.browse')
                    });

                    // let isLocked = false;
                    angular.element(document.getElementById('main-ui-view')).bind('scroll',function () {

                            const lastState = $scope.isScrollOffsetZero;
                            let newState;
                           if (this.scrollTop > 50)
                               newState = false;
                           else
                               newState =
                                   ($state.current.data || {}).isCollapsingHeader || false;
                        if (newState !== lastState) {
                            $scope.$evalAsync(() => {
                                $scope.isScrollOffsetZero = newState;
                            })
                            // if (!isLocked) {
                            //     isLocked = true;
                            //     $scope.$apply(function () {
                            //         isLocked = false;
                            //     });
                            // }
                        }
                    });

                    $scope.$on('$destroy',() => {
                        angular.element(document.getElementById('main-ui-view')).unbind('scroll');
                        while (deregs.length)
                            deregs.pop()();
                    })

                    $scope.updateCreditButton();
                }
            }
    }]);