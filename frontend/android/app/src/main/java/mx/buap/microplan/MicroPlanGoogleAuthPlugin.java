package mx.buap.microplan;

import android.app.Activity;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "MicroPlanGoogleAuth")
public class MicroPlanGoogleAuthPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        String serverClientId = call.getString("serverClientId");
        if (serverClientId == null || serverClientId.trim().isEmpty()) {
            call.reject("Falta configurar serverClientId para Google Sign-In.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No se pudo obtener la actividad actual.");
            return;
        }

        GetSignInWithGoogleOption googleIdOption = new GetSignInWithGoogleOption.Builder(
            serverClientId.trim()
        ).build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build();

        CredentialManager credentialManager = CredentialManager.create(activity);
        credentialManager.getCredentialAsync(
            activity,
            request,
            new CancellationSignal(),
            ContextCompat.getMainExecutor(activity),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(@NonNull GetCredentialResponse result) {
                    Credential cred = result.getCredential();
                    if (
                        cred instanceof CustomCredential &&
                        GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(
                            cred.getType()
                        )
                    ) {
                        try {
                            GoogleIdTokenCredential googleCred =
                                GoogleIdTokenCredential.createFrom(cred.getData());
                            JSObject ret = new JSObject();
                            ret.put("idToken", googleCred.getIdToken());
                            ret.put("email", googleCred.getId());
                            ret.put("displayName", googleCred.getDisplayName());
                            call.resolve(ret);
                        } catch (Exception e) {
                            call.reject(
                                "No se pudo leer el token de Google: " + e.getMessage()
                            );
                        }
                    } else {
                        call.reject("Credencial de Google no reconocida.");
                    }
                }

                @Override
                public void onError(@NonNull GetCredentialException e) {
                    if (e instanceof GetCredentialCancellationException) {
                        call.reject("Inicio de sesión con Google cancelado.");
                    } else {
                        call.reject("No se pudo iniciar sesión con Google: " + e.getMessage());
                    }
                }
            }
        );
    }
}
