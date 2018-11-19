angular.module('paladinApp').service('referralsService',
    [
        '$q',
        '$location',
        'apiService',
        function (
            $q,
            $location,
            apiService
        ) {

            this.userName = null;
            this.referralCode = null;

            this.validateReferralCode = (referralNameCode) => {
                let self = this;

                // referralCode includes the userName
                let referralCode = referralNameCode;

                let parts = referralNameCode.split('-');
                // remove the alpha-numeric part which is last
                parts.pop();
                let userName = parts.join(' ');

                // do some validation here to avoid unnecessary api calls
                /*
                                if(!referralCode || !referralCode.match(/^[a-z0-9]{6}$/i)){
                                    $location.path('/');
                                    return false;
                                }
                */

                return $q(
                    function (resolve, reject) {
                        return apiService.users.signUpReferred(referralCode)
                            .then(
                                function (result) {
                                    self.userName = userName;
                                    self.referralCode = referralCode;

                                    resolve({
                                        userName: self.userName,
                                        referralCode: self.referralCode
                                    });
                                },
                                function (reason) {
                                    // redirect to normal registration or some handler page
                                    $location.path('/');
                                    reject(reason);
                                });

                    },
                    function (reason) {
                        console.info('Validating the referralCode was rejected with reason: ', reason);
                    })
            };

            this.getReferralData = () => {
                return {
                    userName: this.userName,
                    code: this.referralCode
                }
            }
        }
    ]);
