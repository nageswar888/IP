/**
 * Created by surendra on 20/10/16.
 */


/**
 * Created by surendra on 18/10/16.
 */
'use strict';
(function() {
    angular.module('sbpo.utils')
        .factory('passUtilsService',passUtilsService);
    passUtilsService.$inject = ['$dateParser','$rootScope','$uibModal','api','customFieldService','customType', 'adviceStatus','$filter','virtualLedgerService','$q'];
    function passUtilsService($dateParser,$rootScope,$uibModal,api,customFieldService,customType, adviceStatus,$filter,virtualLedgerService,$q) {
        console.log("this is pass utils service");
        var passUtilService = {
            convertINRToWord:convertINRToWord,
            number2text:number2text,
            convert_number:convert_number,
            frac:frac,
            getCurrentDate:getCurrentDate,
            isEmpty:isEmpty,
            findIndexByKeyAndValue:findIndexByKeyAndValue,
            findIndexByValue:findIndexByValue,
            hasAnyRole:hasAnyRole,
            findByKeyAndValue:findByKeyAndValue,
            findAllByKeyAndValue:findAllByKeyAndValue,
            getTotalAmount:getTotalAmount,
            prepareDownloadAllQuery:prepareDownloadAllQuery,
            getYearQuery:getYearQuery,
            getMonthQuery:getMonthQuery,
            getWeekQuery:getWeekQuery,
            getDayQuery:getDayQuery,
            getMonthWeekNumber:getMonthWeekNumber,
            formatDateString:formatDateString,
            canEditAdvice:canEditAdvice,
            canApproveAdvice:canApproveAdvice,
            canDisburseAdvice:canDisburseAdvice,
            canViewPendingAdvice:canViewPendingAdvice,
            getInprogreessText:getInprogreessText,
            checkStatus:checkStatus,
            getValuesByKey:getValuesByKey,
            toDateObject:toDateObject,
            verifyPasscode:verifyPasscode,
            verifyPasscodeModal:verifyPasscodeModal,
            getSortedWeekData:getSortedWeekData,
            populateCustomFields:populateCustomFields,
            parseDate:parseDate,
            getUserName: getUserName,
            convertToSentenceCase:convertToSentenceCase,
            getUserFullName : getUserFullName,
            canEditAdviceUrgentField: canEditAdviceUrgentField,
            /*freezeActionIcons :freezeActionIcons,*/
            getProjectFullName:getProjectFullName,
            getAllVirtualLedgers:getAllVirtualLedgers,
            replaceSpecialCharacters:replaceSpecialCharacters

        };
        return passUtilService;
        function getProjectFullName(projectName){
            if(typeof projectName === undefined || projectName.length === 0){
                return undefined;
            } else{return projectName;}
        }
        /*function freezeActionIcons() {
         var $cache = $('#adviceFilterBox');
         var vTop = $cache.offset().top;
         angular.element(window).bind("scroll", function () {
         var y = this.pageYOffset;
         if (y >= vTop) {
         angular.element('.groupFilter').find("ul").addClass('freezeActionItem');
         angular.element('.groupFilter').find("ul").addClass('groupScroll');
         angular.element('.sortFilter').addClass('freezeActionItem');
         angular.element('.sortFilter').addClass('sortScroll');
         angular.element('.paymentFilter').addClass('freezeActionItem');
         angular.element('.paymentFilter').addClass('paymentScroll');
         }
         else {
         angular.element('.groupFilter').find("ul").removeClass('freezeActionItem');
         angular.element('.groupFilter').find("ul").removeClass('groupScroll');
         angular.element('.sortFilter').removeClass('freezeActionItem');
         angular.element('.sortFilter').removeClass('sortScroll')
         angular.element('.paymentFilter').removeClass('freezeActionItem');
         angular.element('.paymentFilter').removeClass('paymentScroll');
         }
         });
         }*/
        function convertToSentenceCase(sentence){
            var sentenceCaseString="";
            if(!!sentence){
                var n=sentence.split(".");
                for(var i=0;i<n.length;i++)
                {
                    var spaceput="";
                    var spaceCount=n[i].replace(/^(\s*).*$/,"$1").length;
                    n[i]=n[i].replace(/^\s+/,"");

                    var newstring=n[i].charAt(n[i]).toUpperCase() + n[i].slice(1);

                    for(var j=0;j<spaceCount;j++)
                        spaceput=spaceput+" ";
                    sentenceCaseString=sentenceCaseString+spaceput+newstring+".";
                }
                sentenceCaseString=sentenceCaseString.substring(0, sentenceCaseString.length - 1);
            }
            return sentenceCaseString;

        }

        function parseDate(s) {
            if(s){
                var months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,
                    jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
                var p = s.split('-');
                return new Date(p[2], months[p[1].toLowerCase()], p[0]).getTime();
            }
        }

        function checkStatus(value,status){
            if(value===1){
                if($rootScope.totalAviceStatus.indexOf(status) > -1){
                    return true;
                }
            }
            else if(value===2){
                if($rootScope.adviceStatusWithOutSubmitted.indexOf(status) > -1){
                    return true;
                }
            }
            else if(value===3){
                if($rootScope.adviceStatusWithOUtSubmittedLevel2.indexOf(status) > -1){
                    return true;
                }
            }
            else if(value===4){
                if($rootScope.adviceStatusDisburserApprovedDisbursed.indexOf(status) > -1){
                    return true;
                }
            }
            else if(value===5){
                if($rootScope.adviceStatusDisbursed.indexOf(status) > -1){
                    return true;
                }
            }
        }
        function getInprogreessText(status){
            var text={
                intText:'',
                level2Text:'',
                level3Text:'',
                disbText:''
            };
            if(status==='Submitted'){
                text.intText='Submitted';
                text.level2Text='Level 2 Pending';
                text.level3Text='Level 3 Not Reached';
                text.disbText='Disburser Not Reached';
                return text
            }
            else if(status==='Level 2 Approved'){
                text.intText='Submitted';
                text.level2Text='Level 2 Approved';
                text.level3Text='Level 3 Pending';
                text.disbText='Disburser Not Reached';
                return text
            }
            else if(status==='Level 3 Approved'){
                text.intText='Submitted';
                text.level2Text='Level 2 Approved';
                text.level3Text='Level 3 Approved';
                text.disbText='Disburser Pending';
                return text
            }
        }
        /**
         * this function checks user can view pending advices
         * */
        function canViewPendingAdvice(status){
            var showButton=false;
            if($rootScope.isLevel2ApproverRole() && status=='Submitted'){
                showButton=true
            }
            else if($rootScope.isLevel3ApproverRole() && status=='Level 2 Approved'){
                showButton=true
            }
            else if($rootScope.isDesRole() && status=='Level 3 Approved'){
                showButton=true
            }
            else if( $rootScope.isInitiatorRole && status=='Draft'){
                showButton=true
            }
            return showButton;
        }
        /**
         * this fuction checks user can edit advice
         * */
        function canEditAdvice(advice) {
            if(advice.adviceStatus===adviceStatus.DRAFT && $rootScope.isInitiator()){return true;}
            if(advice.adviceStatus===adviceStatus.SUBMITTED && $rootScope.isLevel2ApproverRole()){return true;}
            if(advice.adviceStatus===adviceStatus.APPEOVED_BY_2 && $rootScope.isLevel3ApproverRole()){return true;}
            if(advice.adviceStatus===adviceStatus.APPEOVED_BY_3 && $rootScope.isDesRole()){return true;}
            if(advice.adviceStatus===adviceStatus.DISBURSED && $rootScope.isMasterAdmin()){return true;}
            return false
        }
        /**
         * this fuction checks user can edit advice urgent field
         * */
        function canEditAdviceUrgentField(advice) {
            if(advice.adviceStatus==='Submitted' && $rootScope.isLevel2ApproverRole()){return true;}
            if(advice.adviceStatus==='Level 2 Approved' && $rootScope.isLevel3ApproverRole()){return true;}
            return false
        }
        /**
         * this fuction checks user can approve advice
         * */
        function canApproveAdvice(advice) {
            if(advice.adviceStatus==='Submitted' && $rootScope.isLevel2ApproverRole()){return true;}
            if(advice.adviceStatus==='Level 2 Approved' && $rootScope.isLevel3ApproverRole()){return true;}
            return false
        }
        /**
         * this fuction checks user can disburse advice
         * */
        function canDisburseAdvice(advice) {
            if(advice.adviceStatus==='Level 3 Approved' && $rootScope.isDesRole()){return true;}
            return false
        }
        /**
         * this fuction gives the amount from a advice
         *@param{object} advice
         *@param{string} key
         *@returns {Number}
         * */
        function getTotalAmount(advice, key){
            var totalAmount=0;
            angular.forEach(advice,function(data){
                totalAmount+=Number(data[key]);
            });
            return totalAmount;
        }
        /**
         * Check the object is empty or undifined
         * @param val
         * @returns {boolean}
         */
        function isEmpty(val){
            return (val === null || val === undefined || val === '' || ((val instanceof Object) &&
            (Object.keys(val).length)==0))
        }


        /**
         * this fuction convert the INR to words
         *@param{Number} value
         *@returns {String}
         * */
        function convertINRToWord(value){
            return number2text(value)
        }

        function number2text(value) {
            var fraction = Math.round(frac(value)*100);
            var f_text  = "";

            if(fraction > 0) {
                f_text = "And "+convert_number(fraction)+" Paise";
            }

            if(convert_number(value)!="Number out of range!"){
                return "Rs. "+convert_number(value)+"  "+f_text+" Only/-";
            }else{
                return convert_number(value)+"  "+f_text
            }
        }

        function frac(f) {
            return f % 1;
        }

        function convert_number(number)
        {
            if ((number < 0) || (number > 999999999999999999))
            {
                return "Number out of range!";
            }

            if (number < 0)
            {
                return "Negative NUMBER!";
            }
            var Gn = Math.floor(number / 10000000);  /* Crore */
            number -= Gn * 10000000;
            var kn = Math.floor(number / 100000);     /* lakhs */
            number -= kn * 100000;
            var Hn = Math.floor(number / 1000);      /* thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100);       /* Tens (deca) */
            number = number % 100;               /* Ones */
            var tn= Math.floor(number / 10);
            var one=Math.floor(number % 10);
            var res = "";

            if (Gn>0)
            {
                res += (convert_number(Gn) + " Crore");
            }
            if (kn>0)
            {
                res += (((res=="") ? "" : " ") +
                convert_number(kn) + " Lakh");
            }
            if (Hn>0)
            {
                res += (((res=="") ? "" : " ") +
                convert_number(Hn) + " Thousand");
            }

            if (Dn)
            {
                res += (((res=="") ? "" : " ") +
                convert_number(Dn) + " Hundred");
            }


            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six","Seven", "Eight", "Nine", "Ten",
                "Eleven", "Twelve", "Thirteen","Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen","Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Fourty", "Fifty", "Sixty","Seventy", "Eighty", "Ninety");

            if (tn>0 || one>0)
            {
                if (!(res==""))
                {
                    res += " And ";
                }
                if (tn < 2)
                {
                    res += ones[tn * 10 + one];
                }
                else
                {

                    res += tens[tn];
                    if (one>0)
                    {
                        res += (" " + ones[one]);
                    }
                }
            }

            if (res=="")
            {
                res = "zero";
            }
            return res;
        } //end of convert number to text


        /**
         * @desc  function for getCurrentDate
         * @returns current date
         * */
        function getCurrentDate() {
            var date = new Date();
            return date;
        }


        /**
         * Finds and returns the first object in array of objects by using the key and value
         * @param a
         * @param key
         * @param value
         * @returns {*}
         */
        function findByKeyAndValue(a, key, value) {
            for (var i = 0; i < a.length; i++) {
                if ( a[i][key] && a[i][key] === value ) {return a[i];}
            }
            return null;
        }

        /**
         * Finds and returns the all object as array from array of objects by using the key and value
         * @param a
         * @param key
         * @param value
         * @returns {*}
         */
        function findAllByKeyAndValue(a, key, value) {
            var array = [];
            for (var i = 0; i < a.length; i++) {
                if ( a[i][key] && a[i][key] === value ) { array.push(a[i]);}
            }
            return array;
        }

        /**
         * Finds and returns the first object index in array of objects by using the key and value
         * @param a
         * @param key
         * @param value
         * @returns {*}
         */
        function findIndexByKeyAndValue(a, key, value) {
            for (var i = 0; i < a.length; i++) {
                if ( a[i][key] && a[i][key] === value ) {return i;}
            }
            return -1;
        }

        function findIndexByValue(a, value) {
            for (var i = 0; i < a.length; i++) {
                if ( a[i] && a[i] === value ) {return i;}
            }
            return -1;
        }

        function hasAnyRole(listOfRoles, roles) {
            for (var i = 0; i < roles.length; i++) {
                if ( roles[i] && findIndexByValue(listOfRoles, roles[i]) >= 0 ) {return true;}
            }
            return false;
        }

        function toDateObject(dateString) {
            if (dateString && dateString.indexOf("-") !== -1){
                return new Date(dateString.replace(/-/g, ' '));
            } else {
                return new Date(dateString);
            }
        }

        function prepareDownloadAllQuery(jsonObject) {
            var query = {};

            return query;
        }

        function getYearQuery(year) {
            return {
                fromDate: year+"/01/01/",
                toDate: year+"/12/31"
            }
        }

        function covertDate(date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('/');
        }

        function getMonthQuery(monthNumber,monthYear){


            var monthDate =  monthYear+"/"+(monthNumber+1)+"/"+"15";
            var date = new Date(monthDate);

            var startDate = new Date(date.getFullYear(), monthNumber, 1);
            var endDate = new Date(date.getFullYear(), (monthNumber) + 1, 0);

            return {
                fromDate: startDate.getFullYear()+"/"+(startDate.getMonth()+1)+"/"+startDate.getDate(),
                toDate: endDate.getFullYear()+"/"+(endDate.getMonth()+1)+"/"+endDate.getDate()
            }
        }

        function getWeekQuery(date) {
            var first = new Date(date).getDate() - new Date(date).getDay(); // First day is the day of the month - the day of the week
            var last = '';
            if(first < 0) {
                first = 1;
                var lastDate = moment(new Date(date)).endOf('week').toDate();
                last = new Date(lastDate).getDate();
            }
            else if(first === 0) {
                first = 1;
                last = 6;
            }
            else {
                var lastDate = moment(new Date(date)).endOf('week').toDate();
                last = new Date(lastDate).getDate();
                //last = first + 6; // last day is the first day + 6
            }

            var startDate = new Date(new Date(date).setDate(first))
            var endDate = new Date(new Date(date).setDate(last))

            if(startDate.getDate() > endDate.getDate()) {
                var lastDayOfMonth = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth()+1, 0);
                endDate = lastDayOfMonth;
            }

            return {
                fromDate: startDate.getFullYear()+"/"+(startDate.getMonth()+1)+"/"+startDate.getDate(),
                toDate: endDate.getFullYear()+"/"+(endDate.getMonth()+1)+"/"+endDate.getDate()
            }
        }

        function getDayQuery(date) {
            var dateNum = new Date(date).getDate()
            var day = new Date(date).getDay()
            var year = new Date(date).getFullYear()
            var month = new Date(date).getMonth()

            return {
                fromDate: year+"/"+(month+1)+"/"+dateNum,
                toDate: year+"/"+(month+1)+"/"+dateNum,
            }
        }

        function getMonthWeekNumber(date) {
            var firstDay = new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1).getDay();
            return Math.ceil((new Date(date).getDate() + firstDay)/7);
        }
        // convert date string into date with format
        function formatDateString(dateString, inputFormat, outputFormat) {
            return $dateParser(dateString, inputFormat);
        }

        function getValuesByKey(data, key) {
            var values = [];
            for (var i = 0; i < data.length; i++) {
                values.push(data[i][key]);
            }
            return values;
        }
        function verifyPasscode(query){
            return api.verifyPasscode({q:query}).$promise;
        }
        function getSortedWeekData(weekGraphData){
            var keys = Object.keys(weekGraphData).sort();
            /*keys.map(function(i,e){
             var data = i.toString();
             return data.substring(0, data.indexOf(","))
             }).sort();*/

            var sortedObj = {};
            for(var i=0; i<keys.length; i++) {
                var currentKey = keys[i];
                sortedObj[currentKey] = weekGraphData[currentKey];
            }
            return sortedObj;
        }
        /**
         *
         * @param advice {*}
         * @param callback
         * @param showComment {boolean}
         * @param user {*}
         * @param submitLabel value
         */
        function verifyPasscodeModal( advice, callback, showComment, user, submitLabel){
            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/verifyPasscode.html'),
                controller: function ($uibModalInstance,passUtilsService,Flash,$filter) {
                    var vm=this;
                    vm.user=user;
                    vm.verifyPasscode=verifyPasscode;
                    vm.showComment=showComment;
                    vm.submitLabel=submitLabel;
                    function verifyPasscode(form){
                        var query={
                            advice:advice,
                            passcode:vm.passcode,
                            comment:vm.comment
                        };
                        passUtilsService.verifyPasscode(query).then(verifyPasscodeSuccess).catch(verifyPasscodeFail);
                        function verifyPasscodeSuccess(response){
                            console.log(response);
                            if(response.status=='FAILED'){
                                Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'errorFlashMsgDiv');
                            }else{
                                $uibModalInstance.dismiss('cancel');
                                if(callback) {
                                    callback(vm.comment);
                                }
                            }

                        }
                        function verifyPasscodeFail(error){
                            console.log(error);
                        }
                    }
                    vm.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');
                    }
                },
                controllerAs:'vm'
            });
        }

        /**
         * populates custom fields
         * @param type
         * @param idKey
         * @param nameKey
         * @returns {Array}
         */
        function populateCustomFields(type, idKey, nameKey){
            idKey = idKey ? idKey : 'key';
            nameKey = nameKey ? nameKey : 'value';
            var paymentTypes=[];
            customFieldService.listAllCustomFields(type).then(function(response){
                angular.forEach(response.data,function(data){
                    var eachCustomField = {};
                    eachCustomField[idKey] = data.id;
                    eachCustomField[nameKey] = data.name;
                    paymentTypes.push(eachCustomField);
                });
            }, function(failure){
                console.log(failure);
            });
            return paymentTypes;
        }

        function getUserName(userObj) {
            if(userObj) {
                return userObj.firstName + " " + userObj.lastName;
            }
            return '';
        }

        /**
         * getting full name or a user
         * @param user
         * @returns {string}
         */
        function getUserFullName(user){
            if(user) {
                var firstName = '', middleName = '', lastName = '';
                if (user.firstName) {
                    firstName = user.firstName;
                }
                if (user.middleName) {
                    middleName = user.middleName;
                }
                if (user.lastName) {
                    lastName = user.lastName;
                }
                return firstName + ' ' + middleName + ' ' + lastName;
            } else
                return '';
        }
        function getAllVirtualLedgers(name,type) {
            var discriminator, virtualLedgerOptions=[];
            var searchDefer=$q.defer();
            if(type === 'ledger'){
                type=ledgerType.LEDGER;
            }
            else if(type === 'virtualledger'){
                type=ledgerType.VIRTUAL_LEDGER;
            }
            virtualLedgerService.getVirtualLedgersByName(name,type)
                .then(successCallback)
                .catch(errorCallback);
            function successCallback(response) {
                console.log(response)
                if (response.status == 200) {
                    virtualLedgerOptions= $filter('orderBy')(response.data, 'name');
                    searchDefer.resolve(virtualLedgerOptions)
                } else {
                    searchDefer.reject(virtualLedgerOptions)
                }
            }
            function errorCallback(error) {
                console.log(error);
            }
            return searchDefer.promise
        }

        /**
         * This function will replace special characters with encoded value
         * @param property
         * @returns {*}
         */
        function replaceSpecialCharacters(property) {
            if(property) {
                return property.
                replace('&',/%26/gi).
                replace('=',/%3D/gi).
                replace('#',/%23/gi).
                replace('@',/%40/gi).
                replace('$',/%24/gi).
                replace('%',/%25/gi).
                replace('^',/%5E/gi).
                replace(',',/%2C/gi).
                replace('<',/%3C/gi).
                replace('>',/%3E/gi).
                replace('+',/%2B/gi).
                replace('?',/%3F/gi);
            }
            else {
                return property;
            }
        }
    }

}());

