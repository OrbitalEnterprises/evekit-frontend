/* EveKit Admin Page Module */
(function(){
  var eveKitAdmin = angular.module('eveKitAdmin', ['ngResource', 'ngSanitize', 'ngRoute', 'eveKitDialog', 'eveKitAccountWS', 'eveKitAdminWS', 'eveKitTrackerWS']);

  eveKitAdmin.controller('AdminSyspropEditCtrl',
      ['$scope', 'DialogService', 'AdminWSService',
       function($scope, DialogService, AdminWSService) {
        $scope.sectionName = "Admin : System Property Editor";
        $scope.prop_list = [];
        $scope.newprop = {
            name : '',
            value : ''
        };

        // Refresh property list
        $scope.refreshProperties = function() {
          var info = DialogService.simpleInfoMessage('Refreshing property list...');
          AdminWSService.getSysProps().then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.prop_list = result;
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('refreshing property list: ' + err.errorMessage, 10);
            });
          });
        };

        // Save a new property and refresh the property list.
        $scope.saveNewProperty = function() {
          var info = DialogService.simpleInfoMessage('Saving new property...');
          AdminWSService.setSysProp($scope.newprop.name, $scope.newprop.value)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.newprop.name = '';
              $scope.newprop.value = '';
              $scope.refreshProperties();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('saving new property: ' + err.errorMessage, 10);
            });
          });
        };

        // Save property change.
        $scope.savePropChange = function(prop) {
          var info = DialogService.simpleInfoMessage('Saving property change...');
          AdminWSService.setSysProp(prop.propertyName, prop.propertyValue)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.refreshProperties();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('saving new property: ' + err.errorMessage, 10);
            });
          });
        };

        // Remove a property.
        $scope.deleteProperty = function(prop) {
          var info = DialogService.simpleInfoMessage('Removing property...');
          AdminWSService.deleteSysProp(prop.propertyName)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.refreshProperties();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('removing property: ' + err.errorMessage, 10);
            });
          });
        };

        // Initialize
        $scope.refreshProperties();
      }]);

  eveKitAdmin.controller('AdminUserpropEditCtrl',
      ['$scope', 'DialogService', 'AdminWSService', 'AccountWSService',
       function($scope, DialogService, AdminWSService, AccountWSService) {
        $scope.sectionName = "Admin : User Account Property Editor";
        $scope.uid_list = [];
        $scope.prop_list = [];
        $scope.newprop = {
            name : '',
            value : ''
        };
        $scope.uid = null;

        // Refresh uid list
        $scope.refreshUids = function() {
          $scope.uid = null;
          $scope.prop_list = [];
          var info = DialogService.simpleInfoMessage('Refreshing uid list...');
          AccountWSService.listUsers()
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.uid_list = result;
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('refreshing uid list: ' + err.errorMessage, 10);
            });
          });
        };

        // Change uid
        $scope.selectUid = function(new_uid) {
          $scope.uid = new_uid;
          $scope.prop_list = [];
          $scope.refreshProperties();
        };

        // Refresh property list
        $scope.refreshProperties = function() {
          var info = DialogService.simpleInfoMessage('Refreshing property list...');
          AdminWSService.getUserProps($scope.uid.uid)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.prop_list = result;
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('refreshing property list: ' + err.errorMessage, 10);
            });
          });
        };

        // Save a new property and refresh the property list.
        $scope.saveNewProperty = function() {
          // Only honor if a uid has been selected.
          if ($scope.uid == null) return;
          var info = DialogService.simpleInfoMessage('Saving new property...');
          AdminWSService.setUserProp($scope.uid.uid, $scope.newprop.name, $scope.newprop.value)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.newprop.name = '';
              $scope.newprop.value = '';
              $scope.refreshProperties();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('saving new property: ' + err.errorMessage, 10);
            });
          });
        };

        // Save property change.
        $scope.savePropChange = function(prop) {
          var info = DialogService.simpleInfoMessage('Saving property change...');
          AdminWSService.setUserProp($scope.uid.uid, prop.propertyName, prop.propertyValue)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.refreshProperties();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('saving new property: ' + err.errorMessage, 10);
            });
          });
        };

        // Remove a property.
        $scope.deleteProperty = function(prop) {
          var info = DialogService.simpleInfoMessage('Removing property...');
          AdminWSService.deleteUserProp($scope.uid.uid, prop.propertyName)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.refreshProperties();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('removing property: ' + err.errorMessage, 10);
            });
          });
        };

        // Initialize
        $scope.refreshUids();
      }]);

  eveKitAdmin.controller('AdminInflightCtrl',
      ['$scope', 'DialogService', 'TrackerWSService',
       function($scope, DialogService, TrackerWSService) {
        $scope.sectionName = "Admin : Inflight Syncs";
        $scope.charSyncHistory = [];
        $scope.corpSyncHistory = [];
        $scope.charStatusFunctions = CapsuleerSyncTrackerStatusFieldList;
        $scope.corpStatusFunctions = CorporationSyncTrackerStatusFieldList;

        // Refresh char sync list
        var refreshCharSyncList = function() {
          var info = DialogService.simpleInfoMessage('Refreshing Capsuleer Syncs...');
          TrackerWSService.getUnfinishedCapSync()
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.charSyncHistory = result;
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('refreshing capsuleer syncs: ' + err.errorMessage, 10);
            });
          });
        };

        // Refresh corp sync list
        var refreshCorpSyncList = function() {
          var info = DialogService.simpleInfoMessage('Refreshing Corporation Syncs...');
          TrackerWSService.getUnfinishedCorpSync()
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.corpSyncHistory = result;
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('refreshing corporation syncs: ' + err.errorMessage, 10);
            });
          });
        };

        // Refresh both sync lists
        $scope.refreshSyncLists = function() {
          refreshCharSyncList();
          refreshCorpSyncList();
        };

        // Display sync details
        $scope.displayDetail = function(uid, accountID, trackerID) {
          DialogService.ackDialog('info', 'uid=' + uid + '<br>aid=' + accountID + '<br>tid=' + trackerID, -1, angular.noop);
        };

        // Finish synchronization
        $scope.finishSync = function(uid, accountID, trackerID) {
          var info = DialogService.simpleInfoMessage('Finishing sync...');
          TrackerWSService.finishTracker(uid, accountID, trackerID)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.refreshSyncLists();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('finishing sync: ' + err.errorMessage, 10);
            });
          });
        };

        // Decode history class
        $scope.determineHistoryClass = function (isChar, historyEntry, index) {
          var statusPointerArray = isChar ? CapsuleerSyncTrackerStatusFieldList : CorporationSyncTrackerStatusFieldList;
          var status = historyEntry[statusPointerArray[index]];
          switch (status) {
            case 'UPDATED':
              return 'sync-history-ok';
              break;

            case 'NOT_EXPIRED':
              return 'sync-history-ok';
              break;

            case 'SYNC_ERROR':
              return 'sync-history-fail';
              break;

            case 'SYNC_WARNING':
              return 'sync-history-warn';
              break;

            case 'NOT_PROCESSED':
              return 'sync-history-nop';
              break;

            case 'NOT_ALLOWED':
              return 'sync-history-na';
              break;

            default:
              console.log('Received unexpected status "' + status + '" in sync history');
            break;
          }
        };

        // Decode history title
        $scope.determineHistoryTitle = function (isChar, historyEntry, index) {
          var statusPointerArray = isChar ? CapsuleerSyncTrackerStatusFieldList : CorporationSyncTrackerStatusFieldList;
          var detailPointerArray = isChar ? CapsuleerSyncTrackerDetailFieldList : CorporationSyncTrackerDetailFieldList;
          var status = historyEntry[statusPointerArray[index]];
          switch (status) {
            case 'UPDATED':
              return 'Updated';
              break;

            case 'NOT_EXPIRED':
              return 'Not Expired';
              break;

            case 'SYNC_ERROR':
            case 'SYNC_WARNING':
            case 'NOT_ALLOWED':
              return historyEntry[detailPointerArray[index]];
              break;

            case 'NOT_PROCESSED':
              return 'Not Processed';
              break;

            default:
              console.log('Received unexpected status "' + status + '" in sync history');
            break;
          }
        };
        // Get history element start time.
        $scope.getStartTime = function (isChar, el) {
          return el['syncStart'];
        };
        // Get history element end time.
        $scope.getEndTime = function (isChar, el) {
          return el['syncEnd'];
        };

        // Initialize
        $scope.refreshSyncLists();
      }]);

  eveKitAdmin.controller('AdminUsersCtrl',
      ['$scope', 'DialogService', 'AccountWSService',
       function($scope, DialogService, AccountWSService) {
        $scope.sectionName = "Admin : User List";
        $scope.user_list = [];
        $scope.user_account_list = {};

        // Extract last sign on time for ordering
        $scope.getLastSignOnTime = function(u) {
          return u.last;
        };

        // Refresh user list
        $scope.refresh = function() {
          $scope.user_list = [];
          $scope.user_account_list = {};
          var info = DialogService.simpleInfoMessage('Refreshing user list...');
          var getSources = function(user_list) {
            // Retrieve last source for each user
            var cb = function(tgt, success) {
              return function(source) {
                $scope.$apply(function() {
                  tgt.screenName = success ? source.screenName : 'ERROR!';
                  tgt.source = success ? source.source : 'ERROR!';
                  $scope.user_list.push(tgt);
                });
              };
            };
            for(var i = 0; i < user_list.length; i++) {
              var pass = cb(user_list[i], true);
              var fail = cb(user_list[i], false);
              AccountWSService.getUserLastSource(user_list[i].uid)
              .then(pass)
              .catch(fail);
            }
          };
          AccountWSService.listUsers()
          .then(function(result) {
            DialogService.removeMessage(info);
            getSources(result);
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('refreshing user list: ' + err.errorMessage, 10);
            });
          });
        };

        // Disable/Enable user
        $scope.toggleEnabled = function(user_info) {
          var info = DialogService.simpleInfoMessage('Toggling user state...');
          AccountWSService.toggleActive(user_info.uid, user_info.active ? false : true)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.refresh();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('toggling user state: ' + err.errorMessage, 10);
            });
          });
        };

        // Show/Hide user acounts
        $scope.toggleAccountView = function(uid) {
          var def = angular.isDefined($scope.user_account_list[uid]);
          delete $scope.user_account_list[uid];
          if (def) {
            return;
          }
          var info = DialogService.simpleInfoMessage('Retrieving sync accounts...');
          AccountWSService.getSyncAccount(uid, -1)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.user_account_list[uid] = result;
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('retrieving sync accounts: ' + err.errorMessage, 10);
            });
          });
        };

        // Disable/Enable user
        $scope.toggleAutoSync = function(uid, acctid, state) {
          var info = DialogService.simpleInfoMessage('Toggling auto sync...');
          AccountWSService.toggleAutoSync(uid, acctid, state)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              delete $scope.user_account_list[uid];
              $scope.toggleAccountView(uid);
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('toggling auto sync: ' + err.errorMessage, 10);
            });
          });
        };

        // Become user
        $scope.becomeUser = function(uid) {
          var info = DialogService.simpleInfoMessage('Becoming selected user...');
          AccountWSService.becomeUser(uid)
          .then(function(result) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              // Reload page to refresh login cookies
              location.reload(true);
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.connectionErrorMessage('becoming user: ' + err.errorMessage, 10);
            });
          });
        };

        // Initialize
        $scope.refresh();
      }]);

})();
