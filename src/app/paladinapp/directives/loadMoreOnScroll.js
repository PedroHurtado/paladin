'use strict';
angular.module('paladinApp')
    .directive('whenScrolled', function() {
        let threshold = 10;
        return function(scope, elm, attr) {
            var raw = elm[0];

            elm.bind('scroll', function() {
                if (Math.ceil(raw.scrollTop + raw.offsetHeight) >= raw.scrollHeight - threshold) {
                    var t = setTimeout(() => {
                        scope.$apply(attr.whenScrolled);
                        clearTimeout(t);
                        t = null;
                    },10)
                }
            });
        }
    });