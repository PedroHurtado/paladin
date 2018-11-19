angular.module('paladinApp')
.service('appStateManager', ['enums','$base64',function (enums,$base64) {
    /// Filled from server and localStorage
    let appState = {
        currentLang: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it',
        getCurrentLang: () => appState.currentLang == 'it' ? 'it-IT' : appState.currentLang,
        user: null,
        chatUser: null,
        getUserId: () => {
            let userId;
            const hash = localStorage.getItem(enums.localStorageKeys.userId);
            userId = $base64.decode(hash).split(':')[1] || undefined;
            return userId;
        },
        location: null, // Filled from geoLocation service -> dataService
        categoriesDict: null,
    };

    return appState;
}]);