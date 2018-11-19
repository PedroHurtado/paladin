angular.module('paladinApp')
.filter('ptTruncate',function () {
    return function (input, maxChars) {

        if (input) {
            if (input.length > maxChars) {
                return input.slice(0,maxChars-3) + '...';
            }
        }
        return input
    }
});