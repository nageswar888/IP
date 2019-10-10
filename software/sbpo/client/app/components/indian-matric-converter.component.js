'use strict';
(function() {
    angular
        .module('sbpo').directive('indianMatricConverter', indianMatricConverter);
    indianMatricConverter.$inject = ['$filter','$locale'];

    function indianMatricConverter($filter,$locale) {
        var directive={
            restrict: 'A',
            require: 'ngModel',
            link:link
        };
        function link(scope, elem, attrs, modelCtrl){
            modelCtrl.$formatters.push(filterFunc);
            modelCtrl.$parsers.push(function (newViewValue) {
                var oldModelValue = modelCtrl.$modelValue;
                var newModelValue = toNumber(newViewValue);
                var pos = getCaretPosition(elem[0]);
                if(newViewValue.endsWith('.')){
                    modelCtrl.$viewValue = newViewValue
                } else if(isNaN(newModelValue)) {
                    newModelValue = "";
                    modelCtrl.$viewValue = newModelValue
                } else{
                    modelCtrl.$viewValue = filterFunc(newModelValue);
                }
                elem.val(modelCtrl.$viewValue);
                var newPos = pos + modelCtrl.$viewValue.length -
                    newViewValue.length;
                setCaretPosition(elem[0], newPos);
                return newModelValue;
            });
        }
        var decimalSep = $locale.NUMBER_FORMATS.DECIMAL_SEP;
        var toNumberRegex = new RegExp('[^0-9\\' + decimalSep + ']', 'g');
        var trailingZerosRegex = new RegExp('\\' + decimalSep + '0+$');
        var filterFunc = function (value) {
            return $filter('indianAmtMatricInput')(value);
        };

        function getCaretPosition(input){
            if (!input) return 0;
            if (input.selectionStart !== undefined) {
                return input.selectionStart;
            } else if (document.selection) {
                // Curse you IE
                input.focus();
                var selection = document.selection.createRange();
                selection.moveStart('character', input.value ? -input.value.length : 0);
                return selection.text.length;
            }
            return 0;
        }

        function setCaretPosition(input, pos){
            if (!input) return 0;
            if (input.offsetWidth === 0 || input.offsetHeight === 0) {
                return; // Input's hidden
            }
            if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(pos, pos);
            }
            else if (input.createTextRange) {
                // Curse you IE
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        }

        function toNumber(currencyStr) {
            return parseFloat(currencyStr.replace(toNumberRegex, ''), 10);
        }
        return directive;
    }
}());
