/**
 * Created by sb0103 on 11/1/17.
 */

(function(){
    angular.module('admin')
        .controller('notificationController',notificationController);
    notificationController.$inject=['notificationService','Flash','$filter','$uibModal','passUtilsService','contact'];

    function notificationController(notificationService,Flash,$filter,$uibModal,passUtilsService,contact){
        var vm=this;
        vm.saveContact=saveContact;
        vm.deleteEmailId=deleteEmailId;
        vm.deleteMobileNo=deleteMobileNo;
        vm.addEmail=addEmail;
        vm.removeContact=removeContact;
        vm.editContact=editContact;
        vm.isContainEditedRows=isContainEditedRows;
        vm.addMobile=addMobile;
        vm.changeStatus=changeStatus;

        listManageNotification();
        getEmailIds();
        getMobileNo();

        function editContact(contact){
            contact.edit = true;
        }
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
         *
         * @param index
         * @param contact
         * @param contactGroup
         */
        function removeContact( index, contact, contactGroup, type) {
            if(contact._id) {
                var loadedGroup = type === 'email' ? vm.loadedEmailGroup : vm.loadedPhoneGroup;
                var loadedContact = passUtilsService.findByKeyAndValue(loadedGroup, '_id', contact._id);
                if( loadedContact ) {
                    contact.contact = loadedContact.contact;
                }
                contact.edit = false;
            }else {
                contactGroup.splice(index, 1);
            }
        }

        function addEmail(){
            var newEmailCount = 0 ;
            angular.forEach(vm.emailGroup, function(email, index){
                if(!email._id) { newEmailCount++; }
            });
            if(newEmailCount < 5) {
                var newEmail = {
                    contact:'',
                    edit:true
                };
                vm.emailGroup.push(newEmail);
            }
        }

        function addMobile(){
            var newMobileCount = 0 ;
            angular.forEach(vm.phoneGroup, function(mobile, index){
                if(!mobile._id) { newMobileCount++; }
            });
            if(newMobileCount < 5) {
                var newMobile = {
                    contact:'',
                    edit:true
                };
                vm.phoneGroup.push(newMobile);
            }
        }


        /*function will return list of emails from notification*/
        function getEmailIds(){
            notificationService.getEmailIds().then(getEmailIdsSuccess).catch(getEmailIdsSuccessFailed);
            function getEmailIdsSuccess(response){
                vm.emailGroup=[]; vm.loadedEmailGroup=[];
                console.log(response);
                angular.forEach(response.data,function(data){
                    if(data.contact===undefined || data.contact===''){

                    }
                    else{
                        vm.emailGroup.push(data);
                    }

                });
                vm.loadedEmailGroup= angular.copy(vm.emailGroup);
            }
            function getEmailIdsSuccessFailed(error){
                console.log(error);
            }
        }

        /*function will return list of mobile no from notification*/
        function getMobileNo(){
            notificationService.getMobileNo().then(getMobileNoSuccess).catch(getMobileNoSuccessFailed);

            function getMobileNoSuccess(response){
                vm.phoneGroup=[]; vm.loadedPhoneGroup=[];
                angular.forEach(response.data,function(data){
                    if(data.contact===undefined || data.contact===''){

                    }
                    else {
                        vm.phoneGroup.push(data);
                    }
                });
                vm.loadedPhoneGroup= angular.copy(vm.phoneGroup);
            }
            function getMobileNoSuccessFailed(error){
                console.log(error);
            }
        }


        function listManageNotification(){
            notificationService.listManageNotification().then(listManageNotificationSuccess).catch(listManageNotificationFailed);

            function listManageNotificationSuccess(response){
                if(response){
                    angular.forEach(response.data,function(notification){
                        if(notification.type==="create"){
                            vm.createEmailid=notification.is_email;
                            vm.createMobNo=notification.is_phone
                        }
                        else{
                            vm.disEmailid=notification.is_email;
                            vm.disMobNo=notification.is_phone
                        }
                    })
                }

            }
            function listManageNotificationFailed(error){

            }
        }

        function deleteMobileNo(mobile){

            $uibModal.open({
                template: require('../../../../partials/notification/deteteMobileConfirmation.html'),
                controller: function ($scope, $uibModalInstance, Flash) {
                    $scope.confirmOk=function(){
                        notificationService.deleteMobileNo(mobile._id).then(deleteMobileNoSuccess).catch(deleteMobileNoFailed);

                        function deleteMobileNoSuccess(response){
                            if(response.status==='OK'){
                                Flash.create('success', $filter('translate')('phoneno.delete.success'),'notificationFlashMsgDiv');
                                vm.admin={};
                                getMobileNo();
                                $uibModalInstance.close();
                            }else if(response.status==='FAILED'){
                                Flash.create('danger', $filter('translate')('phoneno.not.exist'),'notificationFlashMsgDiv');
                                $uibModalInstance.close();
                            }
                        }
                        function deleteMobileNoFailed(error){
                            Flash.create('danger', $filter('translate')('phoneno.delete.failed'),'notificationFlashMsgDiv');
                            $uibModalInstance.close();
                        }
                    };

                    $scope.cancleConfirmation=function(){
                        $uibModalInstance.close();
                    };
                }
            });
        }

        function deleteEmailId(email){
            $uibModal.open({
                template: require('../../../../partials/notification/deteteEmailConfirmation.html'),
                controller: function ($scope, $uibModalInstance, Flash) {
                    $scope.confirmOk=function(){
                        notificationService.deleteEmailId(email._id).then(deleteEmailIdSuccess).catch(deleteEmailIdFailed);

                        function deleteEmailIdSuccess(response){
                            if(response.status==='OK'){
                                Flash.create('success', $filter('translate')('email.delete.success'),'notificationFlashMsgDiv');
                                getEmailIds();
                                $uibModalInstance.close();
                            }else{
                                Flash.create('danger', $filter('translate')('email.not.exist'),'notificationFlashMsgDiv');
                                $uibModalInstance.close();
                            }
                        }
                        function deleteEmailIdFailed(error){
                            Flash.create('danger', $filter('translate')('email.delete.failed'),'notificationFlashMsgDiv');
                            $uibModalInstance.close();
                        }
                    };

                    $scope.cancleConfirmation=function(){
                        $uibModalInstance.close();
                    }
                }
            });

        }

        function saveContact(contactsGroup,contactType){
            var query={
                type:contactType,
                fields: passUtilsService.findAllByKeyAndValue(contactsGroup, 'edit', true)
            };
            var contactsArr = query.fields.map(function(elem){ return elem.contact ? elem.contact.toLowerCase(): ''});
            var contactsArrLength = contactsArr.length;
            var uniqueContactsArrLength = jQuery.unique(contactsArr.sort()).length;
            vm.emailForm.adminSubmitted = true;
            vm.mobileForm.adminSubmitted = true;
            if((vm.emailForm.$valid && contactType === contact.CONTACT_EMAIL) || (vm.mobileForm.$valid && contactType === contact.CONTACT_MOBILE)) {
                if(uniqueContactsArrLength === contactsArrLength) {
                    notificationService.saveContact(query).then(saveContactSuccess).catch(saveContactFailed);

                    function saveContactSuccess(response) {
                        if (response.status === 409) {
                            saveContactFailed('Fail');
                        } else {
                            if (contactType === contact.CONTACT_EMAIL) {
                                Flash.create('success', $filter('translate')('email.added.success'), 'notificationFlashMsgDiv');
                            } else {
                                Flash.create('success', $filter('translate')('mobile.added.success'), 'notificationFlashMsgDiv');
                            }
                            vm.admin = {};
                            getEmailIds();
                            getMobileNo();
                        }
                    }
                } else {
                    saveContactFailed('Fail');
                }

                function saveContactFailed(failure){
                    if(contactType === contact.CONTACT_EMAIL){
                        Flash.create('danger',$filter('translate')('save.user.emailExists'),'notificationFlashMsgDiv');
                    } else {
                        Flash.create('danger',$filter('translate')('save.user.mobileNoExists'),'notificationFlashMsgDiv');
                    }                }

            }else{
                if(contactType===contact.CONTACT_EMAIL){
                    for(var i=0; i<vm.emailGroup.length; i++) {
                        if(vm.emailForm['addEmail_'+i] && vm.emailForm['addEmail_'+i].$invalid && vm.emailForm['addEmail_'+i].$error.email) {
                            Flash.create('danger',$filter('translate')('email.not.proper'),'notificationFlashMsgDiv');
                            break;
                        }
                    }
                }
                else if(contactType===contact.CONTACT_MOBILE){
                    for(var i=0; i<vm.phoneGroup.length; i++) {
                        if(vm.mobileForm['addPhoneno_'+i] && vm.mobileForm['addPhoneno_'+i].$invalid && vm.mobileForm['addPhoneno_'+i].$error.maxlength
                        || vm.mobileForm['addPhoneno_'+i] && vm.mobileForm['addPhoneno_'+i].$invalid && vm.mobileForm['addPhoneno_'+i].$error.minlength) {
                            Flash.create('danger',$filter('translate')('phoneno.not.proper'),'notificationFlashMsgDiv');
                            break;
                        }
                    }
                }
            }
        }

        function changeStatus(type,isemail,isphone){
            var query={
                type:type,
                isEmail:isemail,
                isPhone:isphone
            };

            notificationService.changeStatus(query).then(changeStatusSuccess).catch(changeStatusFailed);

            function changeStatusSuccess(response){
                console.log(response);
            }

            function changeStatusFailed(error){
                console.log("error");
            }
        }


    }
})();
