/**
 * Created by surendra on 21/10/16.
 */
/*
* TODO: future purpose for checking array object empty and size conditions
* */
(function() {
    'use strict';
    angular
        .module('sbpo.utils')
        .filter('roleName', roleName)
        .filter('isEmptyObject', isEmptyObject)
        .filter('filterAmount',filterAmount)
        .filter('filterStatus',filterStatus)
        .filter('dateFilterwithTime',dateFilterwithTime)
        .filter('dateFilter',dateFilter)
        .filter('dateFilterWithAMPM',dateFilterWithAMPM)
        .filter('indianAmtMatric',indianAmtMatric)
        .filter('indianAmtMatricInput',indianAmtMatricInput)
        .filter('getAmountInConvertedFormat',getAmountInConvertedFormat)
        .filter('adviceFilter', adviceFilter)
        .filter('rolesFilter', rolesFilter)
        .filter('limitRolesFilter', limitRolesFilter)
        .filter('RoleNames',RoleNames)
        .filter('camelCase',camelCase)
        .filter('enabledFilter',enabledFilter)
        .filter('adminMail',adminMail)
        .filter('nameFilter',nameFilter)
        .filter('reverse',reverse) ;

    function reverse(){
        return function(items) {
            return items.slice().reverse();
        };
    }

    function enabledFilter(){
        return function(input, scope) {
           if(input===false){
               return 'Inactive'
           }else{
               return 'Active'
           }
        }
    }
    function camelCase(){
        return function(input, scope) {
            if(input===undefined || input===''){
                return '';
            }else{
                input = input || '';
                return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

            }

        }
    }

    adviceFilter.$inject = ['$filter', '$cookies', '$rootScope', 'passUtilsService'];
    dateFilter.$inject = [];
    dateFilterWithAMPM.$inject=['$rootScope'];
    dateFilter.$inject=['$rootScope'];
    rolesFilter.$inject=['$rootScope','passUtilsService', '$filter'];
    function rolesFilter($rootScope, passUtilsService, $filter){
        return function(input, scope) {
            var roles=[];
            angular.forEach(input,function(data){
                var eachRole = passUtilsService.findByKeyAndValue($rootScope.roleNames, 'key', data)
                if(eachRole) {
                    roles.push(eachRole.label);
                }
            });
            roles = $filter('orderBy')(roles);
            return roles.join(", ");
        }
    }

    limitRolesFilter.$inject=['$rootScope', 'passUtilsService', '$filter'];
    function limitRolesFilter($rootScope, passUtilsService, $filter ){
        return function(input, scope) {
            var roles=[], count=0;
            angular.forEach(input,function(data){
                var eachRole = passUtilsService.findByKeyAndValue($rootScope.roleNames, 'key', data);
                if(eachRole) { roles.push(eachRole.label); }
            });
            roles = $filter('orderBy')(roles);
            var countText = roles.length>2 ? '+'+ (roles.length - 2) : '';
            roles = roles.slice(0,2);
            return roles.join(", ")+' '+countText;
        }
    }

    RoleNames.$inject = ['$rootScope'];
    //filter for role names
    function RoleNames($rootScope){
        return function(input) {
            input = input || '';

            angular.forEach($rootScope.roleNames, function(value, index) {
                if(value.key === input) {
                    input = value;
                    return;
                }
            });
            return input;
        };
    }
    //filter for date
    function dateFilter($rootScope){
        return function(input, scope) {
            if(input=== undefined || input===null || input===''){
                return '';
            }else{
                var commingDate=moment(new Date(input)).format($rootScope.dateFormate);
                var toDay=moment(new Date()).format($rootScope.dateFormate);

                var dateObj = new Date();
                var month = dateObj.getUTCMonth() + 1; //months from 1-12
                var day = dateObj.getUTCDate()-1;
                var year = dateObj.getUTCFullYear();
                var yesterDay = moment(new Date(year+"-"+month+"-"+day)).format($rootScope.dateFormate);
                if(commingDate===toDay)
                {
                    return "Today";
                }
                else if(commingDate===yesterDay)
                {
                    return "Yesterday";
                }
                else {
                    return commingDate;
                }
            }
        }
    }
    function dateFilterWithAMPM($rootScope) {
        return function(input, scope) {
            var monthNames = $rootScope.monthNames;
            var date=new Date(input)
            //var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;

            var ordinalStr = '';
            if(day===1){
                ordinalStr = 'st'
            }else if(day===2){
                ordinalStr = 'nd';
            }else if(day===3){
                ordinalStr = 'rd';
            }else{
                ordinalStr = 'th';
            }

            var strTime = day +ordinalStr+' '+monthNames[monthIndex]+' '+ year +' '+hours + ':' + minutes + ' ' + ampm;

           return strTime;
        }
    }
    function indianAmtMatric() {
        return function(input, scope) {
            var input=input;
            if(input== undefined || NaN){
                return '';
            }
            input=input.toString();
            var afterPoint = '';
            if(input.indexOf('.') > 0)
                afterPoint = input.substring(input.indexOf('.'),input.length);
            input = Math.floor(input);
            input=input.toString();
            var lastThree = input.substring(input.length-3);
            var otherNumbers = input.substring(0,input.length-3);
            if(otherNumbers != '')
                lastThree = ',' + lastThree;
            var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
            return res+'/-';
        }
    }

    function indianAmtMatricInput() {
        return function(input, scope) {
            if(input== undefined || NaN){
                return '';
            }
            var input = parseFloat(input) * Math.pow(10, 2);
            input = Math.round(input);
            input = input / Math.pow(10, 2);
            input=input.toString();
            var afterPoint = '';
            if(input.indexOf('.') > 0)
                afterPoint = input.substring(input.indexOf('.'),input.length);
            input = Math.floor(input);
            input=input.toString();
            var lastThree = input.substring(input.length-3);
            var otherNumbers = input.substring(0,input.length-3);
            if(otherNumbers != '')
                lastThree = ',' + lastThree;
            var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
            return res;
        }
    }

    function getAmountInConvertedFormat() {
        return function(input, scope) {
            var output = {
                data:0,
                symbol:''
            }
            if(input== undefined || NaN){
                return output;
            }
            var digit;
            var numberLength = Math.max(Math.floor(Math.log10(Math.abs(input))), 0) + 1;
            if(numberLength > 3 && numberLength <= 4) {
                digit = (''+input)[0];
                output.data = Number(digit);
                output.symbol = 'K';
            }
            else if(numberLength > 4 && numberLength <= 5) {
                digit = (''+input).substring(0, 2);
                output.data = Number(digit);
                output.symbol = 'K';
            }
            else if(numberLength > 5 && numberLength <= 6) {
                digit = (''+input)[0];
                output.data = Number(digit);
                output.symbol = 'L';
            }
            else if(numberLength > 6 && numberLength <= 7) {
                digit = (''+input).substring(0, 2);
                output.data = Number(digit);
                output.symbol = 'L';
            }
            else if(numberLength > 7 && numberLength <= 8) {
                digit = (''+input)[0];
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 8 && numberLength <= 9) {
                digit = (''+input).substring(0, 2);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 9 && numberLength <= 10) {
                //100Cr
                digit = (''+input).substring(0, 3);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 10 && numberLength <= 11) {
                //1,000Cr
                digit = (''+input).substring(0, 4);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 11 && numberLength <= 12) {
                //10,000Cr
                digit = (''+input).substring(0, 5);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 12 && numberLength <= 13) {
                //1,00,000Cr
                digit = (''+input).substring(0, 6);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 13 && numberLength <= 14) {
                //10,00,000Cr
                digit = (''+input).substring(0, 7);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 14 && numberLength <= 15) {
                //1,00,00,000Cr
                digit = (''+input).substring(0, 8);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 15 && numberLength <= 16) {
                //10,00,00,000Cr
                digit = (''+input).substring(0, 9);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else if(numberLength > 16 && numberLength <= 17) {
                //1,00,00,00,000Cr
                digit = (''+input).substring(0, 10);
                output.data = Number(digit);
                output.symbol = 'CR';
            }
            else {
                output.data = input;
                output.symbol = '';
            }
            return output;
        }
    }


    function dateFilterwithTime(){
        return function(input, scope) {
            var date=new Date(input)
            var commingDate=moment(new Date(input)).format("DD/MM/YYYY");
            var toDay=moment(new Date()).format("DD/MM/YYYY");
            //var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;


            var d = new Date();
            d.setDate(d.getDate()-1);
            console.log(d.toLocaleString());

            var yesterDay=moment(new Date(d.toLocaleString())).format("MM/DD/YYYY");
            if(commingDate===toDay)
            {
                return "Today at "+strTime;
            }
            else if(commingDate===yesterDay)
            {
                return "Yesterday at "+strTime;
            }
            else {
                return commingDate;
            }

        }
    }
    filterAmount.$inject=['passUtilsService'];
    function filterAmount(passUtilsService){

        return function (amount){
            return passUtilsService.convertINRToWord(amount);
        };

    }
    filterStatus.$inject=['$rootScope'];
    function filterStatus($rootScope){

        return function (status){

            if($rootScope.adviceStatuswithOutDisbursed.indexOf(status) > -1){
                var status='Inprogress';
                return status;
            }else{
                return status;
            }
        };

    }
    function roleName()
    {
        return function (input) {
            input = input || '';
            if (input === 'ROLE_INITIATOR') {
                return '(Advice Initiator)';
            }
            if (input === 'ROLE_LEVEL2APPROVER') {
                return '(Level 2 Approver)';
            }
            if (input === 'ROLE_LEVEL3APPROVER') {
                return '(Level 3 Approver)';
            }
            if (input === 'ROLE_DISBURSER') {
                return '(Disburser)';
            }
            if (input === 'ROLE_MASTERADMIN') {
                return '(Admin)';
            }
            if (input === 'ROLE_VIEWER') {
                return '(User)';
            }
            if (input === 'ROLE_PAYEE') {
                return '(Payee)';
            }
            return input;
        };
    }

    function isEmptyObject($filter) {
        //code
        return function(input) {
            if(input != '' || input !='undefined') {
                return true;
            }
            return false;
        };
    }

    /**
     * This filter is used to render advices based on role and his actions for Pending tab
     * It will render Submitted,Approved,Level 2 Approved,Level 3 Approved,Disbursed Approval statuses advices for
     * In-progress tab. And for Disbursed tab it will render Disbursed advices
     * @param $filter
     * @param $cookies
     * @param $rootScope
     * @returns {Function}
     */
    function adviceFilter($filter, $cookies,$rootScope,passUtilsService) {
        var inprogressTabStatuses = $rootScope.adviceStatuswithOutDisbursed;
        var disbursedTabStatuses = $rootScope.adviceStatusDisbursed;
        var pendingTabRoleBasedStatuses = $rootScope.adviceStatusOnRole;
        return function( items, condition) {
            var filtered = [];

            if(passUtilsService.isEmpty(condition)){
                return items;
            }

            if(condition === "Inprogress" ){
                angular.forEach(items, function(item) {
                    if(inprogressTabStatuses.indexOf(item.adviceStatus)>-1) {
                        filtered.push(item);
                    }
                });
                return filtered;
            }
            else if(condition === "Disbursed" ){
                angular.forEach(items, function(item) {
                    if(disbursedTabStatuses.indexOf(item.adviceStatus)>-1) {
                        filtered.push(item);
                    }
                });
                return filtered;
            }
            else if(condition === "Pending" ){
                if($rootScope.isInitiatorRole()) {
                    angular.forEach(items, function(item) {
                        if(pendingTabRoleBasedStatuses.initiatorRole.indexOf(item.adviceStatus)>-1) {
                            filtered.push(item);
                        }
                    });
                    return filtered;
                }
                if($rootScope.isLevel2ApproverRole() ) {
                    angular.forEach(items, function(item) {
                        if(pendingTabRoleBasedStatuses.level2ApproverRole.indexOf(item.adviceStatus)>-1) {
                            filtered.push(item);
                        }
                    });
                    return filtered;
                }
                if($rootScope.isLevel3ApproverRole()) {
                    angular.forEach(items, function(item) {
                        if(pendingTabRoleBasedStatuses.level3ApproverRole.indexOf(item.adviceStatus)>-1) {
                            filtered.push(item);
                        }
                    });
                    return filtered;
                }
                if($rootScope.isDesRole()) {
                    angular.forEach(items, function(item) {
                        if(pendingTabRoleBasedStatuses.disbursedRole.indexOf(item.adviceStatus)>-1) {
                            filtered.push(item);
                        }
                    });
                    return filtered;
                }
            }

            return filtered;
        };
    }

    function adminMail() {
        return function (input) {
            input = input || [];
            var mails = [];
            angular.forEach(input, function (admin, index) {
                mails.push(admin.email);
            });
            return mails.join(", ");
        }
    }
    nameFilter.$inject = ['passUtilsService'];
    /**
     * This filter is used to get full name of a user.
     * @param passUtilsService
     * @returns {fullName}
     */
    function nameFilter(passUtilsService){
        return function(input, scope) {
            var fullName='';
            if(input){
                fullName =  passUtilsService.getUserFullName(input);
            }
            return fullName;
        }
    }

}());

