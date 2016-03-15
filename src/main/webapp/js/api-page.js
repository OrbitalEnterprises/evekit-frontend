/* EveKit API Page Module */
(function(){
  var eveKitAPI = angular.module('eveKitAPI', []);

  eveKitAPI.controller('APIModelCtrl',
      ['$scope',
       function($scope) {
        $scope.sectionName = "API : Model";
      }]);

})();
