angular.module('paladinApp')
.filter('ptCurrency', function () {
   return function (input) {
       return '€ ' + input
   }
});