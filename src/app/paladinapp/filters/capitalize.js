angular.module('paladinApp').filter('capitalize', function() {
    return function(input){
        //console.log('capitalize : '+input)
        if (input) {
            if (input.indexOf(' ') !== -1) {
                var inputPieces,
                    i;

                input = input.toLowerCase();
                inputPieces = input.split(' ');

                for (i = 0; i < inputPieces.length; i++) {
                    inputPieces[i] = capitalizeString(inputPieces[i].trim());
                }

                return inputPieces.toString().replace(/,/g, ' ');
            }
            else {
                input = input.toLowerCase();
                return capitalizeString(input);
            }
        }
        function capitalizeString(inputString) {
            return inputString.substring(0, 1).toUpperCase() + inputString.substring(1);
        }

        return input
    };
});