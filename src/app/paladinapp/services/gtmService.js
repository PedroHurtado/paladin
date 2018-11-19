'use strict';
angular.module('paladinApp')
    .service('gtmService',['$window', function ($window) {

        this.trackEvent = function(category, action, label, value) {

            if (!window.globals.isProd())
                return
                
            if (category == undefined || action == undefined) {
                throw Error('GTMService.trackEvent: Missing required property. Aborting hit.');
            } 
    
            $window.dataLayer.push({
                'event': 'ngTrackEvent',
                'attributes': {
                    'category': category,
                    'action': action,
                    'label': label ? label : null,
                    'value': value ? value : null,
                    'nonInteraction': true
                }
            });
    
            console.log("DataLayer Event fired "+ category + " " + action);
        }
                  
    }]);