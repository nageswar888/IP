/**
 * Created by sb0103 on 10/1/17.
 */

var excelbuilder = require('msexcel-builder');
var apiUtils = require('./apiUtils');
var constants = require('./constants');
var Q = require('q');
const os = require('os');
var tmp=os.tmpdir()+'/';

var generateExcelBook={
    generateExcelPerformanceMatrix:function(yearData,filename){
        var deferred = Q.defer();
        var workbook = excelbuilder.createWorkbook(tmp, filename);
        /*var months={1:"JAN",2:"FEB",3:"MARCH",4:"APRIL",5:"MAY",6:"JUNE",7:"JULY",8:"AUGUST",9:"SEPT",10:"OCT",11:"NOV",12:"DEC"};*/
        var months={0:"JAN",1:"FEB",2:"MARCH",3:"APRIL",4:"MAY",5:"JUNE",6:"JULY",7:"AUGUST",8:"SEPT",9:"OCT",10:"NOV",11:"DEC"};

        for (var key in yearData) {
            var projectTotalAmounts = {};
            //TODO: remove hard-coded value
            var sheet1 = workbook.createSheet(key, Object.keys(yearData[key]).length+5,Object.keys(months).length+5);
            if (yearData.hasOwnProperty(key)) {
                var monthDup = [];
                var uniqueProjectList = [];
                yearData[key].forEach(function(elem, indx){
                    var a = elem.month;
                    var b = elem.project;
                    if(monthDup.indexOf(a) == -1) {
                        monthDup.push(a);
                    }
                    if(uniqueProjectList.indexOf(b) == -1){
                        uniqueProjectList.push(b);
                    }
                    if(!projectTotalAmounts[elem.project]) {
                        projectTotalAmounts[elem.project] = elem.totalAmt;
                    } else {
                        projectTotalAmounts[elem.project] += elem.totalAmt;
                    }
                });
            }

            var newData={};
            monthDup.forEach(function(data){
                var a=[];
                yearData[key].forEach(function(elem, indx){
                    if(elem.month===data){
                        a.push(elem);
                    }
                });
                newData[data]=a;
            });
            monthDup.sort(function(a, b){return a-b});
            sheet1.merge({col:2,row:1},{col:5,row:1});
            sheet1.set(2,1, "Advices From "+months[monthDup[0]]+" "+key+" "+months[monthDup[monthDup.length-1]]+" "+key);
            sheet1.font(2,1, {bold:'true'});
            sheet1.set(1,2 , "Months");
            sheet1.font(1,2 , {bold:'true'});

            uniqueProjectList.forEach(function(eachProject,index){
                sheet1.set(index+2,2, eachProject);
                sheet1.font(index+2,2, {bold:'true'});

                if(uniqueProjectList.length-1 === index){
                    sheet1.set(index+3,2, "Total");
                    sheet1.font(index+3,2, {bold:'true'});
                }
            });
            var count=3;
            var s=3;

            for (var key in newData) {
                var sumAmt=0;
                if (newData.hasOwnProperty(key)) {
                    sheet1.font(1,count, {bold:'true'});
                    sheet1.set(1,count++, months[key]);
                }
                newData[key].forEach(function(eachData){
                    uniqueProjectList.forEach(function(eachProject,buttomindex){
                        if(eachData.project === eachProject){
                            sheet1.set(buttomindex+2,s, Number(eachData.totalAmt));
                            sumAmt+=Number(eachData.totalAmt);
                        }
                        if(uniqueProjectList.length-1===buttomindex){
                            sheet1.set(buttomindex+3,s, sumAmt);
                            sheet1.font(buttomindex+3,s, {bold:'true'});
                        }
                    });
                });
                s++;
            }

            sheet1.font(1,count, {bold:'true'});
            sheet1.set(1,count, "Total");
            var grandTotal=0;

            for(key in projectTotalAmounts){
                uniqueProjectList.forEach(function(eachProject,index){
                    if(eachProject===key){
                        sheet1.font(index+2,count, {bold:'true'});
                        sheet1.set(index+2,count, projectTotalAmounts[key]);
                        grandTotal+=projectTotalAmounts[key];
                    }
                })
            }

            sheet1.font(uniqueProjectList.length+2,monthDup.length+3, {bold:'true'});
            sheet1.set(uniqueProjectList.length+2,monthDup.length+3, grandTotal);
        }
        workbook.save(function(err) {
            if (err) {
                deferred.reject(err);
            }
            else {
                console.log('congratulations, your workbook created');
                deferred.resolve({data: "success"});
            }
        });
        return deferred.promise;

    },
    generateExcelBook:function(advicesList, filename,queryParam,amount){
        var deferred = Q.defer();
        var workbook = excelbuilder.createWorkbook(tmp, filename);
        var sheet1 = workbook.createSheet('sheet1', 30, advicesList.length+12);
        sheet1.set(3, 1, 'iPASS SEARCH CRITERIA');
        sheet1.font(3, 1, {bold:'true'});
        sheet1.fill(3, 1, {type:'solid',fgColor:'8',bgColor:'64'});
        sheet1.font(3, 1, {sz:'12',family:'3',bold:'true'});
        sheet1.width(3, 30);

        var counttop=2;
        if(apiUtils.isNullObject(queryParam.payeeName)){
            sheet1.set(1,counttop , "Payee");
            sheet1.set(2,counttop , apiUtils.replaceEncodeValueToSymbol(queryParam.payeeName));
            counttop++;
        }
        if(apiUtils.isNullObject(queryParam.projectName)){
            sheet1.set(1,counttop , "Project Name");
            sheet1.set(2,counttop , apiUtils.replaceEncodeValueToSymbol(queryParam.projectName));
            counttop++;
        }
        if(apiUtils.isNullObject(queryParam.status)){
            sheet1.set(1,counttop , "Status");
            sheet1.set(2,counttop , queryParam.status);
            counttop++;
        }
        if(queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
            && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
            && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {
            sheet1.set(1,counttop , "Date Range");

            if(queryParam.fromDate && queryParam.toDate){
                sheet1.set(2,counttop , queryParam.fromDate+" to "+queryParam.toDate);
                counttop++;
            }else if(queryParam.fromDate){
                sheet1.set(2,counttop , queryParam.fromDate+" to "+ "Today");
                counttop++;
            }else if(queryParam.toDate){
                sheet1.set(2,counttop , "Since Beginning"+" to "+ queryParam.toDate);
                counttop++;
            }
            else {
                sheet1.set(2,counttop , "Since Beginning"+" to "+ "Today");
                counttop++;
            }

            if(queryParam.fromAmount && queryParam.toAmount) {
                sheet1.set(1,counttop , "Amount Range");
                sheet1.set(2,counttop  , apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)) +" to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)));
                counttop++;
            }else if(queryParam.fromAmount){
                sheet1.set(1,counttop , "Amount Range");
                sheet1.set(2,counttop  , "Greater than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)));
                counttop++;
            }else if(queryParam.toAmount){
                sheet1.set(1,counttop , "Amount Range");
                sheet1.set(2,counttop  , "Less than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)));
                counttop++;
            }
            if(queryParam.virtualLedger){
                sheet1.set(1,counttop , "Virtual ledger");
                sheet1.set(2,counttop, apiUtils.replaceEncodeValueToSymbol(queryParam.virtualLedgerName));
                counttop++;
            }if(queryParam.ledger){
                sheet1.set(1,counttop , "Ledger");
                sheet1.set(2,counttop, apiUtils.replaceEncodeValueToSymbol(queryParam.ledgerName));
                counttop++;
            }if(queryParam.bankName){
                sheet1.set(1,counttop , "Bank");
                sheet1.set(2,counttop, apiUtils.replaceEncodeValueToSymbol(queryParam.bankName));
                counttop++;
            }
            sheet1.merge({col:2,row:counttop},{col:3,row:counttop});
        }

        if(apiUtils.isNullObject(queryParam.adviceNum)){
            sheet1.set(1,counttop , "Advice Number ");
            sheet1.set(2,counttop , queryParam.adviceNum);
            counttop++;
        }if(apiUtils.isNullObject(queryParam.category)){
            sheet1.set(1,counttop , "Category");
            sheet1.set(2,counttop , apiUtils.replaceEncodeValueToSymbol(queryParam.categoryName));
            counttop++;
        }if(apiUtils.isNullObject(queryParam.paymentType)){
            sheet1.set(1,counttop , "Payment Type");
            sheet1.set(2,counttop , apiUtils.replaceEncodeValueToSymbol(queryParam.paymentTypeName));
            counttop++;
        }

        sheet1.set(1,counttop , "Total Amount: Rs");
        sheet1.font(1,counttop, {bold:'true'});
        sheet1.set(2,counttop , apiUtils.indiaCurrencyFormat(amount));
        counttop++;

        sheet1.set(1,counttop , "Total Amount in words: Rs");
        sheet1.font(1,counttop, {bold:'true'});
        sheet1.set(2,counttop , apiUtils.convertINRToWord(amount));
        sheet1.merge({col:2,row:counttop},{col:4,row:counttop});
        counttop++;
        counttop++;

        sheet1.set(1, counttop, 'Payment Advice Number');
        sheet1.set(2, counttop, 'Payee');
        sheet1.set(3, counttop, 'Project');
        sheet1.set(4, counttop, 'Status');
        sheet1.set(5, counttop, 'Requested Amount');
        sheet1.set(6, counttop, 'Requested Amount in words');




        sheet1.font(1, counttop, {bold:'true'});
        sheet1.font(2, counttop, {bold:'true'});
        sheet1.font(3, counttop, {bold:'true'});
        sheet1.font(4, counttop, {bold:'true'});
        sheet1.font(5, counttop, {bold:'true'});
        sheet1.font(6, counttop, {bold:'true'});


        sheet1.width(1, 30);
        sheet1.width(2, 20);
        sheet1.width(4, 20);
        sheet1.width(5, 20);
        sheet1.width(6, 30);



        var count=counttop+1;
        var finalTotal = 0;
        advicesList.forEach(function(advice){
            /*apiUtils.getAdviceById(adviceId).then(function(advice){*/
            if (advice) {
                finalTotal += advice.requestedAmount;
                var user =  advice.payee.user;
                sheet1.set(1,count, advice.adviceNumber);
                sheet1.set(2,count, apiUtils.getPayeeFullName(user));
                sheet1.set(3,count, advice.project.projectName);
                sheet1.set(4,count, advice.adviceStatus);
                sheet1.set(5,count,advice.requestedAmount);
                sheet1.set(6,count,apiUtils.convertINRToWord(Number(advice.requestedAmount)));
                sheet1.merge({col:6,row:count},{col:10,row:count});
            }
            count++;

            if(advicesList.length===count-(counttop+1)){
                sheet1.set(4,count , "Total");
                sheet1.font(4, count, {bold:'true'});
                sheet1.set(5,count , finalTotal);
                workbook.save(function(err){
                    if (err){
                        deferred.reject(err);
                    }

                    else{
                        deferred.resolve({data:"success"});
                    }

                });
            }
        });
        /*});*/
        return deferred.promise;
    },
    generateExcelBookPerProject:function(result, filename, queryParam){
        var deferred = Q.defer();
        var workbook = excelbuilder.createWorkbook(tmp, filename);
        /*var sheet1 = workbook.createSheet('sheet1', 30, 60);*/


        result.forEach(function(advices){
            var count=3;
            var innercount=0;
            var rowSize = 0, colSize=40;
            if(advices.projectDetails) {
                rowSize = advices.projectDetails.length;
            }
            rowSize = rowSize+count+40;
            console.log('Creating Excel sheet with size: '+ rowSize+"*"+colSize);
            var sheet1 = workbook.createSheet(advices.projectDetails[0].name.projectName, colSize, rowSize);

            sheet1.set(2, count, 'Project Name');
            sheet1.fill(2, count, {type:'solid',fgColor:'8',bgColor:'64'});
            sheet1.set(3, count, advices.projectDetails[0].name.projectName);
            sheet1.fill(3, count, {type:'solid',fgColor:'8',bgColor:'64'});
            sheet1.font(2, count, {bold:'true'});
            sheet1.font(3, count, {bold:'true'});

            count++;
            sheet1.set(2, count, 'Total Amount');
            sheet1.set(3, count, apiUtils.indiaCurrencyFormat(advices.total));
            sheet1.font(2, count, {bold:'true'});
            sheet1.font(3, count, {bold:'true'});

            count++;
            sheet1.set(2, count, 'Total Amount in words');
            sheet1.set(3, count, apiUtils.convertINRToWord(advices.total));
            sheet1.font(2, count, {bold:'true'});
            sheet1.font(3, count, {bold:'true'});
            sheet1.merge({col:3,row:count},{col:6,row:count});



            if(queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
                && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
                && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {
                count++;
                sheet1.set(2,count , "Date Range");
                sheet1.font(2,count , {bold:'true'});

                if(queryParam.fromDate && queryParam.toDate){
                    sheet1.set(3,count  , apiUtils.getConvertedDate(queryParam.fromDate)+" to "+apiUtils.getConvertedDate(queryParam.toDate));
                    sheet1.font(3,count , {bold:'true'});
                }else if(queryParam.fromDate){
                    sheet1.set(3,count  , apiUtils.getConvertedDate(queryParam.fromDate)+" to "+"Today");
                    sheet1.font(3,count , {bold:'true'});
                }else if(queryParam.toDate){
                    sheet1.set(3,count  , "Since Beginning"+" to "+apiUtils.getConvertedDate(queryParam.toDate));
                    sheet1.font(3,count , {bold:'true'});
                }
                else {
                    sheet1.set(3,count , "Since Beginning"+" to "+ "Today");
                    sheet1.font(3,count , {bold:'true'});
                }

                if(queryParam.fromAmount && queryParam.toAmount) {
                    count++;
                    sheet1.set(2,count , "Amount Range");
                    sheet1.set(3,count  , apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)) +" to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }else if(queryParam.fromAmount){
                    count++;
                    sheet1.set(2,count , "Amount Range");
                    sheet1.set(3,count , "Greater than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }else if(queryParam.toAmount){
                    count++;
                    sheet1.set(2,count , "Amount Range");
                    sheet1.set(3,count , "Less than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }
                if(queryParam.category){
                    count++;
                    sheet1.set(2,count , "Category");
                    sheet1.set(3,count, apiUtils.replaceEncodeValueToSymbol(queryParam.categoryName));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }if(queryParam.virtualLedger){
                    count++;
                    sheet1.set(2,count , "Virtual ledger");
                    sheet1.set(3,count, apiUtils.replaceEncodeValueToSymbol(queryParam.virtualLedgerName));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }if(queryParam.ledger){
                    count++;
                    sheet1.set(2,count , "Ledger");
                    sheet1.set(3,count, apiUtils.replaceEncodeValueToSymbol(queryParam.ledgerName));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }if(queryParam.bankName){
                    count++;
                    sheet1.set(2,count , "Bank");
                    sheet1.set(3,count, apiUtils.replaceEncodeValueToSymbol(queryParam.bankName));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }if(queryParam.payeeName){
                    count++;
                    sheet1.set(2,count , "Payee");
                    sheet1.set(3,count, apiUtils.replaceEncodeValueToSymbol(queryParam.payeeName));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }if(queryParam.adviceNum){
                    count++;
                    sheet1.set(2,count , "Advice Number");
                    sheet1.set(3,count, queryParam.adviceNum);
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }if(queryParam.paymentType){
                    count++;
                    sheet1.set(2,count , "Payment Type");
                    sheet1.set(3,count, apiUtils.replaceEncodeValueToSymbol(queryParam.paymentTypeName));
                    sheet1.font(2,count , {bold:'true'});
                    sheet1.font(3,count , {bold:'true'});
                }
            }


            /*sheet1.merge({col:3,row:count+3},{col:4,row:count+3});
            sheet1.font(2,count+3 , {bold:'true'});
            sheet1.font(3,count+3, {bold:'true'});
            sheet1.font(2,count+4 , {bold:'true'});
            sheet1.font(3,count+4, {bold:'true'});*/

            /*heading per project*/
            count=count+3;
            sheet1.set(1, count, 'Advice Number');
            sheet1.font(1, count, {bold:'true'});
            sheet1.set(2, count, 'Payee Name');
            sheet1.font(2, count, {bold:'true'});
            var finalTotal = 0;

            if(queryParam.status.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase() ||
                queryParam.status.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase() ||
                queryParam.status.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {
                sheet1.set(3, count, 'Status');
                sheet1.font(3, count, {bold:'true'});

                sheet1.set(4, count, 'Requested Amount');
                sheet1.font(4, count, {bold:'true'});
                sheet1.width(4, 20);
                sheet1.width(3, 20);
                sheet1.width(2, 25);
                sheet1.width(1, 25);

                sheet1.set(5, count, 'Requested Amount in words');
                sheet1.font(5, count, {bold:'true'});
                sheet1.width(5, 35);
                advices.projectDetails.forEach(function(perAdvice){
                    finalTotal += perAdvice.requestedAmount;
                    sheet1.set(1, innercount+count, perAdvice.adviceNumber);
                    sheet1.set(2, innercount+count, apiUtils.getPayeeFullName(perAdvice.payee.user));
                    sheet1.set(3, innercount+count, perAdvice.adviceStatus);
                    sheet1.set(4, innercount+count, perAdvice.requestedAmount);
                    sheet1.set(5, innercount+count, apiUtils.convertINRToWord(Number(perAdvice.requestedAmount)));
                    sheet1.merge({col:5,row:innercount+count},{col:9,row:innercount+count});
                    innercount++;
                });
                sheet1.set(3,innercount+14 , "Total");
                sheet1.font(3, innercount+14, {bold:'true'});
                sheet1.set(4,innercount+14 , finalTotal);
            }
            else {
                sheet1.set(3, count, 'Requested Amount');
                sheet1.font(3, count, {bold:'true'});
                sheet1.width(3, 20);
                sheet1.width(2, 25);
                sheet1.width(1, 25);
                sheet1.set(4, count, 'Requested Amount in words');
                sheet1.font(4, count, {bold:'true'});
                sheet1.width(4, 35);
                count++;
                advices.projectDetails.forEach(function(perAdvice){
                    finalTotal += perAdvice.requestedAmount;
                    sheet1.set(1, innercount+count, perAdvice.adviceNumber);
                    sheet1.set(2, innercount+count, apiUtils.getPayeeFullName(perAdvice.payee.user));
                    sheet1.set(3, innercount+count, perAdvice.requestedAmount);
                    sheet1.set(4, innercount+count, apiUtils.convertINRToWord(Number(perAdvice.requestedAmount)));
                    sheet1.merge({col:4,row:innercount+count},{col:8,row:innercount+count});
                    innercount++;
                });
                count=count+2;
                sheet1.set(2,innercount+count , "Total");
                sheet1.font(2, innercount+count, {bold:'true'});
                sheet1.set(3,innercount+count , finalTotal);
            }
            /*count=count+innercount+7;*/
        });
        workbook.save(function(err) {
            if (err) {
                deferred.reject(err);
            }

            else {
                deferred.resolve({data: "success"});
            }
        });
        return deferred.promise;
    },
    generateExcelBookPerProjectForPaymentRequest:function(result, filename, queryParam){
        var deferred = Q.defer();
        try {
            var workbook = excelbuilder.createWorkbook(tmp, filename);
            var keys = Object.keys(result)
            keys.forEach(function (key){
                var count = 3;
                var sheet1;
                var projectName;
                //var data = apiUtils.getValuesByKey(result,key)
                if(result[key].SUBMITTED && result[key].SUBMITTED.length>0) {
                    projectName = result[key].SUBMITTED[0].name;
                    sheet1 = workbook.createSheet(projectName, result[key].SUBMITTED.length+10, (result[key].SUBMITTED.length+10)*2);
                }
                else if(result[key].APPROVED && result[key].APPROVED.length>0) {
                    projectName = result[key].APPROVED[0].name;
                    sheet1 = workbook.createSheet(projectName, result[key].APPROVED.length+10, (result[key].APPROVED.length+10)*2);
                }
                else if(result[key].REJECTED && result[key].REJECTED.length>0) {
                    projectName = result[key].REJECTED[0].name;
                    sheet1 = workbook.createSheet(projectName, result[key].REJECTED.length+10, (result[key].REJECTED.length+10)*2);
                }
                else {
                    console.log("None");
                    projectName = undefined;
                    sheet1 = workbook.createSheet('Project', 30, 60);
                }

                sheet1.set(2, count, 'Project Name');
                sheet1.fill(2, count, {type: 'solid', fgColor: '8', bgColor: '64'});
                sheet1.set(3, count, projectName);
                sheet1.fill(3, count, {type: 'solid', fgColor: '8', bgColor: '64'});
                sheet1.font(2, count, {bold: 'true'});
                sheet1.font(3, count, {bold: 'true'});

                count++;

                sheet1.set(2, count, 'Total Amount');
                sheet1.set(3, count, apiUtils.indiaCurrencyFormat(result[key].total));
                sheet1.font(2, count, {bold: 'true'});
                sheet1.font(3, count, {bold: 'true'});
                count++;

                sheet1.set(2, count, 'Total Amount in words');
                sheet1.set(3, count, apiUtils.convertINRToWord(result[key].total));
                sheet1.font(2, count, {bold: 'true'});
                sheet1.font(3, count, {bold: 'true'});
                sheet1.merge({col: 3, row: count}, {col: 6, row: count});

                count++;
                count++;

                sheet1.set(1, count, 'Payment Request Number');
                sheet1.font(1, count, {bold: 'true'});

                sheet1.set(2, count, 'Payee Name');
                sheet1.font(2, count, {bold: 'true'});

                sheet1.set(3, count, 'Status');
                sheet1.font(3, count, {bold: 'true'});

                sheet1.set(4, count, 'Amount');
                sheet1.font(4, count, {bold: 'true'});
                sheet1.width(4, 20);
                sheet1.width(3, 20);
                sheet1.width(2, 25);
                sheet1.width(1, 25);

                sheet1.set(5, count, 'Amount in words');
                sheet1.font(5, count, {bold: 'true'});
                sheet1.width(5, 35);

                count++;
                if(result[key].APPROVED && result[key].APPROVED.length > 0) {
                    count++;
                    sheet1.set(1, count, 'Processed Payment Requests');
                    sheet1.font(1, count, {bold: 'true'});
                    count = generateExcelBook.printPerProjectExcelData(result[key].APPROVED, filename, queryParam, workbook, sheet1, result[key].total, count)
                }
                if(result[key].SUBMITTED && result[key].SUBMITTED.length > 0) {
                    count += 2;
                    sheet1.set(1, count, 'Un-processed Payment Requests');
                    sheet1.font(1, count, {bold: 'true'});
                    count =  generateExcelBook.printPerProjectExcelData(result[key].SUBMITTED, filename, queryParam, workbook, sheet1, result[key].total, count)
                }
                if(result[key].REJECTED && result[key].REJECTED.length > 0) {
                    count += 2;
                    sheet1.set(1, count, 'Rejected Payment Requests');
                    sheet1.font(1, count, {bold: 'true'});
                    count =  generateExcelBook.printPerProjectExcelData(result[key].REJECTED, filename, queryParam, workbook, sheet1, result[key].total, count)
                }
                sheet1.set(3, count+1, "Total");
                sheet1.font(3, count+1, {bold:'true'});
                sheet1.set(4, count+1, result[key].total);
            })
            workbook.save(function (err) {
                if (err) {
                    console.log("Error",err)
                    deferred.reject(err);
                }
                else {
                    console.log("working fine");
                    deferred.resolve({data: "success"});
                }
            });
        } catch(error) {
            console.log(error);
        }
        return deferred.promise;
    },

    printPerProjectExcelData:function(result, filename, queryParam, workbook, sheet1, total, count) {
        result.forEach(function (advices) {
            sheet1.set(1, count+1, advices.paymentRequestNumber);
            sheet1.set(2, count+1, apiUtils.getPayeeFullName(advices.payee.user));
            sheet1.set(3, count+1, advices.status);
            sheet1.set(4, count+1, Number(advices.amount));
            sheet1.set(5, count+1, apiUtils.convertINRToWord(Number(advices.amount)));
            sheet1.merge({col: 5, row: count}, {col: 9, row: count});
            count++;
        });
        return count++;
    },



    generateExcelBookForPaymentRequests:function(paymentRequestsList, filename, queryParam){
        var deferred = Q.defer();
        try {
            var workbook = excelbuilder.createWorkbook(tmp, filename);

            paymentRequestsList.forEach(function (paymentRequests) {
                var size = paymentRequests.projectDetails.length;
                var sheet1 = workbook.createSheet(paymentRequests._id, size+30, (size+30)*2);

                sheet1.set(3, 1, 'iPASS Payment Requests');
                sheet1.font(3, 1, {bold:'true'});
                sheet1.fill(3, 1, {type:'solid',fgColor:'8',bgColor:'64'});
                sheet1.font(3, 1, {sz:'12',family:'3',bold:'true'});
                sheet1.width(3, 30);

                var counttop=2;

                sheet1.set(1,counttop , "Total Amount: Rs");
                sheet1.font(1,counttop, {bold:'true'});
                sheet1.set(2,counttop , apiUtils.indiaCurrencyFormat(paymentRequests.total));
                counttop++;

                sheet1.set(1,counttop , "Total Amount in words: Rs");
                sheet1.font(1,counttop, {bold:'true'});
                sheet1.set(2,counttop , apiUtils.convertINRToWord(paymentRequests.total));
                sheet1.merge({col:2,row:counttop},{col:4,row:counttop});
                counttop++;
                counttop++;

                sheet1.set(1, counttop, 'Payment Request Number');
                sheet1.set(2, counttop, 'Status');
                sheet1.set(3, counttop, 'Payee');
                sheet1.set(4, counttop, 'Project');
                sheet1.set(5, counttop, 'Amount');
                sheet1.set(6, counttop, 'Requested Amount in words');

                sheet1.font(1, counttop, {bold:'true'});
                sheet1.font(2, counttop, {bold:'true'});
                sheet1.font(3, counttop, {bold:'true'});
                sheet1.font(4, counttop, {bold:'true'});
                sheet1.font(5, counttop, {bold:'true'});
                sheet1.font(6, counttop, {bold:'true'});


                sheet1.width(1, 30);
                sheet1.width(2, 20);
                sheet1.width(3, 20);
                sheet1.width(4, 20);
                sheet1.width(5, 20);
                sheet1.width(6, 30);
                var count=counttop+1;
                var paymentRequestsPromise = [];
                var c = 0;
                if(paymentRequests) {
                    var finalTotal = 0;
                    paymentRequests.projectDetails.forEach(function(paymentRequest){
                        finalTotal += paymentRequest.amount;
                        sheet1.set(1,count, paymentRequest.paymentRequestNumber);
                        sheet1.set(2,count, paymentRequest.status);
                        sheet1.set(3,count, apiUtils.getPayeeFullName(paymentRequest.payeeUser));
                        sheet1.set(4,count, paymentRequest.name);
                        sheet1.set(5,count, Number(paymentRequest.amount));
                        sheet1.set(6,count, apiUtils.convertINRToWord(Number(paymentRequest.amount)));
                        sheet1.merge({col:6,row:count},{col:11,row:count});
                        count++;
                    });
                    sheet1.set(4, count, 'Total');
                    sheet1.font(4, count, {bold:'true'});
                    sheet1.set(5,count,finalTotal);
                }

            });
            workbook.save(function(err){
                if (err){
                    deferred.reject(err);
                }
                else{
                    deferred.resolve({data:apiUtils.i18n('request.success.msg')});
                }
            });
        }
        catch(error) {
            console.log("generateExcelBookForPaymentRequests",error);
        }


        return deferred.promise;
    }
};
module.exports = generateExcelBook;
