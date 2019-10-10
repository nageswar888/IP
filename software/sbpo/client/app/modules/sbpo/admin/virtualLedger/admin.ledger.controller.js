/**
 * Created by sb0103 on 11/1/17.
 */

(function(){
    angular.module('admin')
        .controller('ledgerController', virtualLedgerController);
    virtualLedgerController.$inject=['virtualLedgerService','addAdminPayeeService', '$filter', 'passUtilsService', 'Flash','$uibModal','ledgerType','validation'];

    function virtualLedgerController(virtualLedgerService, addAdminPayeeService, $filter, passUtilsService, Flash, $uibModal,ledgerType,validation) {
        var vm = this;
        vm.listLedgers = listLedgers;
        vm.saveLedger = saveLedger;
        vm.editLedger = editLedger;
        vm.deleteLedger = deleteLedger;
        vm.removeLedger = removeLedger;
        vm.addLedger = addLedger;
        vm.isContainEditedRows=isContainEditedRows;
        vm.ledgerNameMaxlength = validation.ledger.name.maxLength;
        listLedgers();


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
        function listLedgers() {
            vm.ledgers = [];
            vm.unModifiedLedgers = [];
            var type = ledgerType.LEDGER;
            console.log(type)
            virtualLedgerService
                .listVirtualLedger({ledgerType: type})
                .then(listSuccessCallBack)
                .catch(listFailureCallBack);

            function listSuccessCallBack(response) {
                if (response.data && response.data.length == 0) {
                    addLedger()
                }
                else {
                    vm.ledgers = $filter('orderBy')(response.data, 'name');

                }
                vm.unModifiedLedgers = angular.copy(vm.ledgers);
            }

            function listFailureCallBack(error) {
                console.log(error)
            }
        }

        /**
         * Adds ledger with edit optionn to existed list
         */
        function addLedger() {
            vm.ledgers.push({name: '', edit: true})
        }

        /**
         * Responsible to shift ledger to edit mode
         * @param ledger
         */
        function editLedger(ledger) { ledger.edit = true; }

        /**
         * Responsible to save ledgers
         */
        function saveLedger() {
            if (vm.ledgerForm.$valid) {
                var editableLedgers = passUtilsService.findAllByKeyAndValue(vm.ledgers, 'edit', true);
                editableLedgers = editableLedgers.map(function (elem, index) {
                    var obj = {};
                    if (elem['_id']) {
                        obj['id'] = elem['_id']
                    }
                    obj['name'] = elem.name;
                    obj['discriminator'] = ledgerType.LEDGER;
                    return obj;
                });

                var ledgersNames = editableLedgers.map(function (elem) {
                    return elem.name.toLowerCase()
                });
                var ledgersArrLength = ledgersNames.length;
                var uniqueLedgersArrLength = jQuery.unique(ledgersNames.sort()).length;
                if (ledgersArrLength == uniqueLedgersArrLength && ledgersArrLength != 0) {
                    virtualLedgerService
                        .saveVirtualLedger(editableLedgers)
                        .then(saveSuccessCallBack)
                        .catch(saveFailureCallBack);
                }
                else {
                    Flash.create('danger', $filter('translate')('ledger.name.required'), 'ledgerFlashMsgDiv');
                }
            }
            else {
                for(var i=0;i<vm.ledgers.length;i++) {
                    if(vm.ledgerForm['name'+i] && vm.ledgerForm['name'+i].$invalid && vm.ledgerForm['name'+i].$error.required) {
                        Flash.create('danger', $filter('translate')('ledger.name.required'), 'ledgerFlashMsgDiv');
                    }
                }
            }
            function saveSuccessCallBack(response) {
                if (response.status == 200) {
                    Flash.create('success', $filter('translate')('ledger.save.success.message'), 'ledgerFlashMsgDiv');
                    listLedgers();
                } else {
                    Flash.create('danger', $filter('translate')('ledger.name.invalid'), 'ledgerFlashMsgDiv');
                }
            }
            function saveFailureCallBack(error) {
                Flash.create('danger', $filter('translate')('ledger.save.fail.message'), 'ledgerFlashMsgDiv');
            }
        }


        function deleteLedger(ledger) {
            $uibModal.open({
                template: require('../../../../partials/virtual-ledger/deleteVirtualLedgerConfirmation.html'),
                controller: function ($scope, $uibModalInstance, Flash) {
                    $scope.confirmOk = function () {
                        virtualLedgerService.deleteVirtualLedger(ledger._id).then(deleteVirtualLedgerSuccess).catch(deleteVirtualLedgerFail);

                        function deleteVirtualLedgerSuccess(response) {
                            if (response.status == 200) {
                                $uibModalInstance.close();
                                Flash.create('success', $filter('translate')('ledger.delete.success.msg'), 'ledgerFlashMsgDiv');
                                listLedgers()
                            }
                            else if(response.status === 403) {
                                Flash.create('danger', $filter('translate')('ledger.delete.contains.advice.error.msg'), 'ledgerConfirmFlashMsgDiv');
                            }
                            else {
                                Flash.create('danger', $filter('translate')('ledger.delete.fail.msg'), 'ledgerFlashMsgDiv');
                            }
                        }

                        function deleteVirtualLedgerFail(error) {
                            Flash.create('danger', $filter('translate')('ledger.delete.fail.msg'), 'ledgerFlashMsgDiv');
                            $uibModalInstance.close();
                        }
                    };

                    $scope.cancleConfirmation = function () {
                        $uibModalInstance.close();
                    }
                }
            });
        }

        function removeLedger(index, ledger) {
            if (ledger['_id']) {
                var loadedLedger = passUtilsService.findByKeyAndValue(vm.unModifiedLedgers, '_id', ledger['_id']);
                if (loadedLedger) {
                    ledger.name = loadedLedger.name;
                }
                ledger.edit = false;
            } else {
                vm.ledgers.splice(index, 1);
            }
        }
    }
})();
