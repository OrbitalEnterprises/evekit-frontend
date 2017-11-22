package enterprises.orbital.evekit.frontend;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.core.Application;

import enterprises.orbital.base.OrbitalProperties;
import enterprises.orbital.base.PersistentProperty;
import enterprises.orbital.db.DBPropertyProvider;
import enterprises.orbital.evekit.account.EveKitUserAccountProvider;
import enterprises.orbital.evekit.ws.account.AccountWS;
import enterprises.orbital.evekit.ws.account.CredentialWS;
import enterprises.orbital.evekit.ws.model.SyncTrackerWS;
import enterprises.orbital.oauth.AuthUtil;

public class FrontendApplication extends Application {
  // Property which holds the name of the persistence unit for properties
  public static final String PROP_PROPERTIES_PU = "enterprises.orbital.evekit.frontend.properties.persistence_unit";
  public static final String PROP_APP_PATH      = "enterprises.orbital.evekit.frontend.apppath";
  public static final String DEF_APP_PATH       = "http://localhost/controller";

  public FrontendApplication() throws IOException {
    // Populate properties
    OrbitalProperties.addPropertyFile("EveKitFrontend.properties");
    // Sent persistence unit for properties
    PersistentProperty.setProvider(new DBPropertyProvider(OrbitalProperties.getGlobalProperty(PROP_PROPERTIES_PU)));
    // Sent UserAccountProvider provider
    AuthUtil.setUserAccountProvider(new EveKitUserAccountProvider());
  }

  @Override
  public Set<Class<?>> getClasses() {
    Set<Class<?>> resources = new HashSet<Class<?>>();
    // Local resources
    resources.add(AccountWS.class);
    resources.add(CredentialWS.class);
    resources.add(SyncTrackerWS.class);
    resources.add(AuthenticationWS.class);
    resources.add(ReleaseWS.class);
    resources.add(AdminWS.class);
    // Swagger additions
    resources.add(io.swagger.jaxrs.listing.ApiListingResource.class);
    resources.add(io.swagger.jaxrs.listing.SwaggerSerializers.class);
    // Return resource set
    return resources;
  }

}
