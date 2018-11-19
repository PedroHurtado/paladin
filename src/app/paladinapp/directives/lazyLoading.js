angular.module('paladinApp')
.directive('lazyLoading',[function () {
    return {
        restrict:'A',
        link: function ($scope, elem, attr) {

            /*We build sourceSet based on sizes: 
                Product: 100w,200w,300w,400w,500w
                Profile: 100w,300w,500w
                */
            const buildSourceSet = (imagePath, isProfile) => {
                let sourceSet = '';
                for (var index = 1; index <= 5; index++) {
                    if (isProfile && index%2 == 0) continue;  
                    sourceSet = sourceSet + imagePath + attr.lazyLoading + "_"+index+"00 "+index+"00w, ";   
                }
                if (sourceSet.length > 0)
                    sourceSet = sourceSet + imagePath + attr.lazyLoading + " 600w";
                    
                return sourceSet;           
            }
            angular.element(elem)[0].src = '/assets/empty-image.png';

            const getImagePath = () => {
                let imagePath = '';
                if (attr.imageType) {
                    if  (attr.imageType == "product") {
                        imagePath = window.globals.PRODUCT_IMAGE_URL;
                    } else if (attr.imageType == "profile") {
                        if (attr.lazyLoading.length > 0) 
                            imagePath = window.globals.PROFILE_IMAGE_URL;
                        else imagePath = '/assets/profile.png';
                    }
                }
                return imagePath;
            }
            
            
            function loadImg(changes){
                changes.forEach(change => {
                    if(change.intersectionRatio > 0){
                        const imagePath = getImagePath();
                        change.target.src = imagePath + attr.lazyLoading;
                        if (attr.imageType && (attr.imageType == "product" 
                        || attr.imageType == "profile" && attr.lazyLoading.length > 0)) {
                            change.target.srcset= buildSourceSet(imagePath, attr.imageType == "profile"); 
                        }
                    }   
                })
            }    

            const observer = new IntersectionObserver(loadImg)
            const img = angular.element(elem)[0];
            observer.observe(img)

        }
    }
}]);