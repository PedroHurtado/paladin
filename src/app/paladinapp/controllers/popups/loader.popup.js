'use strict';
angular.module('paladinPopups')
    .controller('loaderPopup',[
        '$rootScope',
        '$scope',
        function (
            $rootScope,
            $scope) {
                $scope.loadingText = undefined
        }
    ]);