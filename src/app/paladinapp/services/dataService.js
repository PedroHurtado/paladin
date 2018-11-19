angular.module('paladinApp')
    .service('dataService',[
        '$rootScope',
        'enums',
        'appStateManager',
        '$translate',
        'ptLog',
        '$base64',
        'apiService',
        '$state',
        'popupService',
        '$timeout',
        'geoLocationService',
        'chatService',
        '$interval',
        'ngMeta',
        '$location',
        function (
            $rootScope,
            enums,
            appStateManager,
            $translate,
            ptLog,
            $base64,
            apiService,
            $state,
            popupService,
            $timeout,
            geoLocationService,
            chatService,
            $interval,
            ngMeta,
            $location) {
        const TAG = 'dataService || ';
        let didInit = false;
        const init = function () {
            if (!didInit) {
                didInit = true;
                registerBus();
            }

            $translate.preferredLanguage(localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it');


            /// Load user if exists
            if (getUserId()) {
                getMe();
            }

            // getCategories();

            //geoLocationUpdate();
            // geoLocationUpdateInterval();
        };

        const registerBus = () => {
            $rootScope.$on(enums.busEvents.userLogin, (event, data) => {
                let {
                    oAuthToken,
                } = data;
                setTokens(oAuthToken);
                setUserId(data.User_Id);
                getMe();

            });

            $rootScope.$on(enums.busEvents.userSignup, (event, data) => {

            });

            $rootScope.$on(enums.busEvents.tokenRefresh,(event,data) => {
                setTokens(data)
            });

            $rootScope.$on(enums.busEvents.preferredLanguageChange, (event, data) => {
                localStorage.setItem(enums.localStorageKeys.preferredLanguage, data.currentLang);
                appStateManager.currentLang = data.currentLang;
                $translate.preferredLanguage(data.currentLang);
                $translate.use(data.currentLang);
                $translate.refresh();
                const newPath = location.pathname.replace(location.pathname.split('/')[1],data.currentLang);
                location.replace(newPath)
            });

            $rootScope.$on(enums.busEvents.userLogout,(event) => {
                chatService.disconnectChat();
                localStorage.clear();
                localStorage.setItem(enums.localStorageKeys.preferredLanguage,appStateManager.currentLang);
                (false);
                appStateManager.user = null;
                $rootScope.$emit(enums.busEvents.updatedUser,null);
                $state.go('app.home',{languageCode:appStateManager.currentLang});

            });


            $rootScope.$on(enums.busEvents.triggerEmailValidation,(event,data) => {
                popupService.showEmailVerification(data.userId)
                    .then(() => {
                        $state.go('app.home')
                    })
                    .catch(() =>{
                        $state.go('app.home')
                    })
            });
            $rootScope.$on('$destroy', () => {
                console.log('ROOT SCOPE IS DEAD')
            })
        };

        const geoLocationUpdate = () => {
            return new Promise((resolve, reject) => {
                ptLog.log(TAG, 'Starting location update');
                geoLocationService.getLocation()
                    .then((location) => {
                        updateGeoLocationStorage(location);
                        ptLog.log('Successfully got location');
                        resolve(location);
                    })
                    .catch((err) => {
                        ptLog.error(TAG, 'error getting location', JSON.stringify(err));
                        reject(err);
                    })
            })
        };

        const geoLocationUpdateInterval = () => {
            $timeout(() => {
                geoLocationUpdate()
                    .finally(() => {
                        geoLocationUpdateInterval();
                    })
            }, 10 * 1000)
        };

        const getGeoLocationForApp = () => {
            return new Promise((resolve,reject) => {
                if (appStateManager.location) {
                    resolve(appStateManager.location);
                } else if (localStorage.getItem(enums.localStorageKeys.locationLatLong)) {
                    const {lat, lng} = JSON.parse(localStorage.getItem(enums.localStorageKeys.locationLatLong));
                    resolve({
                        lat,
                        lng
                    })
                } else {
                    geoLocationUpdate()
                        .then((location) => {
                            const lat = location.geometry.location.lat(),
                                lng = location.geometry.location.lng();
                            resolve({
                                lat,
                                lng
                            })
                        })
                        .catch(reject)
                }
            })

        };

        const updateGeoLocationStorage = (location) => {
            appStateManager.location = location;
            const latLong = {
                lat: location.geometry.location.lat(),
                lng: location.geometry.location.lng()
            };
            localStorage.setItem(enums.localStorageKeys.locationLatLong,JSON.stringify(latLong));
            $rootScope.$emit(enums.busEvents.locationUpdate,latLong);
        };

        const getLatLong = () => {
            return new Promise((resolve,reject) => {
                const latLngStr = localStorage.getItem(enums.localStorageKeys.locationLatLong);
                if (!latLngStr) {
                    geoLocationUpdate()
                        .then(() => {
                            getLatLong().then(resolve).catch(reject)
                        })
                        .catch(reject)
                } else {
                    resolve(JSON.parse(latLngStr))
                }
            })
        };

        const setUserId = (userId) => {
            localStorage.setItem(enums.localStorageKeys.userId,$base64.encode(`${enums.secret}:${userId}`));
        };

        const setTokens = (oAuthToken) => {
            if (oAuthToken && oAuthToken.access_token && oAuthToken.token_type && oAuthToken.refresh_token) {
                localStorage.setItem(enums.localStorageKeys.jwtToken,`${oAuthToken.token_type} ${oAuthToken.access_token}`);
                localStorage.setItem(enums.localStorageKeys.refreshToken, oAuthToken.refresh_token)
            } else {
                ptLog.error(TAG,'Sign up successful but access token was not provided!');
            }
        };

        const getUserId = () => {
            return appStateManager.getUserId()
        };

        let messagesPollerInterval = undefined;
        const messagesPoller = (isStart) => {
                if (isStart) {
                    if (messagesPollerInterval) {
                        return new Error('message poller already active');
                    }
                    messagesPollerInterval = $interval(getUnreadMessages,30 * 1000);
                } else {
                    if (!messagesPollerInterval) {
                        return new Error('message poller already deactivated');
                    }
                    $interval.cancel(messagesPollerInterval);
                    messagesPollerInterval = undefined;
                }
        };

        const getUnreadMessages = () => {
            chatService.syncDialogList()
                .then((dialogsDict) => {
                    console.log(dialogsDict);
                    let nummberOfUnreadMessages = 0;
                    Object.keys(dialogsDict)
                        .forEach((dialog) => {
                            nummberOfUnreadMessages += dialogsDict[dialog];
                        });

                    $rootScope.$emit(enums.busChatEvents.updateUnreadCount,{
                        total: nummberOfUnreadMessages,
                        detailedDict: dialogsDict,
                    });

                })
                .catch((err) => {
                    if (err.code == 404) { // no chats, no messages
                        $rootScope.$emit(enums.busChatEvents.updateUnreadCount,{
                            total: 0,
                            detailedDict: {},
                        });
                    } else  {
                        ptLog.error(err)
                    }
                })
        };

        const getCategories = () => {
            apiService.categories.getCategories()
                .then((response) => {
                    let catDict = {};

                    response.Data.forEach((item) => catDict[item.Category_Id] = item);
                    appStateManager.categoriesDict = catDict;
                    $rootScope.$emit(enums.busEvents.categoriesUpdate,catDict);
                })
                .catch((err) => {
                    ptLog.error(err);
                })
        };

        const getMe = () => {
            const userId = getUserId();
            if (userId) {
                apiService.users.getUserProfile({userId})
                    .then((response) => {
                        appStateManager.user = response.Data;
                        ptLog.log(TAG,'Fetched user profile');
                        $rootScope.$emit(enums.busEvents.updatedUser,appStateManager.user);
                        activatePendingPrivateState();
                        chatService.loginToChat()
                            .then(() => {
                                chatService.connectToChat()
                                    .then(() => {
                                        chatService.syncDialogList();
                                        messagesPoller(true);
                                    })
                                    .catch((err) => {
                                        console.error('Could not connect to chat',JSON.stringify(err));
                                    })
                            })
                    })
                    .catch((err) => {
                        ptLog.error(TAG,JSON.stringify(err));
                    })
            } else {
                ptLog.log(TAG,'User Id not found');
            }
        };


        const forceLogin = (transition) => {
            const nexState = transition.targetState();
            let stateObjToSave = {
                name: nexState.identifier().name,
                params: nexState.params(),
                options: nexState.options().current(),
            };
            setPendingPrivateState(stateObjToSave);
            popupService.showLoginSignupPopup(false)
                .catch((err) => {
                    // User decided not to login, delete saved state
                    setPendingPrivateState(null);
                })

        };

        const updateGeneralSEO = () => {
            const languageCode = appStateManager.currentLang;
            window.globals.SUPPORTED_LANGS.forEach((item) => {
               ngMeta.setTag(enums.ngMetaValues.currentUrl(item.code),$location.absUrl().replace(`/${languageCode}/`,`/${item.code}/`));
            });
        };

        const setPendingPrivateState = (state) => {
                if (state) {
                    const encodedState = $base64.encode(`${enums.secret}|:${JSON.stringify(state)}`);
                    localStorage.setItem(enums.localStorageKeys.pendingPrivateState,encodedState);
                } else {
                    localStorage.removeItem(enums.localStorageKeys.pendingPrivateState)
                }
        };

        const activatePendingPrivateState = () => {
            const encodedState = localStorage.getItem(enums.localStorageKeys.pendingPrivateState);
            if (encodedState) {
                const targetState = JSON.parse($base64.decode(encodedState).split('|:')[1]);
                if (targetState) {
                    setPendingPrivateState(null);
                    $state.go(targetState.name,targetState.params,targetState.options);
                }
            }
        };

        return {
            init,
            setUserId,
            getUserId,
            getCategories,
            getGeoLocationForApp,
            forceLogin,
            updateGeneralSEO,
        }
}]);