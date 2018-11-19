'use strict';
angular.module('paladinApp')
    .directive('chatsList',[
        '$rootScope',
        'enums',
        'chatService',
        'appStateManager',
        function (
            $rootScope,
            enums,
            chatService,
            appStateManager) {

            return {
                restrict: 'E',
                templateUrl: './views/templates/chatsList.tpl.html',
                link: function ($scope, attr, elem) {
                    $scope.currentPage = 0;
                    $scope.isLoading = true;
                    $scope.canLoadMore = true;
                    let isLoadingMore = false;
                    $scope.chats = [];
                    $scope.unreadDict = {};
                    $scope.selectedChatId = null;
                    $scope.loadChatsList = (isReplace = true) => {
                        $scope.isLoading = true;
                        chatService.getChatList(appStateManager.getUserId(),$scope.currentPage)
                            .then((list) => {
                                $scope.$evalAsync(() => {
                                    $scope.isLoading = false;
                                    isLoadingMore = false;
                                    if (isReplace) {
                                        $scope.chats = list;
                                        $scope.currentPage = 0;
                                        $scope.canLoadMore = true;
                                    } else {
                                        if (list.length > 0) {
                                            $scope.chats = $scope.chats.concat(list);
                                            $scope.currentPage++;
                                        } else {
                                            $scope.canLoadMore = false;
                                        }
                                    }
                                });
                                chatService.getUnreadMessage()
                                    .then((dialogsDict) => {
                                        $scope.unreadDict = dialogsDict || {};
                                    })
                                    .catch(() => $scope.unreadDict = {});
                            })
                            .catch((err) => {
                                $scope.isLoading = false;
                            })
                    };

                    $scope.onChatListItemClicked = (chatItem) => {
                        console.log(chatItem);
                        if ($scope.selectedChatId != chatItem.Chat_QBRoomId) {
                            $scope.selectedChatId = chatItem.Chat_QBRoomId;
                            $rootScope.$emit(enums.busChatEvents.detailedChatSelected, {chatId: chatItem.Chat_QBRoomId})
                        }
                    };
                    $rootScope.$on(enums.busChatEvents.updateUnreadCount, (event,data) => {
                           $scope.unreadDict = data.detailedDict || {}
                    });

                    let deregs = [];

                    deregs.push($rootScope.$on(enums.busChatEvents.selectPendingChat,(event,data) => {
                            $scope.selectedChatId = data.chatId;
                    }));

                    $scope.loadMore = () => {
                        if ($scope.canLoadMore) {
                            if (!isLoadingMore) {
                                isLoadingMore = true;
                                console.log('$scope.canLoadMore');
                                $scope.loadChatsList(false);
                            }
                        }
                    };

                    $scope.loadChatsList(true);

                    $scope.$on('$destroy',function () {
                        while (deregs.length > 0)
                            deregs.pop()()
                    })
                }
            }

        }]);