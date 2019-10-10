var statusEnums = {
    "DRAFT": {code:"DRAFT", value: "Draft"},
    "SUBMITTED": {code:"SUBMITTED", value: "Submitted"},
    "APPROVED": {code:"APPROVED", value: "Approved"},
    "REJECTED": {code:"REJECTED", value: "Rejected"}
};

var statusEnumObj = {
    values: Object.keys(statusEnums),
    value: function (code) {
        return statusEnums[code].code;
    }
};
statusEnumObj = Object.assign(statusEnums, statusEnumObj);
module.exports = statusEnumObj;