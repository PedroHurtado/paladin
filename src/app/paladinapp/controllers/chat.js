'use strict';
angular.module('paladinApp')
    .controller('chatController',[
        '$rootScope',
        '$scope',
        '$mdMedia',
        '$mdSidenav',
        'appStateManager',
        'enums',
        '$stateParams',
        'chatService',
        '$mdMedia',
        function (
            $rootScope,
            $scope,
            $mdMedia,
            $mdSidenav,
            appStateManager,
            enums,
            $stateParams,
            chatService) {

            $scope.isLoading = false;
            $scope.isChatCollapsed = false;
            $scope.preSelectedchat = { value: undefined };
            $scope.isGtMd = $mdMedia('gt-md');
            $scope.isGtSM = $mdMedia('gt-sm');
            if ($stateParams.chatId)
                chatService.activateChatWhenReady($stateParams.chatId);


            $scope.toggleNav = () => {
                $mdSidenav('chat-list-side-nav').toggle();
            };


            let deregs = [];

            deregs.push(
                $scope.$watch(function () {return $mdMedia('gt-md') },function (mgMd) {
                    $scope.isGtMd = mgMd;
                    $scope.isChatCollapsed = mgMd;
                })
            );
            deregs.push(
                $scope.$watch(function () {return $mdMedia('gt-sm') },function (mgSm) {
                    $scope.isGtSM = mgSm;
                })
            );

            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()();
            })

    }]);