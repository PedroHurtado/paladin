angular.module('paladinApp')
.directive('productImage',[function () {
    return {
        restrict:'A',
        link: function ($scope, elem, attr) {
            angular.element(elem)[0].src = '/assets/blank-image.jpg';
            
            function loadImg(changes){
                changes.forEach(change => {
                    if(change.intersectionRatio > 0){
                        change.target.src = window.globals.PRODUCT_IMAGE_URL + attr.productImage;
                    }
                })
            }    

            const observer = new IntersectionObserver(loadImg)
            const img = angular.element(elem)[0];
            observer.observe(img)

            
        }
    }
}]);