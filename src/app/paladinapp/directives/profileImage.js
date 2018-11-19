angular.module('paladinApp')
    .directive('profileImage',[function () {
        return {
            restrict:'A',
            link: function ($scope, elem, attr) {
                const update = () => {
                    if (elem && elem[0]) {
                        if (attr.profileImage == '')
                            elem[0].src = '/assets/profile.png';
                        else
                            elem[0].src = window.globals.PROFILE_IMAGE_URL + attr.profileImage;
                    }
                };

                update();


                let deregs = [];

                deregs.push($scope.$watch('profileImage',() => {
                    update();
                }));

                $scope.$on('$destroy',() => {
                    while (deregs.length)
                        deregs.pop()();
                })

            }
        }
    }]);