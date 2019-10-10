var Q = require('q');
const uuidV1 = require('uuid/v1');
const constants = require('./constants');
var parseDomain = require('parse-domain');
var passwordHash = require('password-hash');
var typeEnum = require("../enums/customType");
var stampEnum = require("../enums/stampType");
var AdviceModel = require('../models/AdviceModel');
var PaymentRequestModel = require('../models/PaymentRequestModel');
var CustomFieldsModel = require('../models/CustomFieldsModel');
var UserModel= require('../models/UserModel');
var ObjectId = require('mongoose').Types.ObjectId;
var _ = require('lodash');
var i18n = require("i18n");

var apiUtils = {
    validate: function(user, password) {
        return passwordHash.verify(password, user.passcode);
    },
    getAdviceById: function (id) {
        var deferred = Q.defer();
        var populate = [
            { path:'user' },
            { path:'secondLevelApprover' },
            { path:'thirdLevelApprover' },
            { path:'disburser' },
            { path: 'payee', populate: { path: 'user'}},
            { path:'project' },
            { path:'organization' },
            { path:'bank' },
            { path:'paymentType'},
            { path: 'category'},
            { path : 'ledger'}
        ];
        AdviceModel.findOne({_id: id})
            .populate(populate)
            .exec(function (error, data) {

                if (error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve(data);
                }
            });
        return deferred.promise;
    },
    getPaymentRequestById: function (id) {
        var deferred = Q.defer();
        var populate = [
            { path:'user' },
            { path: 'payee', populate: { path: 'user'}},
            { path:'project' },
            { path:'organization' },
            { path:'bank' },
            { path:'paymentType'}
        ];
        PaymentRequestModel.findOne({_id: id})
            .populate(populate)
            .exec(function (error, data) {

                if (error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve(data);
                }
            });
        return deferred.promise;
    },

    convertINRToWord: function(value){
        return this.number2text(value)
    },
    number2text: function(value) {
        var fraction = Math.round(this.frac(value)*100);
        var f_text  = "";

        if(fraction > 0) {
            f_text = "And "+this.convert_number(fraction)+" Paise";
        }

        return this.convert_number(value)+" "+f_text+" Only/-";
    },
    frac: function(f) {
        return f % 1;
    },
    convert_number: function(number)
    {
        /*if ((number < 0) || (number > 9999999999999999999999999))
         {
         return "NUMBER OUT OF RANGE!";
         }*/
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
            res += (this.convert_number(Gn) + " Crore");
        }
        if (kn>0)
        {
            res += (((res=="") ? "" : " ") +
            this.convert_number(kn) + " Lakh");
        }
        if (Hn>0)
        {
            res += (((res=="") ? "" : " ") +
            this.convert_number(Hn) + " Thousand");
        }

        if (Dn)
        {
            res += (((res=="") ? "" : " ") +
            this.convert_number(Dn) + " Hundred");
        }


        var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six","Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen","Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen","Nineteen");
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
    },
    prepareSearchQuery: function(queryParam, organizationId) {
        var query = {};
        var date = {};
        var amount = {};
        var payee={};
        /*TODO: Remove Below date conversions after verifying date availability in all scenarios */
        if(queryParam.toDate){
            var toDate = new Date(queryParam.toDate);
            toDate=toDate.setDate(toDate.getDate() + 1);
        }
        if(queryParam.fromDate){
            var fromDate=new Date(queryParam.fromDate);
            fromDate=fromDate.setDate(fromDate.getDate());
        }

        if(queryParam.toDate != null && queryParam.toDate != "") { date["$lt"] = new Date(toDate); }
        if(queryParam.fromDate != null && queryParam.fromDate != "") { date["$gte"] = new Date(fromDate); }
        if(queryParam.payee && queryParam.payee !== null) {query["payee"] = new ObjectId(queryParam.payee); }
        else if(queryParam.virtualLedger) {
            var payeeIds=[]
            for(var i=0;i< queryParam.virtualLedgerPayees.length;i++){
                payeeIds.push(new ObjectId(queryParam.virtualLedgerPayees[i]))
            }
            payee["$in"]=payeeIds
        }
        if(queryParam.status && queryParam.status !== null) {query["adviceStatus"] = queryParam.status; }
        if(queryParam.bankId && queryParam.bankId !== null) {query["bank"] = new ObjectId(queryParam.bankId); }
        if(queryParam.project && queryParam.project !== null) {query["project"] = new ObjectId(queryParam.project); }
        if(queryParam.paymentType && queryParam.paymentType !== null) {
            query["paymentType"] = new ObjectId(queryParam.paymentType); }
        if(queryParam.category && queryParam.category !== null) {
            query["category"] = new ObjectId(queryParam.category);
        }
        if(queryParam.adviceNum) {query["adviceNumber"] = queryParam.adviceNum; }

        if(queryParam.fromAmount || queryParam.fromAmount===0){ amount["$gte"] = queryParam.fromAmount; }
        if(queryParam.toAmount || queryParam.toAmount===0){ amount["$lte"] = queryParam.toAmount; }
        if(queryParam.ledger){query['ledger']= new ObjectId(queryParam.ledger); }
        if (!this.isEmptyObject(amount)) {
            query["requestedAmount"] = amount;
        }
        if (!this.isEmptyObject(date)) {
            query["disburserDate"] = date;
        }
        if(!this.isEmptyObject(payee)){
            if(queryParam.payee){
                if( payee.indexOf(queryParam.payee) === -1){
                    payee.$in.push(queryParam.payee)
                }
            }
            query["payee"]=payee;
        }
        query.expired = false;
        query.isActive =  true;
        query.organization = new ObjectId(organizationId);
        return query;
    },
    isEmptyObject: function(obj) {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    },
    isNullObject: function(property) {
        return property!= null && property != ""
    },
    getUserName:function(){
        return process.env.HOME;
    },
    generateUniqueFilename: function(token) {
        return uuidV1()+"-"+token+".pdf";
    },
    generateUniqueFilenameForXls: function(token) {
        return uuidV1()+"-"+token+".xlsx";
    },
    generateMonthKey: function(month, year) {
        return ""+month+", "+year;
    },
    generateWeekKey: function(week, month) {
        return "Week "+week+", "+month;
    },
    generateDayKey: function(day, month) {
        return ""+day+" "+month;
    },
    indiaCurrencyFormat: function(input) {
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
        return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint +'/-';

    },
    populateAdvice: function( queryParam, organization ) {
        if( queryParam.requestedBy === undefined ){
            queryParam.requestedBy = "";
        }
        if( queryParam.selectedProject===undefined ){
            queryParam.selectedProject={};
        }
        if( queryParam.cashAmt===undefined ){
            queryParam.cashAmt=''
        }
        if(!queryParam.isPaymentRequest){
            queryParam.isPaymentRequest=false;
            queryParam.paymentRequestId=null;
        }
        var adviceObj = {
            user: queryParam.userId,
            requestedDate: queryParam.requestedDate,
            requestedAmount: queryParam.requestedAmt,
            paymentType: queryParam.paymentType,
            billAmountDue: queryParam.billAmountDue,
            type: queryParam.selectPaymentMode,
            requestedBy: queryParam.requestedBy,
            initiatedBy: queryParam.initiater,
            description: queryParam.selectedPurpose,
            adviceStatus: queryParam.status,
            accountNumber: queryParam.accNo ? queryParam.accNo: "",
            chequeNumber: queryParam.chequeNumber ? queryParam.chequeNumber: "",
            creditCardNumber: queryParam.creditCardNumber ? queryParam.creditCardNumber: "",
            debitCardNumber: queryParam.debitCardNumber ? queryParam.debitCardNumber: "",
            bank: queryParam.bank ? queryParam.bank: undefined,
            transactionId: queryParam.transId ? queryParam.transId : "",
            others: queryParam.cashAmt ? queryParam.cashAmt : "",
            project: queryParam.selectedProject._id,
            category: queryParam.category,
            organization: organization,
            urgent: queryParam.urgent,
            version: apiUtils.getDefaultAdviceVersion(),
            isActive: true,
            revisions: [],
            paymentRequestId:queryParam.paymentRequestId,
            isPaymentRequest:queryParam.isPaymentRequest
        };
        if(queryParam.ledger){
            adviceObj.ledger=queryParam.ledger;
        }
        /*To support legacy data*/
        if(queryParam.isLegacy) {
            adviceObj['disburserDate'] = queryParam.disburserDate;
            adviceObj['secondLevelApprover'] = queryParam.userId;
            adviceObj['thirdLevelApprover'] = queryParam.userId;
            adviceObj['disburser'] = queryParam.userId;
        }
        return adviceObj;
    },
    getValuesByKey: function(data, key) {
        var values = [];
        for (var i = 0; i < data.length; i++) {
            values.push(data[i][key]);
        }
        return values;
    },
    populateAdviceForUpdate: function( queryParam, organization ) {
        if(queryParam.chequeNumber===undefined){
            queryParam.chequeNumber=''
        }if(queryParam.accountNumber===undefined){
            queryParam.accountNumber=''
        }if(queryParam.creditCardNumber===undefined){
            queryParam.creditCardNumber=''
        }if(queryParam.debitCardNumber===undefined){
            queryParam.debitCardNumber=''
        }if(queryParam.billAmountDue===undefined){
            queryParam.billAmountDue=''
        }
        return {
            adviceNumber: queryParam.adviceNumber,
            requestedDate: queryParam.requestedDate,
            requestedAmount: queryParam.requestedAmount,
            paymentType: queryParam.paymentType,
            type: queryParam.type,
            requestedBy: queryParam.requestedBy,
            initiatedBy: queryParam.initiatedBy,
            description: queryParam.description,
            adviceStatus: queryParam.adviceStatus,
            accountNumber:queryParam.accountNumber,
            chequeNumber:queryParam.chequeNumber,
            creditCardNumber:queryParam.creditCardNumber,
            debitCardNumber:queryParam.debitCardNumber,
            billAmountDue: queryParam.billAmountDue,
            bank:queryParam.bank ? queryParam.bank: undefined,
            transactionId:queryParam.transactionId,
            others:queryParam.others,
            disburserDate : queryParam.disburserDate,
            category : queryParam.category,
            organization: organization,
            project:queryParam.project ? queryParam.project: undefined,
            payee:queryParam.payee ? queryParam.payee: undefined,
            urgent:queryParam.urgent,
            ledger: queryParam.ledger ? queryParam.ledger: undefined,
        };
    },
    getFullMonth: function(monthVal) {
        var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return monthNames[monthVal]
    },
    getFullDay: function(dayVal) {
        var weekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
            "Saturday"
        ];
        return weekNames[dayVal]
    },
    getSubDomain: function(req) {
        return req.body.subdomain ? req.body.subdomain : req.subdomains[0];
    },
    getServerUrl: function( req ) {
        return req.protocol + '://' + req.get('host');//get server url
    },
    getOrganizationSpecificUrl: function( req, domain ){
        var urlOptions = parseDomain(req.hostname);
        return req.protocol + '://' + domain + '.' + urlOptions['domain'] + '.' + urlOptions['tld'];
    },
    getAdviceNumber: function (serialNum) {
        var s = "000000" + serialNum;
        return s.substr(s.length-7);
    },
    /**
     * function for getting undereScorred String
     *@param value bill payment
     *@returns Bill Payment
     * */
    getCamelCaseString : function(value){
        return value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    },
    /**
     * function for getting undereScorred String
     *@param value bill Payment
     *@returns BILL_PAYMENT
     * */
    getCustomTypeValue:function(value){
        var removeSpace='',  underscoredString='',finalString='';
        var convertCamelCase=this.getCamelCaseString(value);
        for(var i=0;i<convertCamelCase.length;i++){
            if(convertCamelCase.charAt(i)!=' '){
                removeSpace=removeSpace+convertCamelCase.charAt(i);
            }
        }
        underscoredString= removeSpace.replace(/(?:^|\.?)([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");
        finalString=underscoredString.toUpperCase();
        return finalString
    },
    /**
     * function for getting custo type
     *@param type Category
     *@returns Category
     * */
    getCustomType:function(type) {
        if(typeEnum.PAYMENT_TYPE.value===type){
            return typeEnum.PAYMENT_TYPE.code
        }else{
            return typeEnum.CATEGORY.code
        }
    },
    /**
     * function for getting stamp type
     *@param type Company Stamp
     *@returns Company Stamp
     * */
    getCompanyStampType:function(type) {
        if(stampEnum.COMPANY_STAMP.value===type){
            return stampEnum.COMPANY_STAMP.value;
        }else if(stampEnum.APPROVED_STAMP.value===type){
            return stampEnum.APPROVED_STAMP.value;
        }else if(stampEnum.REJECTED_STAMP.value===type){
            return stampEnum.REJECTED_STAMP.value;
        }else if(stampEnum.VOID_STAMP.value===type){
            return stampEnum.VOID_STAMP.value;
        }else{
            return stampEnum.DISBURSED_STAMP.value;
        }
    },
    /**
     * function for preparing upload stamp query
     *@param stampType
     * @param queryParams
     *@returns UploadQuery
     * */
    prepareUploadStampQuery : function(stampType, queryParams){
        var UploadQuery={
            type : stampType,
            filename : queryParams.stamp.filename,
            filetype : queryParams.stamp.filetype,
            filesize : queryParams.stamp.filesize,
            base64 : queryParams.stamp.base64
        };
        return UploadQuery;
    },
    /**
     * function for checking is stamp type exist in collection
     *@param stampType
     * @param result
     *@returns true/false
     * */
    isStampTypeExist : function(stampType,result){
        var isTypeExist=false;
        if(result.stamp.length==0){
            isTypeExist=false;
        }else{
            for(var i=0; i<result.stamp.length; i++){
                if(result.stamp[i].type==stampType){
                    isTypeExist=true;
                    break;
                }
            }
        }
        return isTypeExist;
    },

    /**
     *
     * @param date-(javascript date)
     * @returns {string}-string date in (dd MMM, YYYY) format
     */
    getConvertedDate:function(date){
        var stringConvertDate= new Date(date).toDateString();
        var stringDateArray = stringConvertDate.split(' ');
        var formatedDate=stringDateArray[2]+' '+stringDateArray[1]+', '+stringDateArray[3]
        return formatedDate;
    },
    marshalCustomFields: function(customFields) {
        var fields = [];
        customFields.forEach(function(customField){
            fields.push(apiUtils.marshalCustomField(customField))
        });
        return fields;
    },
    marshalCustomField: function(customField) {
        return { "name":customField.name, "value": customField.value,
            "id": customField.id,"description": customField.description }
    },
    addDaysToDate: function(date, days) {
        return new Date(date.setTime( date.getTime() + days * 86400000 ));
    },
    prepareFullName:function(partialName){
        if(partialName.middleName){
            return partialName.firstName+' '+partialName.middleName+' '+partialName.lastName;
        }
        else{
            return partialName.firstName+' '+partialName.lastName;
        }
    },
    getDefaultAdviceVersion: function(){
        return "1.0";
    },
    getNextVersion: function(currVersion){
        return _.toString(_.toNumber(currVersion)+1 +".0");
    },
    getPayeeFullName: function(payeeUser) {
        var name = "";
        if(payeeUser.firstName) { name = name + payeeUser.firstName}
        if(payeeUser.middleName) { name = name +' '+payeeUser.middleName}
        if(payeeUser.lastName) { name = name +' '+payeeUser.lastName}
        return name;
    },
    getCustomFiledById:function(customFiled){
        var deferred = Q.defer();
        CustomFieldsModel.findOne({_id:customFiled},function(err,data){
            if(err){
                deferred.reject(err)
            }
            else{
                deferred.resolve(data.name);
            }
        });
        return deferred.promise;
    },
    getMongoRegexMatch:function(value){
        var valuePattern = '^'+value.trim()+'$';
        return new RegExp(valuePattern, "i");
    },
    getUserById: function(id){
        var deferred = Q.defer();
        UserModel.findOne({_id:id},function(err,user){
            if(err){
                deferred.reject(err);
            }
            else{
                deferred.resolve(user);
            }
        });
        return deferred.promise;
    },
    i18n: function(label, lang){
        if(lang === undefined) {
            lang = ['en']
        }
        i18n.configure({
            locales: lang,
            register: {},
            directory: __dirname +'/../locales'
        });
        return i18n.__(label)
    },
    prepareCountAggregationQueryForAdmin: function(query) {
        var aggregateQuery = [];
        var matchParams = apiUtils.getMatchParams(query);
        aggregateQuery.push({ $match: {$and: matchParams}});

        aggregateQuery.push(
            {$group : {_id : null, count: {$sum: 1}}}
        );
        return aggregateQuery;
    },
    getMatchParams: function(query) {
        var matchParams = [];
        for(k in query){
            var queryObj = {};
            if(query[k]!==undefined){
                if(['payee', 'project', 'paymentType', 'category'].indexOf(k) >=0) {
                    if(query.payee && query.payee.$in){
                        queryObj[k]=query[k]
                    }
                    else {
                        queryObj[k] = new ObjectId(query[k]);
                    }
                }
                else {
                    queryObj[k] = query[k];
                }
                matchParams.push(queryObj);
            }
        }

        console.log("see here match query",queryObj);
        return matchParams
    },
    prepareFetchByNameAggregateQuery: function(query, fieldName) {
        var aggQuery = [
            { $match: query }
        ];
        var projectFieldObject =  {_id: 1};
        projectFieldObject[fieldName] = { $toLower: "$"+fieldName };
        var sortfield = {};
        sortfield[fieldName] = 1;
        aggQuery = aggQuery.concat([
            {
                $project:projectFieldObject

            },
            {$sort:sortfield}
        ]);
        return aggQuery;
    },
    getExternalConfigFile: function() {
        var userHome = apiUtils.getUserName();
        var extConfigLoc = userHome+'/.ipass/config/config.json';
        console.log('> Searching for the external configuration in ',extConfigLoc);
        var config = require(extConfigLoc);
        var appConfig = JSON.parse(JSON.stringify(config));
        return appConfig;
    },
    replaceEncodeValueToSymbol:function(property) {
        if(property) {
            return property.
            replace('/&/gi','&').
            replace('//%/gi26/gi','&').
            replace('//%/gi23/gi','#').
            replace('//%/gi40/gi','@').
            replace('//%/gi24/gi','$').
            replace('/%/gi','%').
            replace('/^/gi','^').
            replace('/,/gi',',').
            replace('/</gi','<').
            replace('/>/gi','>').
            replace('/?/gi','?').
            replace('/%3D/gi','=').
            replace('/+/gi','+');
        }
        else {
            return property;
        }
    },
    setToLowerCase: function(query) {
        if (typeof query === "string")
            return query.toLowerCase();
        else
            return "";
    }

};

module.exports = apiUtils;
