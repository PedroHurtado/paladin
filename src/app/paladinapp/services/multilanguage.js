// angular.module('paladinApp')
// .config(['$translateProvider', function($translateProvider) {
// 	$translateProvider
// 	.useStaticFilesLoader({
// 	    prefix: '/translations/',
// 	    suffix: '.json'
// 	})
// 	.preferredLanguage('it');
// 	/*.useLocalStorage()
//   	.useMissingTranslationHandlerLog()*/
// }]);
//

angular.module('paladinApp')
    .factory('ngTranslateErrorHandler', ['ptLog',function (ptLog) {
        // has to return a function which gets a tranlation ID
        return function (translationID,uses) {
            // do something with dep1 and dep2
            ptLog.warn(`Translation for key "${translationID}" not found when using: ${uses}, using key instead`);
            return translationID;
        };
    }]);
angular.module('paladinApp')
    .config(['$translateProvider', function($translateProvider) {
        $translateProvider
            .useStaticFilesLoader({
                prefix: '/translations/locale-',
                suffix: '.json'
            }).preferredLanguage(localStorage.getItem('PT_LSK_preferredLanguage') || 'it')
            .useMissingTranslationHandler('ngTranslateErrorHandler')
            // .useMissingTranslationHandlerLog()
            .useSanitizeValueStrategy('escapeParameters');


    }]);