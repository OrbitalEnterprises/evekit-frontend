/* EveKit XML Proxy Page Module */
(function(){
  var eveKitAPI = angular.module('eveKitXMLProxy', ['ngRoute', 'eveKitModeServices']);

  eveKitAPI.controller('XMLProxyIntroCtrl',
      ['$scope', '$routeParams', '$sce', 'ToolModeService',
       function($scope, $routeParams, $sce, ToolModeService) {
        ToolModeService.refresh(MODE_PROXY);
        $scope.sectionName = "XML Proxy : Intro";
      }]);

  eveKitAPI.controller('XMLProxyUICtrl',
      ['$scope', '$routeParams', '$sce', 'ToolModeService',
       function($scope, $routeParams, $sce, ToolModeService) {
        ToolModeService.refresh(MODE_PROXY);
        $scope.sectionName = "XML Proxy : Swagger UI";
        var baseUrl = "vendor/swagger-ui-2.1.4/swagger-xmlproxy.html?url=${enterprises.orbital.evekit.frontend.proxypath}/api/swagger.json";
        $scope.urlExtra = $sce.trustAsResourceUrl(baseUrl);
      }]);

})();
