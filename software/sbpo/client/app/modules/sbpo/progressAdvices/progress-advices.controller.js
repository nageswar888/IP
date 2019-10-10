'use strict';
(function() {
    angular
        .module('sbpo.progressAdvice')
        .controller('progressAdviceController', progressAdviceController)
    progressAdviceController.$inject=['$scope','$rootScope','progressAdviceService','$state','$stateParams','Flash','$filter','category','AclService','downloadConstants','passUtilsService','groupByCriteriaLimit'];
    function progressAdviceController($scope,$rootScope,progressAdviceService,$state,$stateParams,Flash,$filter,category,AclService,downloadConstants,passUtilsService,groupByCriteriaLimit){

        var pac=this;
        pac.showSuccessMessage=showSuccessMessage;
        pac.showSuccessMessage();
        pac.getAdvicesByStatus=getAdvicesByStatus;
        pac.downloadAllAdvicesByStatus = downloadAllAdvicesByStatus;
        pac.status = $stateParams.status;
        pac.currentStatus=$state.params.status;
        pac.groupByStatus=category.GROUP_PROJECT;
        //Based on current state status calling getAdviceByStatus
        pac.groupByCriteria=groupByCriteria;
        pac.getDeleteAdvices = getDeleteAdvices;
        pac.canViewDeleteAdvicesOption = canViewDeleteAdvicesOption;
        pac.adviceToDelete = [];
        pac.more = true;
        pac.groupByCriteriaList = {
            projects: [{
                advices: []
            }]
        }
        pac.groupByCriteriaList.groupSkip=0;
        pac.groupByFilters = [
            {label: 'advice.group.by.project.label', key: category.GROUP_PROJECT},
            {label: 'advice.group.by.payee.label', key: category.GROUP_PAYEE}
        ];
        /*//calling Util service
         pac.freezeActionIcons= passUtilsService.freezeActionIcons();
         */
        /**
         * This function will check the user role and  current selected tab value
         * and based on that allow user to see delete options
         */
        function canViewDeleteAdvicesOption() {
            if((AclService.hasAnyRole(['ROLE_INITIATOR']) && pac.currentStatus === 'Pending') ||
                (AclService.hasAnyRole(['ROLE_MASTERADMIN']) && pac.currentStatus === 'Rejected'))
            {
                return true;
            }
            return false;
        }

        /**
         * This function will push and pop the advices ids to adviceToDelete list based on the check box value
         * @param advices
         */
        function getDeleteAdvices(advices) {
            for(var key in advices){
                if((advices[key] === true) && pac.adviceToDelete.indexOf(key) === -1) {
                    pac.adviceToDelete.push(key)
                }
                else if((advices[key] === false) && pac.adviceToDelete.indexOf(key) !== -1){
                    for(var i = pac.adviceToDelete.length - 1; i >= 0; i--) {
                        if(pac.adviceToDelete[i] === key) {
                            pac.adviceToDelete.splice(i, 1);
                        }
                    }
                }
            }
        }

        function groupByCriteria(groupByStatus){
            resetOnCriteria();
            pac.groupByStatus = groupByStatus;
            pac.getAdvicesByStatus(pac.currentStatus, -1, groupByStatus);
        }

        if (pac.currentStatus){
            getAdvicesByStatus(pac.currentStatus,-1,pac.groupByStatus);
        }
        //function for showing success messages
        function showSuccessMessage(){
            pac.message=$stateParams.message;
            Flash.create('success', pac.message, 'FlashMsgDiv');

        }
        function downloadAllAdvicesByStatus(status,type) {
            var query = {
                status:status
            };
            if([downloadConstants.PDF,downloadConstants.EXCEL,downloadConstants.ALL_EXCEL].indexOf(type >= 0)){
                query.type = type;
            }

            if(type === downloadConstants.ALL_EXCEL){
                window.open('/api/advices/downloadAllPerProject?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
            }
            else {
                window.open('/api/advices/downloadAll?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
            }
        }
        //function for getting list of in advice based on role
        function getAdvicesByStatus(status, sortCriteria, groupByCriteria, groupedData, projectId, payeeId) {
            var eachSkip;
            if (pac.groupByCriteriaList.projects !== null) {
                var id = 0;
                if (projectId) {
                    id = projectId

                }
                else if (payeeId) {
                    id = payeeId
                }
                eachSkip = setSkipCountForAdvice(id)
            }
            if(!eachSkip){
                eachSkip=0;
            }
            if (!sortCriteria) {
                sortCriteria = pac.sortCriteria;
            }
            else {
                resetOnCriteria();
            }
            pac.sortCriteria = sortCriteria;
            $rootScope.emptyAdvices = false;
            var query = {
                statusCategory: status,
                sortCriteria: {requestedDate: sortCriteria},
                groupByCriteria: groupByCriteria,
                project: projectId,
                payee: payeeId,
                groupByCriteriaLimit: groupByCriteriaLimit.PROJECT_LIST_LIMIT,
                groupByCriteriaSkip: pac.groupByCriteriaList.groupSkip,
                adviceSkip: eachSkip,
                adviceLimit: groupByCriteriaLimit.ADVICE_LIST_LIMIT
            };
            progressAdviceService.getAdviceByStatus(query).then(handleReadAdvicesSuccess).catch(handleReadAdvicesFailure);
            function handleReadAdvicesSuccess(response) {
                if (response.data.advices === undefined || response.data.advices === 'empty' || response.data.advices.length === 0) {
                    $rootScope.emptyAdvices = true;
                    if (status === 'Inprogress') {
                        pac.noRecordMessage = $filter('translate')('advice.inProgress.notFound');
                    } else if (status === 'Rejected') {
                        pac.noRecordMessage = $filter('translate')('advice.rejected.notFound');
                    } else {
                        if ($rootScope.isInitiatorRole()) {
                            pac.noRecordMessage = $filter('translate')('advice.draft.notFound');
                        } else {
                            pac.noRecordMessage = $filter('translate')('advice.pending.notFound');
                        }
                    }
                    pac.showMessage = true;
                } else {
                    if(response.data.totalProjectCount){
                        pac.groupByCriteriaList.totalProjectCount = response.data.totalProjectCount;
                    }
                    if (groupByCriteria === category.GROUP_PROJECT) {
                        pac.groupByStatus = category.GROUP_PROJECT;
                        if (pac.groupByCriteriaList.groupSkip === 0) {
                            pac.groupByCriteriaList.projects = response.data.advices
                        }
                        else {
                            updateAdviceInScope(response, groupByCriteria, {})
                        }
                    }
                    else if (groupByCriteria === category.GROUP_PAYEE) {
                        pac.groupByStatus = category.GROUP_PAYEE;
                        if (pac.groupByCriteriaList.groupSkip === 0) {
                            pac.groupByCriteriaList.projects = response.data.advices
                        }
                        else {
                            updateAdviceInScope(response, groupByCriteria, {})
                        }
                    }
                    else if (groupByCriteria === category.GROUP_ADVICE) {
                        if (projectId) {
                            fetchLimitedAdvices(projectId, response);
                        }
                        else {
                            fetchLimitedAdvices(payeeId, response);
                        }
                        groupedData.advices = pac.eachProjectAdvices
                    }

                }
            }
            function handleReadAdvicesFailure(error){
                console.log(error);
            }
        }
        function updateAdviceInScope(advice, groupByCriteria) {
            for (var i = 0; i < advice.data.advices.length; i++) {
                var eachAdvice = advice.data.advices[i];
                var index;
                if (groupByCriteria === category.GROUP_PROJECT || groupByCriteria === category.GROUP_PAYEE) {
                    index = passUtilsService.findIndexByKeyAndValue(pac.groupByCriteriaList.projects, '_id', eachAdvice._id);
                    if (index === -1) {
                        pac.groupByCriteriaList.projects.push(eachAdvice);
                    }
                }
            }
        }
        function fetchLimitedAdvices(groupByCriteriaId, response) {
            for (var i = 0; i < pac.groupByCriteriaList.projects.length; i++) {
                var eachProject = pac.groupByCriteriaList.projects[i];
                if (eachProject._id === groupByCriteriaId) {
                    if (eachProject.adviceSkip === 0 || !(eachProject.advices))
                        eachProject.advices = response.data.advices;
                    else if (eachProject.advices) {
                        for (var i = 0; i < response.data.advices.length; i++) {
                            var index = passUtilsService.findIndexByKeyAndValue(eachProject.advices, '_id', response.data.advices[i]._id);
                            if (index === -1) {
                                eachProject.advices.push(response.data.advices[i]);
                            }
                        }

                    }
                    pac.eachProjectAdvices = eachProject.advices
                    break;
                }
            };
        }
        function setSkipCountForAdvice(groupByCriteriaId) {
            for (var i = 0; i < pac.groupByCriteriaList.projects.length; i++) {
                var eachProject = pac.groupByCriteriaList.projects[i];
                if (eachProject._id === groupByCriteriaId) {
                    return eachProject.adviceSkip;
                }
            };
        }
        function resetOnCriteria(){
            pac.groupByCriteriaList.projects=null;
            pac.groupByCriteriaList.groupSkip=0
            pac.groupByCriteriaList.totalProjectCount=0;

        }
    }
}());
