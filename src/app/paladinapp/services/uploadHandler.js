angular.module('paladinApp')
.service('uploadHandler',[function () {
    this.convertInputElementToBas64 = function (inputElement) {
        return new Promise((resolve,reject) => {
            if (inputElement && inputElement.files && inputElement.files.length > 0) {
                return convertFile(inputElement.files[0]).then(resolve)
                    .catch(reject)
            } else {
                // No file uploaded
                reject('no file uploaded')
            }
        })
    };

    const convertFile = (imgFile) => {
        return new Promise((resolve,reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    const img64 = reader.result.replace(`data:${imgFile.type};base64,`, '');
                    resolve({
                        original64:reader.result,
                        serverParsed64: img64,
                    });
                } else
                    reject('error uploading image');
            };
            reader.readAsDataURL(imgFile);
        })
    }
}]);