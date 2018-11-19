angular.module('paladinApp')
    .service('geoLocationService',[
        '$rootScope',
        'appStateManager',
        'ptLog',
        function (
            $rootScope,
            appStateManager,
            ptLog) {
            const TAG = 'geoLocationService || ';
            const geocoder = new google.maps.Geocoder();

            const getGeoLocationPostion = () => {
                return new Promise((resolve,reject) => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(resolve,reject)//,{timeout: 5 * 1000}) // drop results that take more than five secs
                    } else {
                        reject({message: 'goeLocation not supported by browser'})
                    }
                })
            };

            const getLocation = () => {
                return new Promise((resolve,reject) => {
                    ptLog.log('GET USER LOCATION');
                    getGeoLocationPostion()
                        .then((position => {
                            let data = {
                                location: {
                                    lat:position.coords.latitude,
                                    lng: position.coords.longitude
                                }
                            };
                            geoCodeLocation(data)
                                .then((results) => {
                                    resolve(results)
                                })
                                .catch(reject)

                        }))
                        .catch((err) => {
                            ptLog.error(TAG, JSON.stringify(err));
                            ptLog.log(TAG,'Getting default location');
                            const defaultLoc = getDefaultLocationAddressForLang();
                            geoCodeLocation(defaultLoc)
                                .then((results) => {
                                    resolve(results)
                                })
                                .catch(reject)
                        })
                })
            };


            const geoCodeLocation = (locData) => {
                return new Promise((resolve,reject) => {
                    geocoder.geocode(locData, function (results, status) {
                        if (results && results.length > 0) {
                            resolve(results[0])
                        } else {
                            reject({status: status})
                        }
                    })
                })
            };

            const getDefaultLocationAddressForLang = () => {
                const lang = window.globals.SUPPORTED_LANGS.find((lang) => lang.code === appStateManager.currentLang);
                return lang ? {address: lang.defaultLocation} : { address: 'milan italy'}
            };

            const getUserCountryFromUserAddress = (address) => {
                return new Promise((resolve,reject) => {
                    geocoder.geocode({address},(results,status) => {

                        if (status == 'OK') {

                            if (results && results.length > 0) {
                                const {
                                    address_components
                                } = results[0];

                                if (address_components && address_components.length > 0) {
                                    const country = address_components.find((comp) => {
                                        const { types } = comp;
                                        if (types && types.length > 0) {
                                            return types[0].toLowerCase() === 'country';
                                        } else {
                                            return false
                                        }
                                    });

                                    if (country) {
                                       resolve(country)
                                    } else {
                                        reject(new Error('Country not found'))
                                    }

                                } else {
                                    reject(new Error('Address not found'))
                                }

                            } else {
                                reject(new Error('No results found'))
                            }

                        } else {
                            reject(new Error('Could not geocode address'))
                        }
                    })
                });
            };

            const getUserAddressFromCoordinates = ({lat,lng}) => {
                return new Promise((resolve,reject) => {
                    geocoder.geocode({ location: { lat, lng } },(results,status) => {

                        if (status === 'OK') {

                            if (results && results.length > 0) {
                                const streetAddress = results.find((res) => {
                                    const { types } = res;
                                    if (types && types.length > 0) {
                                        return types[0].toLowerCase() === 'street_address';
                                    } else {
                                        return false
                                    }
                                });

                                if (streetAddress) {
                                    resolve(streetAddress.formatted_address)
                                } else {
                                    reject(new Error('Address not found'))
                                }
                            } else {
                                reject(new Error('No results found'))
                            }

                        } else {
                            reject(new Error('Could not geocode coordinates'))
                        }
                    })
                });
            };
            return {
                getLocation,
                getUserCountryFromUserAddress,
                getUserAddressFromCoordinates
            }
        }]);