'use strict';
angular.module('paladinApp')
    .directive('contactLenderOrBorrower',[
        '$rootScope',
        'enums',
        'appStateManager',
        function (
            $rootScope,
            enums,
            appStateManager) {
            return {
                restrict: 'E',
                templateUrl:'./views/templates/contactLenderOrBorrower.tpl.html',
                scope: {
                    isTitleHidden: '=?',
                    isDescriptionHidden: '=?',
                    product: '=?',
                    productBookingDetails: '=?',
                    booking: '=?',
                },
                link: function ($scope, elem, att) {
                    $scope.isTitleHidden = $scope.isTitleHidden || false;
                    $scope.isDescriptionHidden = $scope.isDescriptionHidden || false;

                    $scope.displayedUser = {
                        username: null,
                        profilePic: null,
                        id: null,
                        stars: undefined,
                        reviews: undefined,
                    };
                    const init = () => {
                        const product = $scope.product || {};
                        $scope.isMyProduct = product.Lender_UserId == appStateManager.getUserId();
                        $scope.isCanStartChat = !$scope.isMyProduct || $scope.booking != null;
                        $scope.titleText = $scope.isMyProduct ? 'CONTACT_BORROWER' : 'CONTACT_LENDER';

                        if ($scope.isMyProduct) {
                            if ($scope.booking) { // if null, can't start chat anyways, so directive will be hidden
                                $scope.displayedUser.username = $scope.booking.Borrower_Name;
                                $scope.displayedUser.profilePic = $scope.booking.Borrower_Image;
                                $scope.displayedUser.id = $scope.booking.Borrower_Id;
                                $scope.displayedUser.stars = $scope.booking.Borrower_ReviewScore;
                                $scope.displayedUser.reviews = $scope.booking.Borrower_ReviewCount;
                            } else {
                                $scope.isCanStartChat = false;
                            }
                        } else {
                            if ($scope.product) {
                                $scope.displayedUser.username = product.Lender_FullName;
                                $scope.displayedUser.profilePic = product.Lender_User_DisplayPicturePath;
                                $scope.displayedUser.id = product.Lender_UserId;
                                $scope.displayedUser.stars = product.User_ReviewAsLender;
                                $scope.displayedUser.reviews = product.User_ReviewCountAsLender;
                            } else {
                                $scope.isCanStartChat = false;
                            }
                        }
                    };

                    let deregs = [];
                    deregs.push($scope.$watch('product',() => {
                        init();
                    }));

                    deregs.push($scope.$watch('productBookingDetails',() => {
                        init();
                    }));

                    deregs.push($scope.$watch('booking',() => {
                        init();
                    }));

                    init();

                    $scope.$on('$destroy',function () {
                        while (deregs.length)
                            deregs.pop()();
                    })
                }
            }
    }]);