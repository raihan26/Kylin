/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use strict';

KylinApp
    .controller('JobCtrl', function ($scope, $q, $routeParams, $interval, $modal, ProjectService, MessageService, JobService,SweetAlert,loadingRequest,UserService,jobConfig,JobList) {

        $scope.jobList = JobList;
        $scope.jobConfig = jobConfig;
        $scope.cubeName = null;
        $scope.projects = [];
        $scope.action = {};

        $scope.status = [];
        $scope.toggleSelection = function toggleSelection(current) {
            var idx = $scope.status.indexOf(current);
            if (idx > -1) {
              $scope.status.splice(idx, 1);
            }else {
              $scope.status.push(current);
            }
        };



        // projectName from page ctrl
        $scope.state = {loading: false, refreshing: false, filterAttr: 'last_modified', filterReverse: true, reverseColumn: 'last_modified', projectName:$scope.projectModel.selectedProject};

        ProjectService.list({}, function (projects) {
            angular.forEach(projects, function(project, index){
                $scope.projects.push(project.name);
            });
        });

        $scope.list = function (offset, limit) {
            if(!$scope.projectModel.projects.length){
                return [];
            }
            offset = (!!offset) ? offset : 0;
            var selectedJob = null;
            if (angular.isDefined($scope.state.selectedJob)) {
                selectedJob = $scope.state.selectedJob;
            }

            var defer = $q.defer();
            var statusIds = [];
            angular.forEach($scope.status, function (statusObj, index) {
                statusIds.push(statusObj.value);
            });

            var jobRequest = {
                cubeName: $scope.cubeName,
                projectName: $scope.state.projectName,
                status: statusIds,
                offset: offset,
                limit: limit
            };
            $scope.state.loading = true;

            var defer = $q.defer();
            return JobList.list(jobRequest).then(function(resp){
                $scope.state.loading = false;
                defer.resolve(resp);
                defer.promise;
            });
        }

        $scope.reload = function () {
            // trigger reload action in pagination directive
            $scope.action.reload = !$scope.action.reload;
        };


        $scope.$watch('projectModel.selectedProject', function (newValue, oldValue) {
            if(newValue!=oldValue||newValue==null){
                JobList.removeAll();
                $scope.state.projectName = newValue;
                $scope.reload();
            }

        });
        $scope.resume = function (job) {
            SweetAlert.swal({
                title: '',
                text: 'Are you sure to resume the job?',
                type: '',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: "Yes",
                closeOnConfirm: true
            }, function() {
                loadingRequest.show();
                JobService.resume({jobId: job.uuid}, {}, function (job) {
                    loadingRequest.hide();
                    JobList.jobs[job.uuid] = job;
                    if (angular.isDefined($scope.state.selectedJob)) {
                        $scope.state.selectedJob = JobList.jobs[ $scope.state.selectedJob.uuid];
                    }
                    SweetAlert.swal('Success!', 'Job has been resumed successfully!', 'success');
                },function(e){
                    loadingRequest.hide();
                    if(e.data&& e.data.exception){
                        var message =e.data.exception;
                        var msg = !!(message) ? message : 'Failed to take action.';
                        SweetAlert.swal('Oops...', msg, 'error');
                    }else{
                        SweetAlert.swal('Oops...', "Failed to take action.", 'error');
                    }
                });
            });
        }


        $scope.cancel = function (job) {
            SweetAlert.swal({
                title: '',
                text: 'Are you sure to discard the job?',
                type: '',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: "Yes",
                closeOnConfirm: true
            }, function() {
                loadingRequest.show();
                JobService.cancel({jobId: job.uuid}, {}, function (job) {
                    loadingRequest.hide();
                    $scope.safeApply(function() {
                        JobList.jobs[job.uuid] = job;
                        if (angular.isDefined($scope.state.selectedJob)) {
                            $scope.state.selectedJob = JobList.jobs[ $scope.state.selectedJob.uuid];
                        }

                    });
                    SweetAlert.swal('Success!', 'Job has been discarded successfully!', 'success');
                },function(e){
                    loadingRequest.hide();
                    if(e.data&& e.data.exception){
                        var message =e.data.exception;
                        var msg = !!(message) ? message : 'Failed to take action.';
                        SweetAlert.swal('Oops...', msg, 'error');
                    }else{
                        SweetAlert.swal('Oops...', "Failed to take action.", 'error');
                    }
                });
            });
        }

        $scope.openModal = function () {
            if (angular.isDefined($scope.state.selectedStep)) {
                if ($scope.state.stepAttrToShow == "output") {
                    $scope.state.selectedStep.loadingOp = true;
                    internalOpenModal();
                    var stepId = $scope.state.selectedStep.sequence_id;
                    JobService.stepOutput({jobId: $scope.state.selectedJob.uuid, propValue: $scope.state.selectedStep.id}, function (result) {
                        if (angular.isDefined(JobList.jobs[result['jobId']])) {
                            var tjob = JobList.jobs[result['jobId']];
                            tjob.steps[stepId].cmd_output = result['cmd_output'];
                            tjob.steps[stepId].loadingOp = false;
                        }
                    });
                } else {
                    internalOpenModal();
                }
            }
        }

        function internalOpenModal() {
            $modal.open({
                templateUrl: 'jobStepDetail.html',
                controller: jobStepDetail,
                resolve: {
                    step: function () {
                        return $scope.state.selectedStep;
                    },
                    attr: function () {
                        return $scope.state.stepAttrToShow;
                    }
                }
            });
        }
    }
);

var jobStepDetail = function ($scope, $modalInstance, step, attr) {
    $scope.step = step;
    $scope.stepAttrToShow = attr;
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }
};
