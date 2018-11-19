'use strict';

const mockDummyData = {
    "Status": "success",
    "Data": {
        "User_Booking_Borrower": [
            {
                "Product_Id": 11425,
                "Booking_Id": 736,
                "Borrower_Id": 11736,
                "Borrower_Name": "milalou2 milalou2-last",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11608,
                "Lender_Name": "Marc Ferrer",
                "Lender_StripeAccount": "acct_1AJTHYAN9BUpHCOJ",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/26/2018",
                "EndDate": "4/27/2018",
                "FullStartDate": "2018-04-26T00:00:00Z",
                "FullEndDate": "2018-04-27T00:00:00Z",
                "Lender_Image": "qSzR0g6M0HFiwOZaTm42D5a4stKjQj",
                "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 2,
                "Product_Title": "retina screen",
                "Lender_BillingAddress": null,
                "Product_Image": "lFYnTHaa7yI4kboCpsrT5a4stKjQj",
                "Product_PricePerDay": "5",
                "BorrowerCusotmerId": "",
                "RentAmount": 10,
                "Discount": 0,
                "AmountCharge": 10,
                "Status": "timeout",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "",
                "Delivery_Longitude": "",
                "Delivery_Address": "",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "05:46"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "05:46"
                    },
                    {
                        "StatusName": "timeout",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 4,
                        "CreatedTime": "06:00"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11510,
                "Booking_Id": 730,
                "Borrower_Id": 11736,
                "Borrower_Name": "milalou2 milalou2-last",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11624,
                "Lender_Name": "Muhammad Ali",
                "Lender_StripeAccount": "acct_1CCQcZLXqrrI6AjN",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/19/2018",
                "EndDate": "4/21/2018",
                "FullStartDate": "2018-04-19T00:00:00Z",
                "FullEndDate": "2018-04-21T00:00:00Z",
                "Lender_Image": "yTj58mdeStrfU5QoJBmtD5a4stKjQj",
                "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 3,
                "Product_Title": "Plastic bottle",
                "Lender_BillingAddress": null,
                "Product_Image": "Iti4Fsg9gJl2db5XWKAseD5a4stKjQj",
                "Product_PricePerDay": "14",
                "BorrowerCusotmerId": "",
                "RentAmount": 7,
                "Discount": 0,
                "AmountCharge": 7,
                "Status": "timeout",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "",
                "Delivery_Longitude": "",
                "Delivery_Address": "",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "20:16"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "20:16"
                    },
                    {
                        "StatusName": "timeout",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 4,
                        "CreatedTime": "20:30"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11535,
                "Booking_Id": 689,
                "Borrower_Id": 11736,
                "Borrower_Name": "milalou2 milalou2-last",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11735,
                "Lender_Name": "milalou4",
                "Lender_StripeAccount": "",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/19/2018",
                "EndDate": "4/20/2018",
                "FullStartDate": "2018-04-19T00:00:00Z",
                "FullEndDate": "2018-04-20T00:00:00Z",
                "Lender_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 2,
                "Product_Title": "tennis sport",
                "Lender_BillingAddress": null,
                "Product_Image": "3rQf5vmj3KTZmJ2y5Notj5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 6,
                "Discount": 0,
                "AmountCharge": 6,
                "Status": "timeout",
                "Booking_ReadId": 3,
                "Delivery_Latitude": "",
                "Delivery_Longitude": "",
                "Delivery_Address": "",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "14:25"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "14:25"
                    },
                    {
                        "StatusName": "timeout",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 4,
                        "CreatedTime": "14:40"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11545,
                "Booking_Id": 688,
                "Borrower_Id": 11736,
                "Borrower_Name": "milalou2 milalou2-last",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11746,
                "Lender_Name": "milalou3",
                "Lender_StripeAccount": "acct_1CDbR1BB9Tg1dJD4",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/20/2018",
                "EndDate": "4/20/2018",
                "FullStartDate": "2018-04-20T00:00:00Z",
                "FullEndDate": "2018-04-20T00:00:00Z",
                "Lender_Image": null,
                "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 1,
                "Product_Title": "little mu",
                "Lender_BillingAddress": null,
                "Product_Image": "dQgiMmnnpqeikt2ASslLj5a4stKjQj",
                "Product_PricePerDay": "5",
                "BorrowerCusotmerId": "",
                "RentAmount": 5,
                "Discount": 0,
                "AmountCharge": 5,
                "Status": "card_not_verified_timeout",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "",
                "Delivery_Longitude": "",
                "Delivery_Address": "",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "14:18"
                    },
                    {
                        "StatusName": "notverified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 2,
                        "CreatedTime": "14:18"
                    },
                    {
                        "StatusName": "card_not_verified_timeout",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 13,
                        "CreatedTime": "18:35"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11535,
                "Booking_Id": 556,
                "Borrower_Id": 11736,
                "Borrower_Name": "milalou2 milalou2-last",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11735,
                "Lender_Name": "milalou4",
                "Lender_StripeAccount": "",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/26/2018",
                "EndDate": "4/28/2018",
                "FullStartDate": "2018-04-26T00:00:00Z",
                "FullEndDate": "2018-04-28T00:00:00Z",
                "Lender_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 3,
                "Product_Title": "tennis sport",
                "Lender_BillingAddress": null,
                "Product_Image": "3rQf5vmj3KTZmJ2y5Notj5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 9,
                "Discount": 0,
                "AmountCharge": 9,
                "Status": "started",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "",
                "Delivery_Longitude": "",
                "Delivery_Address": "",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "20:15"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "20:15"
                    },
                    {
                        "StatusName": "accepted",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 7,
                        "CreatedTime": "20:16"
                    },
                    {
                        "StatusName": "started",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 8,
                        "CreatedTime": "21:13"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11537,
                "Booking_Id": 526,
                "Borrower_Id": 11736,
                "Borrower_Name": "milalou2 milalou2-last",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11737,
                "Lender_Name": "milalou5",
                "Lender_StripeAccount": "acct_1CClL3HkZgZyGSpV",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": true,
                "StartDate": "4/19/2018",
                "EndDate": "4/21/2018",
                "FullStartDate": "2018-04-19T00:00:00Z",
                "FullEndDate": "2018-04-21T00:00:00Z",
                "Lender_Image": null,
                "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 3,
                "Product_Title": "sock",
                "Lender_BillingAddress": null,
                "Product_Image": "GCdCsbMYjJAIQ3CnJQ93Mj5a4stKjQj",
                "Product_PricePerDay": "7",
                "BorrowerCusotmerId": "",
                "RentAmount": 21,
                "Discount": 0,
                "AmountCharge": 21,
                "Status": "ended",
                "Booking_ReadId": 3,
                "Delivery_Latitude": "",
                "Delivery_Longitude": "",
                "Delivery_Address": "",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "08:38"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "08:38"
                    },
                    {
                        "StatusName": "accepted",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 7,
                        "CreatedTime": "08:46"
                    },
                    {
                        "StatusName": "started",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 8,
                        "CreatedTime": "08:47"
                    },
                    {
                        "StatusName": "ended",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 9,
                        "CreatedTime": "08:48"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            }
        ],
        "User_Booking_Lender": [
            {
                "Product_Id": 11533,
                "Booking_Id": 756,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/20/2018",
                "EndDate": "4/20/2018",
                "FullStartDate": "2018-04-20T00:00:00Z",
                "FullEndDate": "2018-04-20T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 1,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 3,
                "Discount": 0,
                "AmountCharge": 3,
                "Status": "timeout",
                "Booking_ReadId": 3,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "10:28"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "10:28"
                    },
                    {
                        "StatusName": "timeout",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 4,
                        "CreatedTime": "10:40"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 755,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/19/2018",
                "EndDate": "4/22/2018",
                "FullStartDate": "2018-04-19T00:00:00Z",
                "FullEndDate": "2018-04-22T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 4,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 12,
                "Discount": 0,
                "AmountCharge": 12,
                "Status": "cancelled",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "10:26"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "10:26"
                    },
                    {
                        "StatusName": "cancelled",
                        "CreatedDate": "10/04/2018",
                        "Status_TrackId": 6,
                        "CreatedTime": "10:26"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 735,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/26/2018",
                "EndDate": "4/26/2018",
                "FullStartDate": "2018-04-26T00:00:00Z",
                "FullEndDate": "2018-04-26T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 1,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 3,
                "Discount": 0,
                "AmountCharge": 3,
                "Status": "accepted",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "21:44"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "21:44"
                    },
                    {
                        "StatusName": "accepted",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 7,
                        "CreatedTime": "21:44"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 734,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/21/2018",
                "EndDate": "4/22/2018",
                "FullStartDate": "2018-04-21T00:00:00Z",
                "FullEndDate": "2018-04-22T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 2,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 6,
                "Discount": 0,
                "AmountCharge": 6,
                "Status": "cancelled",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "20:58"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "20:58"
                    },
                    {
                        "StatusName": "cancelled",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 6,
                        "CreatedTime": "20:59"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 733,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/21/2018",
                "EndDate": "4/22/2018",
                "FullStartDate": "2018-04-21T00:00:00Z",
                "FullEndDate": "2018-04-22T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 2,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 6,
                "Discount": 0,
                "AmountCharge": 6,
                "Status": "cancelled",
                "Booking_ReadId": 3,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "20:56"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "20:56"
                    },
                    {
                        "StatusName": "cancelled",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 6,
                        "CreatedTime": "20:58"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 732,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": true,
                "StartDate": "4/11/2018",
                "EndDate": "4/11/2018",
                "FullStartDate": "2018-04-11T00:00:00Z",
                "FullEndDate": "2018-04-11T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 1,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 3,
                "Discount": 0,
                "AmountCharge": 3,
                "Status": "ended",
                "Booking_ReadId": 1,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "20:47"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "20:47"
                    },
                    {
                        "StatusName": "accepted",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 7,
                        "CreatedTime": "20:47"
                    },
                    {
                        "StatusName": "started",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 8,
                        "CreatedTime": "20:55"
                    },
                    {
                        "StatusName": "ended",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 9,
                        "CreatedTime": "20:55"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11532,
                "Booking_Id": 668,
                "Borrower_Id": 11737,
                "Borrower_Name": "milalou5",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/19/2018",
                "EndDate": "4/21/2018",
                "FullStartDate": "2018-04-19T00:00:00Z",
                "FullEndDate": "2018-04-21T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": null,
                "Chat_Id": 0,
                "NoOfdays": 3,
                "Product_Title": "napkins ",
                "Lender_BillingAddress": null,
                "Product_Image": "o8R3Gnu6yT2mVGdKix4Iz5a4stKjQj",
                "Product_PricePerDay": "6",
                "BorrowerCusotmerId": "",
                "RentAmount": 3,
                "Discount": 0,
                "AmountCharge": 3,
                "Status": "card_not_verified_timeout",
                "Booking_ReadId": 1,
                "Delivery_Latitude": "52.4746643",
                "Delivery_Longitude": "13.4244634",
                "Delivery_Address": "Weisestraße 26",
                "Booking_PickupProduct": false,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "08:09"
                    },
                    {
                        "StatusName": "notverified",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 2,
                        "CreatedTime": "08:09"
                    },
                    {
                        "StatusName": "card_not_verified_timeout",
                        "CreatedDate": "09/04/2018",
                        "Status_TrackId": 13,
                        "CreatedTime": "18:35"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 555,
                "Borrower_Id": 11737,
                "Borrower_Name": "milalou5",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": true,
                "StartDate": "4/19/2018",
                "EndDate": "4/21/2018",
                "FullStartDate": "2018-04-19T00:00:00Z",
                "FullEndDate": "2018-04-21T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": null,
                "Chat_Id": 0,
                "NoOfdays": 3,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 9,
                "Discount": 0,
                "AmountCharge": 9,
                "Status": "ended",
                "Booking_ReadId": 2,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "18:25"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "18:25"
                    },
                    {
                        "StatusName": "accepted",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 7,
                        "CreatedTime": "18:26"
                    },
                    {
                        "StatusName": "started",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 8,
                        "CreatedTime": "18:28"
                    },
                    {
                        "StatusName": "ended",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 9,
                        "CreatedTime": "18:29"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            },
            {
                "Product_Id": 11533,
                "Booking_Id": 525,
                "Borrower_Id": 11735,
                "Borrower_Name": "milalou4",
                "Borrower_ReviewScore": 0,
                "Borrower_ReviewCount": 0,
                "Borrower_QBId": null,
                "Lender_Id": 11736,
                "Lender_Name": "milalou2 milalou2-last",
                "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
                "Lender_ReviewScore": 0,
                "Lender_ReviewCount": 0,
                "Lender_QBId": null,
                "Booking_PaidToLender": false,
                "StartDate": "4/3/2018",
                "EndDate": "4/3/2018",
                "FullStartDate": "2018-04-03T00:00:00Z",
                "FullEndDate": "2018-04-03T00:00:00Z",
                "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
                "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
                "Chat_Id": 0,
                "NoOfdays": 1,
                "Product_Title": "pen blue ",
                "Lender_BillingAddress": null,
                "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
                "Product_PricePerDay": "3",
                "BorrowerCusotmerId": "",
                "RentAmount": 3,
                "Discount": 0,
                "AmountCharge": 3,
                "Status": "timeout",
                "Booking_ReadId": 3,
                "Delivery_Latitude": "0",
                "Delivery_Longitude": "0",
                "Delivery_Address": "",
                "Booking_PickupProduct": true,
                "BookingStatus": [
                    {
                        "StatusName": "requested",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 1,
                        "CreatedTime": "08:09"
                    },
                    {
                        "StatusName": "verified",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 3,
                        "CreatedTime": "08:09"
                    },
                    {
                        "StatusName": "timeout",
                        "CreatedDate": "03/04/2018",
                        "Status_TrackId": 4,
                        "CreatedTime": "08:15"
                    }
                ],
                "Booking_ReviewStatus": null,
                "DeliveryAndPickupDetail": null
            }
        ],
        "User_ReviewScore": [
            {
                "User_ReviewScore": 8,
                "User_TotalReviews": 1,
                "User_ReviewAsLender": 8,
                "User_ReviewAsBorrower": 7,
                "User_ReviewCountAsLender": 1,
                "User_ReviewCountAsBorrower": 1
            }
        ]
    },
    "Message": "User Bookings"
};

angular.module('paladinApp')
    .controller('userBookingsController',[
        '$rootScope',
        '$scope',
        'apiService',
        'enums',
        'appStateManager',
        'ptLog',
        '$mdMedia',
        'ptUtils',
        'moment',
        function ($rootScope,
                  $scope,
                  apiService,
                  enums,
                  appStateManager,
                  ptLog,
                  $mdMedia,
                  ptUtils,
                  moment) {
            $scope.isLoading = false;

            $scope.tabs = [
                {
                    title: 'BORROWED',
                    content: 'I am tab borrowed content',
                    bookings: []
                },
                {
                    title: 'LENT',
                    content: 'I am tab lent content',
                    bookings: []
                }
            ];

            $scope.fetchUserBookings = () => {
                $scope.isLoading = true;
                apiService.bookings.getUserBookings(appStateManager.getUserId())
                    .then((res) => {
                        $scope.tabs[0].bookings = res.Data.User_Booking_Borrower
                            .map((item) => {
                                item.lastModified = new Date(item.Last_Modified * 1000);
                                return item
                            })
                            .sort(ptUtils.sorters.bookingLastModifiedEpoch);

                        $scope.tabs[1].bookings = res.Data.User_Booking_Lender
                            .map((item) => {
                                item.lastModified = new Date(item.Last_Modified * 1000);
                                return item
                            })
                            .sort(ptUtils.sorters.bookingLastModifiedEpoch);
                            $scope.isLoading = false;

                    })
                    .catch((err) => {
                        $scope.isLoading = false;
                        ptLog.error(err);
                    })
            };

            $scope.fetchUserBookings();

            $scope.bookingListItemClick = (booking) => {
                $rootScope.$emit(enums.busNavigation.transactionDetailed,{bookingId: booking.Booking_Id})
            };

            $scope.addNewItem = () => {
                $rootScope.$emit(enums.busNavigation.newProduct);
            };

            $scope.isGtMd = $mdMedia('gt-md');

            let deregs = [];

            deregs.push(
                $scope.$watch(function () {return $mdMedia('gt-md') },function (mgMd) {
                    $scope.isGtMd = mgMd;
                })
            );

            $scope.$on('$destroy',() => {
                while (deregs.length)
                    deregs.pop()()
            })
        }
    ]);