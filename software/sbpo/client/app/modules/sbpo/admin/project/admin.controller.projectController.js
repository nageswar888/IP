/**
 * Created by sb0103 on 3/11/16.
 */
(function(){
    angular.module('admin')
        .controller('addProjectController',addProjectController);
    addProjectController.$inject=['$rootScope',"projectService","NgTableParams","$uibModal","$scope",'Flash','$timeout','$state','$filter','passUtilsService','validation','contact'];

    function addProjectController($rootScope,projectService,NgTableParams,$uibModal,$scope,Flash,$timeout,$state,$filter,passUtilsService,validation,contact){
        var vm=this;
        vm.submitProject=submitProject;
        vm.editproject=editProject;
        vm.deleteproject=deleteProject;
        vm.getTotalProject=getTotalProject;
        vm.admin={};
        vm.successShow='hide';
        vm.form = {};
        vm.form.projectFormSubmitted = false;
        vm.admin.startdate = moment(new Date()).format($rootScope.dateFormate);
        vm.projectNameMaxlen = validation.project.name.maxLength;
        vm.projectLocationMaxlen = validation.project.location.maxLength;
        vm.projectLocationMinlen = validation.project.location.minLength;

        vm.setDateRangeFalse = setDateRangeFalse;

        loadTable();
        getTotalProject();

        vm.emailGroup=[];
        vm.phoneGroup=[];
        var contacts=[];


        vm.addEmail=addEmail;
        vm.addMobile=addMobile;
        vm.removeContact=removeContact;


        /**
         *  add empty input box to email
         */
        function addEmail(){
            var newEmailCount = 0 ;
            angular.forEach(vm.emailGroup, function(email, index){
                if(!email._id) { newEmailCount++; }
            });
            if(newEmailCount < 5) {
                var newEmail = {
                    contact:'',
                    type:contact.CONTACT_EMAIL
                };
                vm.emailGroup.push(newEmail);
            }
        }


        /**
         * add empty input box to mobile
         */
        function addMobile(){
            var newMobileCount = 0 ;
            angular.forEach(vm.phoneGroup, function(mobile, index){
                if(!mobile._id) { newMobileCount++; }
            });
            if(newMobileCount < 5) {
                var newMobile = {
                    contact:'',
                    type:contact.CONTACT_PHONE
                };
                vm.phoneGroup.push(newMobile);
            }
        }


        /**
         *
         * @param index
         * @param contact
         * @param contactGroup
         */
        function removeContact( index, contact, contactGroup, type) {
            if(contact._id) {
                var loadedGroup = type === contact.CONTACT_EMAIL ? vm.loadedEmailGroup : vm.loadedPhoneGroup;
                var loadedContact = passUtilsService.findByKeyAndValue(loadedGroup, '_id', contact._id);
                if( loadedContact ) {
                    contact.contact = loadedContact.contact;
                }
                contact.edit = false;
            }else {
                contactGroup.splice(index, 1);
            }
        }


        function getTotalProject() {
            projectService.getTotalProjectCount().then(handleGetTotalUsersSuccess).catch(handleGetTotalUsersFailure);
            function handleGetTotalUsersSuccess(response) {
                vm.totalProject = response.data[0].count;
            }
            function handleGetTotalUsersFailure(error){
                console.log("getTotalAccounts error :",error);
            }
        }

        function loadTable(){
            vm.tableParams = new NgTableParams({
                    page: 1,
                    count: 10
                },{
                getData: function(params){
                    var isFilterApplied = true;
                    if(angular.equals(params.filter(), {})) { isFilterApplied = false; }
                    var query = {
                        page_size: params.count() === -1 ? 0 : params.count(),
                        page:params.page(),
                        projectName:params.filter()["projectName"],
                        projectLocation:params.filter()["projectLocation"]
                    };
                    return  projectService.getAllProjects(query).then(function(response) {
                        vm.noRecordMessage=false;
                        vm.isDataExist = (response.data.length === 0)
                        params.total(response.pagination.total);
                        if (vm.isDataExist && !isFilterApplied) {
                            vm.noRecordMessage=true;
                            vm.tableParams.page(params.page() -1)
                        } else {
                            var orderedData = params.sorting() ?
                                $filter('orderBy')(response.data, params.orderBy()) : response.data;
                            return orderedData;
                        }
                    }, function(error) {
                        console.error('Error occured while loading data.');
                    });
                }});
        }
        function setDateRangeFalse() {
            vm.notMatch = false;
        }

        /**
         *
         * @param arr
         * @param prop
         * @returns {Array}
         *
         * This method will remove the duplicate object on the basis of object property
         */
        function removeDuplicates(arr, prop) {
            var new_arr = [];
            var lookup  = {};

            for (var i in arr) {
                lookup[arr[i][prop]] = arr[i];
            }

            for (i in lookup) {
                new_arr.push(lookup[i]);
            }

            return new_arr;
        }
        function submitProject(){
            vm.form.projectFormSubmitted = true;
            var startDate = vm.admin.startdate;
            var endDate = vm.admin.enddate;
           /* passUtilsService.parseDate(startDate)*/
            if(endDate){
                if( passUtilsService.parseDate(startDate) >  passUtilsService.parseDate(endDate)){
                    vm.notMatch = true;
                    Flash.create('danger', $filter('translate')('project.endDate.invalid'),'projectFlashMsgDiv');
                } else {
                    vm.notMatch = false;
                }
            }

            if(vm.form.$valid && !vm.notMatch ) {
                vm.admin.contacts=vm.emailGroup.concat(vm.phoneGroup);
                vm.admin.contacts= removeDuplicates(vm.admin.contacts, "contact");
                projectService.submitProject(vm.admin).then(saveProjectSuccess).catch(saveProjectFailure);
            }
            else if((vm.form.addPhoneno && !vm.form.addPhoneno.$valid) && (vm.form.addEmail && !vm.form.addEmail.$valid)) {
                Flash.create('danger', $filter('translate')('email.or.phone.error'),'projectFlashMsgDiv');
            } else if(vm.form.addPhoneno && !vm.form.addPhoneno.$valid) {
                Flash.create('danger', $filter('translate')('Invalid.mob'),'projectFlashMsgDiv');
            }else if(vm.form.addEmail && !vm.form.addEmail.$valid){
                Flash.create('danger', $filter('translate')('login.invalid.email.label'),'projectFlashMsgDiv');
            }
            function saveProjectSuccess(response) {
                if(response.messages=="Project Already exists"){
                    Flash.create('danger', $filter('translate')('save.project.error'),'projectFlashMsgDiv');
                }else{
                    Flash.create('success',$filter('translate')('save.project.success'),'projectFlashMsgDiv');
                    $state.go('admin.projecttbl');
                }
            }
            function saveProjectFailure(error){
                console.log(error);
            }
        }

        function deleteProject(project){
            $uibModal.open({
                template:require('../../../../partials/deleteProject.html'),

                controller:function($scope,$uibModalInstance,Flash,$timeout){
                    $scope.deleteProject=function(){
                        projectService.deleteProject(project._id).then(deleteProjectSuccess).catch(deleteProjectFailure);
                        function deleteProjectSuccess(response){
                                if(response.status===400){
                                    Flash.create('danger', response.messages, 'projectErrorFlashMsgDiv');
                                }else{
                                    Flash.create('success', $filter('translate')('delete.project.success'), 'projectFlashMsgDiv');
                                    $uibModalInstance.close();
                                    vm.tableParams.reload();
                                    getTotalProject();
                                }
                        }

                        function deleteProjectFailure(error){
                            console.log(error);
                        }
                    };
                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }
                }
            });
        }



        function editProject(project){
            $uibModal.open({
                size: 'lg',
                template:require('../../../../partials/editProject.html'),
                controller:function($scope,$uibModalInstance,Flash){
                    $scope.editPhoneGroup=project.contacts;
                    $scope.editEmailGroup=project.contacts;

                    var deleteContactsArr=[];

                    $scope.editContact=function(contact){
                        contact.edit = true;
                    };

                    $scope.deleteContacts=function(index,contact){
                        if(contact.type==="email"){
                            $scope.editEmailGroup.splice(index, 1);
                        }
                        else {
                            $scope.editPhoneGroup.splice(index, 1);
                        }
                        deleteContactsArr.push(contacts._id);
                    };

                    /**
                     *  add empty input box to email
                     */
                    $scope.addEmail=function(){
                        var newEmailCount = 0 ;
                        angular.forEach($scope.editEmailGroup, function(email, index){
                            if(!email._id) { newEmailCount++; }
                        });
                        if(newEmailCount < 5) {
                            var newEmail = {
                                contact:'',
                                edit:true,
                                type:contact.CONTACT_EMAIL
                            };
                            $scope.editEmailGroup.push(newEmail);
                        }
                    };

                    /**
                     * add empty input box to mobile
                     */
                    $scope.addMobile=function(){
                        var newMobileCount = 0 ;
                        angular.forEach($scope.editPhoneGroup, function(mobile, index){
                            if(!mobile._id) { newMobileCount++; }
                        });
                        if(newMobileCount < 5) {
                            var newMobile = {
                                contact:'',
                                edit:true,
                                type:'phone'

                            };
                            $scope.editPhoneGroup.push(newMobile);
                        }
                    };

                    /**
                     *
                     * @param index
                     * @param contact
                     * @param contactGroup
                     */
                    $scope.removeContact=function( index, contact, contactGroup, type) {
                        if(contact._id) {
                            var loadedGroup = type === contact.CONTACT_EMAIL ? $scope.editEmailGroup : $scope.editPhoneGroup;
                            var loadedContact = passUtilsService.findByKeyAndValue(loadedGroup, '_id', contact._id);
                            if( loadedContact ) {
                                contact.contact = loadedContact.contact;
                            }
                            contact.edit = false;
                        }else {
                            contactGroup.splice(index, 1);
                        }
                    };

                    $scope.editPhoneGroup = $scope.editPhoneGroup.filter(function( obj ) {
                        return obj.type !== contact.CONTACT_EMAIL;
                    });
                    $scope.editEmailGroup = $scope.editEmailGroup.filter(function( obj ) {
                        return obj.type !== 'phone';
                    });

                    $scope.projectNameMaxlen = validation.project.name.maxLength;
                    $scope.projectLocationMaxlen = validation.project.location.maxLength;
                    $scope.projectLocationMinlen = validation.project.location.minLength;
                    if(project.endDate===undefined ||project.endDate==null){
                        project.endDate=null;
                    }else{
                        project.endDate=moment(new Date(project.endDate)).format($rootScope.dateFormate);
                    }
                    $scope.admin={
                        id:project._id,
                        projectName:project.projectName,
                        projectLocation:project.projectLocation,
                        startDate:moment(new Date(project.startDate)).format($rootScope.dateFormate),
                        endDate:project.endDate
                        };

                    $scope.setDateRangeFalse = function() {
                        $scope.invalidRange = false
                    };
                    $scope.editProject=function(editProjectForm){
                        var startDate = editProjectForm.startdate.$modelValue;
                        var endDate = editProjectForm.enddate.$modelValue;
                        var editedContacts=$scope.editPhoneGroup.concat($scope.editEmailGroup);
                        if(endDate!=null){
                            if(passUtilsService.parseDate(startDate) > passUtilsService.parseDate(endDate)){
                                editProjectForm.enddate.$error.notMatch = true;
                                $scope.invalidRange = true;
                                Flash.create('danger', $filter('translate')('project.endDate.invalid'),'projectEditFlashMsgDiv');
                            } else {
                                console.log("Inside else");
                                editProjectForm.enddate.$error.notMatch = false;
                            }
                        }else{
                            editProjectForm.enddate.$error.notMatch = false;
                            $scope.invalidRange = false;
                        }
                        if(editProjectForm.$valid && !editProjectForm.enddate.$error.notMatch) {
                            $scope.admin.editedContacts=editedContacts;
                            $scope.admin.deletedContacts=deleteContactsArr;
                            projectService.editProject($scope.admin).then(editProjectSuccess).catch(editProjectFailure);
                        }else{
                            if( passUtilsService.parseDate(startDate) >  passUtilsService.parseDate(endDate)){
                                console.log("comming inside 2");
                                editProjectForm.enddate.$error.notMatch = true;
                                $scope.invalidRange = true;
                                Flash.create('danger', $filter('translate')('project.endDate.invalid'),'projectEditFlashMsgDiv');
                            }
                            else if((editProjectForm.addPhoneno && !editProjectForm.addPhoneno.$valid) && (editProjectForm.addEmail && !editProjectForm.addEmail.$valid)) {
                                Flash.create('danger', $filter('translate')('email.or.phone.error'),'projectEditFlashMsgDiv');
                            } else if(editProjectForm.addPhoneno && !editProjectForm.addPhoneno.$valid) {
                                Flash.create('danger', $filter('translate')('Invalid.mob'),'projectEditFlashMsgDiv');
                            }else if(editProjectForm.addEmail && !editProjectForm.addEmail.$valid){
                                Flash.create('danger', $filter('translate')('login.invalid.email.label'),'projectEditFlashMsgDiv');
                            }
                            else {
                                console.log("comming inside 3");
                                Flash.create('danger', $filter('translate')('advice.form.mandatoryField'), 'projectEditFlashMsgDiv');
                            }
                        }
                        function editProjectSuccess(response){

                            if(response.status==='ERROR' && response.messages==='Project Already exists'){
                                Flash.create('danger',$filter('translate')('save.project.error'), 'projectEditFlashMsgDiv');
                            }
                            else if(response.status===301) {
                                Flash.create('danger',$filter('translate')('contact.exist'), 'projectEditFlashMsgDiv');
                            }else
                            {
                                Flash.create('success',$filter('translate')('update.project.success'), 'projectFlashMsgDiv');
                                $uibModalInstance.close();
                                vm.tableParams.reload();
                            }

                        }

                        function editProjectFailure(error){
                            console.log('error')
                        }
                    };

                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }
                },
                windowClass: 'app-modal-window'
            });

        }

    }
})();
