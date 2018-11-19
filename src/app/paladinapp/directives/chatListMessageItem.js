'use strict';
angular.module('paladinApp')
    .directive('chatListMessageItem',[function () {
        return {
            restrict: 'E',
            templateUrl: './views/templates/chatListMessageItem.tpl.html',
            scope: {
                myImage:'=?',
                recipientImage: '=?',
                message: '=',
            },
            link: function ($scope, elem, attr) {
                
            }
        }
    }]);