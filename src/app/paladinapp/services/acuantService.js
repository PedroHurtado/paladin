'use strict';
angular.module('paladinApp')
    .service('acuantService',[
        '$rootScope',
        '$http',
        '$base64',
        function (
            $rootScope,
            $http,
            $base64) {

            const ACUANT_URL = 'https://cssnwebservices.com/CSSNService/CardProcessor';
            const LISENCE = $base64.encode(window.globals.isProd() ? 'A0E66E952D88' : 'E265037472E6');
            const post = (path,imageData) => {
                return $http({
                    method: 'POST',
                    url: ACUANT_URL + path,
                    headers: {
                        // 'Access-Control-Allow-Headers': 'Content-Type',
                        // 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        // 'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/octet-stream; charset=utf-8;',
                        'Authorization': `LicenseKey ${LISENCE}`,
                    },
                    
                    dataType: 'json',
                    data: imageData,

                })
            };
            const postDuplex = (path,imageData) => {
                return $http({
                    method: 'POST',
                    url: ACUANT_URL + path,
                    transformRequest: angular.identity,
                    headers: {
                        // 'Access-Control-Allow-Headers': 'Content-Type',
                        // 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        // 'Access-Control-Allow-Origin': '*',
                        'Content-Type': undefined,
                        'Authorization': `LicenseKey ${LISENCE}`,
                    },
                    
                    dataType: 'json',
                    data: imageData,

                })
            };
            const processPassportImage = ({imageToProcess, imageSource, usePreprocessing}) => {
                return post(`/ProcessPassport/true/true/true/0/150/${usePreprocessing.toString()}/${imageSource.toString()}/true/false`,imageToProcess);
            };

            const processNICDLDuplexImage = ({frontImage, backImage,selectedRegion, imageSource, usePreprocessing}) =>{
                const imgsToProcess = new FormData();
                imgsToProcess.append("frontImage", frontImage);
                imgsToProcess.append("backImage", backImage);
                return postDuplex(`/ProcessDLDuplex/${selectedRegion}/true/-1/true/false/true/0/150/${imageSource.toString()}/${usePreprocessing.toString()}/true/false`, imgsToProcess);
                    // .success(function(){
                    //     console.log("SUCCESS");
                    // })
                    // .error(function(){
                    //     console.log("ERROR");
                    // });
            };


            const processDriversLicense = ({imageToProcess, selectedRegion, imageSource, usePreprocessing}) => {
                return post(`/ProcessDriversLicense/${selectedRegion}/true/-1/true/true/true/0/150/${usePreprocessing.toString()}/${imageSource.toString()}/true/false`,imageToProcess)
            };

            const processFacialMatch = ({idFaceImage, selfie}) => {
                const facialMatchData = new FormData();
                facialMatchData.append("idFaceImage", idFaceImage);
                facialMatchData.append("selfie", selfie);
                return post(`/FacialMatch`,facialMatchData);
            };


            return {
                processPassportImage,
                processNICDLDuplexImage,
                processFacialMatch,
                processDriversLicense
            }
    }]);