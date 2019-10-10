var customType = require("../enums/customType");

module.exports = Object.freeze({
    YEAR: 'year',
    MONTH: 'month',
    WEEKS: 'weeks',
    WEEK: 'week',
    DAY: 'day',
    ADVICE_STATUS_CATEGORIES: {
        PENDING: 'Pending',
        IN_PROGRESS: 'Inprogress',
        REJECTED:'Rejected',
        DISBURSED:'Disbursed',
        LEVEL_TWO_APPROVED:'Level 2 Approved',
        LEVEL_THREE_APPROVED:'Level 3 Approved',
        VOID:'Void',
        DRAFT:'Draft',
        SUBMITTED:'Submitted',
        ALL_REJECTED: ['Rejected','Level 2 Rejected','Level 3 Rejected','Disburser Rejected']
    },
    ADVICE_APPROVE_STATUS_BY_ROLE: {
        ROLE_LEVEL2APPROVER: "Level 2 Approved",
        ROLE_LEVEL3APPROVER: "Level 3 Approved",
        ROLE_DISBURSER: "Disbursed",
        ROLE_INITIATOR: "Submitted",
        ROLE_INITIATOR_ROLE: "Initiator",
        ROLE_PAYMENT_REQUESTER_ROLE: "Initiator"
    },
    ADVICE_REJECT_STATUS_BY_ROLE: {
        ROLE_LEVEL2APPROVER: "Level 2 Rejected",
        ROLE_LEVEL3APPROVER: "Level 3 Rejected",
        ROLE_DISBURSER: "Disburser Rejected"
    },
    ADVICE_ROLE: {
        ROLE_LEVEL2APPROVER: "ROLE_LEVEL2APPROVER",
        ROLE_LEVEL3APPROVER: "ROLE_LEVEL3APPROVER",
        ROLE_INITIATOR: "ROLE_INITIATOR",
        ROLE_DISBURSER: "ROLE_DISBURSER",
        ROLE_ADMIN: "ROLE_MASTERADMIN"
    },
    ADVICE_DISPLAY_ROLES: {
        ROLE_LEVEL2APPROVER: "Level 2 Approver",
        ROLE_LEVEL3APPROVER: "Level 3 Approver",
        ROLE_INITIATOR: "Initiator",
        ROLE_DISBURSER: "Disburser",
        ROLE_ADMIN: "Master Admin"
    },
    ADVICE_DISPLAY_STATUS_BY_ROLE: {
        ROLE_INITIATOR: "Draft",
        ROLE_LEVEL2APPROVER: "Submitted",
        ROLE_LEVEL3APPROVER: "Level 2 Approved",
        ROLE_DISBURSER: "Level 3 Approved"
    },
    ADVICE_STATUS: {
      STATUS_SUCCESS : "success"
    },
    DOWNLOAD_FILE_TYPE:{
        ALL_EXCEL : "allExcel",
        EXCEL : "excel"
    },
    CUSTOM_TYPE: customType.values,
    PAYMENT_REQUEST_PRECODE:"PR",
    PAYMENT_REQUEST_SUBJECT: {
        "CREATED":"iPASS payment request",
        "REJETED":"iPASS payment request rejected",
        "APPROVED":"iPASS payment request approved",
        "DISBURESD":"iPASS payment request disbursed",
        "INITIATED":"iPASS payment request initiated"
    },
    PAYMENT_REQUEST_ROLES:{
        ROLE_PAYMENT_REQUESTER: "ROLE_PAYMENT_REQUESTER"
    },
    GROUP_TYPE: {
        "PROJECT":"project",
        "PAYEE":"payee"
    },
    PAYMENT_REQUEST_STATUS: {
        SUBMITTED: 'SUBMITTED',
        REJECTED: 'REJECTED',
        APPROVED:'APPROVED'
    },
    SAVE_BANK_ACCOUNT_TYPE: {
        CASH_ON_HAND: 'Cash on Hand'
    },
    PAYMENT_MODE:{
            CASH : 'Cash',
            CHEQUE : 'Cheque',
            CREDIT_CARD:"Credit Card",
            DEBIT_CARD:"Debit Card",
            RTGS : "RTGS",
            NEFT : "NEFT",
            DEBIT_BY_BANK : "Debit By Bank",
            BANK_ACCOUNT : "Bank Account"

        }

});
