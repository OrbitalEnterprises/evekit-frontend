package enterprises.orbital.evekit.frontend;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.apache.http.client.utils.URIBuilder;
import org.scribe.builder.api.Api;

import enterprises.orbital.base.OrbitalProperties;
import enterprises.orbital.evekit.account.EveKitUserAccount;
import enterprises.orbital.evekit.account.EveKitUserAuthSource;
import enterprises.orbital.evekit.ws.common.ServiceError;
import enterprises.orbital.oauth.AuthUtil;
import enterprises.orbital.oauth.EVEAuthHandler;
import enterprises.orbital.oauth.EVECallbackHandler;
import enterprises.orbital.oauth.LogoutHandler;
import enterprises.orbital.oauth.TwitterAuthHandler;
import enterprises.orbital.oauth.TwitterCallbackHandler;
import enterprises.orbital.oauth.UserAccount;
import enterprises.orbital.oauth.UserAuthSource;
import io.swagger.annotations.ApiParam;

/**
 * API for authentication, managing authentication sources, and logging out.
 */
@Path("/ws/v1/auth")
@Produces({
    "application/json"
})
@io.swagger.annotations.Api(
    tags = {
        "Authentication"
},
    produces = "application/json")
public class AuthenticationWS {
  private static final Logger log = Logger.getLogger(AuthenticationWS.class.getName());

  protected static URIBuilder makeStandardBuilder(
                                                  HttpServletRequest req) throws MalformedURLException, URISyntaxException {
    URIBuilder builder = new URIBuilder(OrbitalProperties.getGlobalProperty(FrontendApplication.PROP_APP_PATH, FrontendApplication.DEF_APP_PATH) + "/");
    return builder;
  }

  protected static String makeErrorCallback(
                                            HttpServletRequest req,
                                            String source) throws MalformedURLException, URISyntaxException {
    URIBuilder builder = makeStandardBuilder(req);
    builder.addParameter("auth_error",
                         "Error while authenticating with " + source + ".  Please retry.  If the problem perists, please contact the site admin.");
    return builder.toString();
  }

  protected static void loginDebugUser(
                                       String source,
                                       String screenName,
                                       HttpServletRequest req) throws IOException {
    UserAccount existing = AuthUtil.getCurrentUser(req);
    UserAuthSource authSource = AuthUtil.getBySourceScreenname(source, screenName);
    if (authSource != null) {
      // Already exists
      if (existing != null) {
        // User already signed in so change the associated to the current user. There may also be a redirect we should prefer.
        authSource.updateAccount(existing);
      } else {
        // Otherwise, sign in as usual.
        AuthUtil.signOn(req, authSource.getOwner(), authSource);
      }
    } else {
      // New user unless already signed in, in which case it's a new association.
      UserAccount newUser = existing == null ? AuthUtil.createNewUserAccount(false) : existing;
      authSource = AuthUtil.createSource(newUser, source, screenName, "debug user");
      if (existing == null) {
        // New user needs to sign in.
        AuthUtil.signOn(req, newUser, authSource);
      }
    }
  }

  @SuppressWarnings("unchecked")
  @Path("/login/{source}")
  @GET
  @io.swagger.annotations.ApiOperation(
      value = "Authenticate using a specified source.",
      notes = "Initiate authentication using the specified source.  This will most often trigger a redirection to OAuth.")
  @io.swagger.annotations.ApiResponses(
      value = {
          @io.swagger.annotations.ApiResponse(
              code = 307,
              message = "Temporary redirect to an OAuth endpoint to initiate authentication.")
  })
  public Response login(
                        @Context HttpServletRequest req,
                        @PathParam("source") @io.swagger.annotations.ApiParam(
                            name = "source",
                            required = true,
                            value = "The source with which to authenticate.") String source) throws IOException, URISyntaxException {
    String redirect;
    URIBuilder builder = makeStandardBuilder(req);

    switch (source) {
    case "twitter":
      String twitterApiKey = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.twitter_api_key");
      String twitterApiSecret = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.twitter_api_secret");
      builder.setPath(builder.getPath() + "api/ws/v1/auth/callback/twitter");
      redirect = TwitterAuthHandler.doGet(twitterApiKey, twitterApiSecret, builder.toString(), req);
      if (redirect == null) redirect = makeErrorCallback(req, "Twitter");
      log.fine("Redirecting to: " + redirect);
      return Response.temporaryRedirect(new URI(redirect)).build();

    case "eve":
      if (OrbitalProperties.getBooleanGlobalProperty("enterprises.orbital.auth.eve_debug_mode", false)) {
        // In this case, skip the usual login scheme and immediately log in the user with a debug user.
        // This mode is normally only enabled for local test since EVE OAuth login doesn't work in that case.
        String eveDebugUser = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_debug_user", "eveuser");
        loginDebugUser("eve", eveDebugUser, req);
        return Response.temporaryRedirect(new URI(builder.toString())).build();
      } else {
        String eveClientID = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_client_id");
        String eveSecretKey = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_secret_key");
        Class<? extends Api> eveApiClass = null;
        try {
          eveApiClass = (Class<? extends Api>) Class.forName(OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_api_class"));
        } catch (ClassNotFoundException e) {
          log.log(Level.SEVERE, "Failed to retrieve API class", e);
        }
        builder.setPath(builder.getPath() + "api/ws/v1/auth/callback/eve");
        redirect = EVEAuthHandler.doGet(eveApiClass, eveClientID, eveSecretKey, builder.toString(), req);
        if (redirect == null) redirect = makeErrorCallback(req, "EVE");
        log.fine("Redirecting to: " + redirect);
        return Response.temporaryRedirect(new URI(redirect)).build();
      }

    case "google":
    default:
      // Log but otherwise ignore.
      log.severe("Unrecognized login source: " + source);
    }

    return null;
  }

  @SuppressWarnings("unchecked")
  @Path("/callback/{source}")
  @GET
  @io.swagger.annotations.ApiOperation(
      value = "Handle OAuth callback for specified source.",
      notes = "Handle OAuth callback after initial redirection to an OAuth source.")
  @io.swagger.annotations.ApiResponses(
      value = {
          @io.swagger.annotations.ApiResponse(
              code = 307,
              message = "Temporary redirect back to Jeeves site."),
          @io.swagger.annotations.ApiResponse(
              code = 400,
              message = "Unable to complete authentication.")
  })
  public Response callback(
                           @Context HttpServletRequest req,
                           @PathParam("source") @io.swagger.annotations.ApiParam(
                               name = "source",
                               required = true,
                               value = "The source with which authentication just completed.") String source) throws IOException, URISyntaxException {
    String redirect;
    URIBuilder builder = makeStandardBuilder(req);

    switch (source) {
    case "twitter":
      String twitterApiKey = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.twitter_api_key");
      String twitterApiSecret = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.twitter_api_secret");
      redirect = TwitterCallbackHandler.doGet(twitterApiKey, twitterApiSecret, builder.toString(), req);
      if (redirect == null) redirect = makeErrorCallback(req, "Twitter");
      log.fine("Redirecting to: " + redirect);
      return Response.temporaryRedirect(new URI(redirect)).build();

    case "eve":
      String eveClientID = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_client_id");
      String eveSecretKey = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_secret_key");
      String eveVerifyURL = OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_verify_url");
      Class<? extends Api> eveApiClass = null;
      try {
        eveApiClass = (Class<? extends Api>) Class.forName(OrbitalProperties.getGlobalProperty("enterprises.orbital.auth.eve_api_class"));
      } catch (ClassNotFoundException e) {
        log.log(Level.SEVERE, "Failed to retrieve API class", e);
      }
      redirect = EVECallbackHandler.doGet(eveApiClass, eveClientID, eveSecretKey, eveVerifyURL, builder.toString(), req);
      if (redirect == null) redirect = makeErrorCallback(req, "EVE");
      log.fine("Redirecting to: " + redirect);
      return Response.temporaryRedirect(new URI(redirect)).build();

    case "google":
    default:
      // Log but otherwise ignore.
      log.severe("Unrecognized callback source: " + source);
    }

    return null;
  }

  @Path("/logout")
  @GET
  @io.swagger.annotations.ApiOperation(
      value = "Logout the current logged in user.",
      notes = "Logout the current logged in user.")
  @io.swagger.annotations.ApiResponses(
      value = {
          @io.swagger.annotations.ApiResponse(
              code = 307,
              message = "Temporary redirect back to Jeeves site.")
  })
  public Response logout(
                         @Context HttpServletRequest req) throws IOException, URISyntaxException {
    URIBuilder builder = makeStandardBuilder(req);
    String redirect = LogoutHandler.doGet(null, builder.toString(), req);
    // This should never happen for the normal logout case.
    assert redirect != null;
    log.fine("Redirecting to: " + redirect);
    return Response.temporaryRedirect(new URI(redirect)).build();
  }

  @Path("/remove/{source}")
  @GET
  @io.swagger.annotations.ApiOperation(
      value = "Remove a login source for a user.",
      notes = "Remove a login source for a user.")
  @io.swagger.annotations.ApiResponses(
      value = {
          @io.swagger.annotations.ApiResponse(
              code = 307,
              message = "Temporary redirect back to Jeeves site.")
  })
  public Response remove(
                         @Context HttpServletRequest req,
                         @Context HttpServletResponse res,
                         @PathParam("source") @io.swagger.annotations.ApiParam(
                             name = "source",
                             required = true,
                             value = "Source we want to remove as a login source for the current logged in user.") String source)
                               throws IOException, URISyntaxException {
    URIBuilder builder = makeStandardBuilder(req);
    String redirect = LogoutHandler.doGet(source, builder.toString(), req);
    // Null is returned if no user is currently logged in. Silently ignore in this case.
    if (redirect == null) redirect = builder.toString();
    log.fine("Redirecting to: " + redirect);
    return Response.temporaryRedirect(new URI(redirect)).build();
  }

  @Path("/become/{uid}")
  @GET
  @io.swagger.annotations.ApiOperation(
      value = "Become the user with the specified UID")
  @io.swagger.annotations.ApiResponses(
      value = {
          @io.swagger.annotations.ApiResponse(
              code = 200,
              message = "Identity switched to specified UID"),
          @io.swagger.annotations.ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
          @io.swagger.annotations.ApiResponse(
              code = 404,
              message = "Request UID not found",
              response = ServiceError.class)
  })
  public Response becomeUser(
                             @Context HttpServletRequest request,
                             @PathParam("uid") @ApiParam(
                                 name = "uid",
                                 required = true,
                                 value = "UID of user to switch to") long uid) throws IOException, URISyntaxException {
    // Retrieve user and verify as needed
    EveKitUserAccount user = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (user == null || !user.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    user = EveKitUserAccount.getAccount(uid);
    if (user == null) {
      ServiceError errMsg = new ServiceError(Status.NOT_FOUND.getStatusCode(), "Target user not found");
      return Response.status(Status.NOT_FOUND).entity(errMsg).build();
    }
    // Pick one of the target users available sources
    List<EveKitUserAuthSource> availableSources = EveKitUserAuthSource.getAllSources(user);
    if (availableSources.size() == 0) {
      ServiceError errMsg = new ServiceError(Status.INTERNAL_SERVER_ERROR.getStatusCode(), "Target user has no sources!");
      return Response.status(Status.INTERNAL_SERVER_ERROR).entity(errMsg).build();
    }
    EveKitUserAuthSource targetSource = availableSources.get(0);
    AuthUtil.signOn(request, user, targetSource);
    return Response.ok().build();
  }

}
