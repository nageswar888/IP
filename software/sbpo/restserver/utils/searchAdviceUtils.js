var apiUtils= require('./apiUtils');
var Q = require('q');
var constants = require("./constants");
var dateFormat = require('dateformat');
var adviceUtil= require('./adviceUtils');
var AdviceModel = require('../models/AdviceModel');

var searchAdviceUtils = {
    /**
     *
     * @param queryParam
     * @param currentUser
     * @returns {*|promise}
     *
     * This method will calculate total amount on search advices
     */
    findTotalAmount:function(queryParam,currentUser){
        var deferred= Q.defer();

        var adviceQuery = adviceUtil.getAdviceStatusesQueryToDisplay(queryParam, currentUser);
        if ((!queryParam.paymentType) && ("paymentType" in queryParam)) {
            adviceQuery.paymentType = null;
        }
        if ((!queryParam.category) && ("category" in queryParam)) {
            adviceQuery.category = null;
        }
        AdviceModel.aggregate([
            {'$match':adviceQuery},
            {
                $group:
                {
                    _id: null,
                    totalAmount: { $sum: "$requestedAmount"  },
                    count: { $sum: 1 }
                }
            }

        ],function(err,grandTotal){
            if(err){
                console.log("Error :",err);
                deferred.reject(err);
            }
            else {
                if(grandTotal.length>0){
                    deferred.resolve(grandTotal[0].totalAmount);
                }

            }
        });
        return deferred.promise;
    },
    /**
     *
     * @param queryParam
     * @param currentUser
     * @returns {*|promise}
     *
     * This method will return filtered advices on search criteria for table view
     */
    getAdvicesForTbleTab:function(queryParam,currentUser){
        var deferred= Q.defer();

        var page_number =queryParam.page ? queryParam.page:1;
        var page_size = queryParam.page_size ? queryParam.page_size : 10 ;

        var adviceQuery = adviceUtil.getAdviceStatusesQueryToDisplay(queryParam, currentUser);
        if ((!queryParam.paymentType) && ("paymentType" in queryParam)) {
            adviceQuery.paymentType = null;
        }
        if ((!queryParam.category) && ("category" in queryParam)) {
            adviceQuery.category = null;
        }
        var populate = [{
            path: 'payee', select: 'user',
            populate: {path: 'user', select: 'firstName middleName lastName'}
        }, {path: 'project'}];
        var sort = {urgent: -1};
        if (queryParam.sortCriteria) {
            sort.requestedDate = queryParam.sortCriteria.requestedDate;
        }

        AdviceModel.paginate(adviceQuery, { page: Number(page_number), limit: Number(page_size),populate:populate  }, function (err, advices) {
            if (err) {
                deferred.reject(err);
            }
            else if (advices.docs.length>0 && queryParam.state) {
                AdviceModel.aggregate([
                    {'$match':adviceQuery},
                    {
                        $group:
                        {
                            _id: null,
                            totalAmount: { $sum: "$requestedAmount"  },
                            count: { $sum: 1 }
                        }
                    }

                ],function(err,grandTotal){
                    if(err){
                        console.log("Error :",err);
                        deferred.reject(err);
                    }
                    else {
                        if(grandTotal.length>0){
                            advices.totalAmt=grandTotal[0].totalAmount;
                            deferred.resolve(advices);
                        }
                    }
                })
            }
            else{
                var responseObject={}
                responseObject.advices=advices;
                deferred.resolve(responseObject);
            }
        });
        return deferred.promise;
    },

    populateSearchDataByFilters : function(queryParam, currentUser) {
        var deferred = Q.defer();
        adviceUtil.fetchAdvicesByStatusCategory(queryParam, currentUser).then(function(advices){
            if(queryParam.groupByCriteria === 'graph') {
                console.log("Fetched advices. Preparing graph data");
                var data = null;
                if (queryParam.type === constants.YEAR){
                    console.log("Selected Graph type is: "+ queryParam.type);
                    data = searchAdviceUtils.populateDataForMultipleYears(advices);
                }
                else if (queryParam.type === constants.MONTH){
                    console.log("Selected Graph type is: "+ queryParam.type);
                    data = searchAdviceUtils.populateDataForYearMonths(advices, queryParam.selected);
                } else if(queryParam.type === constants.WEEKS){
                    console.log("Selected Graph type is: "+ queryParam.type);
                    var fromDate=new Date(queryParam.fromDate);
                    fromDate=fromDate.setDate(fromDate.getDate());
                    data = searchAdviceUtils.populateDataForMonthWeeks(advices, queryParam.selected, fromDate);
                } else if (queryParam.type === constants.WEEK){
                    console.log("Selected Graph type is: "+ queryParam.type);
                    data = searchAdviceUtils.populateDataForWeek(advices, queryParam.selected);
                } else if (queryParam.type === constants.DAY){
                    console.log("Selected Graph type is: "+ queryParam.type);
                    data = searchAdviceUtils.populateDataForDay(advices, queryParam.selected);
                }
                deferred.resolve(data);
            } else {
                deferred.resolve(advices);
            }
        }, function(err){
            deferred.reject(err);
        });
        return deferred.promise;
    },
    populateDataForMonthWeeks: function(advices, selectedMonth, date) {
        var selectedMonthFullName = searchAdviceUtils.getFullMonth(selectedMonth);
        var numberOfWeeksInMonth = searchAdviceUtils.getWeekCount(date);
        var graphData = {};
        if(advices.length > 0) {
            for (var weekNumber = 1; weekNumber <= numberOfWeeksInMonth; weekNumber++) {
                graphData[apiUtils.generateWeekKey(weekNumber, selectedMonthFullName)] = {
                    "week": apiUtils.generateWeekKey(weekNumber, selectedMonthFullName),
                    "total": 0, "adviceCount": 0, "totalAmount": "", "weekDate": ""
                };
            }
            advices.forEach(function (advice) {
                var adviceReqDate = new Date(advice.disburserDate);
                var weekNumber = searchAdviceUtils.getWeekNumber(advice);
                var monthFullName = searchAdviceUtils.getFullMonth(adviceReqDate.getMonth());
                var weekKey = apiUtils.generateWeekKey(weekNumber, monthFullName);

                if (weekKey !== undefined) {
                    //push advice to months
                    var weekData = graphData[weekKey];
                    weekData.total += Number(advice.requestedAmount);
                    weekData.adviceCount += 1;
                    weekData.totalAmount = apiUtils.convertINRToWord(weekData.total);
                    weekData.weekDate = adviceReqDate
                }
                graphData[weekKey] = weekData;
            });
        }
        return graphData;
    },
    populateDataForYearMonths: function(advices, selectedYear) {
        var graphData = {};
        if(advices.length > 0) {
            for (var monthNumber = 0; monthNumber < 12; monthNumber++) {
                graphData[apiUtils.generateMonthKey(searchAdviceUtils.getFullMonth(monthNumber), selectedYear)] = {
                    "month": apiUtils.generateMonthKey(searchAdviceUtils.getFullMonth(monthNumber), selectedYear),
                    "monthNumber": monthNumber,
                    "monthYear": selectedYear,
                    "total": 0,
                    "adviceCount": 0,
                    "totalAmount": ""
                };
            }
            advices.forEach(function (advice) {
                var adviceReqDate = new Date(advice.disburserDate);
                var monthKey = apiUtils.generateMonthKey(searchAdviceUtils.getFullMonth(adviceReqDate.getMonth()), adviceReqDate.getFullYear());
                if (monthKey !== undefined) {
                    //push advice to months
                    var monthData = {};
                    if (graphData[monthKey]) {
                        monthData = graphData[monthKey]
                    } else {
                        monthData = {
                            month: monthKey,
                            monthNumber: adviceReqDate.getMonth(),
                            monthYear: adviceReqDate.getFullYear(),
                            total: 0,
                            adviceCount: 0,
                            totalAmount: 0
                        }
                    }
                    monthData.total += Number(advice.requestedAmount);
                    monthData.adviceCount += 1;
                    monthData.totalAmount = apiUtils.convertINRToWord(monthData.total);
                }
                graphData[monthKey] = monthData;
            });
        }
        return graphData;
    },
    populateDataForMultipleYears: function(advices) {
        var graphData = {};
        advices.forEach(function(advice) {
            var adviceReqDate = new Date(advice.disburserDate);
            var yearKey = adviceReqDate.getFullYear();
            if (yearKey !== undefined) {
                //push advice to months
                var  yearData = {};
                if (graphData[yearKey]) {
                    yearData = graphData[yearKey]
                } else {
                    yearData = {
                        year:adviceReqDate.getFullYear(),
                        total:0,
                        adviceCount:0,
                        totalAmount:0
                    }
                }
                yearData.total +=Number(advice.requestedAmount);
                yearData.adviceCount+=1;
                yearData.totalAmount = apiUtils.convertINRToWord(yearData.total);
            }
            graphData[yearKey] = yearData;
        });

        return graphData;
    },
    populateDataForWeek: function(advices, selectedWeek) {
        var graphData = {};
        advices.forEach(function(advice) {
            var adviceReqDate = new Date(advice.disburserDate);
            var weekNumber = searchAdviceUtils.getWeekNumber(advice);
            var dayKey = dateFormat(adviceReqDate, "dd, mmm, yyyy");
            if (dayKey !== undefined) {
                //push advice to months
                var  dayData = {};
                if (graphData[dayKey]) {
                    dayData = graphData[dayKey]
                } else {
                    dayData = {
                        week:dayKey,
                        total:0,
                        adviceCount:0,
                        totalAmount:0,
                        dayDate: adviceReqDate
                    }
                }
                dayData.total +=Number(advice.requestedAmount);
                dayData.adviceCount+=1;
                dayData.totalAmount = apiUtils.convertINRToWord(dayData.total);

            }
            graphData[dayKey] = dayData;
        });
        return graphData;
    },
    populateDataForDay: function(advices, selectedDay) {
        var graphData = {};
        advices.forEach(function(advice) {
            var adviceReqDate = new Date(advice.disburserDate);
            var dateNumber = adviceReqDate.getDate();
            var adviceKey = advice.adviceNumber;
            var payeeName = (advice.payee.user.firstName+' '+advice.payee.user.middleName+' '+advice.payee.user.lastName)
            if (adviceKey !== undefined) {
                //push advice to months
                var  adviceData = {};
                if (graphData[adviceKey]) {
                    adviceData = graphData[adviceKey]
                } else {
                    adviceData = {
                        adviceNumber:adviceKey,
                        payeeName:payeeName,
                        total:0,
                        adviceCount:0,
                        totalAmount:0,
                        selectedDate:adviceReqDate,
                        adviceId:advice._id
                    }
                }
                adviceData.total +=Number(advice.requestedAmount);
                adviceData.adviceCount+=1;
                adviceData.totalAmount = apiUtils.convertINRToWord(adviceData.total);

            }
            graphData[adviceKey] = adviceData;
        });
        return graphData;
    },
    getFullMonth: function(monthVal) {
        var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return monthNames[monthVal]
    },
    getWeekCount: function (startDate) {
        var firstWeekday = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth(), 1).getDay();
        var last = 32 - new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth(), 32).getDate();
        return Math.ceil( (firstWeekday + last)/7 );
    },
    getWeekNumber: function(advice) {
        var adviceReqDate = advice.disburserDate;
        var firstDay = new Date(adviceReqDate.getFullYear(), adviceReqDate.getMonth(), 1).getDay();
        return Math.ceil((adviceReqDate.getDate() + firstDay)/7);
    },
    advicesSummarizedResult: function(searchQuery) {
        var deferred = Q.defer();
        adviceUtil.getAdviceByQuery(searchQuery).then(function(advices){
            var result = {
                totalAdvices: 0,
                total: 0,
                totalInWords: ""
            };
            if (advices.length==0) {
                deferred.reject(result);
            }
            else {
                var totalAmount = 0;
                advices.forEach(function(advice){
                    totalAmount+=Number(advice.requestedAmount);
                });
                result = {
                    totalAdvices: advices.length,
                    total: totalAmount,
                    totalInWords: apiUtils.convertINRToWord(totalAmount)
                };
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }
};


module.exports=searchAdviceUtils;
