var stampEnums = {
    "APPROVED_STAMP" : {code : "APPROVED_STAMP", value : "Approved Stamp"},
    "REJECTED_STAMP" : {code : "REJECTED_STAMP", value : "Rejected Stamp"},
    "VOID_STAMP" : {code : "VOID_STAMP", value: "Void Stamp"},
    "DISBURSED_STAMP" : {code : "DISBURSED_STAMP", value: "Disbursed Stamp"},
    "COMPANY_STAMP" : {code : "COMPANY_STAMP", value: "Company Stamp"}

};

var stampEnumsObj = {
    values: Object.keys(stampEnums),
    value: function (code) {
        return typeEnums[code].code;
    }
};
stampEnumsObj = Object.assign(stampEnums, stampEnumsObj);
module.exports = stampEnumsObj;
