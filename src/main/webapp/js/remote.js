/* Useful functions */
function convertLongToTime(obj) {
  var timeArg = obj || -1;
  return timeArg == -1 ? null : new Date(timeArg);
}

/** Standard error response */
var EveKitServiceError = function(opt_json) {
  opt_json = opt_json || {};
  this.errorCode = opt_json['errorCode'] || 0;
  this.errorMessage = opt_json['errorMessage'] || '';
};

function handleRemoteResponse(response) {
  if (angular.isDefined(response.obj) &&
      response.obj != null)
    throw new EveKitServiceError(response.obj);
  throw new EveKiServiceError({errorCode: 0, errorMessage: "internal service error"});
}

/** Utilities to handle server interactions. */
(function(){
var eveKitRemoteServices = angular.module('eveKitRemoteServices', []);

/**
 * Service for retrieving swagger endpoints for EveKit.  Returns a promise
 * that resolves to the client when it's ready.
 */
eveKitRemoteServices.factory('SwaggerService', [
  function() {
    // initialize swagger, point to a resource listing
    var url = window.location.href;
    // removing any trailing garbage
    var h = url.indexOf('#');
    if (h != -1) {
      url = url.substring(0, h);
    }
    // construct and retrieve the swagger client spec
    url = url + "api/swagger.json";
    console.log("retrieving swagger from: " + url);
    // initialize swagger with promise
    var swagger = new SwaggerClient({
      url: url,
      usePromise: true
    }).then(function(obj) {
      // save a debug copy of swagger as well as returning
      window.swagger = obj;
      console.log("swagger ready");
      return obj;
    }).catch(function(error) {
      console.error('Swagger promise rejected', error);
      return null;
    });
    return {
      'getSwagger' : function() {
        return swagger;
      }
    };
 }]);

// TODO - everything below here should eventually go away as we replace services

var Response = function(json_resp, opt_result_ctor) {
  if (angular.isDefined(json_resp)) {
    this.raw = json_resp;
    this.eveKitBuild = json_resp['eveKitBuild'] || null;
    this.responseTime = json_resp['responseTime'] || -1;
    if (opt_result_ctor && (json_resp['result'] || json_resp['result'] != null)) {
      this.result = new opt_result_ctor(json_resp['result'] || null);
    } else {
      this.result = json_resp['result'] || null;
    }
  }
};

var ResponseList = function(json_resp, opt_result_ctor) {
  this.result = [];
  if (angular.isDefined(json_resp)) {
    this.raw = json_resp;
    this.eveKitBuild = json_resp['eveKitBuild'] || null;
    this.responseTime = json_resp['responseTime'] || -1;
    this.continuation = json_resp['continuation'] || '-1';
    var res_array = json_resp['result'] || [];
    var store_array = [];
    for ( var i = 0; i < res_array.length; i++) {
      store_array
          .push(opt_result_ctor && (res_array[i] || res_array[i] != null) ? new opt_result_ctor(
              res_array[i]) : res_array[i]);
    }
    this.result = store_array;
  }
};

var ResourceError = function(json_resp) {
  if (angular.isDefined(json_resp)) {
    this.errormsg = json_resp['errormsg'] || null;
    this.errorcode = parseInt(json_resp['errorcode'] || -1, 10);
  }
};

var ResourceResponsePopulator = function(is_list, result_type, raw_response) {
  var json_response = JSON.parse(raw_response);
  var eveKitBuild = json_response['eveKitBuild'] || null;
  var responseTime = json_response['responseTime'] || -1;
  var continuation = json_response['continuation'] || '-1';
  var blank = {'eveKitBuild' : eveKitBuild, 'responseTime' : responseTime, 'continuation' : continuation};
  var target = is_list ? [] : angular.copy(blank);
  if (angular.isDefined(json_response['result']) &&
      angular.isDefined(json_response['result']['errorcode'])) {
    // Error response.  Return as the single element of the array if this is an error case.
    var re = new ResourceError(json_response['result']);
    if (is_list) {
      target.push(angular.extend(angular.copy(blank), re));
    } else {
      angular.extend(target, re);
    }
  } else {
    if (is_list) {
      var rarray = new ResponseList(json_response, result_type);
      for (var i = 0; i < rarray.result.length; i++) {
        var next = angular.copy(blank);
        target.push(angular.extend(next, rarray.result[i]));
      }
    } else {
      var robj = new Response(json_response, result_type);
      angular.extend(target, robj.result);
    }
  }
  return target;
};

eveKitRemoteServices.factory('RemoteHandler',
    [
     function() {
       return {
         ResourceResponsePopulator: ResourceResponsePopulator
       };
     }]);


})();
