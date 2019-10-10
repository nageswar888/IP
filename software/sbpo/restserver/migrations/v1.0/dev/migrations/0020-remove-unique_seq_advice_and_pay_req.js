exports.up = function(db, next){
    /*Collections*/
    var adviceCollection = db.collection('advices');
    var paymentRequestsCollection = db.collection('paymentRequests');
    var payeeCollection = db.collection('payees');


    /*Drop unique index from advices collection for seq*/
    try {
        adviceCollection.dropIndex("seq_1");
    } catch (e) {
        console.log(e)
    }

    /*Drop unique index from paymentRequests collection for pr_seq*/
    try {
        paymentRequestsCollection.dropIndex("pr_seq_1");
    } catch (e) {
        console.log(e)
    }

    /*Drop unique index from payee collection for payeeNumber*/
    try {
        payeeCollection.dropIndex("payeeNumber_1");
    } catch (e) {
        console.log(e)
    }
    next();
};
exports.down = function(db, next){
    next();
};
