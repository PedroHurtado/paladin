'use strict';
angular.module('paladinApp')
    .directive('chatDetailed',[
        '$rootScope',
        'apiService',
        'appStateManager',
        'enums',
        'chatService',
        '$mdSidenav',
        'toastService',
        'ptUtils',
        function (
            $rootScope,
            apiService,
            appStateManager,
            enums,
            chatService,
            $mdSidenav,
            toastService,
            ptUtils) {

            return {
                restrict:'E',
                templateUrl:'./views/templates/chatDetailed.tpl.html',
                scope: {
                    chatId: '=?'
                },
                link: function ($scope, elem, attr) {
                    // if ($stateParams.chatId) {
                    //     $scope.chatId = $stateParams.chatId;
                    // }
                    $scope.chat = null;
                    $scope.bookingId = null;
                    $scope.messages = [];
                    $scope.compose = {text:'',img:null};
                    $scope.isUploadingMedia = false;
                    $scope.userImages = {
                        me: undefined,
                        recipient: undefined,
                    };
                    $scope.canLoadMoreMsgs = true;
                    let deregs = [];

                    $scope.setSelectedChat = (chatId, force = false) => {
                        if (chatId) {
                            if (chatId != $scope.chatId || force) {
                                $scope.chatId = chatId;
                                if ($scope.chat && $scope.chat.Chat_QBRoomId)
                                    chatService.leaveChat($scope.chat.Chat_QBRoomId);
                                $scope.getDetailedChat()
                            }
                        } else {
                            // deselect chat
                            if ($scope.chat && $scope.chat.Chat_QBRoomId)
                                chatService.leaveChat($scope.chat.Chat_QBRoomId)
                        }
                    };
                    $scope.goToProduct = () => {
                        $rootScope.$emit(enums.busNavigation.productDetailed,{product: $scope.product})
                    };
                    $scope.goToRental = () => {
                        $rootScope.$emit(enums.busNavigation.transactionDetailed,{bookingId: $scope.bookingId})
                    };

                    $scope.getDetailedChat = () => {
                        $scope.bookingId = null;
                        $scope.isLoading = true;
                        chatService.getChatDetailed($scope.chatId)
                            .then((chat) => {
                                $scope.chat = chat;
                                if (chat.BookingList && chat.BookingList.length>0 && chat.BookingList[0].BookingId) {
                                    $scope.bookingId = chat.BookingList[0].BookingId
                                }
                                $scope.userImages.me = appStateManager.user.User_DisplayPicturePath;
                                $scope.userImages.recipient = chat.Lender_UserId == appStateManager.user.User_Id ?  chat.Borrower_ProfileImage : chat.Lender_ProfileImage;
                                chatService.joinChat($scope.chat.Chat_QBRoomId)
                                    .then(() => {
                                        $scope.getDetailedProduct();
                                    })
                                    .catch((err) => {
                                        console.log('Failed to join chat', err);
                                        $scope.chat = null;
                                        $scope.chatId = null;
                                        $scope.isLoading = false;
                                        toastService.simpleToast($translate.instant('FAILED_JOIN_CHAT'));
                                    })
                            })
                            .catch((err) => {
                                $scope.isLoading = false;
                                $scope.chatId = null;
                            })
                    };

                    $scope.getDetailedProduct = () => {
                        const { Product_Id } = $scope.chat;
                        apiService.products.getDetailedProduct(Product_Id)
                            .then((res) => {
                                $scope.product = res.Data;
                                $scope.getChatHistory();
                            })
                            .catch((err) => {
                                $scope.chat = null;
                                $scope.isLoading = false;
                            })
                    };

                    $scope.getChatHistory = () => {
                        chatService.getChatHistory($scope.chat.Chat_QBRoomId,0)
                            .then((msgs) => {
                                chatService.clearUnreadBadgesForDialog($scope.chat.Chat_QBRoomId);
                                $scope.$evalAsync(() => {
                                    $scope.canLoadMoreMsgs = true;
                                    $scope.messages = msgs;
                                    $scope.isLoading = false;
                                    // document.getElementById('composeTextMessage').focus();
                                })
                            })
                            .catch((err) => {
                                $scope.$evalAsync(() => {
                                    $scope.messages = [];
                                    $scope.isLoading = false;
                                })
                            })
                    };

                    $scope.loadMoreMessages = () => {
                        if (!$scope.isGettingMoreMsgs && $scope.canLoadMoreMsgs) {
                            $scope.isGettingMoreMsgs = true;
                            console.log('loadMoreMessages');
                            chatService.getChatHistory($scope.chat.Chat_QBRoomId,$scope.messages.length)
                                .then((msgs) => {
                                    if (msgs.length == 0) {
                                        $scope.canLoadMoreMsgs = false;
                                    }
                                    $scope.isGettingMoreMsgs = false;
                                    $scope.messages = msgs.concat($scope.messages);


                                })
                                .catch((err) => {
                                    $scope.isGettingMoreMsgs = false;
                                })
                        }
                    };

                    $scope.toggleNav = () => {
                        $mdSidenav(enums.inAppSideNavsIds.chatSideNav).toggle();
                    };

                    $scope.sendMessage = () => {
                        chatService.sendMessage({
                            dialogId: $scope.chat.Chat_QBRoomId,
                            text: $scope.compose.text,
                            productId: $scope.chat.Product_Id,
                            input: null
                        });
                        $scope.compose.text = '';
                    };

                    $scope.keyPress = ($event) => {
                        if ($event.which == 13 && !$event.shiftKey) {
                            $event.preventDefault();
                            if ($scope.compose.text != '')
                                $scope.sendMessage();
                            else
                                ptUtils.playErrorSound();
                        }
                    };

                    $scope.uploadMedia = () => {
                        $scope.$$postDigest(() => {
                            angular.element(document.getElementById('chatMediaUpload'))[0].click();
                        })
                    };
                    $scope.onUploaded = (inputElement) => {
                        $scope.$evalAsync(() => {
                            $scope.isUploadingMedia = true;
                            if (inputElement && inputElement.files && inputElement.files.length > 0) {
                                chatService.sendMessage({
                                    dialogId: $scope.chat.Chat_QBRoomId,
                                    text: null,
                                    input: inputElement

                                })
                                    .then(() => {
                                        $scope.$evalAsync(() => {
                                            $scope.isUploadingMedia = false;
                                        });
                                    })
                                    .catch((err) => {
                                        $scope.$evalAsync(() => {
                                            $scope.isUploadingMedia = false;
                                        });
                                        alert('error! upload again!')
                                    })
                            }
                        })
                    };
                    deregs.push($rootScope.$on(enums.busChatEvents.detailedChatSelected,(event,data) => {
                        $scope.toggleNav();
                        if (data && data.chatId) {
                            $scope.setSelectedChat(data.chatId);
                        } else
                            $scope.setSelectedChat(null);
                    }));


                    deregs.push($rootScope.$on(enums.busChatEvents.newMessage,(event,data) => {
                            $scope.messages.push(data);
                            chatService.clearUnreadBadgesForDialog($scope.chat.Chat_QBRoomId);
                            $scope.$apply();
                    }));

                    deregs.push($rootScope.$on(enums.busChatEvents.selectPendingChat,(event,data) => {
                        $scope.setSelectedChat(data.chatId,true);
                    }));


                    $scope.$on('$destroy',function () {
                        while (deregs.length > 0)
                            deregs.pop()()
                    })
                }
            }
        }]);