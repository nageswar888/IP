(function() {
    'use strict';
    angular
        .module('sbpo')
        .constant('customType',{
            PAYMENT_TYPE:'PaymentType',
            CATEGORY:'Category'
        })
        .constant('category',{
            GROUP_GRAPH: 'graph',
            GROUP_DEFAULT: 'default',
            GROUP_ADVICE: 'advice',
            GROUP_PROJECT: 'project',
            GROUP_PAYEE: 'payee',
            GROUP_PAYMENT_TYPE: 'paymentType',
            GROUP_CATEGORY: 'category'
        })
        .constant('ledgerType',{
            LEDGER : "ledger",
            VIRTUAL_LEDGER : "virtualLedger",
        })
        .constant('customFieldsMsgs',{
            ADVICE_CONTAIN_CUSTOM_FIELDS:"Advice contains custom field",
            PAYMENT_TYPE_CONTAIN_CUSTOM_FIELDS:"Payment type contains custom field"
        })
        .constant('Regexes',{
            IMAGE_EXTENSION_FORMAT : /(\.jpg|\.jpeg|\.bmp|\.gif|\.png)$/i,
            NAME_PATTERN :/^[a-zA-Z\(\)]+$/,
            PHONE_NO_PATTERN : /^\(?(\d{3})\)?[ .-]?(\d{3})[ .-]?(\d{4})$/,
            CHEQUE_NO_PATTERN:/^[0-9]{1,15}$/,
            AMOUNT_PATTERN:/([1-9][0-9]*||[0]*[1-9]+[0-9]*)/,
            STAMP_EXTENTION_FORMAT : /(\.png)$/i,

        })
        .constant('contact',{
            CONTACT_EMAIL:'email',
            CONTACT_MOBILE:'mobile',
            CONTACT_PHONE:'phone',

        })
        .constant('validation',{
            CATEGORY_NAME_MAX_LENGTH:20,
            PAYMENT_TYPE_NAME_MAX_LENGTH:20,
            CHEQUE_NUMBER_MAX_LENGTH:15,

            project:{
                name:{maxLength:50,minLength:0},
                location:{maxLength:150,minLength:3}
            },
            user:{
                firstName:{maxLength:20,minLength:0},
                middleName:{maxLength:20,minLength:0},
                lastName:{maxLength:20,minLength:0},
                phone:{length:10},
                email:{minLength:4}
            },
            ledger:{
                name:{maxLength:50,minLength:0}
            },
            reportedBy:{maxLength:40},
            payee:{
                firstName:{maxLength:20,minLength:0},
                middleName:{maxLength:20,minLength:0},
                lastName:{maxLength:20,minLength:0},
                nickName:{maxLength:25,minLength:0},
                phone:{maxLength:10,minLength:10},
                email:{maxLength:4},
                bankName:{maxLength:20},
                bankBranch:{maxLength:20},
                ifscCode:{maxLength:20},
                accountNo:{maxLength:20}
            },
            advice:{
                requestedByName:{maxLength:40,minLength:0},
                amount:{maxLength:15,minLength:0},
                purpose:{maxLength:500,minLength:0},
                billAmount:{maxLength:21},
                create: {
                    amount:{maxLength:21,minLength:0},
                }
            },
            account: {
                address:{maxLength:100,minLength:0},
                bankBalance:{maxLength:21}
            },
            default:{ maxLength:20 },
            comments: {
                maxLimit:3,minLimit:0
            }

        })
        .constant('adviceStatus',{
            DISBURSED : 'Disbursed',
            DRAFT:'Draft',
            SUBMITTED:'Submitted',
            APPEOVED_BY_2: 'Level 2 Approved',
            APPEOVED_BY_3:'Level 3 Approved'
        })
        .constant('radioButtonValues',{
            BEGINNING : 'beginning'
        })
        .constant('stamp',{
            APPROVED_STAMP : 'Approved Stamp',
            REJECTED_STAMP : 'Rejected Stamp',
            VOID_STAMP : 'Void Stamp',
            DISBURSED_STAMP : 'Disbursed Stamp',
            COMPANY_STAMP : 'Company Stamp'

        })
        .constant('downloadConstants',{
            PDF : 'pdf',
            ALL_PDF: 'allPdf',
            EXCEL : 'excel',
            ALL_EXCEL : 'allExcel'
        })
        .constant('account',{
            BANK_LABELS : ['Credit Card', 'Debit Card', 'Cheque', 'RTGS', 'NEFT','Debit By Bank'],
            CHEQUE_LABELS : ['Cheque', 'RTGS', 'NEFT'],
            CASH: 'Cash'
        })
        .constant('adviceEditType',{
            EDIT_ADVICE : 'editAdvice',
            VIEW_ADVICE : 'viewAdvice',
            DISBURSE_ADMIN_EDIT_ADVICE: 'disbursedAdminEdit'
        })
        .constant('accountType',{
            BANK_ACCOUNT : 'Bank Account',
            CREDIT_CARD:"Credit Card",
            DEBIT_CARD:"Debit Card",
            CASH_ON_HAND:"Cash on Hand",
            DEBIT_BY_BANK :"Debit By Bank"

        })
        .constant('paymentMode',{
            CASH : 'Cash',
            CHEQUE : 'Cheque',
            CREDIT_CARD:"Credit Card",
            DEBIT_CARD:"Debit Card",
            RTGS : "RTGS",
            NEFT : "NEFT",
            DEBIT_BY_BANK : "Debit By Bank"

        })      
        .constant('groupByCriteriaLimit',{
            PROJECT_LIST_LIMIT : 10,
            ADVICE_LIST_LIMIT  : 10
        })
        .constant('states',{
            CREATE_LEGACY_ADVICE : "createLegacyAdvice",
            ADVICE_PENDING : "advice.pending-approval",
            ADVICE_INPROGRESS : "advice.inprogress",
            ADVICE_REJECTED : "advice.rejected",
            PAYMENT_REQ_INPROGRESS : "inprogressPaymentRequests",
            PAYMENT_REQ_INPROCESS : "inProcessPaymentRequests",
            PAYMENT_REQ_REJECTED : "rejectedPaymentRequests"
        })
        .constant('paymentReqStatus',{
            APPROVED : "APPROVED",
            SUBMITTED : "SUBMITTED",
            REJECTED : "REJECTED"
        })
}());
