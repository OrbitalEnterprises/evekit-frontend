/* EveKit Account Page Module */
(function(){
  var eveKitAccount = angular.module('eveKitAccount', ['ngResource', 'ngSanitize', 'ngRoute', 'eveKitDialog', 'eveKitAccountWS', 'eveKitTrackerWS', 'eveKitServerServices', 'eveKitModeServices']);

  eveKitAccount.controller('AccountMainCtrl',
      ['$scope', 'ToolModeService',
       function($scope, ToolModeService) {
        ToolModeService.refresh(MODE_EVEKIT);
        $scope.sectionName = "Account Sync : Intro";
      }]);

  eveKitAccount.controller('AccountViewCtrl',
      ['$scope', '$timeout', '$location', 'DialogService', 'AccountWSService', 'APIKeyInfo', 'ToolModeService',
       function($scope, $timeout, $location, DialogService, AccountWSService, APIKeyInfo, ToolModeService) {
        ToolModeService.refresh(MODE_EVEKIT);
        $scope.sectionName = "Account Sync : List";
        $scope.accountlist = [];
        $scope.loading = false;
        $scope.$location = $location;
        // Kick off account list load.
        $scope.reloadList = function() {
          $scope.loading = true;
          AccountWSService.getSyncAccount(-1, -1).then(function(accts) {
            if (accts == null) throw "Error loading accounts";
            $scope.$apply(function() {
              $scope.loading = false;
              $scope.accountlist = accts;
            });
            // Check expiry info for each account
            var updater = function(el, i) {
              return function() {
                APIKeyInfo.get({keyID: el.eveKey, vCode: el.eveVCode},
                    angular.noop,
                    function(err) {
                      // Expired keys will report: 403 (Forbidden)
                      // <eveapi version="2">
                      //   <currentTime>2016-03-12 04:35:55</currentTime>
                      //   <error code="222">
                      //     Key has expired. Contact key owner for access renewal.
                      //   </error>
                      //   <cachedUntil>2016-03-13 04:35:55</cachedUntil>
                      // </eveapi>
                      if (angular.isDefined(err.data) && angular.isDefined(err.data.code) && (err.data.code == 222 || err.data.code == 220)) {
                        // Key expired or doesn't fullfill corporation requirements anymore
                        var newval = $.extend(true, {}, el);
                        newval['expired'] = true;
                        // Splice here is necessary to trigger angular update
                        $scope.accountlist.splice(i, 1, newval);
                      }
                    });
              };
            }
            for (var i = 0; i < accts.length; i++) {
              (updater(accts[i], i))();
            }
          }).catch(function(err) {
            $scope.$apply(function() {
              $scope.loading = false;
              $scope.accountlist = [];
              DialogService.serverErrorMessage('loading sync account list: ' + err.errorMessage, 10);
            });
          });
        };
        // Send a synchronization request.
        $scope.sendSyncRequest = function(acct) {
          var infoMsg = DialogService.simpleInfoMessage('Sending synchronization request...', 30);
          AccountWSService.requestSync(acct.userAccount.uid, acct.aid)
          .then(function(stat) {
            $scope.$apply(function() {
              DialogService.removeMessage(infoMsg);
              DialogService.simpleInfoMessage('Account scheduled for synchronization.  If the account has not already been synchronized recently, then account sync history will show sync status shortly.', 40);
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(infoMsg);
              DialogService.serverErrorMessage('sending sync request: ' + err.errorMessage, 10);
            });
          });
        };
        // Delete a sync account.
        $scope.deleteAccount = function(acct) {
          DialogService.yesNoDialog('warning', 'Really delete sync account?', false, function(answer) {
            if (answer == 1) {
              var info = DialogService.simpleInfoMessage('Marking account for removal...');
              AccountWSService.deleteSyncAccount(acct.userAccount.uid, acct.aid).then(function(success) {
                $scope.$apply(function() {
                  DialogService.removeMessage(info);
                  $scope.reloadList();
                });
              }).catch(function(err) {
                $scope.$apply(function() {
                  DialogService.removeMessage(info);
                  DialogService.serverErrorMessage('marking sync account for removal: ' + err.errorMessage, 10);
                });
              });
            }
          })
        };
        // Restore an account marked for deletion.
        $scope.restoreAccount = function(acct) {
          var info = DialogService.simpleInfoMessage('Marking account for restore...');
          AccountWSService.restoreSyncAccount(acct.userAccount.uid, acct.aid).then(function(success){
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              $scope.reloadList();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              DialogService.removeMessage(info);
              DialogService.serverErrorMessage('restoring sync account: ' + err.errorMessage, 10);
            });
          });
        };
        // Auto-reload account list every five minutes.
        var refreshDisplay = function() {
          $scope.reloadList();
          $timeout(refreshDisplay, 1000 * 60 * 5);
        };
        refreshDisplay();
      }]);

  // Validation functions.
  var isAlphaNumeric = function(str) {
    return !/[^a-zA-Z0-9]/.test(str);
  };

  var isNumeric = function(str) {
    return !/[^0-9]/.test(str);
  };

  var validateAccountName = function(name) {
    if (!name || name.length == 0)
      return false;
    for (var i = 0; i < name.length; i++) {
      if (isAlphaNumeric(name[i]))
        continue;
      if (name[i] === '_')
        continue;
      return false;
    }
    return true;
  };

  var validateKeyID = function(name) {
    if (!name || name.length == 0)
      return false;
    for (var i = 0; i < name.length; i++) {
      if (isNumeric(name[i]))
        continue;
      return false;
    }
    return true;
  };

  var validateVCode = function(name) {
    if (!name || name.length == 0)
      return false;
    for (var i = 0; i < name.length; i++) {
      if (isAlphaNumeric(name[i]))
        continue;
      return false;
    }
    return true;
  };

  var abstractValidator = function(name, popover, validator) {
    return function() {
      return {
        require: '?ngModel',
        restrict: 'A',
        link: function(scope, elm, attrs, ngModel) {
          if (!ngModel) return;
          ngModel.$parsers.unshift(function(viewValue) {
            var isValid = validator(viewValue);
            var status = isValid ? 'hide' : 'show';
            $('#' + popover).popover(status);
            ngModel.$setValidity(name, isValid);
            return viewValue;
          });
        }
      };
    }
  };

  // Validators
  eveKitAccount.directive('validateaccountname', [abstractValidator('validateaccountname', 'account-mod-name', validateAccountName)]);
  eveKitAccount.directive('validatekeyid', [abstractValidator('validatekeyid', 'account-mod-keyid', validateKeyID)]);
  eveKitAccount.directive('validatevcode', [abstractValidator('validatevcode', 'account-mod-vcode', validateVCode)]);

  eveKitAccount.controller('AccountModCtrl',
      ['$scope', '$timeout', '$routeParams', '$location', 'DialogService', 'AccountWSService', 'CharacterInfo', 'ToolModeService',
       function($scope, $timeout, $routeParams, $location, DialogService, AccountWSService, CharacterInfo, ToolModeService) {
        ToolModeService.refresh(MODE_EVEKIT);
        $scope.accountID = angular.isDefined($routeParams.acctid) ? parseInt($routeParams.acctid) : -1;
        $scope.isModify = $scope.accountID >= 0;
        $scope.sectionName = "Account Sync : " + ($scope.isModify ? "Modify" : "Create");
        $scope.loading = false;
        $scope.accountChoices = [];
        $scope.original = {
            accountSelection: -1,
            modAccountName: '',
            modType: 'CHARACTER',
            modAutoSync: false,
            modKeyID: '',
            modVCode: ''
        };
        $scope.accountSelection = -1;
        $scope.modAccountName = '';
        $scope.modType = 'CHARACTER';
        $scope.modAutoSync = false;
        $scope.modKeyID = '';
        $scope.modVCode = '';
        $scope.existingAccount = [];
        // Reset state.
        $scope.reset = function() {
          $scope.accountID = -1;
          $scope.isModify = false;
          $scope.accountChoices = [];
          $scope.modAccountName = '';
          $scope.modType = 'CHARACTER';
          $scope.modAutoSync = false;
          $scope.modKeyID = '';
          $scope.modVCode = '';
          $scope.existingAccount = [];
          $scope.changeSelection(-1);
        };
        $scope.dirty = false;
        // Set dirty based on changes.
        $scope.checkDirty = function() {
          $scope.dirty = ($scope.original.accountSelection != $scope.accountSelection) ||
          ($scope.original.modAccountName != $scope.modAccountName) ||
          ($scope.original.modType != $scope.modType) ||
          ($scope.original.modAutoSync != $scope.modAutoSync) ||
          ($scope.original.modKeyID != $scope.modKeyID) ||
          ($scope.original.modVCode != $scope.modVCode);
          $scope.dirty = $scope.dirty && validateAccountName($scope.modAccountName)
          && validateKeyID($scope.modKeyID) && validateVCode($scope.modVCode);
          $scope.dirty = $scope.dirty && $scope.accountSelection != -1;
        }
        // Change selected account.
        $scope.changeSelection = function(i) {
          $scope.accountSelection = i;
          if (i == -1) {
            $('#account-selector').popover('show');
          } else {
            $('#account-selector').popover('hide');
          }
        };
        // Get classes for account selection.
        $scope.getSelectionClasses = function(i) {
          var result = ['col-md-3'];
          if ($scope.accountSelection == i)
            result.push('selected-account');
          return result;
        };
        // Fetch character choices.
        $scope.fetchCharacters = function() {
          $scope.loading = true;
          $scope.changeSelection(-1);
          $scope.accountChoices = CharacterInfo.list({keyID: $scope.modKeyID, vCode: $scope.modVCode},
              function() {
            $scope.loading = false;
            if ($scope.accountChoices.length == 0) {
              DialogService.serverErrorMessage('loading character choices.  Please check key ID and VCode and try again', 10);
              $scope.changeSelection(-1);
            } else {
              if ($scope.existingAccount.length > 0) {
                for(var i = 0; i < $scope.accountChoices.length; i++) {
                  var next = $scope.accountChoices[i];
                  if (next.eveCharacterID == $scope.existingAccount[0].eveCharacterID &&
                      next.eveCorporationID == $scope.existingAccount[0].eveCorporationID) {
                    $scope.original.accountSelection = i;
                    $scope.changeSelection(i);
                    break;
                  }
                }
              } else {
                $scope.changeSelection(-1);
              }
            }
          }, function() {
            $scope.loading = false;
            $scope.accountChoices = [];
            $scope.changeSelection(-1);
            DialogService.connectionErrorMessage('loading character choices', 10);
          });
        };
        // Fetch existing account info.
        $scope.loadExisting = function() {
          $scope.loading = true;
          AccountWSService.getSyncAccount(-1, $scope.accountID).then(function(result) {
            $scope.$apply(function() {
              $scope.loading = false;
              $scope.existingAccount = result;
              $scope.original.modAccountName = $scope.modAccountName = $scope.existingAccount[0].name;
              $scope.original.modType = $scope.modType = $scope.existingAccount[0].characterType ? 'CHARACTER' : 'CORPORATION';
              $scope.original.modAutoSync = $scope.modAutoSync = $scope.existingAccount[0].autoSynchronized;
              $scope.original.modKeyID = $scope.modKeyID = $scope.existingAccount[0].eveKey;
              $scope.original.modVCode = $scope.modVCode = $scope.existingAccount[0].eveVCode;
              $scope.updatePopovers();
              $scope.fetchCharacters();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              $scope.loading = false;
              DialogService.serverErrorMessage('loading existing sync account: ' + err.errorMessage + '  Please reload this page to try again', 10);
              $scope.reset();
            });
          });
        };
        // Set all popovers.
        $scope.updatePopovers = function() {
          if (!validateAccountName($scope.modAccountName)) {
            $('#account-mod-name').popover('show');
          } else {
            $('#account-mod-name').popover('hide');
          }
          if (!validateKeyID($scope.modKeyID)) {
            $('#account-mod-keyid').popover('show');
          } else {
            $('#account-mod-keyid').popover('hide');
          }
          if (!validateVCode($scope.modVCode)) {
            $('#account-mod-vcode').popover('show');
          } else {
            $('#account-mod-vcode').popover('hide');
          }
        };
        // Save new or modified account.
        $scope.save = function() {
          var saveMessage = DialogService.createMessage('info', 'Saving changes...', [], 30);
          if ($scope.isModify) {
            AccountWSService.saveSyncAccount(-1, {
              aid: $scope.accountID,
              name: $scope.modAccountName,
              autoSynchronized: $scope.modAutoSync,
              eveKey: $scope.modKeyID,
              eveVCode: $scope.modVCode,
              eveCharacterID: $scope.accountChoices[$scope.accountSelection].eveCharacterID,
              eveCharacterName: $scope.accountChoices[$scope.accountSelection].eveCharacterName,
              eveCorporationID: $scope.accountChoices[$scope.accountSelection].eveCorporationID,
              eveCorporationName: $scope.accountChoices[$scope.accountSelection].eveCorporationName
            }).then(function() {
              $scope.$apply(function() {
                DialogService.removeMessage(saveMessage);
                $location.url('/account/view');
              });
            }).catch(function(err) {
              $scope.$apply(function() {
                DialogService.removeMessage(saveMessage);
                DialogService.serverErrorMessage('modifying sync account: ' + err.errorMessage, 10);
              });
            });
          } else {
            AccountWSService.saveSyncAccount(-1, {
              aid: -1,
              name: $scope.modAccountName,
              characterType: $scope.modType == 'CHARACTER',
              autoSynchronized: $scope.modAutoSync,
              eveKey: $scope.modKeyID,
              eveVCode: $scope.modVCode,
              eveCharacterID: $scope.accountChoices[$scope.accountSelection].eveCharacterID,
              eveCharacterName: $scope.accountChoices[$scope.accountSelection].eveCharacterName,
              eveCorporationID: $scope.accountChoices[$scope.accountSelection].eveCorporationID,
              eveCorporationName: $scope.accountChoices[$scope.accountSelection].eveCorporationName
            }).then(function() {
              $scope.$apply(function() {
                DialogService.removeMessage(saveMessage);
                $location.url('/account/view');
              });
            }).catch(function(err) {
              $scope.$apply(function() {
                DialogService.removeMessage(saveMessage);
                DialogService.serverErrorMessage('saving new sync account: ' + err.errorMessage, 10);
              });
            });
          }
        };
        // Cancel changes but verify if we're dirty.
        $scope.cancel = function() {
          if ($scope.dirty) {
            DialogService.yesNoDialog('warning', 'You have unsaved changes.  Are you sure you want to cancel?', false,
                function (answer) {
              if (answer == 1) $location.url('/account/view');
            });
          } else {
            $location.url('/account/view');
          }
        };
        // Cleanup pop-overs if we change the view.
        $scope.$on('$routeChangeStart', function() {
          $('#account-mod-name').popover('hide');
          $('#account-mod-keyid').popover('hide');
          $('#account-mod-vcode').popover('hide');
          $('#account-selector').popover('hide');
        });
        // Init
        $scope.$watch('accountSelection', $scope.checkDirty);
        $scope.$watch('modAccountName', $scope.checkDirty);
        $scope.$watch('modType', $scope.checkDirty);
        $scope.$watch('modAutoSync', $scope.checkDirty);
        $scope.$watch('modKeyID', $scope.checkDirty);
        $scope.$watch('modVCode', $scope.checkDirty);
        $scope.updatePopovers();
        $scope.changeSelection(-1);
        if ($scope.isModify) $scope.loadExisting();
      }]);

  eveKitAccount.controller('AccountHistoryCtrl',
      ['$scope', '$timeout', '$routeParams', '$location', 'DialogService', 'AccountWSService', 'TrackerWSService', 'ToolModeService',
       function($scope, $timeout, $routeParams, $location, DialogService, AccountWSService, TrackerWSService, ToolModeService) {
        ToolModeService.refresh(MODE_EVEKIT);
        $scope.sectionName = "Account Sync : History";
        $scope.$location = $location;
        $scope.accountID = angular.isDefined($routeParams.acctid) ? parseInt($routeParams.acctid) : -1;
        $scope.isChar = angular.isDefined($routeParams.ischar) ? ($routeParams.ischar == 'true') : false;
        $scope.accountName = angular.isDefined($routeParams.name) ? $routeParams.name : '';
        if ($scope.accountID == -1) {
          // This should never happen.  Send us back to the view page.
          DialogService.ackDialog('warning', 'Account ID is missing.  If this problem persists, please contact the site admin.', 10, function() {
            $location.url('/account/view');
          });
          return;
        }
        $scope.syncHistory = [];
        $scope.historyType = $scope.isChar ? CapsuleerSyncTrackerStatusFieldList : CorporationSyncTrackerStatusFieldList;
        $scope.statusPointerArray = $scope.isChar ? CapsuleerSyncTrackerStatusFieldList : CorporationSyncTrackerStatusFieldList;
        $scope.detailPointerArray = $scope.isChar ? CapsuleerSyncTrackerDetailFieldList : CorporationSyncTrackerDetailFieldList;
        $scope.determineHistoryClass = function (historyEntry, index) {
          var status = historyEntry[$scope.statusPointerArray[index]];
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
        $scope.determineHistoryTitle = function (historyEntry, index) {
          var status = historyEntry[$scope.statusPointerArray[index]];
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
              return historyEntry[$scope.detailPointerArray[index]];
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
        $scope.getStartTime = function (el) {
          return el['syncStart'];
        };
        // Get history element end time.
        $scope.getEndTime = function (el) {
          return el['syncEnd'];
        };
        // Load next history batch.
        var maxresults = 100;
        $scope.refreshHistory = function(opt_cb) {
          $scope.loading = true;
          var continuation = $scope.syncHistory.length == 0 ? -1 : $scope.syncHistory[$scope.syncHistory.length - 1].syncStart;
          var resource = $scope.isChar ? TrackerWSService.getCapHistory : TrackerWSService.getCorpHistory;
          resource($scope.accountID, continuation, maxresults).then(function(result) {
            $scope.$apply(function() {
              $scope.loading = false;
              var toadd = [];
              angular.forEach(result, function(el) {
                var found = false;
                for(var i = 0; i < $scope.syncHistory.length && !found; i++) {
                  if ($scope.syncHistory[i].tid == el.tid) {
                    found = true;
                    break;
                  }
                }
                if (!found) toadd.push(el);
              });
              $scope.syncHistory = $scope.syncHistory.concat(toadd);
              $scope.syncHistory.sort(function(a, b) {
                return b.syncStart - a.syncStart;
              });
              if (angular.isDefined(opt_cb)) opt_cb();
            });
          }).catch(function(err) {
            $scope.$apply(function() {
              $scope.loading = false;
              DialogService.connectionErrorMessage('loading account history: ' + err.errorMessage + '.  Please reload to try again', 20);
              if (angular.isDefined(opt_cb)) opt_cb();
            });
          });
        };
        // Load more history when we scroll to the bottom of the current view.
        $scope.handleScroll = function() {
          if ($('#historyScroll').scrollTop() > ($('#historyScrollTable').height() - $('#historyScroll').height()) / 2) {
            $('#historyScroll').unbind('scroll');
            $scope.loadMoreHistory();
          }
        };
        $scope.loadMoreHistory = function () {
          $scope.refreshHistory(function() {
            fixHeight();
            $('#historyScroll').scroll($scope.handleScroll);
          });
        };
        // Fix viewport size so scrolling works correctly.
        var fixHeight = function() {
          $('#historyScroll').height($('#bottom-nav').offset().top - $('#historyScroll').offset().top - 60);
        };
        // Init
        $('#historyScroll').scroll($scope.handleScroll);
        $(window).resize(fixHeight);
        $scope.loadMoreHistory();
      }]);


    eveKitAccount.controller('AccountTokenCtrl',
        ['$scope', '$location', '$window', '$filter', 'DialogService', 'AccountWSService', 'TokenWSService',
            function($scope, $location, $window, $filter, DialogService, AccountWSService, TokenWSService) {
                $scope.sectionName = "ESI Token List";
                $scope.loading = false;
                $scope.tokenList = [];
                // State for create connection dialog
                $scope.currentScope = [];
                $scope.currentScopeSelection = {};
                // Reload token list.
                $scope.reloadList = function() {
                    $scope.loading = true;
                    AccountWSService.getUser().then(function(uval) {
                        if (uval == null || !uval.admin) {
                            $scope.$apply(function() {
                                // Not logged in, redirect
                                $location.path('/main');
                            });
                            return;
                        }
                        // Valid user, look for token list
                        TokenWSService.getTokenList().then(function(result) {
                            $scope.$apply(function() {
                                $scope.loading = false;
                                $scope.tokenList = result;
                                // Compute displayable scope list.
                                for (var i=0; i < $scope.tokenList.length; i++) {
                                    var scope_title = "Authorized Scopes:\n";
                                    var scopes = $scope.tokenList[i].scopes.split(' ');
                                    for (var j=0; j < scopes.length; j++) {
                                        scope_title += scopes[j] + '\n';
                                    }
                                    // Remove the trailing newline.
                                    if (scope_title.length > 0) {
                                        scope_title = scope_title.substring(0, scope_title.length - 1);
                                    }
                                    $scope.tokenList[i].displayScopes = scope_title;
                                }
                            });
                        }).catch(function(err) {
                            $scope.$apply(function() {
                                $scope.loading = false;
                                DialogService.connectionErrorMessage('loading token list: ' + err.errorMessage, 20);
                            });
                        });
                    }).catch(function(err) {
                        $scope.$apply(function() {
                            // Assume not logged in and redirect
                            $location.path('/main');
                        });
                    });
                };
                // Delete a token
                $scope.deleteToken = function(key) {
                    DialogService.yesNoDialog('warning', 'Really delete token?', false, function(answer) {
                        if (answer == 1) {
                            var info = DialogService.simpleInfoMessage('Deleting token...');
                            TokenWSService.deleteToken(key).then(function(result) {
                                $scope.$apply(function() {
                                    DialogService.removeMessage(info);
                                    $scope.reloadList();
                                });
                            }).catch(function(err) {
                                $scope.$apply(function() {
                                    DialogService.removeMessage(info);
                                    DialogService.connectionErrorMessage('removing token: ' + err.errorMessage, 20);
                                });
                            });
                        }
                    })
                };
                // Reauthorize a token
                $scope.reauthToken = function(key) {
                    DialogService.yesNoDialog('warning', 'Really re-authorize token?', false, function(answer) {
                        if (answer == 1) {
                            var info = DialogService.simpleInfoMessage('Re-authorizing token...');
                            TokenWSService.reauthToken(key).then(function(result) {
                                // On success, result is a redirect we need to manually insert.
                                // This is basically the same flow as creating a new connection.
                                $window.location.href = result['newLocation']
                            }).catch(function(err) {
                                $scope.$apply(function() {
                                    DialogService.removeMessage(info);
                                    DialogService.connectionErrorMessage('re-authorizing token: ' + err.errorMessage, 20);
                                });
                            });
                        }
                    })
                };
                // Retrieve available scopes
                $scope.getScopeList = function(cb) {
                    TokenWSService.getESIScopes().then(function(result) {
                        $scope.$apply(function() {
                            // Result is a map: scopeName -> scopeDefinition
                            // Transform to a list of objects before returning
                            scopeList = [];
                            for (var sc in result) {
                                if (result.hasOwnProperty(sc)) scopeList.push({value: sc, description: result[sc]});
                            }
                            $scope.currentScope = scopeList;
                            if (cb) cb();
                        });
                    }).catch(function(err) {
                        $scope.$apply(function() {
                            $('#createToken').modal('hide');
                            DialogService.connectionErrorMessage('retrieving scope list: ' + err.errorMessage, 20);
                        });
                    })
                };
                // Update scope list as needed
                $scope.updateDialogScope = function() {
                    var info = DialogService.simpleInfoMessage("Retrieving scope list...", 10);
                    if ($scope.currentScope.length > 0) {
                        // Already cached
                        DialogService.removeMessage(info);
                    } else {
                        // Retrieve latest from server
                        $scope.getScopeList(function() {
                            DialogService.removeMessage(info);
                        });
                    }
                };
                // Reset scopes
                $scope.clearAllScopes = function() {
                    $scope.currentScopeSelection = {};
                };
                // Select all scopes
                $scope.selectAllScopes = function() {
                    for (var i = 0; i < $scope.currentScope.length; i++) {
                        $scope.currentScopeSelection[$scope.currentScope[i].value] = true;
                    }
                };
                // Sanity check invalid form
                $scope.isFormInvalid = function() {
                    // The new token form is invalid only if no scopes have been selected
                    for (var key in $scope.currentScopeSelection) {
                        if ($scope.currentScopeSelection.hasOwnProperty())
                            return false;
                    }
                    return true;
                }
                // Create new token
                $scope.createToken = function() {
                    var scopeList = [];
                    for (var sc in $scope.currentScopeSelection) {
                        if ($scope.currentScopeSelection.hasOwnProperty(sc)) scopeList.push(sc);
                    }
                    TokenWSService.createToken(scopeList.join(' ')).then(function(result) {
                        // Result is a redirect to complete
                        $window.location.href = result['newLocation'];
                    }).catch(function(err) {
                        // Fail, show error message
                        $scope.$apply(function() {
                            DialogService.connectionErrorMessage('creating new token: ' + err.errorMessage, 20);
                        });
                    });
                };
                // Popup to create new connection
                $scope.create = function() {
                    $scope.currentScopeSelection = {};
                    $scope.updateDialogScope();
                    $('#createToken').modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                };
                // Init
                $scope.reloadList();
            }]);

})();
