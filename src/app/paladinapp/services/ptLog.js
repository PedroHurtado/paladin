angular.module('paladinApp')
.service('ptLog', [function () {
        this.log = function () {
            if( window.globals.LOG_LEVEL === 'verbose') {
                console.log.apply(this,['PALADIN LOG:',...arguments]);
            }
        };

        this.warn = function () {
            if (window.globals.LOG_LEVEL === 'verbose') {
                console.warn.apply(this,['PALADIN WARN:',...arguments])
            }
        };

        this.error = function () {
            console.error.apply(this,['PALADIN ERROR:',...arguments]);
        }
}]);