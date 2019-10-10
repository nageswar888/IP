'use strict';
(function(){
    angular
        .module('sbpo.searchAdvice')
        .controller('SearchAdviceController', SearchAdviceController);

    SearchAdviceController.$inject = [
        '$state', '$scope', '$rootScope','$location', 'NgTableParams', '$stateParams', '$q', 'searchAdviceService',
        '$cookies', 'paymentAdvice','$timeout','passUtilsService', '$http', 'customType','Flash','$filter', 'category', 'adviceEditType',
        'ledgerType', '$uibModal', 'downloadConstants','$anchorScroll','groupByCriteriaLimit','addBankService'
    ];

    function SearchAdviceController($state, $scope, $rootScope, $location, NgTableParams, $stateParams, $q, searchAdviceService,
                                    $cookies, paymentAdvice,$timeout,passUtilsService, $http, customType ,Flash,$filter, category,
                                    adviceEditType,ledgerType,$uibModal,downloadConstants,$anchorScroll,groupByCriteriaLimit,addBankService) {
        var sac = this;
        sac.state=$state.current.name
        sac.currentDate = moment(new Date()).format("DD/MM/YYYY");
        sac.advice = $stateParams.filterObj ? $stateParams.filterObj : {"model": {}};
        sac.adviceQueryParams = {};
        sac.showHideMonthGraph = false;
        sac.showHidePerDayAdviceGraph = false;
        sac.showHideDayGraph = false;
        sac.showHideWeekGraph = false;
        sac.searchFormValidate = false;
        sac.invalidRange = false;
        sac.pieChartOtion = {};
        sac.groupByCriteriaList={}
        sac.groupByCriteriaList.groupSkip=0;
        sac.groupByCriteriaLimit=groupByCriteriaLimit.PROJECT_LIST_LIMIT;
        sac.resetSearchAdviceForm = resetSearchAdviceForm;
        sac.convertStringToDate = convertStringToDate;
        sac.searchByDate = searchByDate;
        sac.getAllProjects = getAllProjects;
        sac.getAllBanks = getAllBanks;
        sac.setDateRangeFalse = setDateRangeFalse;
        sac.downloadAdvicePdf = downloadAdvicePdf;
        sac.downloadAsMatrix = downloadAsMatrix;
        sac.paymentTypes = passUtilsService.populateCustomFields(customType.PAYMENT_TYPE, '_id', 'name');
        sac.categories = passUtilsService.populateCustomFields(customType.CATEGORY, '_id', 'name');
        /*sac.downloadAll = downloadAll;*/
        sac.status = $stateParams.status;
        sac.viewAdviceDetails = viewAdviceDetails;
        sac.toggleAdvancedSearch = toggleAdvancedSearch;
        sac.getAllVirtualLedgers = getAllVirtualLedgers;
        sac.show = show;
        sac.showSearchData = showSearchData;
        sac.hideProjectName=hideProjectName;
        sac.searchGroupedAdvices=searchGroupedAdvices
        /*showSearchData('second')*/
        $scope.RequestedDate = "ng-hide";
        $scope.RequestedBy = "ng-hide";
        $scope.FirstLevelApprover = "ng-hide";
        $scope.SecondLevelApprover = "ng-hide";
        $scope.InitiatedBy = "ng-hide";
        $scope.Disburser = "ng-hide";
        $scope.PaymentType = "ng-hide";
        $scope.BillAmountDue = "ng-hide";
        $scope.ModeofPayment = "ng-hide";
        $scope.Purpose = "ng-hide";
        $scope.DateMoneyDisbursed = "ng-hide";
        sac.graphView = graphView;
        sac.tableView = tableView;
        sac.groupView = groupView;
        sac.bactToMonthGraph = bactToMonthGraph;
        sac.backToYearGraph = backToYearGraph;
        sac.adviceStatus = $rootScope.adviceStatusForSearch;
        sac.bactToWeekGraph = bactToWeekGraph;
        sac.bactToDayGraph = bactToDayGraph;
        sac.bactToPerDayAdviceGraph = bactToPerDayAdviceGraph;
        sac.groupByProjectView = groupByProjectView;
        sac.setAmountRangeFalse = setAmountRangeFalse;
        sac.getProjectFullName = getProjectFullName
        sac.graphMonth = $rootScope.monthNames;

        if(!$rootScope.hideColumns){
            $rootScope.hideColumns={};
        }
        if(Object.keys($rootScope.hideColumns).length === 0 && $rootScope.hideColumns.constructor === Object){
            $rootScope.hideColumns = {
                projectName: false,
                payeeName: false
            };
        }
        sac.resultTabs = [
            {
                key: 'graphView',
                title: 'graph.btn.label',
                groupCategory: category.GROUP_GRAPH,
                iconClass: 'fa fa-bar-chart',
                onSelect: sac.graphView,
                populateData: populateGraphData,
                totalKey: 'total',
                templateUrl: '/app/partials/searchAdviceGraph.html'
            },

            {
                key: 'graphByProjectView',
                title: 'label.graph.group.project',
                iconClass: 'fa fa-table',
                onSelect: sac.groupByProjectView,
                templateUrl: '/app/partials/search/searchAdviceGroupProject.html',
                populateData: populateGraphByProjectView
            },

            {
                key: 'tableView',
                title: 'advice.table.btn.label',
                groupCategory: category.GROUP_DEFAULT,
                iconClass: 'fa fa-table',
                onSelect: sac.tableView,
                populateData: populateTableData,
                totalKey: 'requestedAmount',
                templateUrl: '/app/partials/searchAdviceTable.html',
                hideColumns: $rootScope.hideColumns
            },
            {
                key: 'groupView',
                title: 'advice.group.view.label',
                groupCategory: category.GROUP_PROJECT,
                iconClass: 'fa fa-table',
                onSelect: sac.groupView,
                populateData: populateGroupData,
                totalKey: 'requestedAmount',
                templateUrl: '/app/partials/searchAdviceGroup.html',
                groupOptions: [
                    {key: category.GROUP_PROJECT, label: 'advice.project.label'},
                    {key: category.GROUP_PAYEE, label: 'advice.title.payee'},
                    {key: category.GROUP_PAYMENT_TYPE, label: 'advice.title.paymentType'},
                    {key: category.GROUP_CATEGORY, label: 'advice.category.label'}
                ]
            }
        ];
        sac.graphQuery = $stateParams.graphQuery ? $stateParams.graphQuery : {};
        sac.selectedResultTab = passUtilsService.findByKeyAndValue(sac.resultTabs, 'key', $stateParams.resultsView ? $stateParams.resultsView : 'graphView');
        sac.selectedResultTabKey = angular.copy(sac.selectedResultTab.key);
        sac.fetchGroupedAdvices = fetchGroupedAdvices;

        sac.copiedAdvice = angular.copy(sac.advice);
        checkState();
        sac.predicate = 'payee';
        sac.reverse = true;
        if (sac.advice.model) {
            sac.advice.model.status = $rootScope.adviceStatusForSearch[0];
        }
        sac.getAllPayees = getAllPayees;
        sac.checkStatus = checkStatus;
        sac.searchByAdviceNumber = searchByAdviceNumber;
        var count = 0;
        sac.downloadAllPerProject = downloadAllPerProject;
        //Get payee based on payee(user) Id
        getPayeeByUserId();

        function downloadAllPerProject(type){
            var query = getDownloadQuery(type);
            if (type === downloadConstants.ALL_PDF) {
                if(sac.totalAdviceCount > sac.downloadLimit) {
                    $uibModal.open({
                        template: require('../../../partials/downloadConfirmation.html'),
                        controller:function UIModalController($scope,$uibModalInstance,Flash){
                            $scope.allProject = true;
                            $scope.adviceCount = sac.totalAdviceCount;
                            $scope.maxAdvicesDownload = sac.downloadLimit;
                            $scope.downloadAllPerProjectPdf=function(){
                                window.open('/api/advices/downloadAllPerProject?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
                                $uibModalInstance.close();
                            };
                            $scope.closePopup=function(){
                                $uibModalInstance.close();
                            }
                        }
                    });
                }
                else {
                    console.log("sac.totalAdviceCount",sac.totalAdviceCount)
                    window.open('/api/advices/downloadAllPerProject?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
                }
            }
            else {
                window.open('/api/advices/downloadAllPerProject?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
            }
        }

        function downloadAsMatrix(type){
            var query = getDownloadQuery(type);
            window.open('/api/advices/downloadProjectMatrix?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
        }

        function getDownloadQuery(type) {
            var selectedGraphQuery = sac.graphQuery[sac.showGraph];
            var frmDate = selectedGraphQuery ? passUtilsService.toDateObject(selectedGraphQuery.dateQuery.fromDate) : passUtilsService.toDateObject(sac.copiedAdvice.model.fromDate);
            var toDate = selectedGraphQuery ? passUtilsService.toDateObject(selectedGraphQuery.dateQuery.toDate) : passUtilsService.toDateObject(sac.copiedAdvice.model.toDate);
            var frmAmt = selectedGraphQuery ? selectedGraphQuery.dateQuery.fromAmount : sac.copiedAdvice.model.fromAmount;
            var toAmt = selectedGraphQuery ? selectedGraphQuery.dateQuery.toAmount : sac.copiedAdvice.model.toAmount;
            var ledger = selectedGraphQuery ? selectedGraphQuery.dateQuery.ledger : sac.advice.model.ledger?sac.advice.model.ledger._id:undefined;
            var bankId = selectedGraphQuery?selectedGraphQuery.dateQuery.bank:sac.advice.model.bank?sac.advice.model.bank._id:undefined;
            var virtualLedger=selectedGraphQuery ? selectedGraphQuery.dateQuery.virtualLedger : sac.advice.model.virtualLedger?sac.advice.model.virtualLedger._id:undefined;
            var typeObj = getType(frmDate, toDate);

            var payee, project, status, categoryName, paymentTypeName,bankName,virtualLedgerName,ledgerName;
            if (sac.copiedAdvice.model.payee) {
                payee = sac.copiedAdvice.model.payee._id
            }
            if (sac.copiedAdvice.model.project) {
                project = sac.copiedAdvice.model.project._id
            }
            if (sac.copiedAdvice.model.status === "All") {
                status = undefined;
            } else {
                status = sac.copiedAdvice.model.status
            }
            var paymentType, category, payeeName;
            if (sac.copiedAdvice.model.payee) {
                payeeName = sac.copiedAdvice.model.payee.nickName;
            }
            if (sac.copiedAdvice.model.paymentType) {
                paymentType = sac.copiedAdvice.model.paymentType._id;
                paymentTypeName = sac.copiedAdvice.model.paymentType.name;
            }
            if (sac.copiedAdvice.model.category) {
                category = sac.copiedAdvice.model.category._id;
                categoryName = sac.copiedAdvice.model.category.name;
            }
            if(sac.advice.model.ledger){
                console.log("sac.advice.model.ledger____",sac.advice.model.ledger);
                ledger=sac.advice.model.ledger._id;
                ledgerName=sac.advice.model.ledger.name;
            }if(sac.advice.model.bank){
                bankName=sac.advice.model.bank.accountName;
                bankId=sac.advice.model.bank._id;

            }
            if(sac.advice.model.virtualLedger){
                virtualLedger=sac.advice.model.virtualLedger._id;
                virtualLedgerName=sac.advice.model.virtualLedger.name;
            }

            var options = {year: "numeric", month: "numeric", day: "numeric"};
            if (sac.copiedAdvice.model.toDate)
                toDate = toDate.toLocaleDateString("en-US", options);
            if (sac.copiedAdvice.model.fromDate)
                frmDate = frmDate.toLocaleDateString("en-US", options);

            var query = {
                toDate: toDate,
                fromDate: frmDate,
                payee: payee,
                project: project,
                status: status,
                type: typeObj.type,
                selected: typeObj.selected,
                statusType: type,
                adviceNum: sac.copiedAdvice.model.adviceNum,
                payeeName: passUtilsService.replaceSpecialCharacters(payeeName),
                projectName: sac.advice.model.project ? passUtilsService.replaceSpecialCharacters(sac.advice.model.project.projectName) : undefined,
                paymentType: paymentType,
                category: category,
                categoryName: passUtilsService.replaceSpecialCharacters(categoryName),
                paymentTypeName: passUtilsService.replaceSpecialCharacters(paymentTypeName),
                fromAmount: frmAmt,
                toAmount: toAmt,
                ledger:ledger,
                virtualLedger:virtualLedger,
                bankId:bankId,
                bankName:passUtilsService.replaceSpecialCharacters(bankName),
                virtualLedgerName:passUtilsService.replaceSpecialCharacters(virtualLedgerName),
                ledgerName:passUtilsService.replaceSpecialCharacters(ledgerName)
            };
            return query
        }

        /*This method will render html in search page on the basis of redio button*/
        function checkStatus(status, commingStatus) {
            $rootScope.currentState = status;
            if (status === commingStatus) {
                return true;
            }
        }

        /*This method will return adviceId of respected advice no*/
        function searchByAdviceNumber(adviceno) {
            var query = {adviceNo: adviceno};
            if ($rootScope.isPayee()) {
                query['payeeId'] = sac.copiedAdvice.model.payee._id
            }
            searchAdviceService.searchByAdviceNumber(query).then(searchByAdviceNumberSuccess).catch(searchByAdviceNumberFailed);
            function searchByAdviceNumberSuccess(response) {
                if (response.status === "OK") {
                    $state.go('viewAdviceDetail', {id: response.data._id, showValidation: false})
                }
                else {
                    Flash.create('danger', $filter('translate')('advice.not.found.error'), 'searchFlashMsgDiv');
                }
            }

            function searchByAdviceNumberFailed(error) {
                console.log(error);
            }
        }
        function show(scrollLocation){
            console.log("_____calling2")
            $anchorScroll.yOffset = 70;
            $location.hash(scrollLocation);
            $anchorScroll();
        }

        function showSearchData(scrollLocation){
            console.log("_____calling1")
            $anchorScroll.yOffset = 70;
            $timeout(function () {
                $location.hash(scrollLocation);
                $anchorScroll();
            },1500)
        }



        function checkState() {
            if ($rootScope.previousState.name !== 'viewAdviceDetail') {
                sac.advice.model = {};
                //sac.advice.model.toDate = moment(new Date()).format($rootScope.dateFormate);
                /*sac.advice.model.toDate = moment(new Date()).format("DD-MMM-YYYY");*/
            }
            if (sac.selectedResultTab.key === 'graphView') {
                if (sac.graphQuery.day) {
                    bactToPerDayAdviceGraph();
                }
                else if (sac.graphQuery.week) {
                    bactToDayGraph();
                }
                else if (sac.graphQuery.weeks) {
                    bactToWeekGraph();
                }
                else if (sac.graphQuery.month) {
                    bactToMonthGraph();
                }
                else if (sac.graphQuery.year) {
                    backToYearGraph();
                }
                else {
                    console.log("Invalid graph query......")
                }
            } else {
                sac.selectedResultTab.onSelect(sac.advice);
            }
        }

        /**
         *
         * @param searchTerm
         * @param event
         *
         * This method will return bank account name based on ui-select character
         */
        function getAllBanks(searchTerm, event) {
            if($rootScope.keyCode.indexOf(event.keyCode) === -1) {
                addBankService.getAllBanks({accountName:searchTerm}).then(adminBankSuccess).catch(adminBankFailure);
            }
            function adminBankSuccess(success){
                sac.allBanks = success.data;
            }
            function adminBankFailure(failure){
            }
        }

        /*
         * fetch all projects by name
         * */

        function getAllProjects(searchTerm) {
            if (searchTerm.length === 0) {
                getProjectFullName(searchTerm)
            }
            paymentAdvice.getProjectsByName({projectName: searchTerm}).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                sac.projects = response.data;
                sac.projects = $filter('orderBy')(sac.projects, 'projectName');
                sac.projects.unshift({projectName: 'All', value: ''});

            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }

        sac.order = function (predicate) {
            sac.reverse = (sac.predicate === predicate) ? !sac.reverse : false;
            sac.predicate = predicate;
        };
        $scope.tableColumnSetting = {
            scrollableHeight: '300px',
            enableSearch: true,
            scrollable: true,
            smartButtonMaxItems: 3,
            smartButtonTextConverter: function (itemText, originalItem) {
                return itemText;
            },
            groupByTextProvider: function (groupValue) {
                if (groupValue === 'E') {
                    return 'Enabled';
                } else {
                    return 'Disabled';
                }
            }
        };

        $scope.yourEvents = {
            onDeselectAll: function () {
                $scope.RequestedDate = "ng-hide";
                $scope.RequestedBy = "ng-hide";
                $scope.RequestedBy = "ng-hide";
                $scope.InitiatedBy = "ng-hide";
                $scope.Disburser = "ng-hide";
                $scope.PaymentType = "ng-hide";
                $scope.BillAmountDue = "ng-hide";
                $scope.ModeofPayment = "ng-hide";
                $scope.DateMoneyDisbursed = "ng-hide";
                $scope.FirstLevelApprover = "ng-hide";
                $scope.SecondLevelApprover = "ng-hide";
                $scope.PaymentAdviceNumber = "ng-hide";
            },

            onItemSelect: function (item) {
                console.log(item.id);
                if (item.id === 'RequestedDate')
                    $scope.RequestedDate = "ng-show";
                else if (item.id === 'RequestedBy')
                    $scope.RequestedBy = "ng-show";
                else if (item.id === 'RequestedBy')
                    $scope.RequestedBy = "ng-show";
                else if (item.id === 'InitiatedBy')
                    $scope.InitiatedBy = "ng-show";
                else if (item.id === 'Disburser')
                    $scope.Disburser = "ng-show";
                else if (item.id === 'PaymentType')
                    $scope.PaymentType = "ng-show";
                else if (item.id === 'BillAmountDue')
                    $scope.BillAmountDue = "ng-show";
                else if (item.id === 'ModeofPayment')
                    $scope.ModeofPayment = "ng-show";
                else if (item.id === 'DateMoneyDisbursed')
                    $scope.DateMoneyDisbursed = "ng-show";
                else if (item.id === 'FirstLevelApprover')
                    $scope.FirstLevelApprover = "ng-show";
                else if (item.id === 'SecondLevelApprover')
                    $scope.SecondLevelApprover = "ng-show";
                else if (item.id === 'PaymentAdviceNumber')
                    $scope.PaymentAdviceNumber = "ng-show";
            },
            onItemDeselect: function (item) {
                if (item.id === 'RequestedDate')
                    $scope.RequestedDate = "ng-hide";
                else if (item.id === 'RequestedBy')
                    $scope.RequestedBy = "ng-hide";
                else if (item.id === 'RequestedBy')
                    $scope.RequestedBy = "ng-hide";
                else if (item.id === 'InitiatedBy')
                    $scope.InitiatedBy = "ng-hide";
                else if (item.id === 'Disburser')
                    $scope.Disburser = "ng-hide";
                else if (item.id === 'PaymentType')
                    $scope.PaymentType = "ng-hide";
                else if (item.id === 'BillAmountDue')
                    $scope.BillAmountDue = "ng-hide";
                else if (item.id === 'ModeofPayment')
                    $scope.ModeofPayment = "ng-hide";
                else if (item.id === 'DateMoneyDisbursed')
                    $scope.DateMoneyDisbursed = "ng-hide";
                else if (item.id === 'FirstLevelApprover')
                    $scope.FirstLevelApprover = "ng-hide";
                else if (item.id === 'SecondLevelApprover')
                    $scope.SecondLevelApprover = "ng-hide";
                else if (item.id === 'PaymentAdviceNumber')
                    $scope.PaymentAdviceNumber = "ng-hide";
            }
        };
        $scope.Selectedmodel = $rootScope.Model;
        $scope.selecteColumns = $rootScope.Model;
        $scope.tableColumns = $rootScope.tableColumns;
        /*
         * fetch all payees by name
         * */
        function getAllPayees(searchTerm) {
            paymentAdvice.getPayeesByName({payeeName: searchTerm}).then(handleReadPayeesSuccess).catch(handleReadPayeesFailure);
            function handleReadPayeesSuccess(response) {
                if (response.data) {
                    sac.payees = response.data;
                    sac.payees = $filter('orderBy')(sac.payees, 'nickName');
                    sac.payees.unshift({nickName: 'All'})
                } else {
                    sac.payees = [];
                    sac.payees.push({nickName: 'All'})
                }
            }

            function handleReadPayeesFailure(error) {
                console.log(error);
            }
        }

        function searchAdvicesForGraph(typeObj, dateQuery, sortCriteria, groupByCriteria, projectId, payeeId,
                                       paymentTypeId, categoryId, isFeatchCount, afterSuccess,ledgerId,virtualLedgerId,state,bankId) {

            if (!groupByCriteria) {
                groupByCriteria = sac.selectedResultTab.groupCategory;
            }
            sac.graphQuery[typeObj.type] = {
                typeObj: typeObj,
                dateQuery: dateQuery
            };

            payeeId = !payeeId && sac.copiedAdvice.model.payee ? sac.copiedAdvice.model.payee._id : payeeId;
            projectId = !projectId && sac.copiedAdvice.model.project ? sac.copiedAdvice.model.project._id : projectId;
            paymentTypeId = !paymentTypeId && sac.copiedAdvice.model.paymentType ? sac.copiedAdvice.model.paymentType._id : paymentTypeId;
            categoryId = !categoryId && sac.copiedAdvice.model.category ? sac.copiedAdvice.model.category._id : categoryId;
            ledgerId=!ledgerId && sac.copiedAdvice.model.ledger ? sac.copiedAdvice.model.ledger._id : ledgerId
            virtualLedgerId=!virtualLedgerId && sac.copiedAdvice.model.virtualLedger ? sac.copiedAdvice.model.virtualLedger._id : virtualLedgerId
            bankId=!bankId && sac.copiedAdvice.model.bank ? sac.copiedAdvice.model.bank._id : bankId;

            state = !state && sac.state ? sac.state : state
            var status;
            if (sac.copiedAdvice.model.status === "All") {
                status = undefined;
            } else {
                status = sac.copiedAdvice.model.status
            }
            searchAdvices(typeObj, dateQuery.fromDate, dateQuery.toDate, payeeId, projectId, status, dateQuery.adviceNum, paymentTypeId,
                categoryId, sortCriteria, groupByCriteria, afterSuccess, dateQuery.fromAmount, dateQuery.toAmount, isFeatchCount,ledgerId,virtualLedgerId,state,bankId);
        }

        function genratePieChart(pieChartData) {
            sac.pieChartData = [];
            var projectName = "";
            var projectTotal = 0;
            var count = 0;
            sac.totalProjectAmount = 0;
            pieChartData.forEach(function (advice) {
                projectName = advice.project;
                projectTotal = advice.total;
                count = advice.advicesCount;
                sac.pieChartData.push({projectName: projectName, total: projectTotal, count: count});
                sac.totalProjectAmount = sac.totalProjectAmount + advice.total
            });

            sac.pieChartOtion = {
                chart: {
                    type: 'pieChart',
                    height: 500,
                    width: 800,
                    x: function (d) {
                        return d.projectName + " : Rs." + $filter('indianAmtMatricInput')(d.total) + "/-";
                    },
                    y: function (d) {
                        return d.total;
                    },
                    showValues: true,
                    valueFormat: function (d) {
                        return $filter('indianAmtMatricInput')(d);
                    },
                    showLabels: false,
                    duration: 280,
                    labelThreshold: 0.0,
                    labelSunbeamLayout: false,
                    showLegend: true,
                    transition: true,
                    legend: {
                        rightAlign: false,
                        margin: {
                            top: 5,
                            right: 5,
                            bottom: 5,
                            left: 5
                        },
                        maxKeyLength: 40
                    },
                    tooltip: {
                        contentGenerator: function (d) {
                            var html = "<div class='row' style='max-width: 250px;'>" +
                                "<div class='col-sm-12'>" +
                                "<div class='col-sm-12'>Project:" + d.data.projectName + "  </div>" +
                                "<div class='col-sm-12 chart-tooltip-text-wrap'>" +
                                "Total: Rs." + $filter('indianAmtMatricInput')(d.data.total) + "/-</div>" +
                                "<div class='col-sm-12'>Advice count: " + d.data.count + "</div>";
                            html += "</div></div>";
                            return html;
                        }
                    }
                }
            }
        }

        function graphYearsView(yearsGraphData) {
            backToYearGraph(true);
            sac.years = [];
            sac.yearsGraphData = [];
            angular.forEach(yearsGraphData, function (val, graphKey) {
                sac.years.push(val)
            });

            sac.yearsGraphData.push({
                "values": sac.years
            });
            sac.yearOptions = {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    width: 700,
                    margin: {
                        top: 30,
                        right: 95,
                        bottom: 50,
                        left: 60
                    },
                    x: function (d) {
                        return d.year;
                    },
                    y: function (d) {
                        return d.total;
                    },
                    groupSpacing: 0.5,
                    valueFormat: function (d) {
                        return $filter('indianAmtMatricInput')(d);
                    },
                    showValues: true,
                    showControls: false,
                    showLegend: false,
                    duration: 500,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: '',
                        ticks: 3,
                        showMaxMin: false,
                        tickFormat: function (d) {
                            var symbolicNumber = $filter('getAmountInConvertedFormat')(d);
                            var num = $filter('indianAmtMatricInput')(symbolicNumber.data);
                            return num + symbolicNumber.symbol;
                        }
                    },
                    callback: function (chart) {
                        chart.multibar.dispatch.on('elementClick', function (e) {
                            console.log('elementClick in callback', e.data);
                            var yearQuery = passUtilsService.getYearQuery(e.data.year);
                            yearQuery.adviceNum = sac.copiedAdvice.model.adviceNum;
                            yearQuery.fromAmount = sac.copiedAdvice.model.fromAmount;
                            yearQuery.toAmount = sac.copiedAdvice.model.toAmount;
                            searchAdvicesForGraph({type: "month", selected: e.data.year}, yearQuery);
                            sac.showGraph = 'month';
                            //apply the transition to graph
                            if (angular.element(document.querySelectorAll('#yearGraph')).hasClass("fadeout")) {
                                angular.element(document.querySelectorAll('#yearGraph')).removeClass("fadeout").addClass("fadein");
                            }
                            else {
                                angular.element(document.querySelectorAll('#yearGraph')).removeClass("fadein").addClass("fadeout");
                            }
                            $scope.$apply();
                        });
                    },
                    tooltip: {
                        contentGenerator: function (d) {
                            var html = "<div class='row' style='max-width: 250px;'>" +
                                "<div class='col-sm-12'>" +
                                "<div class='col-sm-12'>Advices:" + d.data.adviceCount + "  </div>" +
                                "<div class='col-sm-12 chart-tooltip-text-wrap'>" +
                                "Total: " + d.data.totalAmount + "</div>";
                            html += "</div></div>";
                            return html;
                        }
                    }
                }
            };
        }

        function graphYearView(graphDate) {
            bactToMonthGraph(true);
            sac.year = [];
            sac.yearData = [];
            angular.forEach(graphDate, function (val, graphKey) {
                sac.year.push(val)
            });

            sac.yearData.push({
                "values": sac.year
            });


            sac.options = {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    width: 700,
                    margin: {
                        top: 30,
                        right: 95,
                        bottom: 50,
                        left: 100
                    },
                    x: function (d) {
                        return d.month;
                    },
                    y: function (d) {
                        return d.total;
                    },
                    groupSpacing: 0.5,
                    valueFormat: function (d) {
                        return $filter('indianAmtMatricInput')(d);
                    },
                    showValues: true,
                    showControls: false,
                    showLegend: false,
                    duration: 500,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: '',
                        ticks: 3,
                        showMaxMin: false,
                        tickFormat: function (d) {
                            var symbolicNumber = $filter('getAmountInConvertedFormat')(d);
                            var num = $filter('indianAmtMatricInput')(symbolicNumber.data);
                            return num + symbolicNumber.symbol;
                        }
                    },
                    callback: function (chart) {
                        chart.multibar.dispatch.on('elementClick', function (e) {
                            console.log('elementClick in callback', e.data);
                            var dateQuery = passUtilsService.getMonthQuery(e.data.monthNumber, e.data.monthYear);
                            dateQuery.adviceNum = sac.copiedAdvice.model.adviceNum;
                            dateQuery.fromAmount = sac.copiedAdvice.model.fromAmount;
                            dateQuery.toAmount = sac.copiedAdvice.model.toAmount;
                            searchAdvicesForGraph({type: "weeks", selected: e.data.monthNumber}, dateQuery);
                            sac.showGraph = 'weeks';
                            //apply the transition to graph
                            if (angular.element(document.querySelectorAll('#weeksGraph')).hasClass("fadeout")) {
                                angular.element(document.querySelectorAll('#weeksGraph')).removeClass("fadeout").addClass("fadein");
                            }
                            else {
                                angular.element(document.querySelectorAll('#weeksGraph')).removeClass("fadein").addClass("fadeout");
                            }
                            $scope.$apply();
                        });
                    },
                    tooltip: {
                        contentGenerator: function (d) {
                            var html = "<div class='row' style='max-width: 250px;'>" +
                                "<div class='col-sm-12'>" +
                                "<div class='col-sm-12'>Advices:" + d.data.adviceCount + "  </div>" +
                                "<div class='col-sm-12 chart-tooltip-text-wrap'>" +
                                "Total: " + d.data.totalAmount + "</div>";
                            html += "</div></div>";
                            return html;
                        }
                    }
                }
            };
        }


        //return week number in the month
        function getMonthWeek(date) {
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
            return Math.ceil((date.getDate() + firstDay) / 7);
        }


        function graphMonthView(monthGraphData) {
            bactToWeekGraph(true);

            sac.month = [];
            sac.monthData = [];
            angular.forEach(monthGraphData, function (val, graphKey) {
                sac.month.push(val)
            });

            sac.monthData.push({
                "values": sac.month
            });


            sac.monthOptions = {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    width: 700,
                    margin: {
                        top: 30,
                        right: 95,
                        bottom: 50,
                        left: 125
                    },
                    x: function (d) {
                        return d.week;
                    },
                    y: function (d) {
                        return d.total;
                    },
                    showValues: true,
                    valueFormat: function (d) {
                        return $filter('indianAmtMatricInput')(d);
                    },
                    showControls: false,
                    showLegend: false,
                    duration: 500,
                    groupSpacing: 0.5,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: '',
                        ticks: 3,
                        showMaxMin: false,
                        tickFormat: function (d) {
                            var symbolicNumber = $filter('getAmountInConvertedFormat')(d);
                            var num = $filter('indianAmtMatricInput')(symbolicNumber.data);
                            return num + symbolicNumber.symbol;
                        }
                    },
                    callback: function (chart) {
                        chart.multibar.dispatch.on('elementClick', function (e) {
                            console.log('elementClick in callback for week bar', e.data);

                            var dateQuery = passUtilsService.getWeekQuery(e.data.weekDate);
                            var weekNum = passUtilsService.getMonthWeekNumber(e.data.weekDate);
                            dateQuery.adviceNum = sac.copiedAdvice.model.adviceNum;
                            dateQuery.fromAmount = sac.copiedAdvice.model.fromAmount;
                            dateQuery.toAmount = sac.copiedAdvice.model.toAmount;
                            searchAdvicesForGraph({type: "week", selected: weekNum}, dateQuery);
                            sac.showGraph = 'week';
                            //apply the transition to graph
                            if (angular.element(document.querySelectorAll('#weekGraph')).hasClass("fadeout")) {
                                angular.element(document.querySelectorAll('#weekGraph')).removeClass("fadeout").addClass("fadein");
                            }
                            else {
                                angular.element(document.querySelectorAll('#weekGraph')).removeClass("fadein").addClass("fadeout");
                            }
                            $scope.$apply();
                        });
                    },
                    tooltip: {
                        contentGenerator: function (d) {
                            var html = "<div class='row' style='max-width: 250px;'>" +
                                "<div class='col-sm-12'>" +
                                "<div class='col-sm-12'>Advices: " + d.data.adviceCount + "</div>" +
                                "<div class='col-sm-12 chart-tooltip-text-wrap'>" +
                                "Total: " + d.data.totalAmount + "</div>";
                            html += "</div></div>";
                            return html;
                        }
                    }
                }
            }
        }

        function graphWeekView(weekGraphData) {
            //data for week graph
            bactToDayGraph(true);
            sac.week = [];
            sac.weekData = [];

            angular.forEach(passUtilsService.getSortedWeekData(weekGraphData), function (val, graphKey) {
                sac.week.push(val)
            });

            sac.weekData.push({
                "values": sac.week
            });

            sac.weekOptions = {

                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    width: 700,
                    margin: {
                        top: 30,
                        right: 95,
                        bottom: 50,
                        left: 100
                    },
                    x: function (d) {
                        return d.week;
                    },
                    y: function (d) {
                        return d.total;
                    },
                    valueFormat: function (d) {
                        return $filter('indianAmtMatricInput')(d);
                    },
                    showValues: true,
                    showControls: false,
                    showLegend: false,
                    duration: 500,
                    groupSpacing: 0.5,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: '',
                        ticks: 3,
                        showMaxMin: false,
                        tickFormat: function (d) {
                            var symbolicNumber = $filter('getAmountInConvertedFormat')(d);
                            var num = $filter('indianAmtMatricInput')(symbolicNumber.data);
                            return num + symbolicNumber.symbol;
                        }
                    },
                    callback: function (chart) {
                        chart.multibar.dispatch.on('elementClick', function (e) {
                            console.log('elementClick in callback for day bar', e.data);
                            //calculateDataForSelectedDayBar(e.data);
                            var selectedDate = e.data.week.split(",")[0]
                            var dateQuery = passUtilsService.getDayQuery(e.data.dayDate);
                            dateQuery.adviceNum = sac.copiedAdvice.model.adviceNum;
                            dateQuery.fromAmount = sac.copiedAdvice.model.fromAmount;
                            dateQuery.toAmount = sac.copiedAdvice.model.toAmount;

                            searchAdvicesForGraph({type: "day", selected: selectedDate}, dateQuery);
                            sac.showGraph = 'day';
                            //apply the transition to graph
                            if (angular.element(document.querySelectorAll('#dayGraph')).hasClass("fadeout")) {
                                angular.element(document.querySelectorAll('#dayGraph')).removeClass("fadeout").addClass("fadein");
                            }
                            else {
                                angular.element(document.querySelectorAll('#dayGraph')).removeClass("fadein").addClass("fadeout");
                            }
                            $scope.$apply();
                        });
                    },
                    tooltip: {
                        contentGenerator: function (d) {
                            var html = "<div class='row' style='max-width: 250px;'>" +
                                "<div class='col-sm-12'>" +
                                "<div class='col-sm-12'>Advices: " + d.data.adviceCount + "</div>" +
                                "<div class='col-sm-12 chart-tooltip-text-wrap'>" +
                                "Total: " + d.data.totalAmount + " </div>";
                            html += "</div></div>";
                            return html;
                        }
                    }

                }
            }
        }


        function graphDayView(dayGraphData) {
            bactToPerDayAdviceGraph(true);
            sac.dayList = [];
            sac.perDayGraphData = [];
            angular.forEach(dayGraphData, function (val, graphKey) {
                sac.dayList.push(val)
            });

            sac.perDayGraphData.push({
                "values": sac.dayList
            });
            sac.perDayOptions = {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    width: 700,
                    margin: {
                        top: 30,
                        right: 95,
                        bottom: 50,
                        left: 105
                    },
                    x: function (d) {
                        return d.adviceNumber;
                    },
                    y: function (d) {
                        return d.total;
                    },
                    valueFormat: function (d) {
                        return $filter('indianAmtMatricInput')(d);
                    },
                    showValues: true,
                    showControls: false,
                    showLegend: false,
                    duration: 500,
                    groupSpacing: 0.5,
                    transitionDuration: 500,
                    xAxis: {
                        axisLabel: '',
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: '',
                        ticks: 2,
                        showMaxMin: false,
                        tickFormat: function (d) {
                            var symbolicNumber = $filter('getAmountInConvertedFormat')(d);
                            var num = $filter('indianAmtMatricInput')(symbolicNumber.data);
                            return num + symbolicNumber.symbol;
                        }
                    },
                    callback: function (chart) {
                        chart.multibar.dispatch.on('elementClick', function (e) {
                            console.log('elementClick in callback', e.data);
                            if (e.data.adviceId) {
                                $state.go('viewAdviceDetail', {
                                    id: e.data.adviceId,
                                    graphQuery: sac.graphQuery,
                                    filterObj: sac.copiedAdvice,
                                    resultsView: 'graphView'
                                })
                            }

                        });
                    },
                    tooltip: {
                        contentGenerator: function (d) {
                            var html = "<div class='row' style='max-width: 250px;'>" +
                                "<div class='col-sm-12'>" +
                                "<div class='col-sm-12'>Payee: " + d.data.payeeName + "</div>" +
                                "<div class='col-sm-12 chart-tooltip-text-wrap'>" +
                                "Total: " + d.data.totalAmount + " </div>";
                            html += "</div></div>";
                            return html;
                        }
                    }
                }
            };
        }

        function a(task) {
            var availableDates = [];
            var year = 0;
            var date = task.requestedDate;
            if (date != null) {
                year = date.substring(0, 4);
            }
            if (year in availableDates) {
                availableDates.push(year)
            }

            return null;
        }

        function groupByProjectView(advice) {
            sac.selectedResultTab = passUtilsService.findByKeyAndValue(sac.resultTabs, 'key', 'graphByProjectView');
            if (advice) {

                var fromDate = advice.model.fromDate ? advice.model.fromDate : undefined;
                var toDate = advice.model.toDate ? advice.model.toDate : undefined;
                var adviceNum = advice.model.adviceNum ? advice.model.adviceNum : undefined;
                var payeeId = advice.model.payee ? advice.model.payee._id : undefined;
                var projectId = advice.model.project ? advice.model.project._id : undefined;
                var paymentTypeId = advice.model.paymentType ? advice.model.paymentType._id : undefined;
                var categoryId = advice.model.category ? advice.model.category._id : undefined;
                var status = advice.model.status ? advice.model.status : undefined;
                var fromAmount = advice.model.fromAmount ? advice.model.fromAmount : undefined;
                var toAmount = advice.model.toAmount ? advice.model.toAmount : undefined;
                var ledgerId=advice.model.ledger? advice.model.ledger._id : undefined;
                var virtualLedgerId=advice.model.virtualLedger? advice.model.virtualLedger._id : undefined;
                var bankId=advice.model.bank? advice.model.bank._id : undefined;
                var state = sac.state ? sac.state : undefined;

                groupByProjectGraph({}, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId, categoryId, undefined, undefined, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId);
            }
            sac.showMessage = false;
        }

        function graphView() {
            //TODO: Imp: Refactor this code
            sac.selectedResultTab = passUtilsService.findByKeyAndValue(sac.resultTabs, 'key', 'graphView');
            sac.showHideYearGraph = true;
            sac.showHideMonthGraph = false;
            sac.showHideDayGraph = false;
            sac.showHideWeekGraph = false;
            sac.showHidePerDayAdviceGraph = false;
            if (sac.showGraph === 'year') {
                sac.showHideYearGraph = true;
                sac.showHideMonthGraph = false;
                sac.showHideDayGraph = false;
                sac.showHideWeekGraph = false;
                sac.showHidePerDayAdviceGraph = false;
            }
            else if (sac.showGraph === 'month') {
                sac.showHideYearGraph = false;
                sac.showHideMonthGraph = true;
                sac.showHideDayGraph = false;
                sac.showHideWeekGraph = false;
                sac.showHidePerDayAdviceGraph = false;
            }
            else if (sac.showGraph === 'weeks') {
                sac.showHideYearGraph = false;
                sac.showHideMonthGraph = false;
                sac.showHideDayGraph = false;
                sac.showHideWeekGraph = true;
                sac.showHidePerDayAdviceGraph = false;
            }
            else if (sac.showGraph === 'week') {
                sac.showHideYearGraph = false;
                sac.showHideMonthGraph = false;
                sac.showHideDayGraph = true;
                sac.showHideWeekGraph = false;
                sac.showHidePerDayAdviceGraph = false;
            }
            else if (sac.showGraph === 'day') {
                sac.showHideYearGraph = false;
                sac.showHideMonthGraph = false;
                sac.showHideDayGraph = false;
                sac.showHideWeekGraph = false;
                sac.showHidePerDayAdviceGraph = true;
            } else {
                sac.searchByDate(sac.copiedAdvice)
            }
            sac.showMessage = false;
        }

        function tableView(advice) {
            sac.selectedResultTab = passUtilsService.findByKeyAndValue(sac.resultTabs, 'key', 'tableView');
            if (advice) {
                searchAdvicesForGraph({}, {
                    fromDate: advice.model.fromDate,
                    toDate: advice.model.toDate,
                    adviceNum: advice.model.adviceNum
                });
            }

            sac.showMessage = false;

        }

        function groupView(advice, useSelected) {
            sac.selectedResultTab = passUtilsService.findByKeyAndValue(sac.resultTabs, 'key', 'groupView');
            if (advice) {
                sac.selectedResultTab.groupCategory = useSelected ? sac.selectedResultTab.selectedGroupOption.key : category.GROUP_PROJECT;
                sac.selectedResultTab.selectedGroupOption = passUtilsService.findByKeyAndValue(sac.selectedResultTab.groupOptions, 'key', sac.selectedResultTab.groupCategory);
                //setting groupSkip as 0 for each change in groupView
                sac.groupByCriteriaList.groupSkip=0;
                searchAdvicesForGraph({}, {
                    fromDate: advice.model.fromDate,
                    toDate: advice.model.toDate,
                    adviceNum: advice.model.adviceNum
                });
            }
            sac.showMessage = false;
        }

        function backToYearGraph(dontReloadGraph) {
            sac.years = "active-r";
            sac.months = "";
            sac.weeks = "";
            sac.days = "";
            sac.day = "";

            sac.showHideYearGraph = true;
            sac.showHideMonthGraph = false;
            sac.showHideDayGraph = false;
            sac.showHideWeekGraph = false;
            sac.showHidePerDayAdviceGraph = false;

            sac.backBtnYearGraph = true;

            sac.showGraph = 'year';
            sac.showMessage = false;
            //apply transitions to year graph
            if (angular.element(document.querySelectorAll('#yearGraph')).hasClass("fadeout")) {
                angular.element(document.querySelectorAll('#yearGraph')).removeClass("fadeout").addClass("fadein");
            }
            else {
                angular.element(document.querySelectorAll('#yearGraph')).removeClass("fadein").addClass("fadeout");
            }

            if (!dontReloadGraph) {
                delete sac.graphQuery.month;
                delete sac.graphQuery.weeks;
                delete sac.graphQuery.week;
                delete sac.graphQuery.day;
                searchAdvicesForGraph(sac.graphQuery.year.typeObj, sac.graphQuery.year.dateQuery);
            }

        }

        function bactToMonthGraph(dontReloadGraph) {
            //apply transitions to month graph
            if (angular.element(document.querySelectorAll('#weeksGraph')).hasClass("fadeout")) {
                angular.element(document.querySelectorAll('#weeksGraph')).removeClass("fadeout").addClass("fadein");
            }
            else {
                angular.element(document.querySelectorAll('#weeksGraph')).removeClass("fadein").addClass("fadeout");
            }
            sac.years = "";
            sac.months = "active-r";
            sac.weeks = "";
            sac.days = "";
            sac.day = "";

            sac.showHideYearGraph = false;
            sac.showHideMonthGraph = true;
            sac.showHideDayGraph = false;
            sac.showHideWeekGraph = false;
            sac.showHidePerDayAdviceGraph = false;

            sac.backBtnMonthGraph = true;

            sac.showGraph = 'month';
            sac.showMessage = false;

            if (!dontReloadGraph) {
                delete sac.graphQuery.weeks;
                delete sac.graphQuery.week;
                delete sac.graphQuery.day;
                searchAdvicesForGraph(sac.graphQuery.month.typeObj, sac.graphQuery.month.dateQuery);
            }
        }

        function bactToWeekGraph(dontReloadGraph) {
            //apply transitions to week graph
            if (angular.element(document.querySelectorAll('#weekGraph')).hasClass("fadeout")) {
                angular.element(document.querySelectorAll('#weekGraph')).removeClass("fadeout").addClass("fadein");
            }
            else {
                angular.element(document.querySelectorAll('#weekGraph')).removeClass("fadein").addClass("fadeout");
            }
            sac.years = "";
            sac.months = "";
            sac.weeks = "active-r";
            sac.days = "";
            sac.day = "";
            sac.showHideYearGraph = false;
            sac.showHideMonthGraph = false;
            sac.showHideDayGraph = false;
            sac.showHideWeekGraph = true;
            sac.showHidePerDayAdviceGraph = false;

            sac.backBtnWeekGraph = true;

            sac.showGraph = 'weeks';
            sac.showMessage = false;

            if (!dontReloadGraph) {
                delete sac.graphQuery.week;
                delete sac.graphQuery.day;
                searchAdvicesForGraph(sac.graphQuery.weeks.typeObj, sac.graphQuery.weeks.dateQuery);
            }

        }

        function bactToDayGraph(dontReloadGraph) {
            console.log("day wise data");
            //apply transitions to day graph
            if (angular.element(document.querySelectorAll('#dayGraph')).hasClass("fadeout")) {
                angular.element(document.querySelectorAll('#dayGraph')).removeClass("fadeout").addClass("fadein");
            }
            else {
                angular.element(document.querySelectorAll('#dayGraph')).removeClass("fadein").addClass("fadeout");
            }
            sac.years = "";
            sac.months = "";
            sac.weeks = "";
            sac.days = "active-r";
            sac.day = "";
            sac.showHideYearGraph = false;
            sac.showHideMonthGraph = false;
            sac.showHideDayGraph = true;
            sac.showHideWeekGraph = false;
            sac.showHidePerDayAdviceGraph = false;

            sac.backBtnDayGraph = true;

            sac.showGraph = 'week';
            sac.showMessage = false;

            if (!dontReloadGraph) {
                delete sac.graphQuery.day;
                searchAdvicesForGraph(sac.graphQuery.week.typeObj, sac.graphQuery.week.dateQuery);
            }

        }

        function bactToPerDayAdviceGraph(dontReloadGraph) {
            //apply transitions to day graph
            if (angular.element(document.querySelectorAll('searchByDate#dayGraph')).hasClass("fadeout")) {
                angular.element(document.querySelectorAll('#dayGraph')).removeClass("fadeout").addClass("fadein");
            }
            else {
                angular.element(document.querySelectorAll('#dayGraph')).removeClass("fadein").addClass("fadeout");
            }
            sac.years = "";
            sac.months = "";
            sac.weeks = "";
            sac.days = "";
            sac.day = "active-r";
            sac.showHideYearGraph = false;
            sac.showHideMonthGraph = false;
            sac.showHideDayGraph = false;
            sac.showHideWeekGraph = false;
            sac.showHidePerDayAdviceGraph = true;

            sac.backBtnPerDayAdviceGraph = true;

            sac.showGraph = 'day';
            sac.showMessage = false;

            if (!dontReloadGraph) {
                searchAdvicesForGraph(sac.graphQuery.day.typeObj, sac.graphQuery.day.dateQuery);
            }

        }

        /**
         * this method will set inavlidRange to false,
         * if user change the date in date picker dropdown
         */
        function setDateRangeFalse() {
            sac.invalidRange = false
        }

        function setAmountRangeFalse() {
            sac.invalidAmountRange = false;
        }

        function validateForm(advice, form) {
            sac.searchFormValidate = form.$valid;
            if (!!advice.model) {
                if (new Date(advice.model.fromDate).getTime() > new Date(advice.model.toDate).getTime()) {
                    sac.searchFormValidate = false;
                    //form.fromDate.$error.invalidRange  = true;
                    sac.invalidRange = true
                }
                if (advice.model.toAmount && (advice.model.fromAmount > advice.model.toAmount)) {
                    sac.searchFormValidate = false;
                    sac.invalidAmountRange = true;
                }
            }
        }

        function searchByDate(advice, form) {
            console.log("search by date method is getting call");
            console.log(advice)
            sac.isSearchData = false;
            if (form) {
                validateForm(advice, form);
            }
            if (!form || sac.searchFormValidate) {
                sac.isDataSearched = true;
                sac.copiedAdvice = angular.copy(sac.advice);
                sac.dayList = [];
                sac.perDayGraphData = [];
                sac.week = [];
                sac.weekData = [];
                sac.month = [];
                sac.monthData = [];
                sac.year = [];
                sac.yearData = [];
                sac.years = [];
                sac.yearsGraphData = [];

                //tableView();
                sac.empExp = "ng-hide";
                sac.showHideYearGraph = false;
                sac.showHideMonthGraph = false;
                sac.showHidePerDayAdviceGraph = false;
                sac.showHideDayGraph = false;
                sac.showHideWeekGraph = false;
                sac.backBtnYearGraph = false;
                sac.backBtnMonthGraph = false;
                sac.backBtnWeekGraph = false;
                sac.backBtnDayGraph = false;
                sac.backBtnPerDayAdviceGraph = false;
                sac.showGraph = '';
                sac.groupByCriteriaList.groupSkip=0;
                if (!!advice.model) {
                    var frmDate = passUtilsService.toDateObject(advice.model.fromDate);
                    var tDate = passUtilsService.toDateObject(advice.model.toDate);

                    var typeObj = getType(frmDate, tDate);

                    sac.graphQuery = {};
                    $rootScope.hideColumns.payeeName = sac.copiedAdvice.model.payee && sac.copiedAdvice.model.payee._id;
                    $rootScope.hideColumns.projectName = sac.copiedAdvice.model.project && sac.copiedAdvice.model.project._id;
                    searchAdvicesForGraph(typeObj,
                        {
                            fromDate: advice.model.fromDate,
                            toDate: advice.model.toDate,
                            adviceNum: advice.model.adviceNum,
                            fromAmount: advice.model.fromAmount,
                            toAmount: advice.model.toAmount
                        });
                }

            }
        }

        function prepareSearchQuery(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                                    categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId,groupByCriteriaSkip,groupByCriteriaLimit) {
            var query = {
                toDate: toDate,
                fromDate: fromDate,
                payee: payeeId,
                project: projectId,
                paymentType: paymentTypeId,
                category: categoryId,
                status: status,
                type: typeObj.type,
                selected: typeObj.selected,
                adviceNum: adviceNum,
                statusCategory: status,
                sortCriteria: sortCriteria,
                groupByCriteria: groupByCriteria,
                fromAmount: fromAmount,
                toAmount: toAmount,
                ledger: ledgerId,
                virtualLedger: virtualLedgerId,
                state : state,
                bankId:bankId,
                groupByCriteriaSkip:groupByCriteriaSkip,
                groupByCriteriaLimit: groupByCriteriaLimit
            };
            return query;
        }

        /*Get count of advices based on search criteria*/
        function getTotalCountOfAdvices(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                                        categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId,groupByCriteriaSkip,groupByCriteriaLimit) {
            var query = prepareSearchQuery(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId);

            searchAdviceService.getAdviceCountBasedOnSearchCriteria(query)
                .then(function (response) {
                    if (response.data !== undefined || response.data.length === 0) {
                        sac.totalAdviceCount = response.data[0].advicesCount
                        sac.downloadLimit = response.data[0].downloadLimit
                    }
                })
                .catch(function (error) {
                    console.log("getTotalCountOfAdvices error");
                    console.log(error);
                });
        }

        /*Query for preparing graph group by project*/
        function groupByProjectGraph(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                                     categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId,groupByCriteriaSkip,groupByCriteriaLimit) {
            //Below code is to take the query parameters from the graph view selection
            if (sac.selectedResultTabKey !== 'graphView') {
                console.log("==================")
                if (sac.graphQuery[sac.showGraph] !== undefined && sac.graphQuery[sac.showGraph].typeObj !== undefined) {
                    typeObj = sac.graphQuery[sac.showGraph].typeObj;
                    if (sac.graphQuery[sac.showGraph].dateQuery !== undefined) {
                        var fromDt = sac.graphQuery[sac.showGraph].dateQuery['fromDate'];
                        if (fromDt) {
                            fromDt = fromDt.split("-");
                            sac.advice.model.fromDate = $filter('date')(new Date(fromDt), "dd-MMM-yyyy");
                            fromDate = fromDt;
                        }
                        var toDt = sac.graphQuery[sac.showGraph].dateQuery['toDate'];
                        if (toDt) {
                            toDt = toDt.split("-");
                            sac.advice.model.toDate = $filter('date')(new Date(toDt), "dd-MMM-yyyy");
                            toDate = toDt;
                        }
                        var fromAmt = sac.graphQuery[sac.showGraph].dateQuery['fromAmount'];
                        if (fromAmt) {
                            sac.advice.model.fromAmount = fromAmt;
                            fromAmount = fromAmt;
                        }
                        var toAmt = sac.graphQuery[sac.showGraph].dateQuery['toAmount'];
                        if (toAmt) {
                            sac.advice.model.toAmount = toAmt;
                            toAmount = toAmt;
                        }
                        adviceNum = sac.graphQuery[sac.showGraph].dateQuery['adviceNum'] ? sac.graphQuery[sac.showGraph].dateQuery['adviceNum'] : adviceNum;
                    }
                }
            }
            var query = prepareSearchQuery(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId,groupByCriteriaSkip,groupByCriteriaLimit);

            getTotalCountOfAdvices(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,state,bankId);

            searchAdviceService.calculateAggregationByProject(query)
                .then(function (response) {
                    if (response.data !== undefined || response.data.length === 0) {
                        $timeout(function () {
                            genratePieChart(response.data)
                        }, 1000);
                    }
                })
                .catch(function (error) {
                    console.log("Pie chart error");
                    console.log(error);
                    sac.showMessage = true;
                    sac.emptyException = $filter('translate')('search.advice.wrong');
                });
        }

        function searchAdvices(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                               categoryId, sortCriteria, groupByCriteria, afterSuccess, fromAmount, toAmount, isFeatchCount,ledgerId,virtualLedgerId,state,bankId) {

            // storing all params of search method in an object and binding this object to render advices component.
            sac.searchParams={
                typeObj:typeObj,
                fromDate:fromDate,
                toDate:toDate,
                payeeId:payeeId,
                projectId:projectId,
                status:status,
                adviceNum:adviceNum,
                paymentTypeId:paymentTypeId,
                categoryId:categoryId, sortCriteria:sortCriteria, groupByCriteria:groupByCriteria, afterSuccess:afterSuccess, fromAmount:fromAmount, toAmount:toAmount,
                isFeatchCount:isFeatchCount,ledgerId:ledgerId,virtualLedgerId:virtualLedgerId,state:state,bankId:bankId
            }
            sac.showMessage = false;
            //Below code is to take the query parameters from the graph view selection
            //TODO: Imp: This code is duplicated with the above one and this can be removed once we refactor the whole code of this file
            if (sac.selectedResultTabKey !== 'graphView') {
                if (sac.graphQuery[sac.showGraph] !== undefined && sac.graphQuery[sac.showGraph].typeObj !== undefined) {
                    typeObj = sac.graphQuery[sac.showGraph].typeObj;
                    if (sac.graphQuery[sac.showGraph].dateQuery !== undefined) {
                        var fromDt = sac.graphQuery[sac.showGraph].dateQuery['fromDate'];
                        if (fromDt) {
                            fromDt = fromDt.split("-");
                            sac.advice.model.fromDate = $filter('date')(new Date(fromDt), "dd-MMM-yyyy");
                            fromDate = fromDt;
                        }
                        var toDt = sac.graphQuery[sac.showGraph].dateQuery['toDate'];

                        if (toDt) {
                            toDt = toDt.split("-");
                            sac.advice.model.toDate = $filter('date')(new Date(toDt), "dd-MMM-yyyy");
                            toDate = toDt;
                        }
                        var fromAmt = sac.graphQuery[sac.showGraph].dateQuery['fromAmount'];
                        if(fromAmt) {
                            sac.advice.model.fromAmount = fromAmt;
                            fromAmount = fromAmt;
                        }
                        var toAmt = sac.graphQuery[sac.showGraph].dateQuery['toAmount'];
                        if(toAmt) {
                            sac.advice.model.toAmount = toAmt;
                            toAmount = toAmt;
                        }
                        adviceNum = sac.graphQuery[sac.showGraph].dateQuery['adviceNum'] ? sac.graphQuery[sac.showGraph].dateQuery['adviceNum'] : adviceNum;
                    }
                }
            }
            var query={}
            //adding skip and limit only if groupView is selected
            if(sac.selectedResultTabKey === 'groupView'){

                console.log("sac.selectedResultTabKey",sac.selectedResultTabKey);
                console.log("sac.selectedResultTabKey",sac.groupByCriteriaList.more);
                query = prepareSearchQuery(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                    categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,sac.state,bankId,sac.groupByCriteriaList.groupSkip,sac.groupByCriteriaLimit,bankId)
            }
            else{
                console.log("sac.selectedResultTabKey",sac.selectedResultTabKey);
                query = prepareSearchQuery(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                    categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,sac.state,bankId);
            }
            if (!isFeatchCount) {
                getTotalCountOfAdvices(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                    categoryId, sortCriteria, groupByCriteria, fromAmount, toAmount,ledgerId,virtualLedgerId,sac.state,bankId);
            }

            if(groupByCriteria==='default'){
                sac.groupByCriteriaList.more=undefined;
                sac.selectedResultTab.tableParams = new NgTableParams({
                    page: 1,
                    count: 10
                },{
                    getData: function(params){
                        var isFilterApplied = true;
                        if(angular.equals(params.filter(), {})) { isFilterApplied = false; }
                        query.page_size= params.count() === -1 ? 0 : params.count();
                        query.page=params.page();
                        return  searchAdviceService.searchByDateTblTab(query).then(function(response){


                            if (response.data === undefined || response.data.length === 0 || angular.equals(response.data, {})) {
                                sac.emptyException = $filter('translate')('search.advice.notFound');
                                sac.showMessage = true;
                                sac.empExp = "ng-show";
                                sac.isSearchData = false;
                            }
                            else {
                                sac.isSearchData = true;
                                sac.showMessage = false;
                                sac.totalAmount = response.pagination.totalAmt;
                                params.total(response.pagination.total);
                                sac.noRecordMessage=false;
                                sac.isDataExist = (response.data.length === 0)

                                if (sac.isDataExist && !isFilterApplied) {
                                    sac.noRecordMessage=true;
                                } else {
                                    var orderedData = params.sorting() ?
                                        $filter('orderBy')(response.data, params.orderBy()) : response.data;
                                    return orderedData;
                                }
                                var orderedData = response.data;
                                return orderedData;
                            }



                        }, function(error) {
                            console.error('Error occured while loading data.');
                        });
                    }});
            }
            else {
                sac.groupByCriteriaList.more=undefined;
                searchAdviceService.searchByDate(query)
                    .then(function (response) {
                        if (afterSuccess) {
                            afterSuccess(response)
                            showSearchData('second')
                        } else {
                            sac.selectedResultTab.data = [];
                            if (response.data === undefined || response.data.length === 0 || angular.equals(response.data, {})) {
                                sac.emptyException = $filter('translate')('search.advice.notFound');
                                sac.showMessage = true;
                                sac.empExp = "ng-show";
                                sac.isSearchData = false;
                            }
                            else {
                                sac.isSearchData = true;
                                sac.showMessage = false;
                                //groupViewTotalAmount is rendered only if groupView is selected
                                if(sac.selectedResultTabKey === 'groupView'){
                                    sac.groupViewTotalAmount = response.data.grandTotal;
                                }
                                else {
                                    sac.totalAmount = passUtilsService.getTotalAmount(response.data , sac.selectedResultTab.totalKey);
                                }
                                sac.groupByCriteriaList.totalProjectCount=response.data.totalProjectCount
                                sac.selectedResultTab.populateData(response, typeObj,groupByCriteria)
                            }
                        }
                    })
                    .catch(function (error) {
                        sac.showMessage = true;
                        sac.emptyException = $filter('translate')('search.advice.wrong');
                        sac.empExp = "ng-show";
                    });
            }
        }
        function populateTableData(response) {
            tableView();
            sac.selectedResultTab.data = response.data;
            sac.selectedResultTab.tableParams = new NgTableParams({
                page: 1,
                count: 10
            }, {dataset: sac.selectedResultTab.data});
        }

        function populateGraphByProjectView() {
            groupByProjectView(sac.advice);
        }

        function populateGraphData(response, typeObj) {
            if (typeObj.type === 'year') {
                sac.showGraph = 'year';
                graphYearsView(response.data);
            }
            else if (typeObj.type === 'month') {
                sac.showGraph = 'month';
                graphYearView(response.data);
            }
            else if (typeObj.type === 'weeks') {
                sac.showGraph = 'weeks';
                graphMonthView(response.data);
            }
            else if (typeObj.type === 'week') {
                sac.showGraph = 'week';
                graphWeekView(response.data);
            }
            else {
                sac.showGraph = 'day';
                graphDayView(response.data);
            }
        }

        sac.groupByCriteriaList = {
            projects: [{
                advices: []
            }]
        };

        function populateGroupData(response,typeObj,groupByCriteria) {
            groupView();
            sac.groupByStatus = groupByCriteria;
            if (sac.groupByCriteriaList.groupSkip === 0) {
                sac.groupByCriteriaList.projects = response.data.advices
            }
            else {
                updateAdviceInScope(response, groupByCriteria, {})
            }
            //This method will update advices into scope
            function updateAdviceInScope(advice, groupByCriteria) {
                for (var i = 0; i < advice.data.advices.length; i++) {
                    var eachAdvice = advice.data.advices[i];
                    var index;
                    if (groupByCriteria === category.GROUP_PROJECT || groupByCriteria === category.GROUP_PAYEE ||
                        groupByCriteria === category.GROUP_CATEGORY || groupByCriteria === category.GROUP_PAYMENT_TYPE ) {
                        index = passUtilsService.findIndexByKeyAndValue(sac.groupByCriteriaList.projects, '_id', eachAdvice._id);
                        if (index === -1) {
                            sac.groupByCriteriaList.projects.push(eachAdvice);
                        }
                    }
                }
            }
            sac.selectedResultTab.data = sac.groupByCriteriaList.projects;
        }

        function getType(frmDate, tDate) {
            var fromWeek = getMonthWeek(frmDate);
            var toWeek = getMonthWeek(tDate);
            var year = tDate.getFullYear();
            var searchTypes = ['year', 'month', 'weeks', 'week', 'day'];
            var type = '';
            var selected = 0;

            if (frmDate.getFullYear() !== tDate.getFullYear()) {
                // type years
                type = searchTypes[0];
                selected = -99;
            }
            else if (frmDate.getFullYear() === tDate.getFullYear()) {
                if (frmDate.getMonth() !== tDate.getMonth()) {
                    // type year
                    type = searchTypes[1];
                    selected = frmDate.getFullYear();
                }
                else if (frmDate.getMonth() === tDate.getMonth()) {

                    if (fromWeek !== toWeek) {
                        // type month
                        type = searchTypes[2];
                        selected = frmDate.getMonth();
                    }
                    else if (fromWeek === toWeek) {
                        var fromDay = frmDate.getDay();
                        var toDay = tDate.getDay();
                        if ((fromDay === toDay)) {
                            // type day
                            type = searchTypes[4];
                            selected = frmDate.getDate();
                        }
                        else {
                            // type week
                            type = searchTypes[3];
                            selected = fromWeek
                        }
                    }
                }
            }
            return {type: type, selected: selected};
        }

        /*This function will be move to utility soon*/
        function convertStringToDate(advice) {
            if (advice.requestedDate) {
                var parts = advice.requestedDate.split('/');
                var date = new Date(parseInt(parts[2]),
                    parseInt(parts[1]),
                    parseInt(parts[0]));
                return -date;
            }
        }

        function viewAdviceDetails(advice) {
            $state.go('viewAdviceDetail',
                {
                    id: advice._id, graphQuery: sac.graphQuery, filterObj: sac.advice,
                    resultsView: sac.selectedResultTab.key, editType: adviceEditType.DISBURSE_ADMIN_EDIT_ADVICE
                })
        }

        function downloadAdvicePdf(adviceId) {
            $http.get('/api/advices/downloadPdf/' + adviceId, {responseType: 'arraybuffer'}).then(function (response) {
                var file = new Blob([response.data], {type: 'application/pdf'});
                var fileURL = URL.createObjectURL(file);
                window.open(fileURL);
            });
        }

        function getPayeeByUserId(userId) {
            /*Allowing to execute this function only for payee*/
            if ($rootScope.isPayee()) {
                var currentUserId = $rootScope.getCurrentLoggedInUser()['_id'];
                searchAdviceService.getPayeeByUserId({id: currentUserId})
                    .then(function (response) {
                        sac.copiedAdvice.model.payee = response.data;
                    })
                    .catch(function (error) {
                        console.log(error);
                    })
            }
        }

        function resetSearchAdviceForm() {
            /* $state.reload();*/
            $state.transitionTo($state.current, {}, {
                reload: true, inherit: false, notify: true
            });
        }

        function fetchGroupedAdvices(groupedData, projectId, payeeId, paymentTypeId, categoryId) {
            searchAdvicesForGraph({}, {
                fromDate: sac.copiedAdvice.model.fromDate,
                toDate: sac.copiedAdvice.model.toDate,
                adviceNum: sac.copiedAdvice.model.adviceNum
            }, undefined, category.GROUP_ADVICE, projectId, payeeId, paymentTypeId, categoryId, true, function (response) {
                groupedData.advices = response.data;
                var counts = groupedData.advices.length > 50 ? [50, 100, 150] : [];
                groupedData.tableParams = new NgTableParams({page: 1, count: 50}, {
                    counts: counts,
                    dataset: groupedData.advices
                });
                groupedData.hideColumns = $rootScope.hideColumns;
            });
        }

        function toggleAdvancedSearch(show) {
            sac.advice.showAdvancedSearch = !!show;
            if (!sac.advice.showAdvancedSearch) {
                sac.advice.model.paymentType = undefined;
                sac.advice.model.category = undefined;
                if (sac.copiedAdvice && sac.copiedAdvice.model) {
                    sac.copiedAdvice.model.paymentType = undefined;
                    sac.copiedAdvice.model.category = undefined;
                }
            }
        }

        function getProjectFullName(item) {
            sac.hovered = passUtilsService.getProjectFullName(item);
        }
        function getAllVirtualLedgers(searchTerm,type) {
            console.log(type)
            if(type === "ledger"){
                type=ledgerType.LEDGER
            }
            if(type === "virtualledger"){
                type=ledgerType.VIRTUAL_LEDGER
            }
            passUtilsService.getAllVirtualLedgers({name:searchTerm,type : type})
                .then(successCallback)
                .catch(errorCallback);
            function successCallback(virtualLedgerOptions) {
                sac.virtualLedgerOptionNames=virtualLedgerOptions
            }
            function errorCallback(error) {
                sac.virtualLedgerOptionNames=[];
            }
        }
        function hideProjectName(){
            sac.hovered=""
        }
        function searchGroupedAdvices(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                                      categoryId, sortCriteria, groupByCriteria, afterSuccess, fromAmount, toAmount, isFeatchCount,ledgerId,virtualLedgerId,state,bankId){
            //calling the search method
            searchAdvices(typeObj, fromDate, toDate, payeeId, projectId, status, adviceNum, paymentTypeId,
                categoryId, sortCriteria, groupByCriteria, afterSuccess, fromAmount, toAmount, isFeatchCount,ledgerId,virtualLedgerId,state,bankId)
        }
    }
}());


