(function () {
    angular.module('admin')
        .controller('categoriesController',categoriesController);
    categoriesController.$inject=['customFieldService','Flash','$filter','$uibModal','customType','passUtilsService','validation','customFieldsMsgs'];

    function categoriesController(customFieldService, Flash, $filter, $uibModal, customType, passUtilsService,validation,customFieldsMsgs){
        var vm=this;
        vm.costumField='category';
        vm.categories=[];
        vm.getAllCategories=getAllCategories;
        vm.getAllCategories();
        vm.addCategory=addCategory;
        vm.isContainEditedRows=isContainEditedRows;
        vm.removeCategory=removeCategory;
        vm.saveCategory=saveCategory;
        vm.deleteCategory=deleteCategory;
        vm.editCategory=editCategory;
        vm.categoryNameMaxLen = validation.CATEGORY_NAME_MAX_LENGTH;


        /**
         * Remove category from list
         */
        function removeCategory( index, category ) {
            if(category.id) {
                var loadedCategory = passUtilsService.findByKeyAndValue(vm.loadedCategories, 'id', category.id);
                if( loadedCategory ) {
                    category.name = loadedCategory.name;
                    category.description = loadedCategory.description;
                }
                category.edit = false;
            }else {
                vm.categories.splice(index, 1);
            }

        }

        /**
         * Add New category in to list
         */
        function addCategory(){
            var newCategoryCount = 0 ;
            angular.forEach(vm.categories, function(category, index){
                if(!category.id) { newCategoryCount++; }
            });
            if(newCategoryCount < 5) {
                var newCategory = {
                    name:'',
                    description:'',
                    edit:true
                };
                vm.categories.push(newCategory);
            }
        }

        /**
         * Return true if list contains editable rows otherwise false
         * @returns {boolean}
         */
        function isContainEditedRows(){
            return passUtilsService.findByKeyAndValue(vm.categories, 'edit', true)!=null;
        }

        /**
         * Make category editable
         * @param category
         */
        function editCategory(category){
            category.edit = true;
        }

        function saveCategory(){
            var query={
                type:customType.CATEGORY,
                fields: passUtilsService.findAllByKeyAndValue(vm.categories, 'edit', true)
            };
            vm.forms.adminSubmitted = true;
            if(vm.forms.$valid) {
                customFieldService.saveCustomField(query).then(submitCategorySuccess).catch(submitCategoryFailure);
            }else{
                for(var i=0; i<vm.categories.length; i++) {
                    if(vm.forms['category_'+i] && vm.forms['category_'+i].$invalid && vm.forms['category_'+i].$error.maxlength) {
                        Flash.create('danger',$filter('translate')('custom.field.form.invalid'),'customFlashMsgDiv');
                        break;
                    }
                }
            }
            function submitCategorySuccess(response){
                if(response.status===409){
                    Flash.create('danger',$filter('translate')('save.category.error'),'customFlashMsgDiv');
                }else{
                    Flash.create('success',$filter('translate')('save.category.success'),'customFlashMsgDiv');
                    vm.getAllCategories();
                }
            }

            function submitCategoryFailure(failure){
                console.log(failure);
            }
        }


        function getAllCategories(){
            var type = customType.CATEGORY;
            customFieldService.listAllCustomFields(type).then(gettingCategoriesSuccess).catch(gettingCategoriesFailure);

            function gettingCategoriesSuccess(response){
                if(response.data.length===0){
                    vm.noCategoryMessage=$filter('translate')('categories.notFound.message');
                    vm.showNoCategory=true;
                }else{
                    vm.loadedCategories = response.data;
                }
                vm.categories = $filter('orderBy')(response.data, 'name');
            }
            function gettingCategoriesFailure(failure){
                console.log(failure);
            }
        }

        function deleteCategory(query){
            $uibModal.open({
                template: require('../../../../partials/deleteCustomField.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash){
                    $scope.deleteHeading=$filter('translate')('confirmation.label');
                    $scope.deleteConformation=$filter('translate')('conform.delete.category');
                    $scope.deleteCustomField=function(){
                        customFieldService.deleteCustomField(query).then(deleteCategorySuccess).catch(deleteCategoryFailure);
                        function deleteCategorySuccess(response){
                            console.log("response",response)
                            if(response.status === 503 && response.messages===customFieldsMsgs.ADVICE_CONTAIN_CUSTOM_FIELDS){
                                Flash.create('danger', $filter('translate')('delete.category.error'), 'customFlashMsgDiv');
                                $uibModalInstance.close();
                            }else if(response.status === 200){
                                Flash.create('success', $filter('translate')('delete.category.success'), 'customFlashMsgDiv');
                                vm.getAllCategories();
                                $uibModalInstance.close();
                            }
                            else {
                                Flash.create('danger', $filter('translate')('user.password.change.error'), 'customFlashMsgDiv');
                                $uibModalInstance.close();
                            }
                          /*  if(response.status==='FAILED'){
                                Flash.create('danger', $filter('translate')('delete.category.error'), 'customFlashMsgDiv');
                            }else{
                                Flash.create('success', $filter('translate')('delete.category.success'), 'customFlashMsgDiv');
                                vm.getAllCategories();
                                $uibModalInstance.close();
                            }*/
                        }

                        function deleteCategoryFailure(error){
                            console.log(error);
                        }
                    };
                    $scope.cancle=function(){
                        $uibModalInstance.close();
                    }
                }
            });
        }
    }
})();
