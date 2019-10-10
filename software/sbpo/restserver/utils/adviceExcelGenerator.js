/**
 * Created by sb0103 on 10/1/17.
 */

var excelbuilder = require('msexcel-builder');
var apiUtils = require('./apiUtils');
var constants = require('./constants');
var Q = require('q');

var generateExcelBook={
    generateExcelBook:function(advicesList, filename,queryParam,amount){
        var deferred = Q.defer();
        var workbook = excelbuilder.createWorkbook('./tmp/', filename);
        var sheet1 = workbook.createSheet('sheet1', 30, 60);
        sheet1.set(3, 1, 'iPASS SEARCH CRITERIA');
        sheet1.font(3, 1, {bold:'true'});
        sheet1.fill(3, 1, {type:'solid',fgColor:'8',bgColor:'64'});
        sheet1.font(3, 1, {sz:'12',family:'3',bold:'true'});
        sheet1.width(3, 30);

        var counttop=2;
        if(apiUtils.isNullObject(queryParam.payeeName)){
            sheet1.set(1,counttop , "Payee");
            sheet1.set(2,counttop , queryParam.payeeName);
            counttop++;
        }
        if(apiUtils.isNullObject(queryParam.projectName)){
            sheet1.set(1,counttop , "Project Name");
            sheet1.set(2,counttop , queryParam.projectName);
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
            sheet1.merge({col:2,row:counttop},{col:3,row:counttop});
        }

        if(apiUtils.isNullObject(queryParam.adviceNum)){
            sheet1.set(1,counttop , "Advice Number ");
            sheet1.set(2,counttop , queryParam.adviceNum);
            counttop++;
        }if(apiUtils.isNullObject(queryParam.category)){
            sheet1.set(1,counttop , "Category");
            sheet1.set(2,counttop , queryParam.categoryName);
            counttop++;
        }if(apiUtils.isNullObject(queryParam.paymentType)){
            sheet1.set(1,counttop , "Payment Type");
            sheet1.set(2,counttop , queryParam.paymentTypeName);
            counttop++;
        }

        sheet1.set(1,counttop , "Total Amount: Rs");
        sheet1.font(1,counttop, {bold:'true'});
        sheet1.set(2,counttop , apiUtils.indiaCurrencyFormat(amount));

        counttop++;

        sheet1.set(1, counttop, 'Payment Advice Number');
        sheet1.set(2, counttop, 'Payee');
        sheet1.set(3, counttop, 'Project');
        sheet1.set(4, counttop, 'Status');
        sheet1.set(5, counttop, 'Amount');




        sheet1.font(1, counttop, {bold:'true'});
        sheet1.font(2, counttop, {bold:'true'});
        sheet1.font(3, counttop, {bold:'true'});
        sheet1.font(4, counttop, {bold:'true'});
        sheet1.font(5, counttop, {bold:'true'});


        sheet1.width(1, 30);
        sheet1.width(2, 20);
        sheet1.width(4, 20);
        sheet1.width(5, 20);



        var count=counttop+1;
        advicesList.forEach(function(adviceId){
            apiUtils.getAdviceById(adviceId).then(function(advice){
                if (advice) {
                    var user =  advice.payee.user;
                    sheet1.set(1,count, advice.adviceNumber);
                    sheet1.set(2,count, apiUtils.getPayeeFullName(user));
                    sheet1.set(3,count, advice.project.projectName);
                    sheet1.set(4,count, advice.adviceStatus);
                    sheet1.set(5,count,apiUtils.indiaCurrencyFormat(Number(advice.requestedAmount)));
                }
                count++;

                if(advicesList.length===count-(counttop+1)){
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
        });
        return deferred.promise;
    },
    generateExcelBookPerProject:function(result, filename, queryParam){
        var deferred = Q.defer();
        var workbook = excelbuilder.createWorkbook('./tmp/', filename);
        /*var sheet1 = workbook.createSheet('sheet1', 30, 60);*/

        var count=3;
        result.forEach(function(advices){
            var innercount=0;
            var rowSize = 0, colSize=30;
            if(advices.projectDetails) {
                rowSize = advices.projectDetails.length;
            }
            rowSize = rowSize+count+6;
            console.log('Creating Excel sheet with size: '+ rowSize+"*"+colSize);
            var sheet1 = workbook.createSheet(advices.projectDetails[0].name.projectName, colSize, rowSize);

            sheet1.set(2, count, 'Project Name');
            sheet1.fill(2, count, {type:'solid',fgColor:'8',bgColor:'64'});
            sheet1.set(3, count, advices.projectDetails[0].name.projectName);
            sheet1.fill(3, count, {type:'solid',fgColor:'8',bgColor:'64'});
            sheet1.font(2, count, {bold:'true'});
            sheet1.font(3, count, {bold:'true'});

            sheet1.set(2, count+1, 'Total Amount');
            sheet1.set(3, count+1, apiUtils.indiaCurrencyFormat(advices.total));
            sheet1.font(2, count+1, {bold:'true'});
            sheet1.font(3, count+1, {bold:'true'});

            sheet1.set(2, count+2, 'Total Amount in words');
            sheet1.set(3, count+2, apiUtils.convertINRToWord(advices.total));
            sheet1.font(2, count+2, {bold:'true'});
            sheet1.font(3, count+2, {bold:'true'});
            sheet1.merge({col:3,row:count+2},{col:6,row:count+2});

            sheet1.set(2,count+3 , "Date Range");

            if(queryParam.fromDate && queryParam.toDate){
                sheet1.set(3,count+3  , apiUtils.getConvertedDate(queryParam.fromDate)+" to "+apiUtils.getConvertedDate(queryParam.toDate));
            }else if(queryParam.fromDate){
                sheet1.set(3,count+3  , apiUtils.getConvertedDate(queryParam.fromDate)+" to "+"Today");
            }else if(queryParam.toDate){
                sheet1.set(3,count+3  , "Since Beginning"+" to "+apiUtils.getConvertedDate(queryParam.toDate));
            }
            else {
                sheet1.set(3,count+3 , "Since Beginning"+" to "+ "Today");
            }

            sheet1.merge({col:3,row:count+3},{col:4,row:count+3});
            sheet1.font(2,count+3 , {bold:'true'});
            sheet1.font(3,count+3, {bold:'true'});

            /*heading per project*/
            sheet1.set(1, count+5, 'Advice Number');
            sheet1.font(1, count+5, {bold:'true'});

            sheet1.set(2, count+5, 'Payee Name');
            sheet1.font(2, count+5, {bold:'true'});

            sheet1.set(3, count+5, 'Requested Amount');
            sheet1.font(3, count+5, {bold:'true'});
            sheet1.width(3, 20);
            sheet1.width(2, 25);
            sheet1.width(1, 25);

            sheet1.set(4, count+5, 'Requested Amount in words');
            sheet1.font(4, count+5, {bold:'true'});
            sheet1.width(4, 35);

            advices.projectDetails.forEach(function(perAdvice){
                sheet1.set(1, innercount+count+6, perAdvice.adviceNumber);
                sheet1.set(2, innercount+count+6, apiUtils.getPayeeFullName(perAdvice.payee.user));
                sheet1.set(3, innercount+count+6, apiUtils.indiaCurrencyFormat(Number(perAdvice.requestedAmount)));
                sheet1.set(4, innercount+count+6, apiUtils.convertINRToWord(Number(perAdvice.requestedAmount)));
                sheet1.merge({col:4,row:innercount+count+6},{col:8,row:innercount+count+6});
                innercount++;
            });
            /*count=count+innercount+7;*/
        });
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
    }
};
module.exports = generateExcelBook;
