angular.module('paladinApp')
.service('toastService',['$mdToast',function ($mdToast) {
    this.simpleToast = function (message,delay = 3000, isRight = true) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .hideDelay(delay)
                .position(isRight ? 'bottom right' : 'bottom left')
        );
    }
}]);