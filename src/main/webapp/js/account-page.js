/* EveKit Account Page Module */
(function () {
    var eveKitAccount = angular.module('eveKitAccount', ['ngResource', 'ngSanitize', 'ngRoute', 'eveKitDialog', 'eveKitAccountWS', 'eveKitTrackerWS', 'eveKitServerServices', 'eveKitModeServices']);

    eveKitAccount.controller('AccountMainCtrl',
        ['$scope', 'ToolModeService',
            function ($scope, ToolModeService) {
                ToolModeService.refresh(MODE_EVEKIT);
                $scope.sectionName = "Account Sync : Intro";
            }]);

    eveKitAccount.controller('AccountViewCtrl',
        ['$scope', '$timeout', '$location', '$window', 'DialogService', 'AccountWSService', 'APIKeyInfo', 'ToolModeService', 'CharacterInfo', 'CredentialWSService',
            function ($scope, $timeout, $location, $window, DialogService, AccountWSService, APIKeyInfo, ToolModeService, CharacterInfo, CredentialWSService) {
                ToolModeService.refresh(MODE_EVEKIT);
                $scope.sectionName = "Account Sync : List";
                $scope.accountlist = [];
                $scope.loading = false;
                $scope.$location = $location;
                // Kick off account list load.
                $scope.reloadList = function () {
                    $scope.loading = true;
                    AccountWSService.getSyncAccount(-1, -1).then(function (accts) {
                        if (accts == null) throw "Error loading accounts";
                        $scope.$apply(function () {
                            $scope.loading = false;
                            $scope.accountlist = accts;
                        });
                        // Check expiry info for each account
                        var updater = function (el, i) {
                            return function () {
                                APIKeyInfo.get({keyID: el.eveKey, vCode: el.eveVCode},
                                    angular.noop,
                                    function (err) {
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
                    }).catch(function (err) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            $scope.accountlist = [];
                            DialogService.serverErrorMessage('loading sync account list: ' + err.errorMessage, 10);
                        });
                    });
                };
                // Send a synchronization request.
                $scope.sendSyncRequest = function (acct) {
                    var infoMsg = DialogService.simpleInfoMessage('Sending synchronization request...', 30);
                    AccountWSService.requestSync(acct.userAccount.uid, acct.aid)
                        .then(function (stat) {
                            $scope.$apply(function () {
                                DialogService.removeMessage(infoMsg);
                                DialogService.simpleInfoMessage('Account scheduled for synchronization.  If the account has not already been synchronized recently, then account sync history will show sync status shortly.', 40);
                            });
                        }).catch(function (err) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(infoMsg);
                            DialogService.serverErrorMessage('sending sync request: ' + err.errorMessage, 10);
                        });
                    });
                };
                // Delete a sync account.
                $scope.deleteAccount = function (acct) {
                    DialogService.yesNoDialog('warning', 'Really delete sync account?', false, function (answer) {
                        if (answer == 1) {
                            var info = DialogService.simpleInfoMessage('Marking account for removal...');
                            AccountWSService.deleteSyncAccount(acct.userAccount.uid, acct.aid).then(function (success) {
                                $scope.$apply(function () {
                                    DialogService.removeMessage(info);
                                    $scope.reloadList();
                                });
                            }).catch(function (err) {
                                $scope.$apply(function () {
                                    DialogService.removeMessage(info);
                                    DialogService.serverErrorMessage('marking sync account for removal: ' + err.errorMessage, 10);
                                });
                            });
                        }
                    })
                };
                // Restore an account marked for deletion.
                $scope.restoreAccount = function (acct) {
                    var info = DialogService.simpleInfoMessage('Marking account for restore...');
                    AccountWSService.restoreSyncAccount(acct.userAccount.uid, acct.aid).then(function (success) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            $scope.reloadList();
                        });
                    }).catch(function (err) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            DialogService.serverErrorMessage('restoring sync account: ' + err.errorMessage, 10);
                        });
                    });
                };
                // State for new account form
                $scope.newAccountName = '';
                $scope.newAccountType = '';
                $scope.newAccountAutoSync = false;
                // Start the new account dialog
                $scope.addAccountDialog = function () {
                    $scope.newAccountName = '';
                    $scope.newAccountType = '';
                    $scope.newAccountAutoSync = false;
                    $('#addAccount').modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                };
                // Verify add account form
                $scope.isNewAccountInvalid = function () {
                    // Form is invalid if:
                    // 1) account name is invalid; or
                    // 2) account name already in use; or
                    // 3) account type not selected
                    if (!validateAccountName($scope.newAccountName))
                        return true;
                    if ($scope.newAccountType !== 'CHARACTER' && $scope.newAccountType !== 'CORPORATION')
                        return true;
                    for (var i = 0; i < $scope.accountlist.length; i++) {
                        if ($scope.newAccountName === $scope.accountlist[i].name)
                            return true;
                    }
                    return false;
                };
                // Save new account
                $scope.addAccount = function() {
                    var info = DialogService.simpleInfoMessage('Adding account...');
                    AccountWSService.saveSyncAccount(-1, -1, $scope.newAccountName, $scope.newAccountType === 'CHARACTER', $scope.newAccountAutoSync).then(function (success) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            $scope.reloadList();
                        });
                    }).catch(function (err) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            DialogService.serverErrorMessage('saving new account: ' + err.errorMessage, 10);
                        });
                    });
                };
                // State for modify account form
                $scope.accountToModify = null;
                $scope.modifyAccountName = '';
                $scope.modifyAccountType = '';
                $scope.modifyAccountAutoSync = false;
                // Start the modify account dialog
                $scope.modifyAccountDialog = function (account) {
                    $scope.accountToModify = account;
                    $scope.modifyAccountName = account.name;
                    $scope.modifyAccountType = account.characterType ? 'CHARACTER' : 'CORPORATION';
                    $scope.modifyAccountAutoSync = account.autoSynchronized;
                    $('#modifyAccount').modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                };
                // Verify modify account form
                $scope.isModifiedAccountInvalid = function () {
                    // Form is invalid if:
                    // 1) account name is invalid; or
                    // 2) account name already in use; or
                    // 3) account type not selected
                    if (!validateAccountName($scope.modifyAccountName))
                        return true;
                    for (var i = 0; i < $scope.accountlist.length; i++) {
                        if ($scope.accountlist[i].aid === $scope.accountToModify.aid)
                            continue;
                        if ($scope.newAccountName === $scope.accountlist[i].name)
                            return true;
                    }
                    return false;
                };
                // Save modified account
                $scope.modifyAccount = function() {
                    var info = DialogService.simpleInfoMessage('Saving account changes...');
                    AccountWSService.saveSyncAccount(-1, $scope.accountToModify.aid, $scope.modifyAccountName, $scope.accountToModify.characterType, $scope.modifyAccountAutoSync).then(function (success) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            $scope.reloadList();
                        });
                    }).catch(function (err) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            DialogService.serverErrorMessage('saving account changes: ' + err.errorMessage, 10);
                        });
                    });
                };
                // State for new xml credential form
                $scope.newCredentialAccount = null;
                $scope.xmlFormType = 'Add';
                $scope.newKeyID = '';
                $scope.newVCode = '';
                $scope.accountChoices = [];
                $scope.accountSelection = -1;
                // Start the add XML credential dialog
                $scope.addXMLCredentialDialog = function (account) {
                    // Show an error if the account already has an XML credential.  The UI should normally
                    // prevent this dialog from being invoked in this case.
                    if (account.eveKey > 0) {
                        DialogService.simpleErrorMessage("Account already has an XML credential.  You may either edit the existing credential, or remove it and replace it with a new one.");
                        return;
                    }
                    $scope.xmlFormType = 'Add';
                    $scope.newCredentialAccount = account;
                    $scope.newKeyID = '';
                    $scope.newVCode = '';
                    $scope.accountChoices = [];
                    $scope.accountSelection = -1;
                    $('#addXMLCredential').modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                };
                // Start the modify XML credential dialog
                $scope.modifyXMLCredentialDialog = function (account) {
                    // Show an error if the account does not have an XML credential.  The UI should normally
                    // prevent this dialog from being invoked in this case.
                    if (account.eveKey <= 0) {
                        DialogService.simpleErrorMessage("Account does not have an XML credential.  You must first create an XML credential.");
                        return;
                    }
                    $scope.xmlFormType = 'Modify';
                    $scope.newCredentialAccount = account;
                    $scope.newKeyID = account.eveKey;
                    $scope.newVCode = account.eveVCode;
                    $scope.accountChoices = [];
                    $scope.accountSelection = -1;
                    CharacterInfo.list({keyID: $scope.newKeyID, vCode: $scope.newVCode}).$promise.then(function(lst) {
                        if (lst.length == 0) {
                            DialogService.serverErrorMessage('loading account selection from current credential.  Credential can not be modified at this time.', 10);
                            return;
                        }
                        $scope.accountChoices = lst;
                        for (var i = 0; i < lst.length; i++) {
                            if (lst[i].eveCharacterID == account.eveCharacterID && lst[i].eveCorporationID == account.eveCorporationID) {
                                $scope.accountSelection = i;
                                break;
                            }
                        }
                        if ($scope.accountSelection === -1) {
                            DialogService.simpleErrorMessage("Account character and corporation could not be found using the current credential.  Credential can not be modified at this time", 10);
                            return;
                        }
                        $('#addXMLCredential').modal({
                            backdrop: 'static',
                            keyboard: false
                        });
                    }).catch(function() {
                        $scope.accountChoices = [];
                        $scope.changeXMLSelection(-1);
                        DialogService.connectionErrorMessage('loading account selection from current credential.  Credential can not be modified at this time.', 10);
                        return;
                    });
                };
                // Highlight character to be selected
                $scope.changeXMLSelection = function (i) {
                    $scope.accountSelection = i;
                };
                // Reset XML selections
                $scope.resetXMLSelection = function() {
                    $scope.accountChoices = [];
                    $scope.accountSelection = -1;
                };
                // Change CSS class based on account selection
                $scope.getXMLSelectionClasses = function (i) {
                    var result = ['col-md-3'];
                    if ($scope.accountSelection === i)
                        result.push('selected-account');
                    return result;
                };
                // Fetch character choices.
                $scope.fetchXMLCharacters = function () {
                    $scope.changeXMLSelection(-1);
                    CharacterInfo.list({keyID: $scope.newKeyID, vCode: $scope.newVCode}).$promise.then(function(lst) {
                        $scope.accountChoices = lst;
                        $scope.changeXMLSelection(-1);
                        if (lst.length === 0)
                            DialogService.serverErrorMessage('loading character choices.  Please check key ID and VCode and try again', 10);
                    }).catch(function() {
                        $scope.accountChoices = [];
                        $scope.changeXMLSelection(-1);
                        DialogService.connectionErrorMessage('loading character choices.  Please check key ID and VCode and try again', 10);
                    });
                };
                // Verify new XML credential selection
                $scope.isXMLSelectionInvalid = function () {
                    // Form is invalid if:
                    // 1) key invalid; or,
                    // 2) vcode invalid; or,
                    // 3) no account selected.
                    if (!validateKeyID($scope.newKeyID))
                        return true;
                    if (!validateVCode($scope.newVCode))
                        return true;
                    if ($scope.accountSelection === -1)
                        return true;
                    return false;
                };
                // Add new XML credential
                $scope.addXMLCredential = function() {
                    var info = DialogService.simpleInfoMessage('Adding XML credential...');
                    CredentialWSService.setXMLCredential($scope.newCredentialAccount.aid, $scope.newKeyID, $scope.accountChoices[$scope.accountSelection].eveCharacterID, $scope.newVCode).then(function (success) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            $scope.reloadList();
                        });
                    }).catch(function (err) {
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            DialogService.serverErrorMessage('adding XML credential: ' + err.errorMessage, 10);
                            $scope.reloadList();
                        });
                    });
                };
                // Verify then remove an XML credential
                $scope.removeXMLCredentialDialog = function (account) {
                    // Show an error if the account doesn't have an XML credential.  The UI should normally
                    // prevent this dialog from being invoked in this case.
                    if (account.eveKey <= 0) {
                        DialogService.simpleErrorMessage("Account does not have an XML credential.");
                        return;
                    }
                    DialogService.yesNoDialog('warning', 'Are you sure you want to delete this credential?', false,
                        function (answer) {
                            if (answer == 1) {
                                // Remove credential
                                CredentialWSService.clearXMLCredential(account.aid).then(function () {
                                    $scope.reloadList();
                                }).catch(function (err) {
                                    DialogService.serverErrorMessage('removing XML credential: ' + err.errorMessage, 10);
                                    $scope.reloadList();
                                });
                            }
                        });
                };
                // State for new esi credential form
                $scope.esiFormType = 'Add';
                $scope.scopeList = [];
                $scope.currentScopeSelection = {};
                // Start the add ESI credential dialog
                $scope.addESICredentialDialog = function (account) {
                    // Show an error if the account already has an ESI credential.  The UI should normally
                    // prevent this dialog from being invoked in this case.
                    if (account.scopes !== null) {
                        DialogService.simpleErrorMessage("Account already has an ESI credential.  You may either edit the existing credential, or remove it and replace it with a new one.");
                        return;
                    }
                    $scope.esiFormType = 'Add';
                    $scope.newCredentialAccount = account;
                    $scope.scopeList = [];
                    $scope.currentScopeSelection = {};
                    // Prepare the scope list and launch the dialog
                    $scope.getScopeList(function(groups) {
                        $scope.$apply(function() {
                            // Set available scope list
                            $scope.scopeList = groups;
                            // Now launch the dialog
                            $('#addESICredential').modal({
                                backdrop: 'static',
                                keyboard: false
                            });
                        });
                    }, function(err) {
                        DialogService.serverErrorMessage('retrieving list of scopes: ' + err.errorMessage, 10);
                    });
                };
                // Retrieve endpoint scope list.
                // Result is passed to the callback function.
                $scope.getScopeList = function (success, error) {
                    if ($scope.newCredentialAccount.characterType) {
                        AccountWSService.getCharEndpoints().then(function (result) {
                            if (success) success(result);
                        }).catch(function (err) {
                            if (error) error(err);
                        })
                    } else {
                        AccountWSService.getCorpEndpoints().then(function (result) {
                            if (success) success(result);
                        }).catch(function (err) {
                            if (error) error(err);
                        })
                    }
                };
                // Reset scopes
                $scope.clearAllScopes = function () {
                    $scope.currentScopeSelection = {};
                };
                // Select all scopes
                $scope.selectAllScopes = function () {
                    for (var i = 0; i < $scope.scopeList.length; i++) {
                        $scope.currentScopeSelection[$scope.scopeList[i].name] = true;
                    }
                };
                // Verify new ESI credential selection
                $scope.isESISelectionInvalid = function () {
                    // Form is invalid if no scopes are selected.
                    return $.isEmptyObject($scope.currentScopeSelection);
                };
                // Add new ESI credential
                $scope.addESICredential = function() {
                    var info = DialogService.simpleInfoMessage('Adding ESI credential...');
                    var scopeRequest = [];
                    for (var i = 0; i < $scope.scopeList.length; i++) {
                        var name = $scope.scopeList[i].name;
                        if ($scope.currentScopeSelection[name]) {
                            scopeRequest.push($scope.scopeList[i].scope);
                        }
                    }
                    CredentialWSService.setESICredential($scope.newCredentialAccount.aid, scopeRequest.join(' ')).then(function (result) {
                        // Result is a redirect to complete
                        $scope.$apply(function() {
                            DialogService.removeMessage(info);
                            $window.location.href = result['newLocation'];
                        });
                    }).catch(function (err) {
                        // Fail, show error message
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            DialogService.connectionErrorMessage('adding ESI credential: ' + err.errorMessage, 20);
                            $scope.reloadList();
                        });
                    });
                };
                // Verify then remove an ESI credential
                $scope.removeESICredentialDialog = function (account) {
                    // Show an error if the account doesn't have an ESI credential.  The UI should normally
                    // prevent this dialog from being invoked in this case.
                    if (account.scopes === null) {
                        DialogService.simpleErrorMessage("Account does not have an ESI credential.");
                        return;
                    }
                    DialogService.yesNoDialog('warning', 'Are you sure you want to delete this credential?', false,
                        function (answer) {
                            if (answer == 1) {
                                // Remove credential
                                CredentialWSService.clearESICredential(account.aid).then(function () {
                                    $scope.reloadList();
                                }).catch(function (err) {
                                    DialogService.serverErrorMessage('removing ESI credential: ' + err.errorMessage, 10);
                                    $scope.reloadList();
                                });
                            }
                        });
                };
                // View ESI scopes dialog
                $scope.viewESIScopesDialog = function (account) {
                    // Ignore if account has no scopes.  The UI should normally prevent this dialog from being
                    // invoked in this case.
                    if (account.scopes === null) return;
                    $scope.newCredentialAccount = account;
                    // Retrieve scopes, prepare scope list, and launch the dialog
                    $scope.scopeList = [];
                    $scope.getScopeList(function(groups) {
                        $scope.$apply(function() {
                            // Prepare scope and descriptions from retrieved list
                            var splitScopes = account.scopes.split(' ');
                            for (var i = 0; i < splitScopes.length; i++) {
                                var scopeName = splitScopes[i];
                                for (var j = 0; j < groups.length; j++) {
                                    if (scopeName === groups[j].scope) {
                                        $scope.scopeList.push(groups[j]);
                                        break;
                                    }
                                }
                            }
                            // Now launch the dialog
                            $('#viewESIScopes').modal({
                                backdrop: 'static',
                                keyboard: false
                            });
                        });
                    }, function(err) {
                        DialogService.serverErrorMessage('retrieving list of scopes: ' + err.errorMessage, 10);
                    });
                };
                // Reauthorize ESI credentials dialog
                $scope.reauthESICredentialDialog = function (account) {
                    // Ignore if account has no scopes.  The UI should normally prevent this dialog from being
                    // invoked in this case.
                    if (account.scopes === null) return;
                    // This flow is identical to setting a new ESI credential except that we pull the scopes to
                    // authorize from the existing credential.
                    var info = DialogService.simpleInfoMessage('Re-authorizing ESI credential...');
                    CredentialWSService.setESICredential(account.aid, account.scopes).then(function (result) {
                        // Result is a redirect to complete
                        $scope.$apply(function() {
                            DialogService.removeMessage(info);
                            $window.location.href = result['newLocation'];
                        });
                    }).catch(function (err) {
                        // Fail, show error message
                        $scope.$apply(function () {
                            DialogService.removeMessage(info);
                            DialogService.connectionErrorMessage('re-authorizing ESI credential: ' + err.errorMessage, 20);
                            $scope.reloadList();
                        });
                    });
                };
                // Start the modify ESI credential dialog
                $scope.modifyESICredentialDialog = function (account) {
                    // Ignore if this account has no ESI credential.  The UI should normally prevent this
                    // dialog from being invoked in this case.
                    if (account.scopes === null) return;
                    $scope.esiFormType = 'Edit';
                    $scope.newCredentialAccount = account;
                    $scope.scopeList = [];
                    $scope.currentScopeSelection = {};
                    // This flow is similar to adding an ESI credential except that we pre-populate the form
                    // with the existing scopes assigned to the credential.
                    $scope.getScopeList(function(groups) {
                        $scope.$apply(function() {
                            // Set available scope list
                            $scope.scopeList = groups;
                            // Pre-select based on existing scopes
                            var selectedScopes = account.scopes.split(' ');
                            for (var i = 0; i < selectedScopes.length; i++) {
                                for (var j = 0; j < groups.length; j++) {
                                    if (selectedScopes[i] === groups[j].scope) {
                                        $scope.currentScopeSelection[groups[j].name] = true;
                                        break;
                                    }
                                }
                            }
                            // Now launch the dialog
                            $('#addESICredential').modal({
                                backdrop: 'static',
                                keyboard: false
                            });
                        });
                    }, function(err) {
                        DialogService.serverErrorMessage('retrieving list of scopes: ' + err.errorMessage, 10);
                    });
                };
                // Auto-reload account list every five minutes.
                var refreshDisplay = function () {
                    $scope.reloadList();
                    $timeout(refreshDisplay, 1000 * 60 * 5);
                };
                refreshDisplay();
            }]);

    // Validation functions.
    var isAlphaNumeric = function (str) {
        return !/[^a-zA-Z0-9]/.test(str);
    };

    var isNumeric = function (str) {
        return !/[^0-9]/.test(str);
    };

    var validateAccountName = function (name) {
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

    var validateKeyID = function (name) {
        if (!name || name.length == 0)
            return false;
        for (var i = 0; i < name.length; i++) {
            if (isNumeric(name[i]))
                continue;
            return false;
        }
        return true;
    };

    var validateVCode = function (name) {
        if (!name || name.length == 0)
            return false;
        for (var i = 0; i < name.length; i++) {
            if (isAlphaNumeric(name[i]))
                continue;
            return false;
        }
        return true;
    };

    var abstractValidator = function (name, popover, validator) {
        return function () {
            return {
                require: '?ngModel',
                restrict: 'A',
                link: function (scope, elm, attrs, ngModel) {
                    if (!ngModel) return;
                    ngModel.$parsers.unshift(function (viewValue) {
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
    eveKitAccount.directive('validatekeyid', [abstractValidator('validatekeyid', 'xml-add-keyid', validateKeyID)]);
    eveKitAccount.directive('validatevcode', [abstractValidator('validatevcode', 'xml-add-vcode', validateVCode)]);

    eveKitAccount.controller('AccountHistoryCtrl',
        ['$scope', '$timeout', '$routeParams', '$location', 'DialogService', 'AccountWSService', 'TrackerWSService', 'ToolModeService',
            function ($scope, $timeout, $routeParams, $location, DialogService, AccountWSService, TrackerWSService, ToolModeService) {
                ToolModeService.refresh(MODE_EVEKIT);
                $scope.sectionName = "Account Sync : History";
                $scope.$location = $location;
                $scope.accountID = angular.isDefined($routeParams.acctid) ? parseInt($routeParams.acctid) : -1;
                $scope.isChar = angular.isDefined($routeParams.ischar) ? ($routeParams.ischar == 'true') : false;
                $scope.accountName = angular.isDefined($routeParams.name) ? $routeParams.name : '';
                if ($scope.accountID == -1) {
                    // This should never happen.  Send us back to the view page.
                    DialogService.ackDialog('warning', 'Account ID is missing.  If this problem persists, please contact the site admin.', 10, function () {
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
                $scope.refreshHistory = function (opt_cb) {
                    $scope.loading = true;
                    var continuation = $scope.syncHistory.length == 0 ? -1 : $scope.syncHistory[$scope.syncHistory.length - 1].syncStart;
                    var resource = $scope.isChar ? TrackerWSService.getCapHistory : TrackerWSService.getCorpHistory;
                    resource($scope.accountID, continuation, maxresults).then(function (result) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            var toadd = [];
                            angular.forEach(result, function (el) {
                                var found = false;
                                for (var i = 0; i < $scope.syncHistory.length && !found; i++) {
                                    if ($scope.syncHistory[i].tid == el.tid) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) toadd.push(el);
                            });
                            $scope.syncHistory = $scope.syncHistory.concat(toadd);
                            $scope.syncHistory.sort(function (a, b) {
                                return b.syncStart - a.syncStart;
                            });
                            if (angular.isDefined(opt_cb)) opt_cb();
                        });
                    }).catch(function (err) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            DialogService.connectionErrorMessage('loading account history: ' + err.errorMessage + '.  Please reload to try again', 20);
                            if (angular.isDefined(opt_cb)) opt_cb();
                        });
                    });
                };
                // Load more history when we scroll to the bottom of the current view.
                $scope.capHandleScroll = function () {
                    if ($('#capHistoryScroll').scrollTop() > ($('#capHistoryScrollTable').height() - $('#capHistoryScroll').height()) / 2) {
                        $('#capHistoryScroll').unbind('scroll');
                        $scope.capLoadMoreHistory();
                    }
                };
                $scope.corpHandleScroll = function () {
                    if ($('#corpHistoryScroll').scrollTop() > ($('#corpHistoryScrollTable').height() - $('#corpHistoryScroll').height()) / 2) {
                        $('#corpHistoryScroll').unbind('scroll');
                        $scope.corpLoadMoreHistory();
                    }
                };
                // Fix viewport size so scrolling works correctly.
                var capFixHeight = function () {
                    $('#capHistoryScroll').height($('#bottom-nav').offset().top - $('#capHistoryScroll').offset().top - 60);
                };
                var corpFixHeight = function () {
                    $('#corpHistoryScroll').height($('#bottom-nav').offset().top - $('#corpHistoryScroll').offset().top - 60);
                };
                // Load history when scroll reaches the end
                $scope.capLoadMoreHistory = function () {
                    $scope.refreshHistory(function () {
                        capFixHeight();
                        $('#capHistoryScroll').scroll($scope.capHandleScroll);
                    });
                };
                $scope.corpLoadMoreHistory = function () {
                    $scope.refreshHistory(function () {
                        corpFixHeight();
                        $('#corpHistoryScroll').scroll($scope.corpHandleScroll);
                    });
                };
                // Init
                if ($scope.isChar) {
                    $('#capHistoryScroll').scroll($scope.capHandleScroll);
                    $(window).resize(capFixHeight);
                    $scope.capLoadMoreHistory();
                } else {
                    $('#corpHistoryScroll').scroll($scope.corpHandleScroll);
                    $(window).resize(corpFixHeight);
                    $scope.corpLoadMoreHistory();
                }
            }]);



})();
