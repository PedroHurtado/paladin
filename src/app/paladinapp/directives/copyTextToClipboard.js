angular.module('paladinApp')
    .directive('copyTextToClipboard', [
        '$mdToast',
        function ($mdToast) {
            return {
                restrict:'A',
                link: function ($scope, elem, attr) {

                    // requires an element with an ID to be present on page
                    // TODO: generalize for other uses

                    $(elem).click(()=>{

                        let containerId = attr.copyTextToClipboard;

                        if (document.selection) {
                            var range = document.body.createTextRange();
                            range.moveToElementText(document.getElementById(containerId));
                            range.select().createTextRange();
                            document.execCommand("copy");
                            $mdToast.showSimple('Text copied to clipboard');
                        } else if (window.getSelection) {
                            var range = document.createRange();
                            range.selectNode(document.getElementById(containerId));
                            window.getSelection().addRange(range);
                            document.execCommand("copy");
                            console.info("text copied");
                            $mdToast.showSimple('Text copied to clipboard');
                        }

                    })
                }
            };
        }]
    )
