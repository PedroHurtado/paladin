'use strict';
angular.module('paladinPopups')
    .controller('shareToSocialMediaPopup', [
        '$scope',
        '$mdDialog',
        'locals',
        'ptUtils',
        function (
            $scope,
            $mdDialog,
            locals,
            ptUtils
        ) {
            $scope.referralLink = locals.referralLink;

            $scope.isMobile = ptUtils.isMobile.any();

            $scope.cancel = () => {
                $mdDialog.cancel();
            }
        }]);
