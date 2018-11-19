angular
.module('paladinApp')
.directive('footer',[
    '$rootScope',
    'menusService',
    'appStateManager',
    'enums',
    '$mdMedia',
    '$state',
    function (
        $rootScope,
        menusService,
        appStateManager,
        enums,
        $mdMedia,
        $state) {
    return {
        restrict:'E',
        templateUrl:'./views/templates/footer.tpl.html',
        scope: {

        },
        link: function ($scope, elem, attr) {

            $scope.extraStyle = {
                height: '150px'
            };

            $scope.aboutMenu = menusService.commonMenus.aboutMenu;
            $scope.linksMenu = menusService.commonMenus.linksMenu;
            $scope.menuLists = [
                menusService.commonMenus.aboutMenu,
                menusService.commonMenus.accountLoggedIn,
                menusService.commonMenus.accountLoggedOut,
                menusService.commonMenus.linksMenu,
            ];

            $scope.supportedLanguages = window.globals.SUPPORTED_LANGS;
            $scope.selectedLanguage = $scope.supportedLanguages.find((lang) => lang.code === appStateManager.currentLang);

            $scope.menuClick = (item) => {
                menusService.menuClickHandlerMethod(item);
            };

            $scope.getMenuItemLink = (item) => {
                return item.link || '#';
            };

            $scope.filterMenuItems = (item) => {
              return menusService.shouldShowMenuItem(item)
            };

            $scope.onSelectLanguage = function(code) {
                $scope.selectedLanguage = $scope.supportedLanguages.find((lang) => lang.code === code);
                $rootScope.$emit(enums.busEvents.preferredLanguageChange,{currentLang: code});
                $rootScope.$broadcast('languageChanged', code);
            };

            const setExtraHeight = (extraHeight) => {
                if (extraHeight != $scope.extraStyle.height)
                    $scope.extraStyle.height = extraHeight;

            };
            let deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.footerExtraHeight,(event,data) => {
                $scope.extraStyle.height = data.height || $scope.extraStyle.height;
            }));

            deregs.push($scope.$watch(function () {return $mdMedia('gt-sm') },function (mgSm) {
                    let extraHeight = '0';
                    if (!mgSm) {
                        if (
                            $state.includes('app.products.newProduct') ||
                            $state.includes('app.products.selectedProduct') ||
                            $state.includes('app.bookings.bookingDetailed') ||
                            $state.includes('app.bookings.paymentDetailed') ||
                            $state.includes('app.bookings.bookingDetailed') ||
                            $state.includes('verification.user')

                        ) {
                            extraHeight = '150px'
                        }
                    }

                    setExtraHeight(extraHeight)
            }));


            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()();
            });
        }

    }
}]);