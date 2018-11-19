angular.module('paladinApp')
    .service('navigationService',[
        '$rootScope',
        '$state',
        'enums',
        'ptLog',
        'ptUtils',
        'toastService',
        function (
            $rootScope,
            $state,
            enums,
            ptLog,
            ptUtils,
            toastService) {
            const TAG = 'navigationService ||';

            $rootScope.$on(enums.busNavigation.homePage,() => $state.go('app.home'));

            $rootScope.$on(enums.busNavigation.productDetailed,(event,{product}) => {
                if (product) {
                    $state.go('app.products.selectedProduct',{productNameAndId: ptUtils.getProductNameAndId(product)});
                } else {
                    ptLog.error(TAG, enums.busNavigation.productDetailed, 'NO PRODUCT');
                }
            });

            $rootScope.$on(enums.busNavigation.browseCategory,(event,{categoryId,subCategoryName,categoryName}) => {
                let obj = {};
                if (categoryId)
                    obj.category = categoryId;
                else if (categoryName)
                    obj.category = categoryName.replace(/\ /g,'-');

                if (subCategoryName)
                    obj.subCategory = subCategoryName.replace(/\ /g,'-');
                obj.sortBy = enums.productsSortOptions.bestProduct;
                obj.isResetSearch = true;
                $state.go('app.browse',obj);
            });

            $rootScope.$on(enums.busNavigation.browseKeyword,(event,data) => {
                $state.go('app.browse',{ search: data.keyword });
            });

            $rootScope.$on(enums.busNavigation.switchBrowseMode, (event,{isTryAndBuy}) => {
                if (isTryAndBuy) {
                    $state.go('app.browse');
                } else {
                    $state.go('app.browsePrivate');
                }
            });

            $rootScope.$on(enums.busNavigation.browseSort,(event,data) => {
                $state.go('app.browse',{sortBy:data.sortBy,search:'',isResetSearch: true });
            });

            $rootScope.$on(enums.busNavigation.userProfile,(event,{ userId, replace }) => {
               $state.go('app.profiles.publicProfile', { userId }, replace ? {location: 'replace'} : undefined)
            });

            $rootScope.$on(enums.busNavigation.userListings,() => $state.go('app.myListings'));

            $rootScope.$on(enums.busNavigation.newProduct,() => $state.go('app.products.newProduct') );

            $rootScope.$on(enums.busNavigation.rentals,() => $state.go('app.bookings.userBookings') );

            $rootScope.$on(enums.busNavigation.transactionDetailed,(event,{ bookingId,replace }) => {
                $state.go('app.bookings.bookingDetailed',{bookingId: bookingId},replace ? { location: 'replace'} : undefined)
            });

            $rootScope.$on(enums.busNavigation.idVerification,(event,{bookingId ,replace}) => {
                // optional booking object
                $state.go('verification.user', { bookingId: bookingId ? bookingId : undefined }, replace ? {location: 'replace'} : undefined);
            });

            $rootScope.$on(enums.busNavigation.userReview, (event, { bookingId, isLender}) => {

                $state.go('app.products.productReview', {bookingId: booking.Booking_Id});
            });

            $rootScope.$on(enums.busNavigation.paymentDetailed,(event,{startDate, endDate, productId, purchase, bookingId}) => {
                        $state.go('app.bookings.paymentDetailed',{
                            startDate,
                            endDate,
                            productId,
                            purchase,
                            bookingId,
                        });
                        // ptLog.error(TAG, `Navigation Error: ${enums.busNavigation.paymentDetailed}, please provide startDate, endDate and productId`)
                    // }
            });

            $rootScope.$on(enums.busNavigation.chat, (event, data = undefined) => {
                if (data && data.chatId)
                    $state.go('app.chat',{chatId:data.chatId});
                else
                    $state.go('app.chat')
            })

        }]);