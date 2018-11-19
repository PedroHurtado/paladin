angular.module('paladinApp')
    .service('apiService',[
        '$rootScope',
        '$q',
        '$http',
        '$base64',
        'enums',
        'ptLog',
        'appStateManager',
        function (
            $rootScope,
            $q,
            $http,
            $base64,
            enums,
            ptLog,
            appStateManager) {

            const self = this;

            self.ENV = window.globals.API_URL.slice(0,-1);
            self.timeoutCounter = 0;
            self.maxTimeouts = 5;
            self.raiseTimeout = function() {
                if (self.timeoutCounter <= self.maxTimeouts)
                    self.timeoutCounter += 1;
                if (self.timeoutCounter > self.maxTimeouts && $rootScope.isAppOnline)
                    $rootScope.$emit(enums.busEvents.onAppOnlineState, false)
            };
            self.loweTimeout = function() {
                if (self.timeoutCounter > 0)
                    self.timeoutCounter -= 1;
                if (self.timeoutCounter < self.maxTimeouts && !$rootScope.isAppOnline)
                    $rootScope.$emit(enums.busEvents.onAppOnlineState, true)
            };

            self.getHttpConfig = function(params, headers) {
                let config = {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'X-Requested' : null,
                        'Content-Type' : 'application/json; charset=utf-8',
                        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
                    }
                };
                if (localStorage.getItem(enums.localStorageKeys.jwtToken)) {
                    config.headers['Authorization'] = localStorage.getItem(enums.localStorageKeys.jwtToken);
                }

                if (headers) {
                    Object.keys(headers).forEach((headerKey) => {
                        config.headers[headerKey] = headers[headerKey];
                    });
                }

                if (params) {
                    config.params = params;
                }

                return config;
            };

            self.getDefaultParams = () => {
                return {
                    LanguageCode: appStateManager.getCurrentLang(),
                }
            };

            const maxRetries = 5;
            self.getRequest = function getData (path, params, headers, curRetryCounter) {
                let deferred = $q.defer();
                $http.get(self.ENV + path, self.getHttpConfig(params, headers))
                    .then(function(response) {
                        self.loweTimeout();
                        if ((!response || !response.data) || response.data.Status == 'error') {
                            deferred.reject(response);
                        } else {
                            deferred.resolve(response.data);
                        }
                        // if (response.status === 204) {
                        //     deferred.reject(response);
                        // } else {
                        //     deferred.resolve(response.data);
                        // }
                    }, function(response) {
                        if (!response) {
                            console.warn('R_U');
                            deferred.reject();
                            return;
                        }

                        if (response.status === 401 && localStorage.getItem(enums.localStorageKeys.refreshToken)) {
                            ptLog.log('Refreshing Token');
                            self.apiMethods.users.refreshToken(localStorage.getItem(enums.localStorageKeys.refreshToken))
                                .then((response) => {
                                    ptLog.log('Refreshing Token success');
                                    $rootScope.$emit(enums.busEvents.tokenRefresh,response.data);
                                    setTimeout(() => {
                                        self.getRequest(path, params,headers,curRetryCounter)
                                            .then(deferred.resolve)
                                            .catch(deferred.reject);
                                    },500)
                                })
                                .catch(deferred.reject)
                        } else if (response.status === 423) { /** RETRY HANDLER */
                            if (!curRetryCounter) curRetryCounter = 0;

                            if (curRetryCounter < maxRetries) {
                                curRetryCounter++;
                                let waitingBackoffTime_ms = curRetryCounter * 500; //ms
                                setTimeout(() => {
                                    self.getRequest(path, params, headers, curRetryCounter)
                                        .then(response => deferred.resolve(response.data))
                                        .catch(deferred.reject);
                                }, waitingBackoffTime_ms);
                            } else {
                                deferred.reject(response);
                            }
                        } else {
                            if (response.status === 0 || response.status === -1) {
                                /** TIMEOUT */
                                self.raiseTimeout();
                            }
                            deferred.reject(response);
                        }
                    });
                return deferred.promise;
            };

            self.postRequest = function(path, data, headers, curRetryCounter) {
                let deferred = $q.defer();

                $http.post(self.ENV + path, data, self.getHttpConfig(null, headers))
                    .then(function(response) {
                        self.loweTimeout();
                        if ((!response || !response.data) || response.data.Status == 'error') {
                            deferred.reject(response);
                        } else {
                            deferred.resolve(response.data);
                        }
                        // if (response.status === 204) {
                        //     deferred.reject(response);
                        // } else {
                        //     deferred.resolve(response.data);
                        // }
                    }, function(response) {

                        if (!response) {
                            console.warn('R_U');
                            deferred.reject();
                            return;
                        }
                        if (response.status === 401 && localStorage.getItem(enums.localStorageKeys.refreshToken)) {
                                ptLog.log('Refreshing Token');
                            self.apiMethods.users.refreshToken(localStorage.getItem(enums.localStorageKeys.refreshToken))
                                .then((response) => {
                                    ptLog.log('Refreshing Token success');
                                    $rootScope.$emit(enums.busEvents.tokenRefresh,response.data);
                                    setTimeout(() => {
                                        self.postRequest(path, data,headers,curRetryCounter)
                                            .then(deferred.resolve)
                                            .catch(deferred.reject);
                                    },500)
                                })
                                .catch(deferred.reject)
                        } else if (response.status === 423) { /** RETRY HANDLER */
                            if (!curRetryCounter) curRetryCounter = 0;

                            if (curRetryCounter < maxRetries) {
                                curRetryCounter++;
                                let waitingBackoffTime_ms = curRetryCounter * 500; //ms
                                setTimeout(() => {
                                    self.postRequest(path, data, headers, curRetryCounter)
                                        .then(response => deferred.resolve(response.data))
                                        .catch(deferred.reject);
                                }, waitingBackoffTime_ms);
                            } else {
                                deferred.reject(response);
                            }
                        } else {
                            if (response.status === 0 || response.status === -1) {
                                /** TIMEOUT */
                                self.raiseTimeout();
                            }
                            deferred.reject(response);
                        }
                    });

                return deferred.promise;
            };

            self.putRequest = function(path, data, headers, curRetryCounter) {
                let deferred = $q.defer();

                $http.put(self.ENV + path, data, self.getHttpConfig(null, headers))
                    .then(function(response) {
                        self.loweTimeout();
                        if ((!response || !response.data) || response.data.Status == 'error') {
                            deferred.reject(response);
                        } else {
                            deferred.resolve(response.data);
                        }
                        // if (response.status === 204) {
                        //     deferred.reject(response);
                        // } else {
                        //     deferred.resolve(response.data);
                        // }
                    }, function(response) {

                        if (!response) {
                            console.warn('R_U');
                            deferred.reject();
                            return;
                        }
                        if (response.status === 401 && localStorage.getItem(enums.localStorageKeys.refreshToken)) {
                            ptLog.log('Refreshing Token');
                            self.apiMethods.users.refreshToken(localStorage.getItem(enums.localStorageKeys.refreshToken))
                                .then((response) => {
                                    ptLog.log('Refreshing Token success');
                                    $rootScope.$emit(enums.busEvents.tokenRefresh,response.data);
                                    setTimeout(() => {
                                        self.postRequest(path, data,headers,curRetryCounter)
                                            .then(deferred.resolve)
                                            .catch(deferred.reject);
                                    },500)
                                })
                                .catch(deferred.reject)
                        } else if (response.status === 423) { /** RETRY HANDLER */
                            if (!curRetryCounter) curRetryCounter = 0;

                            if (curRetryCounter < maxRetries) {
                                curRetryCounter++;
                                let waitingBackoffTime_ms = curRetryCounter * 500; //ms
                                setTimeout(() => {
                                    self.putRequest(path, data, headers, curRetryCounter)
                                        .then(response => deferred.resolve(response.data))
                                        .catch(deferred.reject);
                                }, waitingBackoffTime_ms);
                            } else {
                                deferred.reject(response);
                            }
                        } else {
                            if (response.status === 0 || response.status === -1) {
                                /** TIMEOUT */
                                self.raiseTimeout();
                            }
                            deferred.reject(response);
                        }
                    });

                return deferred.promise;
            };


            self.apiMethods = {
                    categories: {
                        getCategories: function () {
                            return self.getRequest(`/GetCategories?LanguageCode=${appStateManager.getCurrentLang()}`)
                        },

                    },
                    pages: {
                        getHomePageData: function (categories) {
                            let params = {};
                            params.LanguageCode = appStateManager.getCurrentLang();
                            params.Categories = categories;
                            return self.getRequest("/GetHomePageData", params)
                        },
                        getProductDetailData: function(id) {
                            let params = {};
                            params.LanguageCode = appStateManager.getCurrentLang();
                            params.Product_Id = id;
                            const User_Id = appStateManager.getUserId();
                            if (User_Id)
                                params.User_Id = User_Id;
                            return self.getRequest("/GetProductDetailData", params)
                        }
                    },
                    products: {
                        getSearchedProducts: function ({
                                                           keyword /* string (optional) */,
                                                           isShop /* string (optional) */,

                                                           categoryId /* Number (optional) */,
                                                           subCategoryId /* Number (optional) */,

                                                           sortBy /* enums.productsSortOptions */,

                                                           minPriceRange /* Number (optional) */,
                                                           maxPriceRange /* Number (optional) */,

                                                           city /* string (optional) */,
                                                           lat /* Number (optional) */,
                                                           lng /* Number (optional) */,
                                                           range /* Number (optional) */,

                                                           page /* Number (optional) */,
                                                           productPerPage /* Number (optional) */,

                                                           isWeb /* Boolean (optional) */,
                                                           productIDs /*String (optional)*/,
                                                           isTryAndBuy

                                                       }) {

                            const LanguageCode = appStateManager.getCurrentLang();
                            let params = {
                                LanguageCode,
                            };

                            if (keyword)
                                params.KeywordProduct = encodeURIComponent(keyword);
                            const userId = appStateManager.getUserId();
                            if (appStateManager.user != null && userId != null)
                                params.User_Id = userId;

                            if (categoryId)
                                params.Category_Id = categoryId;

                            if (subCategoryId)
                                params.SubCategory_Id = subCategoryId;

                            if (isShop)
                                params.IsShop = isShop;

                            if (sortBy)
                                params[sortBy] = true;


                            if (minPriceRange)
                                params.MinPriceRange = minPriceRange;

                            if (maxPriceRange)
                                params.MaxPriceRange = maxPriceRange;


                            if (lat && lng) {
                                params.Latitude = lat;
                                params.Longitude = lng;
                            }

                            if (city)
                                params.Product_City = city;

                            if (range)
                                params.Range = range;

                            if (isWeb)
                                params.IsWeb = isWeb;

                            if (page)
                                params.PageIndex = page;

                            if (productPerPage)
                                params.productPerPage = productPerPage;

                            if (productIDs)
                                params.productIDs = productIDs;
                            if (isTryAndBuy) 
                                params.isTryAndBuy = isTryAndBuy;

                            return self.getRequest('/GetSearchedProduct',params)
                        },

                        getPopularTryAndBuy: function () {

                            return self.apiMethods.products.getSearchedProducts({
                                productPerPage: 20,
                                sortBy: enums.productsSortOptions.bestProduct,
                                isTryAndBuy: true,
                            })
                        },

                        getSuggestions: function (keyword) {
                            let params = self.getDefaultParams();
                            params.Keyword = encodeURIComponent(keyword);

                            return self.getRequest('/Suggestion',params);
                        },

                        getDetailedProduct: function (productId) {
                            const obj = self.getDefaultParams();
                            let params = { Product_Id: productId, ...obj};
                            const User_Id = appStateManager.getUserId();
                            if (User_Id)
                                params.User_Id = User_Id;
                            return self.getRequest('/GetProductDetail',params)
                        },
                        getUserProducts: function ({
                                                       userId,
                                                       productsFilter /* enums.userProductsFilter*/,
                                                       pageIndex = 0,
                                                   }) {
                            let obj = self.getDefaultParams();
                            let params = {
                                ...obj,
                                User_Id: userId,
                                PageIndex: pageIndex,
                            };
                            params[productsFilter] = true;

                            return self.getRequest('/GetMyProducts',params);
                        },
                        getProductBookingDetails: function ({productId, userId}) {
                            let obj = self.getDefaultParams();
                            let params = {
                                ...obj,
                                User_Id: userId,
                                Product_Id: productId,
                            };
                            return self.getRequest('/ProductBookingDetail',params);
                        },
                        addProduct: function ({
                                                  Product_ItemCategory_Id,
                                                  Product_Title,
                                                  Product_Description,
                                                  Product_Price_Perday,
                                                  Product_IsShop,
                                                  Product_City,
                                                  Product_ShopURL,
                                                  Price1Day,
                                                  Price15Day,
                                                  Product_TryAndBuy,
                                                  MinRentalPeriod,
                                                  MaxRentalPeriod,
                                                  Product_Longitude,
                                                  Product_Latitude,
                                                  ProductImage_Image1,
                                                  Product_LenduserId
                                              }) {
                            const data = {
                                ...self.getDefaultParams(),
                                Product_ItemCategory_Id,
                                Product_Title,
                                Product_Description,
                                Product_Price_Perday,
                                Product_IsShop,
                                Product_City,
                                Product_ShopURL,
                                Price1Day,
                                Price15Day,
                                Product_TryAndBuy,
                                MinRentalPeriod,
                                MaxRentalPeriod,
                                Product_Longitude,
                                Product_Latitude,
                                ProductImage_Image1,
                                Product_LenduserId,
                            };

                            return self.postRequest('/AddProduct',data)

                        }
                    },
                    reviews: {
                        submitTransactionReview: (params) => {
                            //console.log('submit review params ', params)
                            return self.postRequest('/AddBookingReview', params)
                        }
                    },
                    users: {
                        signUp: function ({ email, username, password, location, currentLang, referralCode}) {
                            const obj = {
                                User_UserName : username,
                                User_Email : email,
                                User_Address : location,
                                User_Password : password,
                                User_UDIDType : 3,
                                LanguageCode: currentLang,
                                ReferralCode: referralCode
                            };
                            return self.postRequest('/SignUp',obj);
                        },

                        signupFacebook: function ({facebookName,email,address,currentLang,facebookUserId, referralCode}) {
                            const dataObj = {
                                User_UserName :facebookName.replace(" ","-") ,
                                User_Email : email,
                                User_Address : address,
                                User_Password : "",
                                User_UDIDType : 3,
                                LanguageCode: currentLang,
                                User_DisplayPicturePath:'https://graph.facebook.com/' + facebookUserId + '/picture?type=large',
                                User_DisplayPicture: 'https://graph.facebook.com/' + facebookUserId + '/picture?type=large',
                                User_FacebookId: facebookUserId ,
                                User_FullName: facebookName,
                                User_QBId:'',
                                ReferralCode: referralCode
                            };
                            return self.postRequest('/Signup',dataObj);
                        },

                        signUpReferred: function(referralCode){
                            const dataObj = {
                                ReferralCode: referralCode,
                                LanguageCode: appStateManager.getCurrentLang()
                            };

                            return self.getRequest('/VerifyReferralCode', dataObj);
                        },

                        login: function ({ username = '',email = '', password, currentLang}) {
                            const obj = {
                                User_UserName : username,
                                User_Email : email,
                                User_Mobile: "",
                                User_UDIDType : 3,
                                User_Password : password,
                                User_FacebookId: "",
                                LanguageCode: currentLang
                            };
                            return self.postRequest('/Login',obj);
                        },

                        forgotPassword: function({ email , currentLang }) {
                            const dataObj = {
                                ...self.getDefaultParams(),
                                User_Email : email,
                            };
                            return self.postRequest('/ForgetPassword',dataObj,{ Authorization: $base64.encode('Paladin:Paladin123') })
                        },

                        changePassword: function ({userId,newPassword,oldPassword}) {
                            const params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                User_NewPassword: newPassword,
                                User_OldPassword: oldPassword
                            };
                            return self.postRequest('/ChangePassword',params);
                        },

                        emailVerification: function ({userId /* USER ID CODIFIED WITH BACKEND KEY*/}) {
                            return self.getRequest(`/EmailVerfication/?User_Id=${userId}`,undefined,{ Authorization: $base64.encode('Paladin:Paladin123') });
                        },

                        getUserProfile: function ({userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId
                            };
                            return self.getRequest(`/GetUserProfile`,params);
                        },

                        getUserCredit: function ({userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId
                            };
                            return self.getRequest(`/GetUserCredit`,params);
                        },


                        refreshToken: function (refreshToken) {
                            return $http({
                                method: 'POST',
                                url: window.globals.TOKEN_URL,
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                                transformRequest: function(obj) {
                                    let str = [];
                                    for(let p in obj)
                                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                                    return str.join("&");
                                },
                                data: {grant_type: 'refresh_token', refresh_token: refreshToken}
                            })
                        },

                        editProfile: function (profile) {
                            let body = {
                                ...self.getDefaultParams(),
                                ...profile
                            };
                            return self.putRequest('/EditProfile',body);
                        },

                        updateNotificaton: ({userId, emailNotif, chatNotif }) => {
                            let dataObj = {
                                ...self.getDefaultParams(),
                                Notification_Chat: chatNotif,
                                Notification_Push: chatNotif,
                                Notification_Email: emailNotif,
                                Notification_UserId: userId,
                            };
                            return self.postRequest('/UpdateNotification',dataObj)
                        },

                        deleteAccount: function (userId) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                            };
                            return self.getRequest('/DeleteUser',params)
                        }
                    },
                    bookings: {
                        getUserBookings: function (userId) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId
                            };
                            return self.getRequest('/GetUserBookings',params);
                        },
                        getBookingDetailed: function ({bookingId, userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                BookingId: bookingId
                            };
                            return self.getRequest('/GetBookingDetail',params);
                        },
                        acceptBookingRequest: function ({bookingId, userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                Lender_Id: userId,
                                BookingId: bookingId,
                            };
                            return self.getRequest('/AcceptBookingRequest',params);
                        },
                        rejectBookingRequest: function ({bookingId, userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                BookingId: bookingId
                            };
                            return self.getRequest('/RejectBookingRequest',params);
                        },
                        cancelBookingRequest: function ({bookingId, userId, reason}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                BookingId: bookingId,
                                Reason: reason,
                            };
                            return self.getRequest('/CancelBookingRequest',params)
                        },
                        startRental: function ({bookingId, userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                BookingId: bookingId
                            };
                            return self.getRequest('/StartRentalBookingRequest',params)
                        },
                        endRental: function ({bookingId, userId}) {
                            let params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                BookingId: bookingId
                            };
                            return self.getRequest('/EndRentalBookingRequest',params)
                        },
                        bookProduct: function ({
                                                   stripeEmail,
                                                   borrowerId,
                                                   lenderId,
                                                   productId,
                                                   startDate,
                                                   endDate,
                                                   noOfDays,
                                                   coupon,
                                                   stripeCustomerId,
                                                   isSaveCard,
                                                   idVerified,
                                                   isPickUp,
                                                   deliveryLat,
                                                   deliveryLng,
                                                   deliveryAddress,
                                                   deliveryName,
                                                   deliveryPhone,
                                                   deliveryBell,
                                                   isTryAndBuy
                                               }) {
                            const dataObj = {
                                ...self.getDefaultParams(),
                                Stripe_Email: stripeEmail,
                                Borrower_UserId: borrowerId,
                                Lender_UserId: lenderId,

                                Product_Id: productId,
                                StartDate: startDate,
                                EndDate: endDate,
                                NoOfDays: noOfDays,

                                CouponNumber: coupon,
                                CustomerAccountId: stripeCustomerId,
                                SaveCard: isSaveCard,

                                IdVerfied: idVerified,
                                Booking_PickupProduct: isPickUp,

                                Delivery_Latitude: deliveryLat,
                                Delivery_Longitude: deliveryLng,
                                Delivery_Address: deliveryAddress,
                                Complete_Borrower_Name: deliveryName,
                                Phone_Number: deliveryPhone,
                                House_Name: deliveryBell
                            };

                            return self.postRequest(isTryAndBuy ? '/BookTryAndBuyProduct' : '/BookProduct',dataObj);

                        }
                    },
                    payments: {
                        createUserStripeAccount: function ({userId, bookingId, email, country}) {
                            const dataObj = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                Booking_Id: bookingId,
                                User_Email: email,
                                User_Country: country,

                            };
                            return self.postRequest(`/CreateBookingStripeAccount`,dataObj)
                        },
                        verifyCoupon: function ({coupon, userId}) {
                            const params = {
                                ...self.getDefaultParams(),
                                Coupon: coupon,
                                User_Id: userId,
                            };
                            return self.getRequest(`/VerifyCoupon`, params);
                        },
                        createStripeCustomer: function ({email, cardToken}) {
                            // Somebody, very smart, switched the values of token and email in the server -_- so I flipped them here as well
                            // Email field is used as token and vice versa
                            const params = {
                                ...self.getDefaultParams(),
                                Email: cardToken,
                                TokenId: email
                            };
                            return self.getRequest('/CreateStripeCustomer',params);
                        }
                    },
                    purchase: {
                        buyProduct: function ({
                            stripeEmail,
                            bookingId,
                            purchaseAmount,
                            borrowerId,
                            lenderId,
                            productId,
                            stripeCustomerId,
                            isSaveCard,
                            isPickUp,
                            deliveryLat,
                            deliveryLng,
                            deliveryAddress,
                            deliveryName,
                            deliveryPhone,
                            deliveryBell
                        }) {
                        const dataObj = {
                            ...self.getDefaultParams(),
                            Stripe_Email: stripeEmail,
                            Borrower_UserId: borrowerId,
                            Lender_UserId: lenderId,
                            Stripe_Amount: purchaseAmount, 

                            Product_Id: productId,
                            Booking_Id: bookingId,

                            CustomerAccountId: stripeCustomerId,
                            SaveCard: isSaveCard,

                            Booking_PickupProduct: isPickUp,

                            Delivery_Latitude: deliveryLat,
                            Delivery_Longitude: deliveryLng,
                            Delivery_Address: deliveryAddress,
                            Complete_Borrower_Name: deliveryName,
                            Phone_Number: deliveryPhone,
                            House_Name: deliveryBell
                        };

                        return self.postRequest('/BuyProduct',dataObj);

                        }
                    },
                    verification: {
                        uploadPassport: ({passportImage,selfie,userId}) => {
                            const dataObj = {
                                ...self.getDefaultParams(),
                                PassPort: passportImage,
                                User_Selfie: selfie,
                                User_Id: userId,
                            };
                            return self.postRequest('/IDVerficationDocument',dataObj);
                        },
                        sendToManualVerification: (data) => {
                            const dataObj = {
                                ...self.getDefaultParams(),
                                PassPort: data.passportImage,
                                User_Id: data.userId,
                                NICFront: data.NICDLFront,
                                NICBack: data.NICDLBack,
                                User_Selfie: data.selfie,
                                BookingId: data.bookingId
                            };
                            return self.postRequest('/IDManualVerficationDocument',dataObj);
                        },
                        uploadNICDL: ({NICDLFront,NICDLBack,selfie,userId}) => {
                            const dataObj = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                NICFront: NICDLFront,
                                NICBack: NICDLBack,
                                User_Selfie: selfie,
                            };
                            return self.postRequest('/IDVerficationDocument',dataObj);
                        }
                    },
                    chats: {
                        getChatsList: ({userId, pageIndex = 0}) => {
                            const params = {
                                ...self.getDefaultParams(),
                                User_Id: userId,
                                PageIndex: pageIndex,
                            };
                            return self.getRequest('/GetChatList',params)
                        },
                        getChatDetailed: ({chatId}) => {
                            const params = {
                                ...self.getDefaultParams(),
                                Chat_Id: chatId,
                                ChatDone: 0,
                            };
                            return self.getRequest('/GetChatDetail',params)
                        },
                        getChatByQBId: ({chatQbId}) => {
                            const params = {
                                ...self.getDefaultParams(),
                                Chat_QBRoomId: chatQbId,
                                ChatDone: 0,
                            };
                            return self.getRequest('/GetChatInfoByQBId',params);
                        },
                        startBookingChat: ({
                                               lenderId,
                                               borrowerId,
                                               productId,
                                               chatRoomId = null,
                                               bookingId = null }) => {

                            let dataObj = {
                                ...self.getDefaultParams(),
                                User_UDIDType: 3,
                                Lender_Id: lenderId,
                                Borrower_Id: borrowerId,
                                Product_Id: productId,
                                BookingId: bookingId,
                                Chat_QBRoomId: chatRoomId,
                            };
                            return self.postRequest('/StartBookingChat',dataObj)
                        }
                    }
            };

            return self.apiMethods;
        }]);
