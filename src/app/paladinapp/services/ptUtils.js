'use strict';
angular.module('paladinApp')
    .service('ptUtils', [
        '$rootScope',
        'enums',
        'moment',
        '$translate',
        '$timeout',
        'ptLog',
        'geoLocationService',
        '$sce',
        function (
            $rootScope,
            enums,
            moment,
            $translate,
            $timeout,
            ptLog,
            geoLocationService,
            $sce) {
            const TAG = 'ptUtils';

            const stringToDate = (dateString, format = 'DD/MM/YYYY HH:mm', dateDelimiter = '/', timeDelimiter = ':', dateTimeSplitter = ' ') => {

                const isHasTime = format.indexOf('HH') != -1 && format.indexOf('mm') != -1;
                let dateTimeSplits = [dateString];

                if (isHasTime)
                    dateTimeSplits = dateString.split(dateTimeSplitter);

                const datePartFormat = (isHasTime ? format.split(dateTimeSplitter)[0] : format).split(dateDelimiter);
                const dateItems = (isHasTime ? dateString.split(dateTimeSplitter)[0] : dateString).split(dateDelimiter);
                let yearI = datePartFormat.indexOf(datePartFormat.find((item) => item.indexOf('Y') != -1));
                let monthI = datePartFormat.indexOf('MM');
                let dayI = datePartFormat.indexOf('DD');
                let hourI = undefined;
                let minuteI = undefined;


                if (isHasTime) {
                    const timeItems = dateString.split(dateTimeSplitter)[1].split(timeDelimiter);
                    const timePartFormat = format.split(dateTimeSplitter)[1].split(timeDelimiter);
                    hourI = timePartFormat.indexOf('HH');
                    minuteI = timePartFormat.indexOf('mm');
                    return new Date(dateItems[yearI], parseInt(dateItems[monthI]) - 1, dateItems[dayI], timeItems[hourI], timeItems[minuteI]);
                }
                return new Date(dateItems[yearI], parseInt(dateItems[monthI]) - 1, dateItems[dayI]);
            };

            const getDisplayDataForTransactionStatus = (statusId) => {
                let text = undefined;
                let color = undefined;
                switch (statusId) {
                    case enums.productRentalStatus.available:
                        text = 'PRODUCT_STATUS_AVAILABLE';
                        color = 'rentOrderStatus-primary-50';
                        break;
                    case enums.productRentalStatus.requested:
                        color = 'rentOrderStatus-primary-100';
                        text = 'PRODUCT_STATUS_REQUESTED';
                        break;
                    case enums.productRentalStatus.timeout:
                    case enums.productRentalStatus.timeoutByBorrower:
                        color = 'rentOrderStatus-primary-200';
                        text = 'PRODUCT_STATUS_TIMEOUT';
                        break;
                    case enums.productRentalStatus.canceled:
                    case enums.productRentalStatus.criticalCancel:
                    case enums.productRentalStatus.moderateCancel:
                    case enums.productRentalStatus.canceledByLender:
                        color = 'rentOrderStatus-primary-200';
                        text = 'PRODUCT_STATUS_CANCELED';
                        break;
                    case enums.productRentalStatus.denied:
                        color = 'rentOrderStatus-primary-200';
                        text = 'PRODUCT_STATUS_DECLINED';
                        break;
                    case enums.productRentalStatus.accepted:
                        color = 'rentOrderStatus-primary-300';
                        text = 'PRODUCT_STATUS_ACCEPTED';
                        break;
                    case enums.productRentalStatus.started:
                        color = 'rentOrderStatus-primary-400';
                        text = 'PRODUCT_STATUS_STARTED';
                        break;
                    case enums.productRentalStatus.ended:
                        color = 'rentOrderStatus-primary-500';
                        text = 'PRODUCT_STATUS_ENDED';
                        break;
                    case enums.productRentalStatus.verified:
                        color = 'rentOrderStatus-primary-50';
                        text = 'PRODUCT_STATUS_VERIFIED';
                        break;
                    case enums.productRentalStatus.notVerified:
                        color = 'rentOrderStatus-primary-100';
                        text = 'PRODUCT_STATUS_NOT_VERIFIED';
                        break;
                    case enums.productRentalStatus.verifying:
                        color = 'rentOrderStatus-primary-100';
                        text = 'PRODUCT_STATUS_VERIFYING'; 
                        break;
                    case enums.productRentalStatus.booked:
                        color = 'rentOrderStatus-primary-300';
                        text = 'PRODUCT_STATUS_BOOKED'; 
                        break;
                }
                return {
                    text,
                    color
                }
            };

            const getPriceForRentalPeriod = (product, rentalPeriodInDays) => {
                const {
                    Price1Day,
                    Price3Day,
                    Price5Day,
                    Price7Day,
                    Price10Day,
                    Price15Day,
                    Product_TryAndBuy,
                    Product_CategoryId,
                    Product_Price_Perday
                } = product;
                let daysFactor = 0;

                if (enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy) {
                    if (Price15Day > 0 && rentalPeriodInDays >= 15) {
                        daysFactor = rentalPeriodInDays - 15;
                        if (daysFactor > 0)
                            return Price15Day + getPriceForRentalPeriod(product, daysFactor);
                        else
                            return Price15Day;
                    } else if (Price10Day > 0 && rentalPeriodInDays >= 10) {
                        daysFactor = rentalPeriodInDays - 10;
                        if (daysFactor > 0)
                            return Price10Day + getPriceForRentalPeriod(product, daysFactor);
                        else
                            return Price10Day;
                    } else if (Price7Day > 0 && rentalPeriodInDays >= 7) {
                        daysFactor = rentalPeriodInDays - 7;
                        if (daysFactor > 0)
                            return Price7Day + getPriceForRentalPeriod(product, daysFactor);
                        else
                            return Price7Day;
                    } else if (Price5Day > 0 && rentalPeriodInDays >= 5) {
                        daysFactor = rentalPeriodInDays - 5;
                        if (daysFactor > 0)
                            return Price5Day + getPriceForRentalPeriod(product, daysFactor);
                        else
                            return Price5Day;
                    } else if (Price3Day > 0 && rentalPeriodInDays >= 3) {
                        daysFactor = rentalPeriodInDays - 3;
                        if (daysFactor > 0)
                            return Price3Day + getPriceForRentalPeriod(product, daysFactor);
                        else
                            return Price3Day;

                    } else if (Price1Day > 0 && rentalPeriodInDays >= 1) {
                        daysFactor = rentalPeriodInDays - 1;
                        if (daysFactor > 0)
                            return Price1Day + getPriceForRentalPeriod(product, daysFactor);
                        else
                            return Price1Day;
                    } else {
                        return Product_Price_Perday * rentalPeriodInDays;
                    }
                } else {
                    return Product_Price_Perday * rentalPeriodInDays;
                }
            };

            const getPriceForRentalPeriodLegacy = (product, rentalPeriodInDays) => {
                const {
                    Price3Day,
                    Price5Day,
                    Price7Day,
                    Price10Day,
                    Price15Day,
                    Product_TryAndBuy,
                    Product_CategoryId,
                    Product_Price_Perday
                } = product;
                let daysFactor = 0;
                let periodFixedPrice = undefined;
                if (enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy) {
                    if (Price15Day > 0 && rentalPeriodInDays >= 15) {
                        daysFactor = rentalPeriodInDays - 15;
                        periodFixedPrice = Price15Day;
                    } else if (Price10Day > 0 && rentalPeriodInDays >= 10) {
                        daysFactor = rentalPeriodInDays - 10;
                        periodFixedPrice = Price10Day;
                    } else if (Price7Day > 0 && rentalPeriodInDays >= 7) {
                        daysFactor = rentalPeriodInDays - 7;
                        periodFixedPrice = Price7Day;
                    } else if (Price5Day > 0 && rentalPeriodInDays >= 5) {
                        daysFactor = rentalPeriodInDays - 5;
                        periodFixedPrice = Price5Day;
                    } else if (Price3Day > 0 && rentalPeriodInDays >= 3) {
                        daysFactor = rentalPeriodInDays - 3;
                        periodFixedPrice = Price3Day;
                    }
                }

                if (periodFixedPrice) {
                    if (daysFactor > 0)
                        return periodFixedPrice + (daysFactor * Product_Price_Perday);
                    else
                        return periodFixedPrice
                } else {
                    return Product_Price_Perday * rentalPeriodInDays;
                }

            };

            const getPriceCalculatedDescriptionForRentalPeriod = (product, rentalPeriodInDays) => {
                const {
                    Price1Day,
                    Price3Day,
                    Price5Day,
                    Price7Day,
                    Price10Day,
                    Price15Day,
                    Product_TryAndBuy,
                    Product_CategoryId,
                    Product_Price_Perday
                } = product;
                let days = rentalPeriodInDays;
                let priceDivisions = {};


                for (let i = days; i > 0;) {
                    let division = 0;
                    let divisionPrice = 0;
                    if (enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy) {
                        if (Price15Day > 0 && i >= 15) {
                            division = 15;
                            divisionPrice = Price15Day;
                        } else if (Price10Day > 0 && i >= 10) {
                            division = 10;
                            divisionPrice = Price10Day;
                        } else if (Price7Day > 0 && i >= 7) {
                            division = 7;
                            divisionPrice = Price7Day;
                        } else if (Price5Day > 0 && i >= 5) {
                            division = 5;
                            divisionPrice = Price5Day;
                        } else if (Price3Day > 0 && i >= 3) {
                            division = 3;
                            divisionPrice = Price3Day;
                        } else if (Price1Day > 0 && i >= 1) {
                            division = 1;
                            divisionPrice = Price1Day;
                        } else {
                            division = 1;
                            divisionPrice = Product_Price_Perday;
                        }
                    } else {
                        division = 1;
                        divisionPrice = Product_Price_Perday;
                    }

                    priceDivisions[divisionPrice] = (priceDivisions[divisionPrice] || 0) + 1;
                    i -= division;
                }

                let priceDescription = '';
                for (let div in priceDivisions) {
                    priceDescription += (priceDescription === '' ? '' : '+') + `${div}x${priceDivisions[div]}`;
                }
                return priceDescription;
            };


            const calculatePricingListForProduct = (
                startRentDate,
                endRentDate,
                product,
                productBookingDetails,
                isDelivery = false,
                userCredit = null,
                coupon = undefined,
                isBuy = false,
            ) => {
                return new Promise((resolve, reject) => {
                    if (startRentDate && endRentDate && !isBuy) {
                        const days = getRentalPeriodInDays({startRentDate, endRentDate});
                        let prices = [];
                        const {
                            Product_CategoryId,
                            Product_TryAndBuy,
                            MinRentalPeriod,
                            MaxRentalPeriod
                        } = product;
                        const {
                            DeliveryAndPickupDetail
                        } = productBookingDetails;
                        const {
                            Delivery_Fee,
                            PickUp_Address
                        } = DeliveryAndPickupDetail;

                        const isTryAndBuy = enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy;
                        let price = getPriceForRentalPeriodLegacy(product, days);
                        let priceDescription = '' + days;
                        // getPriceCalculatedDescriptionForRentalPeriod(product, days);

                        if (isTryAndBuy) {
                            if (MinRentalPeriod > 0 && days < MinRentalPeriod)
                                return reject({
                                    code: -2,
                                    message: $translate.instant('INVALID_MIN_RENTAL_PERIOD', {days: MinRentalPeriod}),
                                });
                            else if (MaxRentalPeriod > 0 && days > MaxRentalPeriod)
                                reject({
                                    code: -3,
                                    message: $translate.instant('INVALID_MAX_RENTAL_PERIOD', {days: MaxRentalPeriod}),
                                });
                        }

                        prices = [
                            {
                                price: price,
                                description: `${priceDescription} ${$translate.instant(days == 1 ? 'DAY' : 'DAYS')}`
                            },
                            {
                                price: 0,
                                description: $translate.instant('SERVICE_FEE'),
                                tooltip: $translate.instant('SERVICE_FEE_FREE'),
                            }
                        ];

                        if (isTryAndBuy && isDelivery) {
                            prices.push({
                                price: Delivery_Fee || 0,
                                description: $translate.instant('DELIVERY_FEE')
                            })
                        }

                        let totalPrice = (isTryAndBuy && isDelivery ? (Delivery_Fee || 0) : 0) + price;


                        if (coupon) {
                            
                            const {
                                Coupon,
                                CouponValue,
                                CouponIsPercentage,
                                CouponIsFixed,
                            } = coupon;

                            if (!CouponIsFixed) {
                                
                                let discount = CouponIsPercentage ? totalPrice * (CouponValue / 100) : CouponValue;
                                totalPrice -= discount;
                                if (totalPrice < 0) {
                                    totalPrice = 0
                                }
                                prices.push({
                                    description: $translate.instant('COUPON'),
                                    isCoupon: true,
                                    price: `-${discount}`
                                })

                            } else {
                                totalPrice = CouponValue;
                                prices.push({
                                    description: $translate.instant('FIX_COUPON_DISCOUNT'), 
                                    isCoupon: true,
                                    price: `${CouponValue}`    
                                })
                            }
                            
                        } else if (userCredit && userCredit.User_Credit) {
                            const credit = userCredit.User_Credit;

                            let discount = credit >= totalPrice - 5 ? totalPrice - 5 : credit;

                            totalPrice -= discount;

                            prices.push({
                                description: $translate.instant('CREDIT'),
                                isCredit: false,
                                price: `-${discount}`
                            })

                        }


                        prices.push({
                            description: $translate.instant('TOTAL'),
                            price: totalPrice,
                        });

                        resolve(prices)
                    } else if (isBuy) {
                        let prices = [];
                        //buy case
                        prices.push({
                            description: $translate.instant('RETAIL_PRICE'),
                            price: product.Product_PurchasePrice
                        })
                        if (isDelivery) {
                            prices.push({
                                description: $translate.instant('DELIVERY_FEE'),
                                price: product.Product_Process_Fee
                            })
                        }
                       

                        let totalPrice = product.Product_Process_Fee+product.Product_PurchasePrice;
                        prices.push({
                            description: $translate.instant('TOTAL'),
                            price: totalPrice
                        })

                        resolve(prices)
                        
                    }
                })
            };

            const calculatePriceingListForBooking = (booking) => {
                return new Promise((resolve) => {


                    const {
                        Booking_PickupProduct,
                        FullEndDate,
                        FullStartDate,
                        Discount,
                        DeliveryAndPickupDetail,
                        RentAmount,
                        Fix_Amount_Coupon,
                        AmountCharge,
                    } = booking;
                    const {
                        Delivery_Fee
                    } = DeliveryAndPickupDetail;
                    
                    const days = getRentalPeriodInDays({
                        startRentDate: new Date(FullStartDate),
                        endRentDate: new Date(FullEndDate),
                    });
                    const priceDescription = '' + days;
                    const isDelivery = !Booking_PickupProduct;

                    let prices = [
                        {
                            price: isDelivery ? RentAmount-Delivery_Fee : RentAmount,
                            description: `${priceDescription} ${$translate.instant(days == 1 ? 'DAY' : 'DAYS')}`
                        },
                        {
                            price: 0,
                            description: $translate.instant('SERVICE_FEE'),
                            tooltip: $translate.instant('SERVICE_FEE_FREE'),
                        }
                    ];

                    if (isDelivery) {
                        prices.push({
                            price: Delivery_Fee || 0,
                            description: $translate.instant('DELIVERY_FEE'),
                        })
                    }
                    if (Discount) {
                        prices.push({
                            price: -Discount,
                            description: $translate.instant('DISCOUNT'),
                        })
                    }

                    if (Fix_Amount_Coupon>0) {
                        prices.push({
                            price: Fix_Amount_Coupon,
                            description: $translate.instant('FIX_COUPON_DISCOUNT'),
                        })  
                    }
                    /* 
                    let totalPrice = RentAmount + (Booking_PickupProduct ? 0 : Delivery_Fee || 0) - (Discount ? Discount : 0);
                    if (totalPrice < 0)
                        totalPrice = 0;
                    */
                    //as total price we use AmountCharge    
                    prices.push({
                        price: AmountCharge,
                        description: $translate.instant('TOTAL'),
                    });

                    resolve(prices)
                })

            };

            const getRentalPeriodInDays = ({startRentDate, endRentDate}) => {
                let startDate = moment.isMoment(startRentDate) ? startRentDate : moment(new Date(startRentDate));
                let endDate = moment.isMoment(endRentDate) ? endRentDate : moment(new Date(endRentDate));
                return endDate.diff(startDate, 'days') + 1;
            };

            /**
             * @return {
             *  startDate: Date,
             *  endDate: Date,
             * }
             */
            const getProductFirstAvailableDatesToRent = (productBookingDetails) => {
                const dateRanges = getBookedDateRanges(productBookingDetails);
                let firstAvailableDates = {
                    startDate: moment(),
                    endDate: moment().add(1, 'day')
                };

                for (let i = 0; i < dateRanges.length; i++) {
                    if (isBookingDateBookedForDateRange(firstAvailableDates.startDate, dateRanges[i]) ||
                        isBookingDateBookedForDateRange(firstAvailableDates.endDate, dateRanges[i])) {
                        firstAvailableDates.startDate = moment(dateRanges[i].endDate).add(1, 'day');
                        firstAvailableDates.endDate = moment(firstAvailableDates.startDate).add(1, 'day');
                    }
                }

                return firstAvailableDates;
            };


            const getBookedDateRanges = (productBookingDetails) => {
                const {ProductBookingDetail} = productBookingDetails;

                if (ProductBookingDetail && ProductBookingDetail.length > 0) {
                    let dateRanges = [];
                    ProductBookingDetail.forEach((booking) => {
                        dateRanges.push({
                            endDate: moment(booking.EndDate),
                            startDate: moment(booking.StartDate)
                        })
                    });

                    return dateRanges;
                }
                return []
            };

            /**
             *
             * @param momentDate date to validate (moment Object)
             * @param range dateRange containing startDate and enDate dates, usually means that the method "getBookedDateRanges" was called at an earlier step
             */
            const isBookingDateBookedForDateRange = (momentDate, range) => {
                return (momentDate.isBetween(range.startDate, range.endDate) ||
                    momentDate.isSame(range.startDate) ||
                    momentDate.isSame(range.endDate))
            };
            const regexPatterns = {
                email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                numbersOnly: /^[0-9]+$/,
                minMaxLength: (min = 2, max = undefined) => new RegExp(`.{${min},${max ? max : ''}}`),
            };

            const sorters = {
                bookingLastModifiedEpoch: (a, b) => b.Last_Modified - a.Last_Modified,
            };


            const dataUrlToBlob = (dataUrl) => {
                // Decode the dataUrl
                let binary = atob(dataUrl.split(',')[1]);
                // Create 8-bit unsigned array
                let array = [];
                for (let i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                // Return our Blob object
                return new Blob([new Uint8Array(array)], {type: 'image/jpg'});
            };

            const isMobile = {
                Android: function () {
                    return navigator.userAgent.match(/Android/i);
                },
                BlackBerry: function () {
                    return navigator.userAgent.match(/BlackBerry/i);
                },
                iOS: function () {
                    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
                },
                Opera: function () {
                    return navigator.userAgent.match(/Opera Mini/i);
                },
                Windows: function () {
                    return navigator.userAgent.match(/IEMobile/i);
                },
                any: function () {
                    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
                }
            };

            const isCrawler = () => {
                return /bot|prerender|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
            };

            const playErrorSound = () => {
                try {
                    let context = new AudioContext();
                    let o = context.createOscillator();
                    let g = context.createGain();
                    o.type = "sine";
                    o.connect(g);
                    g.connect(context.destination);
                    o.start();
                    g.gain.exponentialRampToValueAtTime(
                        0.00010, context.currentTime + 1
                    )
                } catch (err) {
                    ptLog.error('AudioContext not supported');
                }
            };

            const isProductTryAndBuy = (product) => {
                const {
                    Product_CategoryId,
                    Product_TryAndBuy
                } = product;
                return enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy;
            };

            const getProductDetailUrl = (product) => {
                return window.globals.ROOT_PATH + $translate.use() + '/product/' + getProductNameAndId(product);
            }

            const getProductNameAndId = (product) => {
                return `${product.Product_Title} ${product.Product_Id}`.replace(/\ /g,'-');
            }

            

            const getAddressToDisplayForBooking = ({product, productBookingDetails, booking}) => {
                return new Promise((resolve, reject) => {
                    const isProductTryAndBuyBool = isProductTryAndBuy(product);
                    let location = {
                        title: 'PICK_UP',
                        address: undefined,
                        lat: undefined,
                        lng: undefined,
                    };
                    if (!product) {
                        return reject('product must not be undefined')
                    }
                    location.address = product.Lender_User_Address;
                    location.lat = product.Product_Latitude;
                    location.lng = product.Product_Longitude;

                    if (isProductTryAndBuyBool) {
                        if (productBookingDetails) {
                            if (booking) {
                                const {Booking_PickupProduct, Delivery_Latitude, Delivery_Longitude, Delivery_Address} = booking;

                                if (!Booking_PickupProduct) {
                                    location.title = 'DELIVERY_ADDRESS';
                                    location.address = Delivery_Address;
                                    location.lat = Delivery_Latitude;
                                    location.lng = Delivery_Longitude;
                                } else {
                                    const {PickUp_Address, PickUp_Latitude, PickUp_Longitude} = productBookingDetails;
                                    location.address = PickUp_Address;
                                    location.lat = PickUp_Latitude;
                                    location.lng = PickUp_Longitude;
                                }
                            }
                        }
                    }

                    extractAndGeoLocateAddressFromObjectForFieldNames({
                        object: location,
                        addressFieldName: 'address',
                        latFieldName: 'lat',
                        lngFieldName: 'lng'
                    })
                        .then((address) => {
                            resolve({
                                ...address,
                                title: location.title
                            })
                        })
                        .catch(reject)
                })
            };

            const extractAndGeoLocateAddressFromObjectForFieldNames = ({object, addressFieldName, latFieldName, lngFieldName}) => {
                return new Promise((resolve, reject) => {
                    let address = object[addressFieldName];
                    let lat = Number(object[latFieldName] || 0);
                    let lng = Number(object[lngFieldName] || 0);
                    if (!address && lat && lng) {
                        geoLocationService.getUserAddressFromCoordinates({lat, lng})
                            .then((geoLocatedAddress) => {
                                resolve({
                                    address: geoLocatedAddress,
                                    lat,
                                    lng
                                })
                            })
                            .catch(reject)
                    } else {
                        resolve({
                            address,
                            lat,
                            lng,
                        })
                    }

                });

            };


            const parseBookingStepTutorialHTMLTemplateForTranslationId = (translationId) => {
                const translatedText = $translate.instant(translationId);

                if (translatedText.indexOf('|') != -1) {
                    const textComponents = $translate.instant(translationId).split('|');
                    let HTML_TEXT = '<div>';
                    textComponents.forEach((comp, index) => {
                        if (index == 0)
                            HTML_TEXT += `<span>${comp}</span> <ol>`;
                        else
                            HTML_TEXT += `<li>${comp}</li>`

                    });
                    HTML_TEXT += '</ol><div>';
                    return $sce.trustAsHtml(HTML_TEXT);
                } else {
                    ptLog.warn(TAG, 'parseBookingStepTutorialHTMLTemplateForTranslationId', 'failed to parse translationId:', translationId);
                    return translatedText;
                }
            };

            const getTranslationIdForBookingStatus = (bookingStatus, isLender, isTryAndBuy) => {
                if (bookingStatus === enums.productRentalStatus.notVerified ||
                    bookingStatus === enums.productRentalStatus.verified)
                    return `BookingStatusNotVerified_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.verifying)
                    return `BookingStatusVerifying_Borrower`;
                else if (bookingStatus === enums.productRentalStatus.requested)
                    return `BookingStatusRequested_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.accepted)
                    return `BookingStatusAccepted_${ isLender ? 'Lender' : 'Borrower' }`;
                
                else if (bookingStatus === enums.productRentalStatus.booked)
                    return `BookingStatusBooked_Borrower`;
                
                else if (bookingStatus === enums.productRentalStatus.timeout)
                    return `BookingStatusTimeout_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.denied)
                    return `BookingStatusDenied_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.canceled)
                    return `BookingStatusCancelled_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.criticalCancel)
                    return `BookingStatusCriticalCancelled_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.moderateCancel)
                    return `BookingStatusModerateCancelled_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.canceledByLender)
                    return `BookingStatusCancelledLender_${ isLender ? 'Lender' : 'Borrower' }`;
                else if (bookingStatus === enums.productRentalStatus.started) {
                    if (isTryAndBuy) 
                        return isLender ? `BookingStatusStarted_Lender` : `BookingStatusStarted_Borrower_TnB`;
                    else 
                        return `BookingStatusStarted_${ isLender ? 'Lender' : 'Borrower' }`;
                }
                else if (bookingStatus === enums.productRentalStatus.ended)
                    if (isTryAndBuy) 
                        return isLender ? `BookingStatusEnded_Lender` : `BookingStatusEnded_Borrower_TnB`;
                    else 
                        return `BookingStatusEnded_${ isLender ? 'Lender' : 'Borrower' }`;
            };

            const getTranslationDictForDatePicker = () => {
                return {
                    'Month': $translate.instant('Month'),
                    'Year': $translate.instant('Year'),
                    'Date Range Template': $translate.instant('Date Range Template'),
                    'Custom Date Range': $translate.instant('Custom Date Range'),
                    'Today': $translate.instant('Today'),
                    'Yesterday': $translate.instant('Yesterday'),
                    'This Week': $translate.instant('Week'),
                    'Last Week': $translate.instant('Week'),
                    'This Month': $translate.instant('Month'),
                    'Last Month': $translate.instant('Month'),
                    'This Year': $translate.instant('Year'),
                    'Last Year': $translate.instant('Year'),
                    'Cancel': $translate.instant('Cancel'),
                    'Clear': $translate.instant('Clear'),
                    'Ok': $translate.instant('Ok'),
                    'Sunday': $translate.instant('Sunday'),
                    'Monday': $translate.instant('Monday'),
                    'Tuesday': $translate.instant('Tuesday'),
                    'Wednesday': $translate.instant('Wednesday'),
                    'Thursday': $translate.instant('Thursday'),
                    'Friday': $translate.instant('Friday'),
                    'Saturday': $translate.instant('Saturday'),
                    'Sun': $translate.instant('Sunday'),
                    'Mon': $translate.instant('Monday'),
                    'Tue': $translate.instant('Tuesday'),
                    'Wed': $translate.instant('Wednesday'),
                    'Thu': $translate.instant('Thursday'),
                    'Fri': $translate.instant('Friday'),
                    'Sat': $translate.instant('Saturday'),
                    'January': $translate.instant('January'),
                    'February': $translate.instant('February'),
                    'March': $translate.instant('March'),
                    'April': $translate.instant('April'),
                    'May': $translate.instant('May'),
                    'June': $translate.instant('June'),
                    'July': $translate.instant('July'),
                    'August': $translate.instant('August'),
                    'September': $translate.instant('September'),
                    'October': $translate.instant('October'),
                    'November': $translate.instant('November'),
                    'December': $translate.instant('December'),
                    'Week': $translate.instant('Week'),
                }
            };

            const getCategoriesUrl = (categoryName, subcategoryName, isTryAndBuy, languageCode) => {
                let path = window.globals.ROOT_PATH + languageCode + "/categorie/" + (isTryAndBuy ? '' : "privato/");
                if (subcategoryName == null) {
                  path = path + categoryName;
                } else {
                  path = path + categoryName + "/" + subcategoryName;
                }
            
                return path.split(' ').join('-');;
              }

            return {
                stringToDate,
                getDisplayDataForTransactionStatus,
                getPriceForRentalPeriod,
                calculatePricingListForProduct,
                getPriceCalculatedDescriptionForRentalPeriod,
                getBookedDateRanges,
                isBookingDateBookedForDateRange,
                getProductFirstAvailableDatesToRent,
                regexPatterns,
                sorters,
                isProductTryAndBuy,
                playErrorSound,
                dataUrlToBlob,
                isMobile,
                isCrawler,
                extractAndGeoLocateAddressFromObjectForFieldNames,
                getAddressToDisplayForBooking,
                getRentalPeriodInDays,
                calculatePriceingListForBooking,
                parseBookingStepTutorialHTMLTemplateForTranslationId,
                getTranslationIdForBookingStatus,
                getTranslationDictForDatePicker,
                getProductDetailUrl,
                getProductNameAndId,
                getCategoriesUrl

            }
        }]);
