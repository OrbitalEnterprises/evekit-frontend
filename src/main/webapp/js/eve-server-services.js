/** Response type for EVE character info */
var CharacterInfoBuilder = function(opt_json) {
  opt_json = opt_json || {};
  this.eveCharacterName = opt_json['characterName'] || "";
  this.eveCharacterID = opt_json['characterID'] || -1;
  this.eveCorporationName = opt_json['corporationName'] || "";
  this.eveCorporationID = opt_json['corporationID'] || -1;
};


/* Eve Server Services */
(function() {
var eveKitServerServices = angular.module('eveKitServerServices', ['ngResource', 'eveKitRemoteServices']);

var xmlResponseHandler = function(response) {
  // Response will be raw XML text which we parse and extract
  $response = $( $.parseXML(response) );
  var rows = $response.find('row');
  var charList = [];
  for (var i = 0; i < rows.length; i++) {
    charList.push(new CharacterInfoBuilder({
      characterName: rows[i].getAttribute("name"),
      characterID: rows[i].getAttribute("characterID"),
      corporationName : rows[i].getAttribute("corporationName"),
      corporationID: rows[i].getAttribute("corporationID")
    }));
  }
  return charList;
};

eveKitServerServices.factory('CharacterInfo', ['$resource',
  function($resource) {
    return $resource('https://api.eveonline.com/account/Characters.xml.aspx', {},
        {list:
          {method: 'GET',
           params: {keyID: -1, vCode: ''},
           isArray: true,
           transformResponse: xmlResponseHandler}});
    }]);

var keyInfoResponseHandler = function(response) {
  // Response will be raw XML text which we parse and extract
  $response = $( $.parseXML(response) );
  var data = $response.find('key');
  if (angular.isDefined(data) && data.length > 0) {
    return {
        accessMask: data[0].getAttribute("accessMask"),
        type: data[0].getAttribute("type"),
        expires: data[0].getAttribute("expires")
    };
  }
  data = $response.find('error');
  if (angular.isDefined(data) && data.length > 0) {
    return { code: parseInt(data[0].getAttribute("code")) };
  }
  return null;
};

eveKitServerServices.factory('APIKeyInfo', ['$resource',
  function($resource) {
    return $resource('https://api.eveonline.com/account/APIKeyInfo.xml.aspx', {},
        {get:
          {method: 'GET',
           params: {keyID: -1, vCode: ''},
           isArray: false,
           transformResponse: keyInfoResponseHandler}});
    }]);

})();