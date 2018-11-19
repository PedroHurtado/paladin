angular.module('paladinApp')
.filter('ptHtmlToPlainText',function () {
    return function (input) {
        return  input ? String(input).replace(/<[^>]+>/gm, '') : input;
    }
});