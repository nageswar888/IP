(function () {
    angular.module('admin')
        .controller('paymentTypeController',paymentTypeController);
    paymentTypeController.$inject=['customFieldService','Flash','$filter','$uibModal','customType','passUtilsService','validation','customFieldsMsgs'];

    function paymentTypeController(customFieldService,Flash,$filter,$uibModal,customType, passUtilsService,validation,customFieldsMsgs){
        var vm=this;
        vm.paymentTypes=[];
        vm.getAllPaymentTypes=getAllPaymentTypes;
        vm.getAllPaymentTypes();
        vm.addPaymentType=addPaymentType;
        vm.isContainEditedRows=isContainEditedRows;
        vm.removePaymentType=removePaymentType;
        vm.savePaymentType=savePaymentType;
        vm.deletePaymentType=deletePaymentType;
        vm.editPaymentType=editPaymentType;
        vm.paymentTypeNameMaxlen = validation.PAYMENT_TYPE_NAME_MAX_LENGTH;

        /**
         * Remove payment type from list
         */
        function removePaymentType( index, paymentType ) {
            if(paymentType.id) {
                var loadedPaymentType = passUtilsService.findByKeyAndValue(vm.loadedPaymentTypes, 'id', paymentType.id);
                if( loadedPaymentType ) {
                    paymentType.name = loadedPaymentType.name;
                    paymentType.description = loadedPaymentType.description;
                }
                paymentType.edit = false;
            }else {
                vm.paymentTypes.splice(index, 1);
            }
        }

        /**
         * Add New payment type in to list
         */
        function addPaymentType(){
            var newPaymentTypeCount = 0 ;
            angular.forEach(vm.paymentTypes, function(paymentType, index){
                if(!paymentType.id) { newPaymentTypeCount++; }
            });
            if(newPaymentTypeCount < 5) {
                var newPaymentType = {
                    id:null,
                    name:'',
                    description:'',
                    edit:true
                };
                vm.paymentTypes.push(newPaymentType);
            }
        }

        /**
         * Return true if list contains editable rows otherwise false
         * @returns {boolean}
         */
        function isContainEditedRows(){
            return passUtilsService.findByKeyAndValue(vm.paymentTypes, 'edit', true)!=null;
        }

        /**
         * Make payment type editable
         * @param paymentType
         */
        function editPaymentType(paymentType){
            paymentType.edit = true;
        }

        function savePaymentType(){
            var query={
                type:customType.PAYMENT_TYPE,
                fields: passUtilsService.findAllByKeyAndValue(vm.paymentTypes, 'edit', true)
            };
            vm.forms.adminSubmitted = true;
            if(vm.forms.$valid) {
                customFieldService.saveCustomField(query).then(submitPaymentTypeSuccess)
                    .catch(submitPaymentTypeFailure);
            }else{
                for(var i=0; i<vm.paymentTypes.length; i++) {
                    if(vm.forms['paymentType_'+i] && vm.forms['paymentType_'+i].$invalid && vm.forms['paymentType_'+i].$error.maxlength) {
                        Flash.create('danger',$filter('translate')('custom.field.form.invalid'),'customFlashMsgDiv');
                        break;
                    }
                }
            }
            function submitPaymentTypeSuccess(response){
                if(response.status===409){
                    Flash.create('danger',$filter('translate')('save.paymentType.error'),'customFlashMsgDiv');
                }else{
                    Flash.create('success',$filter('translate')('save.paymentType.success'),'customFlashMsgDiv');
                    vm.getAllPaymentTypes();
                }
            }

            function submitPaymentTypeFailure(failure){
                console.log(failure);
            }
        }


        function getAllPaymentTypes(){
            var type = customType.PAYMENT_TYPE;
            customFieldService.listAllCustomFields(type).then(gettingPaymentTypesSuccess).catch(gettingPaymentTypesFailure);

            function gettingPaymentTypesSuccess(response){
                if(response.data.length===0){
                    vm.noPaymentTypeMessage=$filter('translate')('paymentTypes.notFound.message');
                    vm.showNoPaymentType=true;
                }else{
                    vm.loadedPaymentTypes = response.data;
                }
                vm.paymentTypes = $filter('orderBy')(response.data, 'name');
            }
            function gettingPaymentTypesFailure(failure){
                console.log(failure);
            }
        }

        function deletePaymentType(query){
            $uibModal.open({
                template: require('../../../../partials/deleteCustomField.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash){
                    $scope.deleteHeading=$filter('translate')('confirmation.label');
                    $scope.deleteConformation=$filter('translate')('conform.delete.paymentType');
                    $scope.deleteCustomField=function(){
                        customFieldService.deleteCustomField(query).then(deletePaymentTypeSuccess).catch(deletePaymentTypeFailure);
                        function deletePaymentTypeSuccess(response){
                            if(response.status === 503 && response.messages===customFieldsMsgs.ADVICE_CONTAIN_CUSTOM_FIELDS){
                                Flash.create('danger', $filter('translate')('delete.paymentType.error'), 'customFlashMsgDiv');
                                $uibModalInstance.close();
                            }else if(response.status === 503 && response.messages=== customFieldsMsgs.PAYMENT_TYPE_CONTAIN_CUSTOM_FIELDS){
                                Flash.create('danger', $filter('translate')('delete.paymentType.error.payment.request'), 'customFlashMsgDiv');
                                $uibModalInstance.close();
                            }else if(response.status === 200){
                                Flash.create('success', $filter('translate')('delete.paymentType.success'), 'customFlashMsgDiv');
                                vm.getAllPaymentTypes();
                                $uibModalInstance.close();
                            }
                            else {
                                Flash.create('danger', $filter('translate')('user.password.change.error'), 'customFlashMsgDiv');
                                $uibModalInstance.close();
                            }
                        }

                        function deletePaymentTypeFailure(error){
                            console.log(error);
                        }
                    };

                    $scope.cancle=function(){
                        $uibModalInstance.close();
                    }
                }
            })
        }
    }
})();
