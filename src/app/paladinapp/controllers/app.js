angular.module('paladinApp')
    .controller('appController', [
        '$scope',
        '$rootScope',
        'ZendeskWidget',
        'enums',
        'ptLog',
        'appStateManager',
        'dataService',
        '$state',
        '$location',
        '$mdToast',
        '$mdMedia',
        function(
            $scope,
            $rootScope,
            ZendeskWidget,
            enums,
            ptLog,
            appStateManager,
            dataService,
            $state,
            $location,
            $mdToast,
            $mdMedia) {
            // $rootScope.lang =  localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it';
            $rootScope.isAppOnline = true;
            //if any error this will log
            $scope.$on(enums.busEvents.$routeChangeError, function(event, current, previous, rejection){
                ptLog.log('route change error');
                ptLog.log(rejection);
            });

            if ($state.includes('app.emailVerification') && Object.keys($location.search())[0] != undefined) {
                $rootScope.$emit(enums.busEvents.triggerEmailValidation,{userId: Object.keys($location.search())[0]});
            }

            let deregs = [];
            deregs.push($rootScope.$on(enums.busEvents.locationUpdate,(event,data) => {
                // $mdToast.show(
                //     $mdToast.simple()
                //         .textContent('Location update')
                //         .hideDelay(3000)
                // );
            }));

            deregs.push($rootScope.$on(enums.busEvents.scrollMainScrollerToTop,(event,data) => {
                // let isAnimated = false;
                //
                // if (data && data.isAnimated)
                //     isAnimated = data.isAnimated;
                document.getElementById('main-ui-view').scrollTo(0,0)
            }));

            if ($mdMedia('gt-sm'))
                ZendeskWidget.show();
            else
                ZendeskWidget.hide();

            deregs.push(
                $scope.$watch(function () {return $mdMedia('gt-sm') },function (mgMd) {
                    if (mgMd) {
                        ZendeskWidget.show()
                    } else {
                        ZendeskWidget.hide()
                    }
                })
            );



            $scope.$on('$destroy',function () {
                while (deregs.length)
                    deregs.pop()();
            })
        }]);