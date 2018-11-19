'use strict';
angular.module('paladinApp')
    .directive('chatCtaButton',[
        '$rootScope',
        'enums',
        'apiService',
        'appStateManager',
        'toastService',
        'chatService',
        '$translate',
        function (
            $rootScope,
            enums,
            apiService,
            appStateManager,
            toastService,
            chatService,
            $translate) {

            return {
                restrict: 'E',
                templateUrl:'./views/templates/chatCTAButton.tpl.html',
                scope: {
                    product:'=',
                    productBookingDetails: '=',
                    booking: '=?',
                },
                link: function ($scope, elem, attr) {
                    $scope.userId = appStateManager.getUserId();
                    $scope.startChat = () => {
                        $scope.isLoading = true;
                        const  {
                            Chat_QBRoomId,
                            Lender_UserId,
                            Product_Id,
                            Product_Title,
                        } = $scope.product;
                        // toastService.simpleToast(`Start Chat between lenderID: ${$scope.lenderQbId} and borrowerId: ${$scope.borrowerQbId} for productId: ${$scope.productId}`);
                        const {
                            Borrower_QBId,
                            Lender_QBId
                        } = $scope.productBookingDetails;

                        let borrowerId = $scope.userId;
                        let bookingId = undefined;
                        if ($scope.booking) {
                            bookingId = $scope.booking.Booking_Id;
                            borrowerId = $scope.booking.Borrower_Id;
                        }

                        chatService.createOrStartChat({
                            lenderId: Lender_UserId,
                            borrowerId: borrowerId,
                            lenderQBId: Lender_QBId,
                            borrowerQBId: Borrower_QBId,
                            chatRoomId: Chat_QBRoomId,
                            bookingId: bookingId,
                            productId: Product_Id,
                            productName: Product_Title,
                        })
                            .then((res) => {
                                $scope.isLoading = false;
                            //     nav to chat
                                console.log(res);
                                $rootScope.$emit(enums.busNavigation.chat,{chatId: res.Chat_QBRoomId})
                            })
                            .catch((err) => {
                                $scope.isLoading = false;
                                 console.error(err);
                                toastService.simpleToast($translate.instant('DEFAULT_ERROR'))
                            });

                    }
                }
            }

    }]);