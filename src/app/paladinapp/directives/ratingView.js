angular.module('paladinApp')
    .directive('ratingView', [function () {
        return {
            restrict: 'E',
            scope: {
                rating: '=',
                count: '<?',
                readOnly: '<?',
                onRating: '&'
            },
            templateUrl: './views/templates/ratingView.tpl.html',
            link: function ($scope, elem, attrs) {
                
                $scope.onRatingSet = (rating) => {
                    if ($scope.onRating)
                        $scope.onRating({rating: rating});
                }
            }
        }
    }]);