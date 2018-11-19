'use strict';
angular.module('paladinApp')
    .controller('paymentDetailedController', [
        '$rootScope',
        '$scope',
        'apiService',
        'appStateManager',
        'enums',
        '$stateParams',
        'popupService',
        'toastService',
        '$sce',
        'stripeService',
        'creditcards',
        'menusService',
        'ptUtils',
        'moment',
        'geoLocationService',
        'ptLog',
        '$translate',
        'gtmService',
        function ($rootScope,
                  $scope,
                  apiService,
                  appStateManager,
                  enums,
                  $stateParams,
                  popupService,
                  toastService,
                  $sce,
                  stripeService,
                  creditcards,
                  menusService,
                  ptUtils,
                  moment,
                  geoLocationService,
                  ptLog,
                  $translate,
                  gtmService) {
            $scope.isLoading = true;
            $scope.isHaveSavedCC = false;
            $scope.isTryAndBuy = false;
            $scope.isNewCardLayoutOpen = false;
            $scope.isBuy = false;
            
            if ($stateParams.startDate && $stateParams.startDate && $stateParams.productId) {
                $scope.rentStartDate = $stateParams.startDate;
                $scope.rentEndDate = $stateParams.endDate;        
                $scope.productId = $stateParams.productId;        
            } else if ($stateParams.productId && ($stateParams.purchase || $stateParams.bookingId)) {
                $scope.isBuy = $stateParams.purchase;
                $scope.bookingId = $stateParams.bookingId;
                $scope.productId = $stateParams.productId;        
            } else {
                popupService.showAlert('Ops', $translate.instant('INVALID_PAGE'))
                    .finally(() => {
                        $rootScope.$emit(enums.busNavigation.homePage)
                    });
                return
            }

            $scope.prices = [];
            $scope.userSavedCard = null;
            $scope.coupon = null;
            $scope.statusError = null;

            // New Card model
            $scope.ccModel = {
                number: '',
                type: '',
                expiration: '',
                exp_month: '',
                exp_year: '',
                cvc: '',
                name: '',
                isTermsAndConditionsAccepted: false,
                isSaveCardForFutureTransactions: true,
                isDelivery: true,
                deliveryAddress: '',
                deliveryName: '',
                deliveryPhone: '',
                deliveryBell: '',
            };
            // New CC submit form
            $scope.forms = {};


            $scope.ccIcon = {
                'MasterCard': 'fa-cc-mastercard',
                'Visa': 'fa-cc-visa',
                'American Express': 'fa-cc-amex',
                'Discover': 'fa-cc-discover',
                undefined: 'fa-credit-card',
                'Unknown': 'fa-credit-card',
                'Maestro': 'fa-credit-card',
                'JCB': 'fa-cc-jcb',
                'Diners': 'fa-cc-diners',
                'Diners Club': 'fa-cc-diners-club',
            };

            $scope.fetchProduct = () => {
                $scope.isLoading = true;
                apiService.products.getDetailedProduct($scope.productId)
                    .then((response) => {
                        $scope.product = response.Data;
                        $scope.product.Product_Description = $sce.trustAsHtml($scope.product.Product_Description);

                        ptUtils.extractAndGeoLocateAddressFromObjectForFieldNames({
                            object: $scope.product,
                            addressFieldName: 'Lender_User_Address',
                            latFieldName: 'Product_Latitude',
                            lngFieldName: 'Product_Longitude'
                        })
                            .then((address) => {
                                $scope.product.Lender_User_Address = address;
                            });

                        $scope.isTryAndBuy = ptUtils.isProductTryAndBuy($scope.product);

                        $scope.fetchBookingDetails();
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        toastService.simpleToast(JSON.stringify(err));
                        ptLog.error(JSON.stringify(err))
                    })
            };

            $scope.fetchBookingDetails = () => {
                apiService.products.getProductBookingDetails({
                    productId: $scope.product.Product_Id,
                    userId: appStateManager.getUserId(),
                })
                    .then((response) => {
                        $scope.productBookingDetails = response.Data;
                        $scope.calculatePrices();
                        const {
                            UserCustomerDetail
                        } = $scope.productBookingDetails;

                        let {
                            User_CustomerId
                        } = UserCustomerDetail;

                        // User Has saved credit card, fetch and fill info
                        if (User_CustomerId) {
                            $scope.fetchStripeUserCard(User_CustomerId)
                        } else {
                            $scope.isLoading = false;
                        }
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        console.error(err)
                    })
            };

            $scope.fetchProduct();


            $scope.toggleNewCardLayout = () => {
                $scope.isNewCardLayoutOpen = !$scope.isNewCardLayoutOpen;
                $scope.userSavedCard = null;
                $scope.isHaveSavedCC = false;
            };

            $scope.gotoTermsAndConditions = () => {
                const url = menusService.commonMenus.linksMenu.list[1].link;
                const win = window.open(url, '_blank');
                win.focus();
            };

            $scope.fetchStripeUserCard = (customerId) => {
                stripeService.getCustomerSources(customerId)
                    .then((response) => {
                        if (response.status === 200 && response.data != null) {
                            const {data, object} = response.data;
                            if (object == 'list' && data && data.length > 0) {
                                const card = data.find((sourceItem) => sourceItem.object == 'card');

                                if (card) {
                                    $scope.userSavedCard = card;
                                    $scope.isHaveSavedCC = true;
                                }
                            }
                        }
                        $scope.isLoading = false;
                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        console.error(err)
                    })
            };

            $scope.calculatePrices = () => {

                $scope.prices = [];
                $scope.statusError = undefined;
                $scope.userCredit = null;

                let calculateTransactionPrice = () => {

                    const {
                        product,
                        productBookingDetails,
                        rentStartDate,
                        rentEndDate,
                        userCredit,
                        coupon,
                        ccModel
                    } = $scope;

                    ptUtils.calculatePricingListForProduct(
                        rentStartDate,
                        rentEndDate,
                        product,
                        productBookingDetails,
                        ccModel.isDelivery,
                        userCredit,
                        coupon,
                        $scope.isBuy
                    )
                        .then((prices) => {
                            $scope.$evalAsync(() => {
                                $scope.prices = prices
                            })
                        })
                        .catch((err) => {
                            $scope.$evalAsync(() => {
                                if (err && err.message)
                                    $scope.statusError = err.message
                            })
                        })
                };

                let userId = appStateManager.getUserId();

                apiService.users.getUserCredit({userId})
                    .then((result) => {
                        $scope.userCredit = result.Data;
                        calculateTransactionPrice();
                    })
                    .catch((err) => {
                        console.error('getuserCredit failed ', err)
                    });
            };

            $scope.onDatesSelected = ({startDate, endDate}) => {
                $scope.rentStartDate = startDate;
                $scope.rentEndDate = endDate;
                $scope.calculatePrices();
            };

            $scope.couponValidated = (coupon) => {
                $scope.coupon = coupon;
                $scope.calculatePrices();
            };
            $scope.deleteCoupon = () => {
                $scope.coupon = null;
                $scope.calculatePrices();
            };

            $scope.isDeliveryStatusChange = () => {
                $scope.calculatePrices();
            };

            $scope.bookingValidator = () => {
                $scope.statusError = undefined;
                const {ccModel, forms} = $scope;
                const {ccForm} = forms;


                const {isHaveSavedCC, userSavedCard, isNewCardLayoutOpen} = $scope;

                let isValid = true;
                let msg = '';

                if (!ccModel.isTermsAndConditionsAccepted) {
                    isValid = false;
                    msg = 'NEED_TO_ACCEPT_TERMS_AND_CONDITIONS';
                } else if (isHaveSavedCC && userSavedCard != undefined && !isNewCardLayoutOpen) {
                    isValid = true;
                } else if (ccForm.$invalid || !ccForm.$valid || !ccForm.$dirty) {
                    isValid = false;
                    msg = 'INVALID_CC_FORM'
                }

                if ($scope.isTryAndBuy && ccModel.isDelivery) {
                    if (!ccModel.deliveryAddress || !ccModel.productLat || !ccModel.productLng) {
                        isValid = false;
                        msg = 'INVALID_DELIVERY_ADDRESS';
                    } else if (!ccModel.deliveryName){
                        isValid = false;
                        msg = 'ADD_BILLING_NAME_MISSING';
                    }else if (!ccModel.deliveryPhone){
                        isValid = false;
                        msg = 'ADD_PHONE_NUMBER_MISSING';
                    }else if (!ccModel.deliveryBell){
                        isValid = false;
                        msg = 'ADD_RING_BELL_NAME_MISSING';
                    }
                }


                if (!isValid && msg) {
                    toastService.simpleToast($translate.instant(msg));
                    $scope.statusError = msg;
                }
                return isValid;
            };

            $scope.bookNow = async () => {
                let ccModel = angular.copy($scope.ccModel);
                const {product, isHaveSavedCC, userSavedCard, productBookingDetails, isNewCardLayoutOpen} = $scope;
                const {UserCustomerDetail} = productBookingDetails;
                let {User_CustomerId} = UserCustomerDetail;
                if ($scope.bookingValidator()) {

                    popupService.showLoader();

                    try {

                        const {
                            User_IsVerfied,
                            User_Email
                        } = appStateManager.user;
                        //Check if its a new credit card or we already have it
                        let customerData = null;
                        if (!(User_CustomerId && isHaveSavedCC && userSavedCard && !isNewCardLayoutOpen)) {
                            const cardData = await $scope.createNewCardToken();
                            customerData = await $scope.createStripeCustomer(cardData.id, User_Email);
                            console.log(customerData);
                        } else {
                            customerData = User_CustomerId;
                        } 

                            // Charge Card!
                        const chargeCardRes = await $scope.chargeCard(customerData, User_Email);

                        if (chargeCardRes && chargeCardRes.Data) {
                            //charge card successfull
                            popupService.hideLoader();

                            if (!$scope.isBuy) 
                                gtmService.trackEvent('booking', 'booking-request-submitted', chargeCardRes.Data.Booking_Id, chargeCardRes.Data.AmountCharge*0.78);
                            else    
                                gtmService.trackEvent('purchase', 'purchase-submitted');

                            console.log(chargeCardRes);
                            const bookingId = chargeCardRes.Data.Booking_Id;
                            if ($scope.isBuy) {

                                if ($scope.bookingId) {
                                    $rootScope.$emit(enums.busNavigation.transactionDetailed, {
                                        bookingId,
                                        replace: true
                                    });
                                } else {
                                    $rootScope.$emit(enums.busNavigation.productDetailed, {
                                        product
                                    
                                    });
                                }
                                popupService.showAlert('PURCHASE_SUCCESSFUL_TITLE','PURCHASE_SUCCESSFUL')
                                    .finally(() => {
                                        if ($scope.bookingId)
                                            $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true  });
                                        else
                                            $rootScope.$emit(enums.busNavigation.productDetailed,{ product: product });
                                })

                            } else if (User_IsVerfied || $scope.productBookingDetails.UserCustomerDetail.User_VerifyingStatus === 1)
                                $rootScope.$emit(enums.busNavigation.transactionDetailed, {
                                    bookingId,
                                    replace: true
                                });
                            else {
                                $rootScope.$emit(enums.busNavigation.idVerification, {bookingId, replace: true});
                            }
                        
                        } else {
                                popupService.hideLoader();
                        }
                        
                    } catch (err) {
                        let errMsg = null;
                        if (err.data && err.data.error && err.data.error.code) {
                            //stripe error code from token creation
                            errMsg = $translate.instant(err.data.error.code);
                        } else {
                            errMsg = (err.data || {}).Message || err.message || 'DEFAULT_ERROR';
                        }
                        console.error(err);
                        popupService.hideLoader();
                        $scope.statusError = errMsg;
                        toastService.simpleToast($translate.instant(errMsg));

                    }
                }
            };

            $scope.createNewCardToken = async () => {
                const {number, exp_month, exp_year, cvc, name} = $scope.ccModel;
                // create new token and customer for new card
                const tokenRes = await stripeService.createToken({number, exp_month, exp_year, cvc, name});

                if (tokenRes.data) {
                    const {data} = tokenRes;
                    const {id, card} = data;
                    if (!$scope.isBuy && card && card.funding == 'credit' || $scope.isBuy && card) {
                        return data;
                    } else {
                        // debit not supported
                        throw new Error('DEBIT_CARD_NOT_SUPPORTED');
                    }
                } else {
                    // response is empty
                    throw new Error('CANT_CHARGE_CC');
                }
            };

            $scope.createStripeCustomer = async (tokenId, email) => {
                // create stripe customer
                const stripeCustomer = await apiService.payments.createStripeCustomer({
                    cardToken: tokenId,
                    email: email,
                });

                if (stripeCustomer && stripeCustomer.Data) {
                    console.log(JSON.stringify(stripeCustomer.Data));
                    return stripeCustomer.Data;
                } else {
                    throw new Error('COULD_CREATE_STRIPE_CUSTOMER')
                }

            };


            $scope.chargeCard = async (customerId, stripeEmail) => {
                const {product, rentStartDate, rentEndDate, ccModel, coupon} = $scope;

                if (!$scope.isBuy) {
                    const rentalDays = ptUtils.getRentalPeriodInDays({
                        startRentDate: rentStartDate,
                        endRentDate: rentEndDate
                    });

                
                    return await apiService.bookings.bookProduct({
                    stripeEmail: stripeEmail,
                    borrowerId: Number(appStateManager.getUserId()),
                    lenderId: product.Lender_UserId,
                    productId: product.Product_Id,
                    startDate: moment(rentStartDate).format('MM/DD/YYYY'),
                    endDate: moment(rentEndDate).format('MM/DD/YYYY'),
                    stripeCustomerId: customerId,
                    noOfDays: rentalDays,
                    isSaveCard: ccModel.isSaveCardForFutureTransactions,
                    isPickUp: !ccModel.isDelivery,
                    deliveryAddress: ccModel.isDelivery ? ccModel.deliveryAddress : undefined,
                    deliveryLat: ccModel.isDelivery ? ccModel.productLat : undefined,
                    deliveryLng: ccModel.isDelivery ? ccModel.productLng : undefined,
                    deliveryName: ccModel.isDelivery ? ccModel.deliveryName : undefined,
                    deliveryPhone: ccModel.isDelivery ? ccModel.deliveryPhone : undefined,
                    deliveryBell: ccModel.isDelivery ? ccModel.deliveryBell : undefined,
                    coupon: coupon != undefined ? coupon.Coupon : undefined,
                    idVerified: appStateManager.user.User_IsVerfied,
                    isTryAndBuy: product.Product_TryAndBuy,
                    });
                }

                else return await apiService.purchase.buyProduct({
                    stripeEmail: stripeEmail,
                    bookingId: $scope.bookingId || undefined,
                    borrowerId: Number(appStateManager.getUserId()),
                    purchaseAmount: product.Product_PurchasePrice + product.Product_Process_Fee,
                    lenderId: product.Lender_UserId,
                    productId: product.Product_Id,
                    stripeCustomerId: customerId,
                    isSaveCard: ccModel.isSaveCardForFutureTransactions,
                    isPickUp: !ccModel.isDelivery,
                    deliveryAddress: ccModel.isDelivery ? ccModel.deliveryAddress : undefined,
                    deliveryLat: ccModel.isDelivery ? ccModel.productLat : undefined,
                    deliveryLng: ccModel.isDelivery ? ccModel.productLng : undefined,
                    deliveryName: ccModel.isDelivery ? ccModel.deliveryName : undefined,
                    deliveryPhone: ccModel.isDelivery ? ccModel.deliveryPhone : undefined,
                    deliveryBell: ccModel.isDelivery ? ccModel.deliveryBell : undefined,
                });

            };


            let deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged, (event, data) => {
                if (data.elementId == 'productDeliveryAddress') {
                    let {place} = data, {geometry} = place;
                    $scope.ccModel.productLat = geometry.location.lat();
                    $scope.ccModel.productLng = geometry.location.lng();
                    $scope.ccModel.productLocationId = place.id;
                }
            }));

            const unsavedChanges = (e) => {
                event.returnValue = 'are you sure?'
            };


            window.addEventListener('beforeunload', unsavedChanges);

            $scope.$on('$destroy', () => {
                while (deregs.length)
                    deregs.pop()();
                window.removeEventListener('beforeunload', unsavedChanges);
            })

        }]);

