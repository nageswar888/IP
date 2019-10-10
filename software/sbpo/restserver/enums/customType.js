var typeEnums = {
    "PAYMENT_TYPE": {code:"PAYMENT_TYPE", value: "PaymentType"},
    "CATEGORY": {code:"CATEGORY", value: "Category"}
};

var typeEnumObj = {
    values: Object.keys(typeEnums),
    value: function (code) {
        return typeEnums[code].code;
    }
};
typeEnumObj = Object.assign(typeEnums, typeEnumObj);
module.exports = typeEnumObj;