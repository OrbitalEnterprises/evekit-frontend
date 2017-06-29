/* Account Services */
(function() {
var accountWS = angular.module('eveKitAccountWS', ['eveKitRemoteServices']);

/**
 * Service for sharing authentication state among all controllers.
 */
accountWS.factory('AccountWSService', ['SwaggerService',
  function(SwaggerService) {
    return {
      'getSyncAccount' : function(uid, aid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.getSyncAccount({uid: uid, aid: aid}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'saveSyncAccount' : function(uid, account) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.saveSyncAccount({uid: uid, aid: account.aid, account: account}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'deleteSyncAccount' : function(uid, aid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.deleteSyncAccount({uid: uid, aid: aid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'restoreSyncAccount' : function(uid, aid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.restoreSyncAccount({uid: uid, aid: aid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'requestSync' : function(uid, aid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.requestSync({uid: uid, aid: aid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'getAccessKey' : function(uid, aid, kid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.getAccessKey({uid: uid, aid: aid, kid: kid}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'saveAccessKey' : function(uid, aid, key) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.saveAccessKey({uid: uid, aid: aid, kid: key.kid, key: key}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'deleteAccessKey' : function(uid, aid, kid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.deleteAccessKey({uid: uid, aid: aid, kid: kid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'getUser' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.getUser({}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getUserLastSource' : function(uid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.getUserLastSource({uid: uid || -1}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getUserSources' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.getUserSources({uid: -1}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'listUsers' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.listUsers({}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'toggleAutoSync' : function(uid, aid, autosync) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.toggleAutoSync({uid: uid, aid: aid, autosync: autosync}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'toggleActive' : function(uid, active) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.toggleActive({uid: uid, active: active}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'checkAdmin' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.checkAdmin({}, {})
          .then(function(result) {
            return result.obj.isAdmin;
          }).catch(handleRemoteResponse);
        });
      },
      'becomeUser' : function(uid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Authentication.becomeUser({uid: uid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      }
    };
 }]);

    /**
     * Service for managing EVE SSO tokens.
     */
    accountWS.factory('TokenWSService', ['SwaggerService',
        function(SwaggerService) {
            return {
                'getTokenList' : function() {
                    return SwaggerService.getSwagger()
                        .then(function (swg) {
                            return swg.Token.getTokenList({}, {})
                                .then(function(result) {
                                    return result.obj;
                                }).catch(handleRemoteResponse);
                        });
                },
                'deleteToken' : function(kid) {
                    return SwaggerService.getSwagger()
                        .then(function (swg) {
                            return swg.Token.deleteToken({kid: kid}, {})
                                .then(function(result) {
                                    return true;
                                }).catch(handleRemoteResponse);
                        });
                },
                'reauthToken' : function(kid) {
                    return SwaggerService.getSwagger()
                        .then(function (swg) {
                            return swg.Token.reauthToken({kid: kid}, {})
                                .then(function(result) {
                                    return result.obj;
                                }).catch(handleRemoteResponse);
                        });
                },
                'getESIScopes' : function() {
                    return SwaggerService.getSwagger()
                        .then(function (swg) {
                            return swg.Token.getESIScopes({}, {})
                                .then(function(result) {
                                    return result.obj;
                                }).catch(handleRemoteResponse);
                        });
                },
                'createToken' : function(scope) {
                    return SwaggerService.getSwagger()
                        .then(function (swg) {
                            return swg.Token.createToken({scope: scope}, {})
                                .then(function(result) {
                                    return result.obj;
                                }).catch(handleRemoteResponse);
                        });
                }
            };
        }]);

/**
 * Service to collect and periodically update user credentials.  Changes in credentials are broadcast as an event.
 */
accountWS.factory('UserCredentialsService', ['$rootScope', '$timeout', 'AccountWSService',
  function($rootScope, $timeout, AccountWSService) {
    var userInfo = null;
    var userSource = null;
    var update = function(user, source) {
      $rootScope.$apply(function() {
        if (user) $rootScope.$broadcast('UserInfoChange', userInfo);
        if (source) $rootScope.$broadcast('UserSourceChange', userSource);
      });
    };
    var updateUserCredentials = function() {
      AccountWSService.getUser().then(function (val) {
        if (val != null) {
          userInfo = val;
          update(true, false);
        }
      }).catch(function() {
        // Reset user on any error
        userInfo = null;
        update(true, false);
      });
      AccountWSService.getUserLastSource().then(function (val) {
        if (val != null) {
          userSource = val;
          update(false, true);
        }
      }).catch(function() {
        // Reset source on any error
        userSource = null;
        update(false, true);
      });
      $timeout(updateUserCredentials, 1000 * 60 * 3);
    };
    updateUserCredentials();
    return {
      'getUser' : function() { return userInfo; },
      'getUserSource' : function() { return userSource; }
    };
  }]);

})();
