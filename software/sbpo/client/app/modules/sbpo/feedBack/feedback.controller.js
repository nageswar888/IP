(function(){
    angular.module('sbpo.feedback')
        .controller('feedbackController', feedbackController);
    feedbackController.$inject=['$state','$cookies','$rootScope','feedbackService','Flash','$filter','passUtilsService','validation'];
    function feedbackController($state,$cookies,$rootScope,feedbackService,Flash,$filter,passUtilsService,validation){
        var vm=this;
        vm.currentUser = $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);
        vm.RedirectPage=RedirectPage;
        vm.feedbackValue="Bug";
        vm.reportedBy=vm.currentUser.firstName+' '+vm.currentUser.lastName;
        vm.sendFeedbackMail=sendFeedbackMail;
        vm.titleLength = validation.user.firstName.maxLength;
        vm.reportedBYLength = validation.reportedBy.maxLength;
        function RedirectPage(){
            $rootScope.backToHomePage();
        }
        function sendFeedbackMail(form){
            var query={
                feedbackValue:vm.feedbackValue,
                title:passUtilsService.convertToSentenceCase(vm.title),
                reportedBy:vm.reportedBy,
                description:passUtilsService.convertToSentenceCase(vm.description)
            };
            if(form.$valid) {
                var count=1;
                feedbackService.feedBackMail(query).then(sendinMailSuccess).catch(sendinMailFail);
            }
            else {
                console.log("Feedback form is invalid")
            }
            function sendinMailSuccess(success){
                if(vm.feedbackValue==='Bug'){
                    Flash.create('success',  $filter('translate')('feedback.bug.logged.success'),'feedbackMsgDiv');
                    $state.reload();
                }else{
                    Flash.create('success', $filter('translate')('feedback.enhancement.logged.success'),'feedbackMsgDiv');
                    $state.reload();
                }
                reset();
            }

            function sendinMailFail(failure){
                Flash.create('danger', $filter('translate')('search.advice.wrong'),'feedbackMsgDiv');
            }

        }
        function reset(){
            vm.title="";
            vm.description="";
        }
    }

}());
