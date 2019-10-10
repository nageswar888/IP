/**
 * Created by sukesh on 8/11/16.
 */
var BankModel= require('../../models/BankModel');
var SuccessResponse = require('../../models/SuccessResponse');
var errorResult = require('../../models/ErrorResult');
var AdviceModel= require('../../models/AdviceModel');
var apiUtils = require('../../utils/apiUtils');
var constants = require('../../utils/constants');
var BankRouter={

    /**
     * Prepare query for list the banks
     * @param req
     * @param res
     */
    prepareQuery: function(req, res) {
        var query={};
        query.organization = req.currentUser.organization;
        query.expired = false;
        return query;
    },
    listAllBanks: function(req,res){

        //only for pagination
        if(req.query.page) {
            var page_number =req.query.page ? req.query.page:1;
            var page_size = req.query.page_size ? req.query.page_size : 10 ;

            var query= BankRouter.prepareQuery(req, res);
            var regExp;
            /*TODO:Update query (Multiple filters can not be applied)*/

            if(req.query.accountName){
                regExp= new RegExp(req.query.accountName, "i");
                query.accountName=regExp;
            }if(req.query.accountType){
                regExp= new RegExp(req.query.accountType, "i");
                query.accountType=regExp;
            }if(req.query.accountNo){
                regExp= new RegExp(req.query.accountNo, "i");
                query.accountNo=regExp;
            }if(req.query.bankName){
                regExp= new RegExp(req.query.bankName, "i");
                query.bankName=regExp;
            }if(req.query.branchName){
                regExp= new RegExp(req.query.branchName, "i");
                query.branchName=regExp;
            }if(req.query.ifscCode){
                regExp= new RegExp(req.query.ifscCode, "i");
                query.ifscCode=regExp;
            }if(req.query.address){
                regExp= new RegExp(req.query.address, "i");
                query.address=regExp;
            }

            // Refer for paginate https://www.npmjs.com/package/mongoose-paginate
            BankModel.paginate(query, {sort: {accountName:1}, page: Number(page_number), limit: Number(page_size)  }, function(err, response) {
                if (err) {
                    res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),err));
                } else {
                    res.send(JSON.stringify(new SuccessResponse('OK', response.docs, response, apiUtils.i18n('request.success.msg')) ));
                    res.end();
                }
            });
        }else {
            var query= BankRouter.prepareQuery(req, res);
            if(req.query.accountName){
                regExp= new RegExp(req.query.accountName, "i");
                query.accountName=regExp;
            }else if(req.query.accountName==='') {
                query.accountName='';
            }if(req.query.modeOfPayment){
                if(req.query.modeOfPayment === constants.PAYMENT_MODE.CASH){
                    query.accountType= constants.SAVE_BANK_ACCOUNT_TYPE.CASH_ON_HAND;
                }if(req.query.modeOfPayment === constants.PAYMENT_MODE.CREDIT_CARD){
                    query.accountType= constants.PAYMENT_MODE.CREDIT_CARD;
                }if(req.query.modeOfPayment === constants.PAYMENT_MODE.DEBIT_CARD){
                    query.accountType= constants.PAYMENT_MODE.DEBIT_CARD;
                }if(req.query.modeOfPayment === constants.PAYMENT_MODE.DEBIT_BY_BANK){
                    query.accountType=  {$ne: constants.SAVE_BANK_ACCOUNT_TYPE.CASH_ON_HAND}
                }if(req.query.modeOfPayment === constants.PAYMENT_MODE.NEFT || req.query.modeOfPayment === constants.PAYMENT_MODE.RTGS || req.query.modeOfPayment === constants.PAYMENT_MODE.CHEQUE){
                    query.accountType= constants.PAYMENT_MODE.BANK_ACCOUNT;
                }
            }
            var aggQuery = apiUtils.prepareFetchByNameAggregateQuery(query,'accountName');
            BankModel.aggregate(aggQuery
                ,function(err,bank){
                    if(bank) {
                        res.send(new SuccessResponse(200, bank, "", apiUtils.i18n('request.success.msg')));
                    }
                    else {
                        res.send(new errorResult(404, apiUtils.i18n('account.by.name.not.found.error.msg'),err));
                    }
                    if(err){
                        res.send(new errorResult(500, apiUtils.i18n('account.by.name.error.msg'),err));
                    }
                })
        }
    },
    getBankCount: function(req, res) {
        var query= BankRouter.prepareQuery(req, res);
        var aggregateQuery = apiUtils.prepareCountAggregationQueryForAdmin(query);

        if (apiUtils.isEmptyObject(aggregateQuery)) {
            res.json({data:"empty"})
        }
        else {
            BankModel.aggregate(aggregateQuery,function(error,result){
                if(result){
                    res.send( new SuccessResponse(200, result, "", apiUtils.i18n('request.success.msg')) );
                }
                if(error){
                    res.send(new errorResult(500, apiUtils.i18n('bank.count.error.msg')))
                }
            });
        }

    },
    saveBanks: function(req,res){
        queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var accNamePattern = '^'+queryParam.accountname.trim()+'$';
        var accNameRegex = new RegExp(accNamePattern, "i");
        BankModel.count({accountName:accNameRegex, organization:req.currentUser.organization, expired:false}, function(err,accNameCount) {
            if (accNameCount == 0) {
                if(queryParam.accountType===constants.SAVE_BANK_ACCOUNT_TYPE.CASH_ON_HAND){
                    new BankModel({
                        accountName:queryParam.accountname,
                        accountType:queryParam.accountType,
                        openingBalance:queryParam.openingBalance,
                        asOf:queryParam.asOf,
                        organization : req.currentUser.organization
                    }).save(function(error,newBank){
                        if(error){
                            console.log(error);
                            res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'), error));
                        }else{
                            res.send( new SuccessResponse('OK', newBank, "", apiUtils.i18n('request.success.msg')) );
                        }
                    });
                }else{
                    var accNumPattern = '^'+queryParam.accountno.trim()+'$';
                    var accNumRegex = new RegExp(accNumPattern, "i");
                    BankModel.count({accountNo:accNumRegex, organization:req.currentUser.organization,  expired:false}, function(err,accNumCount) {
                        console.log("Num count "+accNumCount);
                        if(accNumCount == 0){
                            new BankModel({
                                accountName: queryParam.accountname,
                                accountNo: queryParam.accountno,
                                bankName: queryParam.bankname,
                                branchName: queryParam.branchname,
                                ifscCode: queryParam.ifsccode,
                                address: queryParam.address,
                                accountType: queryParam.accountType,
                                creditCardNumber: queryParam.creditCardNumber,
                                debitCardNumber: queryParam.debitCardNumber,
                                openingBalance: queryParam.openingBalance,
                                asOf: queryParam.asOf,
                                organization: req.currentUser.organization
                            }).save(function (error, newBank) {
                                if (error) {
                                    console.log(error);
                                    res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'), error));
                                } else {
                                    res.send(new SuccessResponse('OK', newBank, "", apiUtils.i18n('request.success.msg')));
                                }
                            });
                        }
                        else{
                            res.send(new errorResult(409, apiUtils.i18n('bank.save.account.num.exist.error.msg'), 'Failure'));
                        }
                    })

                }
            } else {
                res.send(new errorResult(409, apiUtils.i18n('bank.save.account.exist.error.msg'), 'Failure'));
            }
        });

    },


    deleteBank:function(req,res){
        AdviceModel.findOne({'bank': req.params.id}, function (err, advice) {
            if(advice && advice.adviceStatus !== constants.ADVICE_STATUS_CATEGORIES.VOID){
                return res.json(new errorResult('FAILED', apiUtils.i18n('bank.delete.contain.transaction.error.msg'), [err]))
            }else{
                BankModel.update({_id:req.params.id}, {expired: true},
                    function(error, result) {
                        if (error) {
                            return res.json(new errorResult('FAILED',  apiUtils.i18n('bank.delete.error.msg'), [error]))
                        }
                        else{
                            return res.json(new SuccessResponse('OK', {}, {}, apiUtils.i18n('request.success.msg')));
                        }
                    });
            }
        });
    },

    updateBank:function(req,res){
        queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var accNamePattern = '^'+queryParam.accountname.trim()+'$';
        var accNameRegex = new RegExp(accNamePattern, "i");

        BankModel.count({accountName:accNameRegex,_id:{$ne:queryParam.id},expired: false, organization:req.currentUser.organization},function(err,accNameCount){
            if(accNameCount == 0) {
                if(queryParam.accountType===constants.SAVE_BANK_ACCOUNT_TYPE.CASH_ON_HAND){
                    BankModel.update(
                        { _id: queryParam.id },
                        {   accountName:queryParam.accountname,
                            accountType:queryParam.accountType,
                            openingBalance:queryParam.openingBalance,
                            asOf:queryParam.asOf,
                            accountNo:"",
                            address:"",
                            creditCardNumber:"",
                            debitCardNumber:"",
                            ifscCode:"",
                            bankName:"",
                            branchName:""
                        },
                        { upsert: true },function(error,data){

                            if(error){
                                res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),error));
                            }

                            else {
                                res.send( new SuccessResponse('OK', data, "", apiUtils.i18n('request.success.msg')) );
                            }

                        }
                    );
                }else{
                    var accNumPattern = '^'+queryParam.accountno.trim()+'$';
                    var accNumRegex = new RegExp(accNumPattern, "i");
                    BankModel.count({accountNo:accNumRegex,_id:{$ne:queryParam.id},expired: false, organization:req.currentUser.organization},function(err,accNumCount){
                        if(accNumCount == 0) {
                            BankModel.update(
                                { _id: queryParam.id },
                                {   accountName:queryParam.accountname,
                                    accountNo:queryParam.accountno,
                                    bankName:queryParam.bankname,
                                    branchName:queryParam.branchname,
                                    ifscCode:queryParam.ifsccode,
                                    address:queryParam.address,
                                    accountType:queryParam.accountType,
                                    openingBalance:queryParam.openingBalance,
                                    creditCardNumber:queryParam.creditCardNumber,
                                    debitCardNumber:queryParam.debitCardNumber,
                                    asOf:queryParam.asOf
                                },
                                { upsert: true },function(error,data){

                                    if(error){
                                        res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),error));
                                    }

                                    else {
                                        res.send( new SuccessResponse('OK', data, "", apiUtils.i18n('request.success.msg')) );
                                    }

                                }
                            );
                        }
                        else{
                            res.send(new errorResult(409, apiUtils.i18n('bank.save.account.num.exist.error.msg'), 'Failure'));
                        }
                    })
                }
            } else {
                res.send(new errorResult(409, apiUtils.i18n('bank.save.account.exist.error.msg'), 'Failure'));
            }
        });
    }
};
module.exports=BankRouter;
