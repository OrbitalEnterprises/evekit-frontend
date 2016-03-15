/* EveKit Module */
(function(){
var eveKit = angular.module('eveKit', [
  'ngRoute', 'ngResource', 'eveKitDialog', 'eveKitRemoteServices', 'eveKitAccountWS', 'eveKitMain', 'eveKitAccount', 'eveKitAccess', 'eveKitAdmin', 'eveKitAPI']);

// Capture any authorization errors before we process the rest of the window location
var searchParams = window.location.search;
var auth_error = null;
if (searchParams && searchParams.length > 1) {
  var vals = searchParams.substr(1).split('&');
  for (var i = 0; i < vals.length; i++) {
    var next = vals[i].split('=');
    if (next[0] == 'auth_error') {
      auth_error = decodeURIComponent(next[1].replace(/\+/g,' '));
      break;
    }
  }
}

/**
 * Service for retrieving build and version info.
 */
eveKit.factory('ReleaseService', ['SwaggerService',
  function(SwaggerService) {
    return {
      'buildDate' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Release.buildDate({}, {})
          .then(function(result) {
            return result.status == 200 ? result.obj['buildDate'] : "";
          })
          .catch(function(error) {
            console.log(error);
            return "";
          });
        });
      },
      'version' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Release.version({}, {})
          .then(function(result) {
            return result.status == 200 ? result.obj['version'] : "";
          })
          .catch(function(error) {
            console.log(error);
            return "";
          });
        });
      }
    };
 }]);

eveKit.config(['$routeProvider',
  function($routeProvider) {
    // Set up routes
    $routeProvider.
      when('/main/news', {
        templateUrl: 'partials/main-news.html',
        controller: 'MainNewsCtrl'
      }).
      when('/main/account', {
        templateUrl: 'partials/main-userinfo.html',
        controller: 'MainAccountCtrl'
      }).
      when('/account/view', {
        templateUrl: 'partials/account-view.html',
        controller: 'AccountViewCtrl'
      }).
      when('/account/mod/:acctid', {
        templateUrl: 'partials/account-mod.html',
        controller: 'AccountModCtrl'
      }).
      when('/account/history/:acctid/:ischar/:name', {
        templateUrl: 'partials/account-history.html',
        controller: 'AccountHistoryCtrl'
      }).
      when('/access/mod/:acctid/:keyid/:ischar/:name/:char/:corp/:charid/:corpid', {
        templateUrl: 'partials/access-mod.html',
        controller: 'AccessModCtrl'
      }).
      when('/access/view/:acctid/:ischar/:name/:char/:corp/:charid/:corpid', {
        templateUrl: 'partials/access-view.html',
        controller: 'AccessViewCtrl'
      }).
      when('/api/model', {
        templateUrl: 'partials/api-model.html',
        controller: 'APIModelCtrl'
      }).
//      when('/api/faq/:section?', {
//        templateUrl: 'partials/api-faq.html',
//        controller: 'APIFAQCtrl'
//      }).
//      when('/api/sde', {
//        templateUrl: 'partials/api-sde.html',
//        controller: 'APISDECtrl'
//      }).
//      when('/api/ref', {
//        templateUrl: 'partials/api-ref.html',
//        controller: 'APIRefCtrl'
//      }).
//      when('/api/datasource', {
//        templateUrl: 'partials/api-datasource.html',
//        controller: 'APIDataSourceCtrl'
//      }).
      when('/admin/syspropedit', {
        templateUrl: 'partials/admin-sysprop.html',
        controller: 'AdminSyspropEditCtrl'
      }).
      when('/admin/userpropedit', {
        templateUrl: 'partials/admin-userprop.html',
        controller: 'AdminUserpropEditCtrl'
      }).
      when('/admin/inflight', {
        templateUrl: 'partials/admin-inflight.html',
        controller: 'AdminInflightCtrl'
      }).
      when('/admin/users', {
        templateUrl: 'partials/admin-users.html',
        controller: 'AdminUsersCtrl'
      }).
      otherwise({
        redirectTo: '/main/news'
      });
  }]);

/* Add scrolling directive to handle hash scrolling. */
/* nicked from here: http://stackoverflow.com/questions/14712223/how-to-handle-anchor-hash-linking-in-angularjs */
eveKit.directive('scrollTo', function ($location, $anchorScroll) {
  return function(scope, element, attrs) {

    element.bind('click', function(event) {
        event.stopPropagation();
        var off = scope.$on('$locationChangeStart', function(ev) {
            off();
            ev.preventDefault();
        });
        var location = attrs.scrollTo;
        $location.hash(location);
        $anchorScroll();
    });
}});

/* Inband controller for setting the version for the page */
eveKit.controller('EveKitVersionCtrl', ['$scope', 'ReleaseService',
  function($scope, ReleaseService) {
    ReleaseService.buildDate().then(function (val) {
      $scope.$apply(function() {
        $scope.eveKitBuildDate = val;
      });
    });
    ReleaseService.version().then(function (val) {
      $scope.$apply(function() {
        $scope.eveKitVersion = val;
      });
    });
}]);

/* Inband controller for setting authentication status and other container menu settings. */
eveKit.controller('EveKitAuthCtrl', ['$scope', '$route', '$timeout', 'UserCredentialsService', 'AccountWSService', 'DialogService',
  function($scope, $route, $timeout, UserCredentialsService, AccountWSService, DialogService) {
    $scope.$route = $route;
    $scope.menufilter = function(value, index) {
      return angular.isDefined(value.filter) ? value.filter() : true;
    };
    // Define menus
    $scope.evekitmenus = [
                          { menuID: 1,
                            title: 'Main Page',
                            display: 'Main',
                            urlPrefix: '/main/',
                            menulist: [ {
                              title: 'News',
                              display: 'News',
                              link: '#/main/news'
                            }, {
                              title: 'User Info',
                              display: 'Your User Info',
                              link: '#/main/account',
                              filter: function() { return $scope.userSource != null; }
                            }, {
                              title: 'Guides',
                              display: 'Guides, Videos and Tutorials (external)',
                              link: 'http://blog.orbital.enterprises/p/evekit-guides-videos-and-tutorials.html',
                              pop: true
                            }, {
                              title: 'General FAQ',
                              display: 'General FAQ (external)',
                              link: 'https://groups.google.com/d/msg/orbital-enterprises/ZOfz0QFXniI/l-U6VszBAAAJ',
                              pop: true
                            }, {
                              title: 'Help & Feedback',
                              display: 'Help & Feedback (external)',
                              link: 'https://groups.google.com/forum/#!forum/orbital-enterprises',
                              pop: true
                            }]
                          },
                          { menuID: 2,
                            title: 'Sync Accounts Page',
                            display: 'Sync Accounts',
                            urlPrefix: '/account/',
                            filter: function() { return $scope.userSource != null; },
                            menulist: [ {
                              title: 'Account List',
                              display: 'Account List',
                              link: '#/account/view'
                            }, {
                              title: 'Create Sync Account',
                              display: 'Create Sync Account',
                              link: '#/account/mod/-1'
                            }, {
                              title: 'Sync Account FAQ',
                              display: 'Sync Account FAQ (external)',
                              link: 'https://groups.google.com/d/msg/orbital-enterprises/SZ_0uG117Ws/P95KQORAAQAJ',
                              pop: true
                            }]
                          },
                          { menuID: 3,
                            title: 'Data Access Keys',
                            display: 'Data Access Keys',
                            urlPrefix: '/access/',
                            filter: function() { return $scope.userSource != null; },
                            menulist: [ {
                              title: 'Access Key FAQ',
                              display: 'Access Key FAQ (external)',
                              link: 'https://groups.google.com/forum/#!topic/orbital-enterprises/3TNV-MvSLkE',
                              pop: true
                            }]
                          },
                          { menuID: 4,
                            title: 'API',
                            display: 'API',
                            urlPrefix: '/api/',
                            menulist: [ {
                              title: 'Model API',
                              display: 'Model API',
                              link: '#/api/model'
                            },
//                            {
//                              title: 'Static Data Export API',
//                              display: 'Static Data Export API',
//                              link: '#/api/sde'
//                            },
//                            {
//                              title: 'Reference Data API',
//                              display: 'Reference Data API',
//                              link: '#/api/ref'
//                            },
//                            {
//                              title: 'Data Source API',
//                              display: 'Data Source API',
//                              link: '#/api/datasource'
//                            },
                            {
                              title: 'API FAQ',
                              display: 'API FAQ (external)',
                              link: 'https://groups.google.com/forum/#!topic/orbital-enterprises/5sogZQ_C8xM'
                            }]
                          },
                          { menuID: 5,
                            title: 'Admin',
                            display: 'Admin',
                            urlPrefix: '/admin/',
                            filter: function() { return $scope.userInfo != null && $scope.userInfo.admin; },
                            menulist: [ {
                              title: 'Sysprop Editor',
                              display: 'Sysprop Editor',
                              link: '#/admin/syspropedit'
                            }, {
                              title: 'Userprop Editor',
                              display: 'Userprop Editor',
                              link: '#/admin/userpropedit'
                            }, {
                              title: 'Inflight Syncs',
                              display: 'Inflight Syncs',
                              link: '#/admin/inflight'
                            }, {
                              title: 'User List',
                              display: 'User List',
                              link: '#/admin/users'
                            }]
                          }
                          ];
    // Set up user credential management
    $scope.userInfo = UserCredentialsService.getUser();
    $scope.userSource = UserCredentialsService.getUserSource();
    $scope.$on('UserInfoChange', function(event, ui) { $scope.userInfo = ui; });
    $scope.$on('UserSourceChange', function(event, us) { $scope.userSource = us; });
    // Set up access key list management
    $scope.updateAccessKeys = function() {
      AccountWSService.getSyncAccount(-1, -1).then(
          function (acctList) {
            $scope.$apply(function() {
              // Acct list valid, create access key menu entries.
              var menuList = [ {
                title: 'Access Key FAQ',
                display: 'Access Key FAQ (external)',
                link: 'https://groups.google.com/forum/#!topic/orbital-enterprises/3TNV-MvSLkE',
                pop: true
              }];
              for (var i = 0; i < acctList.length; i++) {
                menuList.push({
                  title: 'Data Access Keys for ' + acctList[i].name,
                  display: 'Data Access Keys for ' + acctList[i].name,
                  link: '#/access/view/' + acctList[i].aid + '/' + acctList[i].characterType + '/' + acctList[i].name + '/' + acctList[i].eveCharacterName + '/' + acctList[i].eveCorporationName + '/' + acctList[i].eveCharacterID + '/' + acctList[i].eveCorporationID
                });
              }
              $scope.evekitmenus[2].menulist = menuList;
            });
          });
      $timeout($scope.updateAccessKeys, 1000 * 60 * 3);
    };
    $scope.updateAccessKeys();
    $scope.$on('KeysChangeEvent', $scope.updateAccessKeys);
    // Check for authentication error and post an appropriate dialog
    if (auth_error !== null) {
      $timeout(function () { DialogService.simpleErrorMessage(auth_error, 20) }, 1);
    }
  }]);

})();
