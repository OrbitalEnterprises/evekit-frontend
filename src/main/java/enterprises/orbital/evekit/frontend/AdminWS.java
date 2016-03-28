package enterprises.orbital.evekit.frontend;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import enterprises.orbital.base.PersistentProperty;
import enterprises.orbital.evekit.account.EveKitUserAccount;
import enterprises.orbital.evekit.ws.common.ServiceError;
import enterprises.orbital.oauth.AuthUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

/**
 * API for admin features.
 */
@Path("/ws/v1/admin")
@Consumes({
    "application/json"
})
@Produces({
    "application/json"
})
@Api(
    tags = {
        "Admin"
},
    produces = "application/json",
    consumes = "application/json")
public class AdminWS {

  @Path("/sysprop")
  @GET
  @ApiOperation(
      value = "Return list of all system properties")
  @ApiResponses(
      value = {
          @ApiResponse(
              code = 200,
              message = "List of system properties",
              response = PersistentProperty.class,
              responseContainer = "array"),
          @ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
  })
  public Response getSysProps(
                              @Context HttpServletRequest request) {
    // Verify caller is an admin
    EveKitUserAccount admin = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (admin == null || !admin.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not an admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    // Retrieve list of properties, filter out per-user properties
    final List<PersistentProperty> result = new ArrayList<PersistentProperty>();
    for (PersistentProperty next : PersistentProperty.getAll()) {
      if (!next.getPropertyName().startsWith("EveKitUserAccount.")) result.add(next);
    }
    return Response.ok().entity(result).build();
  }

  @Path("/sysprop/{key}")
  @PUT
  @ApiOperation(
      value = "Store system property")
  @ApiResponses(
      value = {
          @ApiResponse(
              code = 200,
              message = "Property saved"),
          @ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
  })
  public Response setSysProp(
                             @Context HttpServletRequest request,
                             @PathParam("key") @ApiParam(
                                 name = "key",
                                 required = true,
                                 value = "System property key") String key,
                             @ApiParam(
                                 name = "value",
                                 required = true,
                                 value = "System property value") String value) {
    // Verify caller is an admin
    EveKitUserAccount admin = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (admin == null || !admin.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not an admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    PersistentProperty.setProperty(key, value);
    return Response.ok().build();
  }

  @Path("/sysprop/{key}")
  @DELETE
  @ApiOperation(
      value = "Remove a system property.  Fails silently if the given property can not be found.")
  @ApiResponses(
      value = {
          @ApiResponse(
              code = 200,
              message = "Property removed."),
          @ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
  })
  public Response deleteSysProp(
                                @Context HttpServletRequest request,
                                @PathParam("key") @ApiParam(
                                    name = "key",
                                    required = true,
                                    value = "System property key") String key) {
    // Verify caller is an admin
    EveKitUserAccount admin = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (admin == null || !admin.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not an admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    PersistentProperty.removeProperty(key);
    return Response.ok().build();
  }

  @Path("/userprop/{uid}")
  @GET
  @ApiOperation(
      value = "Return system properties for the given uid")
  @ApiResponses(
      value = {
          @ApiResponse(
              code = 200,
              message = "List of properties for the given user",
              response = PersistentProperty.class,
              responseContainer = "array"),
          @ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
          @ApiResponse(
              code = 404,
              message = "User with the given UID not found",
              response = ServiceError.class),
  })
  public Response getUserProps(
                               @Context HttpServletRequest request,
                               @PathParam("uid") @ApiParam(
                                   name = "uid",
                                   required = true,
                                   value = "UID of user for which properties will be returned") long uid) {
    // Verify caller is an admin
    EveKitUserAccount admin = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (admin == null || !admin.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not an admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    // Find target user
    EveKitUserAccount target = EveKitUserAccount.getAccount(uid);
    if (target == null) {
      ServiceError errMsg = new ServiceError(Status.NOT_FOUND.getStatusCode(), "No user with given UID found");
      return Response.status(Status.NOT_FOUND).entity(errMsg).build();
    }
    // Return list of properties
    final List<PersistentProperty> result = new ArrayList<PersistentProperty>();
    final String keyPrefix = "EveKitUserAccount." + String.valueOf(uid) + ".";
    for (PersistentProperty next : PersistentProperty.getAll()) {
      if (next.getPropertyName().startsWith(keyPrefix)) {
        // Add the property with the key prefix stripped. This hides the user property naming scheme from the caller.
        result.add(new PersistentProperty(next.getPropertyName().substring(keyPrefix.length()), next.getPropertyValue()));
      }
    }
    return Response.ok().entity(result).build();
  }

  @Path("/userprop/{uid}/{key}")
  @PUT
  @ApiOperation(
      value = "Set user system property")
  @ApiResponses(
      value = {
          @ApiResponse(
              code = 200,
              message = "System property set"),
          @ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
          @ApiResponse(
              code = 404,
              message = "User with the given UID not found",
              response = ServiceError.class),
  })
  public Response setUserProp(
                              @Context HttpServletRequest request,
                              @PathParam("uid") @ApiParam(
                                  name = "uid",
                                  required = true,
                                  value = "UID of user for which a property will be set") long uid,
                              @PathParam("key") @ApiParam(
                                  name = "key",
                                  required = true,
                                  value = "System property key") String key,
                              @ApiParam(
                                  name = "value",
                                  required = true,
                                  value = "System property value") String value) {
    // Verify caller is an admin
    EveKitUserAccount admin = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (admin == null || !admin.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not an admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    // Find target user
    EveKitUserAccount target = EveKitUserAccount.getAccount(uid);
    if (target == null) {
      ServiceError errMsg = new ServiceError(Status.NOT_FOUND.getStatusCode(), "No user with given UID found");
      return Response.status(Status.NOT_FOUND).entity(errMsg).build();
    }
    PersistentProperty.setProperty(target, key, value);
    return Response.ok().build();
  }

  @Path("/userprop/{uid}/{key}")
  @DELETE
  @ApiOperation(
      value = "Remove user property.")
  @ApiResponses(
      value = {
          @ApiResponse(
              code = 200,
              message = "Property removed"),
          @ApiResponse(
              code = 401,
              message = "Requestor not logged in or not an admin",
              response = ServiceError.class),
          @ApiResponse(
              code = 404,
              message = "User with the given UID not found",
              response = ServiceError.class),
  })
  public Response deleteUserProp(
                                 @Context HttpServletRequest request,
                                 @PathParam("uid") @ApiParam(
                                     name = "uid",
                                     required = true,
                                     value = "UID of user for which a property will be deleted") long uid,
                                 @PathParam("key") @ApiParam(
                                     name = "key",
                                     required = true,
                                     value = "System property key") String key) {
    // Verify caller is an admin
    EveKitUserAccount admin = (EveKitUserAccount) AuthUtil.getCurrentUser(request);
    if (admin == null || !admin.isAdmin()) {
      ServiceError errMsg = new ServiceError(Status.UNAUTHORIZED.getStatusCode(), "Requestor not logged in or not an admin");
      return Response.status(Status.UNAUTHORIZED).entity(errMsg).build();
    }
    // Find target user
    EveKitUserAccount target = EveKitUserAccount.getAccount(uid);
    if (target == null) {
      ServiceError errMsg = new ServiceError(Status.NOT_FOUND.getStatusCode(), "No user with given UID found");
      return Response.status(Status.NOT_FOUND).entity(errMsg).build();
    }
    PersistentProperty.removeProperty(target, key);
    return Response.ok().build();
  }

}
