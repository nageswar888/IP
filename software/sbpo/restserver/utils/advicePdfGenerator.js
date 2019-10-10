var apiUtils= require('./apiUtils');
var Q = require('q');
var PDFDocument;
var fs = require('fs');
PDFDocument = require('pdfkit');
var dateFormat = require('dateformat');
var stampEnum = require("../enums/stampType");
var adviceUtils=require("../utils/adviceUtils");
var constants=require("../utils/constants");
const os = require('os');
var tmp=os.tmpdir()+'/';
/**
 * Generates Advice pdf
 */
var advicePdfGenerator = {
    generatePdf: function(adviceId,roles) {
        var deferred = Q.defer();
        apiUtils.getAdviceById(adviceId).then(function (advice) {
            if (advice) {
                var doc = new PDFDocument;
                //TODO: Check for the tmp folder, if it is not available then throe the error
                var filename = tmp + advice._id + '.pdf';
                var writerStream = fs.createWriteStream(filename);
                advicePdfGenerator.writeContentToPdf(doc, advice,roles);
                doc.pipe(writerStream);
                doc.end();
                writerStream.on('finish', function () {
                    deferred.resolve("completed pdf generation");
                    // do stuff with the PDF file
                });
            } else {
                deferred.reject("failed")
            }
        });
        return deferred.promise;
    },
    generatePdfBookPerProject:function(result, fileName, queryParam,completeAmount,roles,signature,stamps){
        var deferred = Q.defer();
        var doc = new PDFDocument;
        var filename = tmp+fileName+'.pdf';
        var writerStream = fs.createWriteStream(filename);
        var itr =0;
        var pageno=1;

        doc.moveTo(0, 50).lineTo(700, 50).stroke();
        doc.moveTo(0,doc.page.height - 60).lineTo(doc.page.width, doc.page.height - 60).stroke();

        doc.moveDown(5);
        doc.fontSize(25);
        doc.font('Times-Roman')
            .text('iPASS ADVICE BOOK',{align:'center'})
            .stroke();

        doc.fontSize(17);
        doc.moveDown(3);
        doc.text("SEARCH CRITERIA",{align:'center'});
        doc.fontSize(12);
        var position=0;
        var boxHeight=80;
        if(apiUtils.isNullObject(queryParam.payeeName)){
            doc.text("Payee: "+apiUtils.replaceEncodeValueToSymbol(queryParam.payeeName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.projectName)){
            doc.text("Project: "+apiUtils.replaceEncodeValueToSymbol(queryParam.projectName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.virtualLedger)){
            doc.text("Virtual ledger: "+apiUtils.replaceEncodeValueToSymbol(queryParam.virtualLedgerName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.bankName)){
            doc.text("Bank: "+apiUtils.replaceEncodeValueToSymbol(queryParam.bankName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.status)){
            doc.text("Status: "+queryParam.status,180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(queryParam.fromDate && queryParam.toDate){
            doc.text("Date Range: "+apiUtils.getConvertedDate(queryParam.fromDate) +" to "+apiUtils.getConvertedDate(queryParam.toDate), 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }else if(queryParam.fromDate){
            doc.text("Date Range: "+apiUtils.getConvertedDate(queryParam.fromDate) +" to "+"Today", 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }else if(queryParam.toDate){
            doc.text("Date Range: "+"Since Beginning" +" to "+apiUtils.getConvertedDate(queryParam.toDate), 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        } else {
            doc.text("Date Range: "+"Since Beginning" +" to "+"Today", 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(queryParam.fromAmount && queryParam.toAmount){
            doc.text("Amount Range: "+apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)) +" to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)), 180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }else if(queryParam.fromAmount){
            doc.text("Amount Range: Grater than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)) , 180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }else if(queryParam.toAmount){
            doc.text("Amount Range: Less than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)), 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.adviceNum)){
            doc.text("Advice Number: "+queryParam.adviceNum,180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.category)){
            doc.text("Category: "+apiUtils.replaceEncodeValueToSymbol(queryParam.categoryName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }if(apiUtils.isNullObject(queryParam.paymentType)){
            doc.text("Payment Type: "+apiUtils.replaceEncodeValueToSymbol(queryParam.paymentTypeName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.ledger)){
            doc.text("Ledger : "+apiUtils.replaceEncodeValueToSymbol(queryParam.ledgerName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        boxHeight+=10;
        doc.rect(160, 220, 340, boxHeight).stroke();

        /*TODO:Remove it later*/
        doc.moveDown(6);
        doc.rect(160, 450, 335, 150).stroke();
        doc.fontSize(17);
        doc.text("SUMMARIZED RESULT",240, 460);
        doc.fontSize(12);
        doc.text("Total Projects: "+ result.length, 180, 490);
        doc.text("Total Amount: Rs "+ apiUtils.indiaCurrencyFormat(completeAmount));
        doc.text("("+ apiUtils.convertINRToWord(completeAmount)+")",180,520, {align:'justify', lineBreak:'true', width:'280'});

        doc.text('Generated By iPASS', 20, doc.page.height - 40, {
            align: 'left',
            lineBreak: false
        });
        var currentPromise = Q("");
        result.forEach(function(advices){
            currentPromise = currentPromise.then(function() {
                return updatePdfContent(advices,doc,queryParam,roles,signature,stamps);
            });
        });
        currentPromise.then(
            function(){
                doc.pipe(writerStream);
                doc.end();
                writerStream.on('finish', function () {
                    deferred.resolve("completed pdf generation");
                });
                return deferred.promise;
            });
        return deferred.promise;
    },

    generatePdfBook: function(idsList, fileName, queryParam,amount,roles, signature,stamps) {
        var deferred = Q.defer();
        var doc = new PDFDocument;
        var filename = tmp+fileName;
        var writerStream = fs.createWriteStream(filename);
        var itr =0;
        var itr2 =0;
        var pageno=1;

        doc.moveTo(0, 50).lineTo(700, 50).stroke();
        doc.moveTo(0,doc.page.height - 60).lineTo(doc.page.width, doc.page.height - 60).stroke();

        doc.moveDown(5);
        doc.fontSize(25);
        doc.font('Times-Roman')
            .text('iPASS ADVICE BOOK',{align:'center'})
            .stroke();

        doc.fontSize(17);
        doc.moveDown(3);
        doc.text("SEARCH CRITERIA",{align:'center'});
        doc.fontSize(12);

        var position=0;
        var boxHeight=80;
        if(apiUtils.isNullObject(queryParam.payeeName)){
            doc.text("Payee: "+apiUtils.replaceEncodeValueToSymbol(queryParam.payeeName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.projectName)){
            doc.text("Project: "+apiUtils.replaceEncodeValueToSymbol(queryParam.projectName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }if(apiUtils.isNullObject(queryParam.virtualLedger)){
            doc.text("Virtual ledger : "+apiUtils.replaceEncodeValueToSymbol(queryParam.virtualLedgerName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.bankName)){
            doc.text("Bank: "+apiUtils.replaceEncodeValueToSymbol(queryParam.bankName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.status)){
            doc.text("Status: "+queryParam.status,180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(queryParam.toDate && !queryParam.fromDate){
            doc.text("Date Range: "+'Since Beginning' +" to "+queryParam.toDate, 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        } else if(queryParam.fromDate && !queryParam.toDate){
            doc.text("Date Range: "+queryParam.fromDate +" to "+'Today', 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;
            //position++;
        } else if(!queryParam.fromDate && !queryParam.toDate){
            doc.text("Date Range: "+'Since Beginning' +" to "+'Today', 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        } else if(queryParam.fromDate && queryParam.toDate){
            doc.text("Date Range: "+queryParam.fromDate +" to "+queryParam.toDate, 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(queryParam.fromAmount && queryParam.toAmount){
            doc.text("Amount Range: "+apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)) +" to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)), 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }else if(queryParam.fromAmount){
            doc.text("Amount Range: Grater than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.fromAmount)) , 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }else if(queryParam.toAmount){
            doc.text("Amount Range: Less than equal to "+apiUtils.indiaCurrencyFormat(Number(queryParam.toAmount)), 180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.adviceNum)){
            doc.text("Advice Number: "+queryParam.adviceNum,180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;
        }
        if(apiUtils.isNullObject(queryParam.categoryName)){
            doc.text("Category: "+apiUtils.replaceEncodeValueToSymbol(queryParam.categoryName),180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }if(apiUtils.isNullObject(queryParam.paymentTypeName)){
            doc.text("Payment Type: "+apiUtils.replaceEncodeValueToSymbol(queryParam.paymentTypeName),180, adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        if(apiUtils.isNullObject(queryParam.ledger)){
            doc.text("Ledger : "+apiUtils.replaceEncodeValueToSymbol(queryParam.ledgerName),180,adviceUtils.getCounterValueOfY(position++));
            boxHeight+=10;

        }
        boxHeight+=10;
        doc.rect(160, 220, 340, boxHeight).stroke();
        doc.moveDown(6);

        doc.rect(160, 450, 335, 150).stroke();
        doc.fontSize(17);
        doc.text("SUMMARIZED RESULT",240, 460);
        doc.fontSize(12);
        doc.text("Total Advices: "+ idsList.length, 180, 490);
        doc.text("Total Amount: Rs "+ apiUtils.indiaCurrencyFormat(amount));
        doc.text("("+ apiUtils.convertINRToWord(amount)+")",180,520, {align:'justify', lineBreak:'true', width:'280'});

        doc.text('Powered By iPASS', 20, doc.page.height - 40, {
            align: 'left',
            lineBreak: false
        });

        var currentPromise = Q("");
        idsList.forEach(function(advice, adviceIdx){
            if (advice) {
                currentPromise = currentPromise.then(function() {
                    return writeEachAdvice(doc,advice,roles,signature,stamps);
                });
            } else {
                deferred.reject("failed")
            }
        });

        currentPromise.then(
            function(){
                doc.pipe(writerStream);
                doc.end();
                writerStream.on('finish', function () {
                    deferred.resolve("completed pdf generation");
                });
                return deferred.promise;
            });
        return deferred.promise;
    },

    writeContentToPdf: function(doc, advice, roles, signature,stamps) {
        var deferred = Q.defer();
        try {
            var user = advice.payee ? advice.payee.user : undefined;
            var companyStamp = {}, approvedStamp = {}, disbursedStamp = {};
            if (advice.organization && advice.organization.stamp && advice.organization.stamp.length > 0) {
                advice.organization.stamp.forEach(function (data) {
                    if (data.type === stampEnum.COMPANY_STAMP.value) {
                        companyStamp = data;
                    } else if (data.type === stampEnum.APPROVED_STAMP.value) {
                        approvedStamp = data;
                    } else if (data.type === stampEnum.DISBURSED_STAMP.value) {
                        disbursedStamp = data;
                    }
                })
            }
            else if(stamps){
                stamps.stamp.forEach(function (data) {
                    if (data.type === stampEnum.COMPANY_STAMP.value) {
                        companyStamp = data;
                    } else if (data.type === stampEnum.APPROVED_STAMP.value) {
                        approvedStamp = data;
                    } else if (data.type === stampEnum.DISBURSED_STAMP.value) {
                        disbursedStamp = data;
                    }
                })
            }
            if (advice.organization && advice.organization.logo &&
                advice.organization.logo.filetype && advice.organization.logo.base64) {
                doc.image('data:' + advice.organization.logo.filetype + ';base64,' + advice.organization.logo.base64, 10, 10, {
                    width: 110,
                    height: 35
                });
            } else if(stamps && stamps.logo && stamps.logo.filetype && stamps.logo.base64) {
                doc.image('data:' + stamps.logo.filetype + ';base64,' + stamps.logo.base64, 10, 10, {
                    width: 110,
                    height: 35
                });

            }else
            {
                doc.image('../client/app/images/iPASS_new.png', 10, 10, {width: 110, height: 35});
            }

            if (advice.adviceNumber && roles && roles.length > 0) {
                if (advice.version && advice.version !== '1.0' && roles[0] !== 'ROLE_PAYEE') {
                    doc.text(" Advice# " + advice.adviceNumber, 360, 19);
                }
                else {
                    doc.text(" Advice# " + advice.adviceNumber, 100, 19, {align: 'right'});
                }
            } else {
                doc.text(" Advice# " + advice.adviceNumber, 100, 19, {align: 'right'});
            }
            if (roles && roles.length > 0) {
                if (advice.version && advice.version !== '1.0' && roles[0] !== 'ROLE_PAYEE') {
                    doc.text("v" + parseInt(advice.version), 100, 19, {align: 'right'});
                }
            }
            if (advice.disburserDate) {
                doc.text("Date: " + dateFormat(advice.disburserDate, "dd mmm, yyyy"), {align: 'right'});
            }
            doc.moveTo(0, 50).lineTo(700, 50);
            doc.moveTo(0, doc.page.height - 60).lineTo(doc.page.width, doc.page.height - 60);
            doc.moveDown();
            if (advice.type === "Cheque" || advice.type === "RTGS" || advice.type === "Credit Card" ||
                advice.type === "Debit Card" || advice.type === "NEFT" || advice.type === "Debit By Bank") {
                if(advice.bank && advice.bank.address){
                    if(advice.bank.address.length>180)
                        doc.rect(20, 80, 555, 200).stroke();
                    else
                        doc.rect(20, 80, 555, 180).stroke();
                }
                else {
                    doc.rect(20, 80, 555, 160).stroke();
                }
                if (advice.bank) {
                    if(advice.bank.bankName) {
                        doc.text("" + advice.bank.bankName, 25, 88, {align: 'left'});
                    }else {
                        doc.text("", 25, 88, {align: 'left'});
                    }
                }
                if (advice.disburserDate) {
                    doc.text("Date: " + dateFormat(advice.disburserDate, "dd mmm, yyyy"), 25, 88, {align: 'right'});
                }

                if (advice.chequeNumber != undefined) {
                    doc.text("Cheque No #: "+ advice.chequeNumber , 25, 110, {align: 'left'});
                }if (advice.creditCardNumber != undefined) {
                    doc.text("Credit Card No #: "+ advice.creditCardNumber , 25, 110, {align: 'left'});
                }if (advice.debitCardNumber != undefined) {
                    doc.text("Debit Card No #: "+ advice.chequeNumber , 25, 110, {align: 'left'});
                }
                doc.text("Ledger: " + (advice.ledger ? advice.ledger.name : ''));
                doc.text("Pay: " + apiUtils.getPayeeFullName(user));
                doc.text("Rupees: (" + apiUtils.convertINRToWord(advice.requestedAmount) + ")", {
                    align: 'left',
                    lineBreak: 'true',
                    width: '355'
                });
                if (advice.requestedAmount) {
                    if (advice.requestedAmount.valueOf().toString().length > 9) {
                        doc.moveTo(390, 108).lineTo(390, 128);
                        doc.rect(370, 108, 200, 20).stroke();
                        doc.text("Rs    " + apiUtils.indiaCurrencyFormat(advice.requestedAmount.valueOf()), 374, 115);
                    }
                    else {
                        doc.moveTo(458, 108).lineTo(458, 128);
                        doc.rect(438, 108, 120, 20).stroke();
                        doc.text("Rs    " + apiUtils.indiaCurrencyFormat(advice.requestedAmount.valueOf()), 442, 115);
                    }
                }
                if (advice.bank) {
                    if(advice.bank.address) {
                        advice.bank.address = advice.bank.address.split("\n").join(",")
                    }
                    if(advice.bank.accountType !== constants.SAVE_BANK_ACCOUNT_TYPE.CASH_ON_HAND) {
                        doc.text("Account No: " + advice.bank.accountNo, 25, 186, {align: 'left'});
                        doc.text("Bank Address: " + advice.bank.address);
                        doc.text("Bank Branch: " + advice.bank.branchName);
                        doc.text("IFSC Code: " + advice.bank.ifscCode);
                    }
                    else {
                        doc.text("" + advice.bank.accountNo, 25, 186, {align: 'left'});
                    }
                } else {
                    doc.text("", 25, 186, {align: 'left'});
                    doc.moveDown(4);
                }
            } else if (advice.type === 'Cash') {
                doc.image('../client/app/images/moneyimages-3.jpeg');
                doc.moveTo(0, 50)
                    .lineTo(700, 50)
                    .stroke();

                doc.moveTo(0, doc.page.height - 60)
                    .lineTo(doc.page.width, doc.page.height - 60)
                    .stroke();
            } else {
                doc.moveTo(0, 50)
                    .lineTo(700, 50)
                    .stroke();

                doc.moveTo(0, doc.page.height - 60)
                    .lineTo(doc.page.width, doc.page.height - 60)
                    .stroke();
            }
            doc.moveDown(4);

            /*doc.text("Payment Advice ", {align: 'center'});*/
            doc.fontSize(17);
            doc.text("Payment Advice ",{align:'center'})
                .stroke();
            doc.fontSize(12);
            doc.moveDown();
            doc.text("Initiated by: " + advice.initiatedBy, {align: 'right'});
            doc.text("Date of Request: " + dateFormat(advice.requestedDate, "dd mmm, yyyy"), {align: 'right'});
            if (advice.disburserDate) {
                doc.text("Date of Disbursement: " + dateFormat(advice.disburserDate, "dd mmm, yyyy"), {align: 'right'});
            }
            if (advice.project) {
                doc.text("Project: " + advice.project.projectName, {align: 'right'});
            }
            doc.moveDown(2);
            doc.text("Pay To: " + (user ? apiUtils.getPayeeFullName(user):''), 25, 330);


            doc.moveDown(1);
            doc.text("Amount (INR): Rs " + apiUtils.indiaCurrencyFormat(
                    advice.requestedAmount ? advice.requestedAmount.valueOf():0), 25, 345);
            doc.text("(" + apiUtils.convertINRToWord(advice.requestedAmount) + ")", 25, 360, {
                align: 'left',
                lineBreak: 'true',
                width: '330'
            });
            doc.moveDown(2);
            doc.text("Payment type: " + (advice.paymentType ? advice.paymentType.name : ""), 25, 410);
            doc.text("Payment mode: " + (advice.type ? advice.type : ""));

            if (advice.paymentType && advice.paymentType.name === 'Bill Payment') {
                if (advice.billAmountDue) {
                    doc.text("Bill amount due: Rs. " + apiUtils.indiaCurrencyFormat(advice.billAmountDue.valueOf()));
                }
                else {
                    doc.text("Bill amount due: Rs. " + 0.0);
                }
            }
            else {
                if (advice.billAmountDue) {
                    doc.text("Bill amount due: Rs. " + apiUtils.indiaCurrencyFormat(advice.billAmountDue.valueOf()));
                    doc.text("(" + apiUtils.convertINRToWord(advice.billAmountDue) + ")");
                }
                else {
                    doc.text("Bill amount due: Not provided");
                }
            }
            doc.text("Purpose: " + (advice.description ? advice.description : ''));
            doc.text("Category: " + (advice.category ? advice.category.name : ''));
            if(advice.type === 'Cash'){
                doc.text("Ledger: " + (advice.ledger ? advice.ledger.name : ''));
            }
            doc.text("Requested by: " + (advice.requestedBy ? advice.requestedBy : ''));
            //initiator
            if (advice.user) {
                //TODO : advice.organization check
                if (advice.organization && advice.organization.stamp &&
                    advice.organization.stamp.filetype && advice.organization.stamp.base64) {
                    doc.image('data:' + advice.organization.stamp.filetype + ';base64,' + advice.organization.stamp.base64, 90, 560, {width: 40});
                } else {
                    console.log('organization stamp not added');
                }

                if (advice.user.signature && advice.user.signature.filetype && advice.user.signature.base64) {
                    doc.image('data:' + advice.user.signature.filetype + ';base64,' + advice.user.signature.base64, 50, 575, {width: 60});
                } else if(signature) {
                    var initiatorSignatureObj= signature[advice.user._id];
                    if (initiatorSignatureObj.filesize && initiatorSignatureObj.filetype) {
                        doc.image('data:' + initiatorSignatureObj.filetype + ';base64,' +
                            initiatorSignatureObj.base64,  50, 575, {width: 60});
                    } else {
                        console.log('initiator signature not added');
                    }
                }
                doc.text("Initiated by", 50, 600);
                if (advice.user.firstName && advice.user.lastName) {
                    doc.text(advice.user.firstName + "  " + advice.user.lastName);
                }
                else {
                    doc.text(advice.user.firstName);
                }
            }
            //level 2 approver
            if (advice.secondLevelApprover) {
                if (approvedStamp.filetype && approvedStamp.base64) {
                    doc.image('data:' + approvedStamp.filetype + ';base64,' + approvedStamp.base64, 220, 560, {width: 60});
                } else {
                    console.log('organization stamp not added');
                    doc.image('../client/app/images/APPROVED', 220, 560, {width: 60});
                }
                if (advice.secondLevelApprover.signature && advice.secondLevelApprover.signature.filetype &&
                    advice.secondLevelApprover.signature.base64) {
                    doc.image('data:' + advice.secondLevelApprover.signature.filetype + ';base64,' +
                        advice.secondLevelApprover.signature.base64, 170, 575, {width: 60});
                } else if(signature){
                    var secondApproverSignatureObj=signature[advice.secondLevelApprover._id];

                    if (secondApproverSignatureObj.filetype && secondApproverSignatureObj.filesize) {
                        doc.image('data:' + secondApproverSignatureObj.filetype + ';base64,' +
                            secondApproverSignatureObj.base64, 170, 575, {width: 60});

                    } else {
                        console.log('secondLevelApprover signature not added');
                    }

                }
                doc.moveDown();
                doc.text("Level 2 Approver", 170, 600);
                if (advice.secondLevelApprover.firstName && advice.secondLevelApprover.lastName) {
                    doc.text(advice.secondLevelApprover.firstName + "  " + advice.secondLevelApprover.lastName);
                }
                else {
                    doc.text(advice.secondLevelApprover.firstName, 210, 620);
                }
            }

            //level 3 approver
            if (advice.thirdLevelApprover) {
                if (approvedStamp.filetype && approvedStamp.base64) {
                    doc.image('data:' + approvedStamp.filetype + ';base64,' + approvedStamp.base64, 330, 560, {width: 60});
                } else {
                    doc.image('../client/app/images/APPROVED', 330, 560, {width: 60});
                }
                if (advice.thirdLevelApprover.signature && advice.thirdLevelApprover.signature.filetype &&
                    advice.thirdLevelApprover.signature.base64) {
                    doc.image('data:' + advice.thirdLevelApprover.signature.filetype + ';base64,' +
                        advice.thirdLevelApprover.signature.base64, 310, 575, {width: 30});
                } else if(signature){
                    var thirdApproverSignatureObj=signature[advice.thirdLevelApprover._id];
                    if (thirdApproverSignatureObj.filetype && thirdApproverSignatureObj.filesize) {
                        doc.image('data:' + thirdApproverSignatureObj.filetype + ';base64,' +
                            thirdApproverSignatureObj.base64, 310, 575, {width: 30});

                    } else {
                        console.log('thirdLevelApprover signature not added');
                    }
                }
                doc.text("Level 3 Approver", 290, 600);
                if (advice.thirdLevelApprover.firstName && advice.thirdLevelApprover.lastName) {
                    doc.text(advice.thirdLevelApprover.firstName + "  " + advice.thirdLevelApprover.lastName);
                }
                else {
                    doc.text(advice.thirdLevelApprover.firstName, 310, 620)
                }
            }
            //disburser
            if (advice.disburser) {
                if (disbursedStamp.filetype && disbursedStamp.base64) {
                    doc.image('data:' + disbursedStamp.filetype + ';base64,' + disbursedStamp.base64, 470, 560, {width: 60});
                } else {
                    doc.image('../client/app/images/DISBURSED', 470, 560, {width: 60});
                }

                if (advice.disburser.signature && advice.disburser.signature.filetype &&
                    advice.disburser.signature.base64) {
                    doc.image('data:' + advice.disburser.signature.filetype + ';base64,' +
                        advice.disburser.signature.base64, 440, 575, {width: 40});
                } else if(signature){
                    var disburserSignatureObj=signature[advice.disburser._id];
                    if (disburserSignatureObj.filetype && disburserSignatureObj.filesize) {
                        doc.image('data:' + disburserSignatureObj.filetype + ';base64,' +
                            disburserSignatureObj.base64, 440, 575, {width: 40});

                    } else {
                        console.log('disburser signature not added');
                    }
                }
                doc.text("Disburser", 440, 600);
                if (advice.disburser.firstName && advice.disburser.lastName) {
                    doc.text(advice.disburser.firstName + "  " + advice.disburser.lastName);
                }
                else {
                    doc.text(advice.disburser.firstName, 450, 620);
                }
            }
            doc.moveTo(44, 650).lineTo(700, 650);
            doc.moveTo(0, doc.page.height - 70).lineTo(doc.page.width, doc.page.height - 70);
            doc.text('Generated By iPASS', 20, doc.page.height - 40, {
                align: 'left',
                lineBreak: false
            });
        } catch(error) {
            console.log("Error while generating the pdf", error);
        }
        deferred.resolve();
        return deferred.promise;
    } ,
    cleanUpPdfs: function() {
        console.log("Removing old generated pdf's files from tmp folder");
        const testFolder = tmp;
        fs.readdir(testFolder, function(err, files){
            files.forEach(function(file){
                console.log(file);
                fs.unlink(testFolder+file,function(err,data){
                    if(err){
                        console.log("Chron job error :",err);
                    }
                    else {
                        console.log("Data :",data);
                    }
                })
            });
        })

    }
};
module.exports = advicePdfGenerator;

/**
 *
 * @param advices
 * @param doc
 * @param queryParam
 */
function updatePdfTopContents(advices,doc,queryParam){
    doc.addPage();
    doc.fontSize(17);
    doc.moveDown(3);

    doc.fontSize(12);
    doc.rect(160, 220, 400, 130).stroke();
    doc.text("Project Name :",170,230);
    doc.text(advices.projectDetails[0].name.projectName,250,230);

    doc.text("Total Amount :",170,250);
    doc.text(apiUtils.indiaCurrencyFormat(advices.total),250,250);
    doc.text("("+apiUtils.convertINRToWord(advices.total)+")",170,270);

    if(apiUtils.convertINRToWord(advices.total).length > 150){
        doc.text("Date Range :",170,320);
        if(queryParam.fromDate && queryParam.toDate){
            doc.text(apiUtils.getConvertedDate(queryParam.fromDate)+" to "+apiUtils.getConvertedDate(queryParam.toDate),250,320);
        }else if(queryParam.toDate){
            doc.text("Since Beginning"+" to "+apiUtils.getConvertedDate(queryParam.toDate),250,320);
        }else if(queryParam.fromDate){
            doc.text(apiUtils.getConvertedDate(queryParam.fromDate)+" to "+"Today",250,320);
        }
        else {
            doc.text("Since Beginning"+" to "+"Today",250,320);
        }
    }
    else {
        doc.text("Date Range :",170,300);

        if(queryParam.fromDate && queryParam.toDate){
            doc.text(apiUtils.getConvertedDate(queryParam.fromDate)+" to "+apiUtils.getConvertedDate(queryParam.toDate),250,300);
        }else if(queryParam.toDate){
            doc.text("Since Beginning"+" to "+apiUtils.getConvertedDate(queryParam.toDate),250,300);
        }else if(queryParam.fromDate){
            doc.text(apiUtils.getConvertedDate(queryParam.fromDate)+" to "+"Today",250,300);
        }
        else {
            doc.text("Since Beginning"+" to "+"Today",250,300);
        }
    }
}

/**
 *
 * @param advices-group of advices on project
 * @param doc
 * @param queryParam
 * @returns {*|promise}- return promise after completion of loop
 */
function updatePdfContent(advices,doc,queryParam,roles,signature,stamps) {
    var deferred = Q.defer();
    updatePdfTopContents(advices,doc,queryParam);
    advices.projectDetails.forEach(function(perAdvice, index){
        /* apiUtils.getAdviceById(perAdvice.id).then(function(advice){*/
        if (perAdvice) {
            doc.addPage();
            advicePdfGenerator.writeContentToPdf(doc, perAdvice,roles,signature,stamps);
        } else {
            console.log("PDF preparation failed");
        }
        if(index === advices.projectDetails.length - 1) {
            deferred.resolve();
        }
    });
    /*});*/
    return deferred.promise;
}



function writeEachAdvice(doc,advice,roles,signature,stamps){
    var deferred = Q.defer();
    doc.addPage();
    advicePdfGenerator.writeContentToPdf(doc, advice, roles, signature,stamps).then(function(){
        deferred.resolve();
    });

    return deferred.promise;
}
