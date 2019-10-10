(function () {
    angular.module('admin')
        .controller('uploadController',uploadController);
    uploadController.$inject=['uploadService','Flash','$filter','$state','$rootScope','Regexes', 'stamp', 'organizationService','$uibModal'];

    function uploadController(uploadService,Flash,$filter,$state,$rootScope, Regexes, stamp, organizationService,$uibModal){
        var vm=this;
        vm.uploadStampImage=uploadStampImage;
        vm.uploadLogoImage=uploadLogoImage;
        vm.upload=upload;
        vm.isSaveButtonShowing=false;
        vm.companyStampType = stamp.COMPANY_STAMP;
        vm.approvedStampType = stamp.APPROVED_STAMP;
        vm.rejectedStampType = stamp.REJECTED_STAMP;
        vm.voidStampType = stamp.VOID_STAMP;
        vm.disbursedStampType = stamp.DISBURSED_STAMP;
        vm.cancelUpload=cancelUpload;
        vm.saveImage = saveImage;
        vm.download = download;
        vm.deleteStamps=deleteStamps;
        vm.images = [];
        vm.fileUploadErrors = {};
        var stampFormat = Regexes.STAMP_EXTENTION_FORMAT;
        var logoFormat = Regexes.IMAGE_EXTENSION_FORMAT;
        var user=$rootScope.getCurrentLoggedInUser();
        vm.getOrgnisationDetails = getOrgnisationDetails;
        vm.getOrgnisationDetails();
        vm.count=0;

        function deleteStamps(query,type){
            $uibModal.open({
                template: require('../../../../partials/upload/deleteStamps.html'),
                controller:function($scope,$uibModalInstance,Flash){
                    $scope.label=$filter('translate')('warnigs.delete',{type:type});
                    $scope.okay=function(){
                        var preparequery={filename:query.filename,filetype:query.filetype,type:type};
                        organizationService.deleteStamps(preparequery).then(function(response){
                            if(type==='logo'){
                                if(response.status == 200)
                                    Flash.create('success', $filter('translate')('delete.logo.success'), 'customFlashMsgDiv');
                                else
                                    Flash.create('danger', $filter('translate')('delete.logo.failed'), 'customFlashMsgDiv');
                            }
                            else{
                                if(response.status == 200)
                                    Flash.create('success', $filter('translate')('delete.stamp.success'), 'customFlashMsgDiv');
                                else
                                    Flash.create('danger', $filter('translate')('delete.stamp.failed'), 'customFlashMsgDiv');
                            }
                            $state.reload();
                            $uibModalInstance.close();
                        },function(error){
                            console.log("error",error);
                        })
                    };
                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }
                }
            });

        }

        function download(query,type){
            var preparequery={filename:query.filename,filetype:query.filetype,type:type};
            window.open('/api/logo/downloadLogo?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(preparequery));
        }

        function  getOrgnisationDetails(){
            organizationService.getOrganizationById(user.org).then(gettingOrganizationSuccess).catch(gettingOrganizationFailure);
            function gettingOrganizationSuccess(response){
                vm.companyLogo=response.data.logo;
                var stamps=response.data.stamp;
                angular.forEach(stamps,function(data){
                    if(data.type===stamp.COMPANY_STAMP){
                        vm.companyStamp = data;
                    }else if(data.type===stamp.APPROVED_STAMP){
                        vm.approvedStamp = data;
                    }else if(data.type===stamp.REJECTED_STAMP){
                        vm.rejectedStamp = data;
                    }else if(data.type===stamp.VOID_STAMP){
                        vm.voidStamp = data;
                    }else if(data.type===stamp.DISBURSED_STAMP){
                        vm.disbursedStamp = data;
                    }
                })

            }
            function gettingOrganizationFailure(error){
                console.log(error);
            }
        }
        function saveImage(imagePath,type){
            var map={"Company Stamp":'company',"Approved Stamp":'approved',"Rejected Stamp":'rejected',"Void Stamp":'voidState',
                "Disbursed Stamp":'disbursed' , 'logo':'logo'};
            //logo
            if(type==='logo'){
                if(!logoFormat.exec(imagePath.filename)){
                    vm.fileUploadErrors[map[type]] = true
                }
                else {
                    vm.fileUploadErrors[map[type]] = false
                }
            }
            else {
                //remaining
                if(!stampFormat.exec(imagePath.filename)){
                    vm.fileUploadErrors[map[type]] = true
                }
                else {
                    vm.fileUploadErrors[map[type]] = false
                }
            }
            var isUploadHasError=true;

            angular.forEach(vm.fileUploadErrors,function(data){
                if(isUploadHasError){
                    if(data){
                        isUploadHasError=false;
                        vm.isSaveButtonShowing=false;
                    }
                    else {
                        var  query={
                            type : type,
                            imagePath : imagePath
                        };
                        //TODO: Check if object already exists in the vm.images array
                        vm.images.push(query);
                        vm.isSaveButtonShowing=true;
                    }
                }
            });
        }

        function upload(){
            angular.forEach(vm.images,function(data){
                if(data.type=='logo'){
                    vm.uploadLogoImage(data);
                }else{
                    uploadStampImage(data)
                }
            });
            vm.isSaveButtonShowing=false;
        }
        function cancelUpload(){
            if(vm.company || vm.logo || vm.approved || vm.rejected || vm.void || vm.disbursed){
                vm.company = null;
                vm.logo = null;
                vm.approved = null;
                vm.rejected = null;
                vm.void = null;
                vm.disbursed = null;
            }
            vm.isSaveButtonShowing=false;
        }

        function uploadStampImage(data){
            if(!stampFormat.exec(data.imagePath.filename))
            {
                Flash.create('danger', $filter('translate')('stamp.format.image.error'), 'customFlashMsgDiv');

            }else{
                var  query={
                    type : data.type,
                    stamp : data.imagePath
                };
                uploadService.uploadStamp(query).then(uploadStampSuccess).catch(uploadStampFailure);

            }
            function uploadStampSuccess(response){
                if(response.status===500){
                    Flash.create('danger', $filter('translate')('upload.stamp.error'), 'customFlashMsgDiv');
                }else{
                    if(vm.count===0){
                        Flash.create('success', $filter('translate')('upload.success'), 'customFlashMsgDiv');
                        vm.count++;
                    }

                    vm.getOrgnisationDetails();
                    $state.reload();
                }
            }
            function uploadStampFailure(error){
                console.log(error);
            }

        }

        function uploadLogoImage(data){
            if(!logoFormat.exec(data.imagePath.filename))
            {
                Flash.create('danger', $filter('translate')('logo.format.image.error'), 'customFlashMsgDiv');
            }else{
                var query={
                    logo:data.imagePath
                };
                uploadService.uploadLogo(query).then(uploadLogoSuccess).catch(uploadLogoFailure);

            }
            function uploadLogoSuccess(response){
                if(response.status==='FAILED'){
                    Flash.create('danger', $filter('translate')('upload.logo.error'), 'customFlashMsgDiv');
                }else{
                    if(vm.count===0){
                        Flash.create('success', $filter('translate')('upload.success'), 'customFlashMsgDiv');
                        vm.count++;
                    }
                    vm.getOrgnisationDetails();
                    $state.reload();
                }
            }

            function uploadLogoFailure(error){
                console.log(error);
            }
        }

    }
})();

