/* Tracker field names */
var CapsuleerSyncTrackerStatusFieldList = [
                                           'accountStatusStatus',
                                           'accountBalanceStatus',
                                           'assetListStatus',
                                           'blueprintsStatus',
                                           'bookmarksStatus',
                                           'calendarEventAttendeesStatus',
                                           'characterSheetStatus',
                                           'partialCharacterSheetStatus',
                                           'chatChannelsStatus',
                                           'contactListStatus',
                                           'contactNotificationsStatus',
                                           'contractsStatus',
                                           'contractItemsStatus',
                                           'contractBidsStatus',
                                           'facWarStatsStatus',
                                           'industryJobsStatus',
                                           'killlogStatus',
                                           'locationsStatus',
                                           'mailBodiesStatus',
                                           'mailingListsStatus',
                                           'mailMessagesStatus',
                                           'marketOrdersStatus',
                                           'medalsStatus',
                                           'notificationsStatus',
                                           'notificationTextsStatus',
                                           'planetaryColoniesStatus',
                                           'researchStatus',
                                           'skillInTrainingStatus',
                                           'skillQueueStatus',
                                           'skillsStatus',
                                           'standingsStatus',
                                           'upcomingCalendarEventsStatus',
                                           'walletJournalStatus',
                                           'walletTransactionsStatus'
                                           ];
var CapsuleerSyncTrackerDetailFieldList = [
                                           'accountStatusDetail',
                                           'accountBalanceDetail',
                                           'assetListDetail',
                                           'blueprintsDetail',
                                           'bookmarksDetail',
                                           'calendarEventAttendeesDetail',
                                           'characterSheetDetail',
                                           'partialCharacterSheetDetail',
                                           'chatChannelsDetail',
                                           'contactListDetail',
                                           'contactNotificationsDetail',
                                           'contractsDetail',
                                           'contractItemsDetail',
                                           'contractBidsDetail',
                                           'facWarStatsDetail',
                                           'industryJobsDetail',
                                           'killlogDetail',
                                           'locationsDetail',
                                           'mailBodiesDetail',
                                           'mailingListsDetail',
                                           'mailMessagesDetail',
                                           'marketOrdersDetail',
                                           'medalsDetail',
                                           'notificationsDetail',
                                           'notificationTextsDetail',
                                           'planetaryColoniesDetail',
                                           'researchDetail',
                                           'skillInTrainingDetail',
                                           'skillQueueDetail',
                                           'skillsDetail',
                                           'standingsDetail',
                                           'upcomingCalendarEventsDetail',
                                           'walletJournalDetail',
                                           'walletTransactionsDetail'
                                           ];
var CorporationSyncTrackerStatusFieldList = [
                                             'accountBalanceStatus',
                                             'assetListStatus',
                                             'blueprintsStatus',
                                             'bookmarksStatus',
                                             'contactListStatus',
                                             'containerLogStatus',
                                             'contractsStatus',
                                             'contractItemsStatus',
                                             'contractBidsStatus',
                                             'corporationSheetStatus',
                                             'corpMedalsStatus',
                                             'corpTitlesStatus',
                                             'customsOfficeStatus',
                                             'facilitiesStatus',
                                             'facWarStatsStatus',
                                             'industryJobsStatus',
                                             'killlogStatus',
                                             'locationsStatus',
                                             'marketOrdersStatus',
                                             'memberMedalsStatus',
                                             'memberSecurityStatus',
                                             'memberSecurityLogStatus',
                                             'memberTrackingStatus',
                                             'outpostListStatus',
                                             'outpostDetailStatus',
                                             'shareholderStatus',
                                             'standingsStatus',
                                             'starbaseListStatus',
                                             'starbaseDetailStatus',
                                             'walletJournalStatus',
                                             'walletTransactionsStatus'
                                             ];
var CorporationSyncTrackerDetailFieldList = [
                                             'accountBalanceDetail',
                                             'assetListDetail',
                                             'blueprintsDetail',
                                             'bookmarksDetail',
                                             'contactListDetail',
                                             'containerLogDetail',
                                             'contractsDetail',
                                             'contractItemsDetail',
                                             'contractBidsDetail',
                                             'corporationSheetDetail',
                                             'corpMedalsDetail',
                                             'corpTitlesDetail',
                                             'customsOfficeDetail',
                                             'facilitiesDetail',
                                             'facWarStatsDetail',
                                             'industryJobsDetail',
                                             'killlogDetail',
                                             'locationsDetail',
                                             'marketOrdersDetail',
                                             'memberMedalsDetail',
                                             'memberSecurityDetail',
                                             'memberSecurityLogDetail',
                                             'memberTrackingDetail',
                                             'outpostListDetail',
                                             'outpostDetailDetail',
                                             'shareholderDetail',
                                             'standingsDetail',
                                             'starbaseListDetail',
                                             'starbaseDetailDetail',
                                             'walletJournalDetail',
                                             'walletTransactionsDetail'
                                             ];

var RefSyncTrackerEndpoints = [
    "REF_SERVER_STATUS",
    "REF_ALLIANCE",
    "REF_SOV_MAP",
    "REF_SOV_CAMPAIGN",
    "REF_SOV_STRUCTURE",
    "REF_FW_WARS",
    "REF_FW_STATS",
    "REF_FW_SYSTEMS",
    "REF_FW_FACTION_LEADERBOARD",
    "REF_FW_CORP_LEADERBOARD",
    "REF_FW_CHAR_LEADERBOARD"
];

/* Sync Tracker Services */
(function() {
var trackerWS = angular.module('eveKitTrackerWS', ['eveKitRemoteServices']);

/**
 * Service to provide access to sync history
 */
trackerWS.factory('TrackerWSService', ['SwaggerService',
  function(SwaggerService) {
    return {
      'getCapHistory' : function(aid, contid, maxresults) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          var args = {aid: aid};
          if (contid) args['contid'] = contid;
          if (maxresults) args['maxresults'] = maxresults;
          return swg.Account.requestCapsuleerSyncHistory(args, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getCorpHistory' : function(aid, contid, maxresults) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          var args = {aid: aid};
          if (contid) args['contid'] = contid;
          if (maxresults) args['maxresults'] = maxresults;
          return swg.Account.requestCorporationSyncHistory(args, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getRefHistory' : function(contid, maxresults) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          var args = {};
          if (contid) args['contid'] = contid;
          if (maxresults) args['maxresults'] = maxresults;
          return swg.Account.requestRefSyncHistory(args, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getUnfinishedCapSync' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.requestUnfinishedCapsuleerSync({}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getUnfinishedCorpSync' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.requestUnfinishedCorporationSync({}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'getUnfinishedRefSync' : function() {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.requestUnfinishedRefSync({}, {})
          .then(function(result) {
            return result.obj;
          }).catch(handleRemoteResponse);
        });
      },
      'finishTracker' : function(uid, aid, tid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.requestFinishTracker({uid: uid, aid: aid, tid: tid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      },
      'finishRefTracker' : function(tid) {
        return SwaggerService.getSwagger()
        .then(function (swg) {
          return swg.Account.requestFinishRefTracker({tid: tid}, {})
          .then(function(result) {
            return true;
          }).catch(handleRemoteResponse);
        });
      }
    };
 }]);


})();
