'use strict';
angular.module('paladinPopups')
    .controller('bookingTrackerInfoMobilePopup',[
        '$scope',
        'enums',
        'ptUtils',
        'locals',
        'appStateManager',
        '$mdDialog',
        '$mdColors',
        function (
            $scope,
            enums,
            ptUtils,
            locals,
            appStateManager,
            $mdDialog,
            $mdColors
        ) {

            $scope.userId = appStateManager.getUserId();
            $scope.isLender = $scope.userId == locals.booking.Lender_Id;
            $scope.isTryAndBuy = locals.booking.IsTryAndBuy;
            $scope.currentStatusId = locals.booking.BookingStatus[locals.booking.BookingStatus.length - 1].Status_TrackId;
            $scope.popupDescription = ptUtils.parseBookingStepTutorialHTMLTemplateForTranslationId(
                ptUtils.getTranslationIdForBookingStatus($scope.currentStatusId,$scope.isLender, $scope.isTryAndBuy)
            );

            $scope.close = () => $mdDialog.hide();

            const setTrackerDescriptionStyle = () => {
                document.getElementById('bookingTrackerInfoMobilePopupId').parentNode.classList.add('md-dialog-booking-tracker-class');
                let bookingTrackerWrapperDiv = document.querySelector('#bookingTrackerInfoMobilePopupId div>div');
                bookingTrackerWrapperDiv.className = 'flex-100 layout-column layout-align-center-center';

                let titleSpan = document.querySelector('#bookingTrackerInfoMobilePopupId div>div>span');
                titleSpan.className = 'fontWeight450 font20pt md-padding';
                $mdColors.applyThemeColors(angular.element(titleSpan),{color:'default-primary-A300'});

                let ol = document.querySelector('#bookingTrackerInfoMobilePopupId div>div>ol');
                ol.className = 'md-padding';

                let listItems = document.querySelectorAll('#bookingTrackerInfoMobilePopupId div>div>ol>li');

                listItems.forEach((item) => {
                    item.className = 'font12pt';
                    $mdColors.applyThemeColors(angular.element(item),{color:'default-primary-A400'});
                })
            };

            $scope.$$postDigest(() => {
                setTrackerDescriptionStyle()
            })





    }]);
