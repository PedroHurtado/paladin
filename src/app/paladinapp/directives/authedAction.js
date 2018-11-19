'use strict';
angular.module('paladinApp')
    .directive('authedAction',[
        '$rootScope',
        'enums',
        'appStateManager',
        'popupService',
        function ($rootScope,
                  enums,
                  appStateManager,
                  popupService) {

                return {
                    restrict: 'A',
                    link: function ($scope, elem, attr) {


                        const deAuthedLoginDiv = document.createElement('div');
                        deAuthedLoginDiv.style.position = 'absolute';
                        deAuthedLoginDiv.style.top = '0';
                        deAuthedLoginDiv.style.left = '0';
                        deAuthedLoginDiv.style.height = '100%';
                        deAuthedLoginDiv.style.width = '100%';
                        // deAuthedLoginDiv.style.backgroundColor = 'red';
                        // deAuthedLoginDiv.style.opacity = '0.5';
                        deAuthedLoginDiv.style.cursor = 'pointer';

                        // deAuthedLoginDiv.style.zIndex = '200';
                        deAuthedLoginDiv.onclick = () => {
                            // deAuthedLoginDiv.style.zIndex = 'auto';
                            popupService.showLoginSignupPopup(false)
                                .finally(() => {
                                });
                            isReloadPage = true;
                        };

                        elem[0].classList.add('forceRelativePosition');
                        let isAdded = false;
                        let isReloadPage = false;

                        const validateAuth = () => {
                            if (appStateManager.getUserId()) {
                                if (isAdded) {
                                    isAdded = false;
                                    elem[0].removeChild(deAuthedLoginDiv);
                                    if (isReloadPage) {
                                        location.reload();
                                    }
                                }
                            } else {
                                if (!isAdded) {
                                    isAdded = true;
                                    elem[0].appendChild(deAuthedLoginDiv)
                                }
                            }
                        };


                        validateAuth();


                        let deregs = [];

                        deregs.push($rootScope.$on(enums.busEvents.updatedUser, (event, data) => {
                            validateAuth()
                        }));

                        $scope.$on('$destroy', () => {
                            while (deregs.length)
                                deregs.pop()();
                        });

                    }
                }
        }]);