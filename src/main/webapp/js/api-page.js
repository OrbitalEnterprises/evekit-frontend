/* EveKit API Page Module */
(function(){
  var eveKitAPI = angular.module('eveKitAPI', ['ngRoute']);

  eveKitAPI.controller('APIModelCtrl',
      ['$scope', '$routeParams', '$sce',
       function($scope, $routeParams, $sce) {
        $scope.sectionName = "API : Model";
        var baseUrl = "vendor/swagger-ui-2.1.4/swagger.html?url=${enterprises.orbital.evekit.frontend.swaggerui.model}";
        $scope.urlExtra = $sce.trustAsResourceUrl(baseUrl);
        if (angular.isDefined($routeParams.accessKey) &&
            angular.isDefined($routeParams.accessCred) &&
            angular.isDefined($routeParams.keyName) &&
            $routeParams.accessKey != "-1" &&
            $routeParams.accessCred != "-1") {
          $scope.urlExtra = $sce.trustAsResourceUrl(baseUrl + "&accessKey=" + $routeParams.accessKey + "&accessCred=" + $routeParams.accessCred + "&accessKeyName=" + $routeParams.keyName);
        }
      }]);

})();
