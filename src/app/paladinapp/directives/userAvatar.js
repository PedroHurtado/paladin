angular.module('paladinApp')
.directive('userAvatar',[function () {
    return {
        restrict:'E',
        scope: {
            user: '<?',
            userId: '<?',
            picSize: '<?',
            userImage: '<?',
        },
        templateUrl:'./views/templates/userAvatar.tpl.html',
        link: function ($scope, elem, attr) {
        // <img class="userAvatarImage" ng-if="user != null" ng-src="{{user.User_DisplayPicturePath =! null ? (imgServerPath +  user.User_DisplayPicturePath) : '/assets/profile.png'}}" alt="{{::user.User_UserName}}"/>

            const init = () => {
                $scope.picSize = $scope.picSize || 30;
                $scope.picSizeParsed = $scope.picSize + "px";
                $scope.sizeStyle = `width: ${$scope.picSize}px; height: ${$scope.picSize}px;`;
                $scope.imgServerPath = window.globals.PROFILE_IMAGE_URL;
                const temp = $scope.userImage;
                    $scope.userImage = '';
                    if ($scope.user) {
                        $scope.userImage = $scope.user.User_DisplayPicturePath;
                    } else if (temp) {
                        $scope.userImage = temp;
                    }
            };

            init();



            let deregs = [];
            deregs.push($scope.$watch('userImage',() => {
                init();
            }));

            deregs.push($scope.$watch('user',() => {

                init();
            }));

            $scope.$on('destroy',() => {
                while (deregs.length)
                    deregs.pop()();
            });
        }
    }
}]);