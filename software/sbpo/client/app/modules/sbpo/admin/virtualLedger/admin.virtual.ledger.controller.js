/**
 * Created by sb0103 on 11/1/17.
 */

(function(){
    angular.module('admin')
        .controller('virtualLedgerController', virtualLedgerController);
    virtualLedgerController.$inject=['virtualLedgerService','addAdminPayeeService', '$filter', 'passUtilsService', 'Flash','$uibModal','ledgerType','validation'];

    function virtualLedgerController(virtualLedgerService, addAdminPayeeService, $filter, passUtilsService, Flash, $uibModal,ledgerType,validation) {
        var vm = this;
        vm.listVirtualLedgers = listVirtualLedgers;
        vm.saveVirtualLedger = saveVirtualLedger;
        vm.editVirtualLedger = editVirtualLedger;
        vm.isContainEditedRows=isContainEditedRows;

        vm.deleteVirtualLedger = deleteVirtualLedger;
        vm.removeVirtualLedger = removeVirtualLedger;
        vm.getAllPayees = getAllPayees;
        vm.addLedger = addLedger;
        vm.ledgerNameMaxLength=validation.ledger.name.maxLength;
        getAllPayees();
        listVirtualLedgers();
        /**
         * Return true if list contains editable rows otherwise false
         * @returns {boolean}
         */
        function isContainEditedRows(groupContacts){
            if(groupContacts)
                return passUtilsService.findByKeyAndValue(groupContacts, 'edit', true)!=null;
            return false;
        }


        /**
         * Responsible to list existed ledgers. renders empty if ledgers doesw not exists
         */
        function listVirtualLedgers(){
            vm.virtualLedgers = []; vm.unModifiedVirtualLedgers = [];
            /*TODO:Get values based on discriminator*/
            var type = ledgerType.VIRTUAL_LEDGER;
            virtualLedgerService
                .listVirtualLedger({ledgerType: type})
                .then(listSuccessCallBack)
                .catch(listFailureCallBack);

            function listSuccessCallBack(response) {
                if(response.data && response.data.length == 0) { addLedger() }
                else { 
                    
                    vm.virtualLedgers=$filter('orderBy')(response.data, 'name');
                }
                vm.unModifiedVirtualLedgers = angular.copy(vm.virtualLedgers);
            }

            function listFailureCallBack(error) { console.log(error) }
        }

        /**
         * Adds ledger with edit optionn to existed list
         */
        function addLedger() { vm.virtualLedgers.push({name:'', payees:[],  edit:true }) }

        /**
         * Responsible to shift ledger to edit mode
         * @param ledger
         */
        function editVirtualLedger(ledger){ ledger.edit = true; }

        /**
         * Responsible to save ledgers
         */
        function saveVirtualLedger(){
            if(vm.ledgerForm.$valid) {
                var editableLedgers = passUtilsService.findAllByKeyAndValue(vm.virtualLedgers, 'edit', true);
                editableLedgers = editableLedgers.map(function(elem, index){
                    var obj = {};
                    if(elem['_id']) { obj['id'] = elem['_id'] }
                    obj['name'] = elem.name;
                    obj['payees'] = elem.payees.map(function(elem,index) { return elem['_id']});
                    obj['discriminator'] = ledgerType.VIRTUAL_LEDGER;
                    return obj;
                });

                var ledgersNames = editableLedgers.map(function(elem){ return elem.name.toLowerCase() });
                var ledgersArrLength = ledgersNames.length;
                var uniqueLedgersArrLength = jQuery.unique(ledgersNames.sort()).length;
                if(ledgersArrLength == uniqueLedgersArrLength && ledgersArrLength !=0) {
                    if(isUniquePayeeExist()) {
                        virtualLedgerService
                            .saveVirtualLedger(editableLedgers)
                            .then(saveSuccessCallBack)
                            .catch(saveFailureCallBack);
                    } else {
                        Flash.create('danger',$filter('translate')("virtual-ledger.payee.duplicate.invalid"),'virtualLedgerFlashMsgDiv');
                    }
                } else {
                    Flash.create('danger',$filter('translate')('virtual-ledger.name.invalid'),'virtualLedgerFlashMsgDiv');
                }
            } else {
                for(var i=0;i<vm.virtualLedgers.length;i++) {
                    if(vm.ledgerForm['name'+i] && vm.ledgerForm['name'+i].$invalid && vm.ledgerForm['name'+i].$error.required) {
                        Flash.create('danger',$filter('translate')('virtual-ledger.name.required'),'virtualLedgerFlashMsgDiv');
                    }
                }
                if((vm.ledgerForm.payees.$invalid )){
                    Flash.create('danger',$filter('translate')('virtual-ledger.payee.invalid'),'virtualLedgerFlashMsgDiv');
                }
            }
            function saveSuccessCallBack(response) {
                if(response.status === 200) {
                    Flash.create('success', $filter('translate')('virtual-ledger.save.success.message'),'virtualLedgerFlashMsgDiv');
                    listVirtualLedgers()
                } else if(response.status === 409){
                    Flash.create('danger', $filter('translate')('virtual-ledger.name.invalid'),'virtualLedgerFlashMsgDiv');
                } else {
                    Flash.create('danger', $filter('translate')('virtual-ledger.payee.duplicate.invalid'),'virtualLedgerFlashMsgDiv');
                }
            }

            function saveFailureCallBack(error) {
                Flash.create('danger',$filter('translate')('virtual-ledger.save.fail.message'),'virtualLedgerFlashMsgDiv');
            }
        }

        function deleteVirtualLedger(ledger){
            $uibModal.open({
                template: require('../../../../partials/virtual-ledger/deleteVirtualLedgerConfirmation.html'),
                controller: function ($scope, $uibModalInstance, Flash) {
                    $scope.confirmOk=function(){
                        virtualLedgerService.deleteVirtualLedger(ledger._id).then(deleteVirtualLedgerSuccess).catch(deleteVirtualLedgerFail);

                        function deleteVirtualLedgerSuccess(response){
                            if(response.status == 200) {
                                $uibModalInstance.close();
                                Flash.create('success', $filter('translate')('virtual-ledger.delete.success.msg'),'virtualLedgerFlashMsgDiv');
                                listVirtualLedgers()
                            } else {
                                Flash.create('danger', $filter('translate')('virtual-ledger.delete.fail.msg'),'virtualLedgerFlashMsgDiv');
                            }
                        }
                        function deleteVirtualLedgerFail(error){
                            Flash.create('danger', $filter('translate')('virtual-ledger.delete.fail.msg'),'virtualLedgerFlashMsgDiv');
                            $uibModalInstance.close();
                        }
                    };

                    $scope.cancleConfirmation=function(){
                        $uibModalInstance.close();
                    }
                }
            });
        }

        function removeVirtualLedger(index, ledger){
            if(ledger['_id']) {
                var loadedLedger = passUtilsService.findByKeyAndValue(vm.unModifiedVirtualLedgers, '_id', ledger['_id']);
                if( loadedLedger ) {
                    ledger.name = loadedLedger.name;
                    ledger.payees = loadedLedger.payees;
                }
                ledger.edit = false;
            } else {
                vm.virtualLedgers.splice(index, 1);
            }
        }

        /*
         * fetch all payees by name
         * */
        function getAllPayees(searchTerm) {
            addAdminPayeeService.getPayeesByName({payeeName:searchTerm}).then(handlePayeeNameSuccess).catch(handlePayeeNameFailure);
            function handlePayeeNameSuccess(response) {
                vm.payees = response.data;
            }
            function handlePayeeNameFailure(error){
                console.log(error);
            }
        }

        function isUniquePayeeExist(){
            var allPayees = [];
            vm.virtualLedgers.forEach(function(ledger){
                allPayees = allPayees.concat(ledger.payees.map(function(p){ return p['_id']}));
            });
            return (allPayees.length != 0 && allPayees.length == jQuery.unique(allPayees.sort()).length);
        }
    }
})();
