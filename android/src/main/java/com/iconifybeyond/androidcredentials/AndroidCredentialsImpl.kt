package com.iconifybeyond.androidcredentials

import android.app.Activity
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CreatePasswordRequest
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PasswordCredential
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.CreateCredentialInterruptedException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.GetCredentialInterruptedException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Core Credential Manager implementation shared by both old-arch and new-arch modules.
 *
 * Minimum SDK requirements:
 *   - Credential Manager (passwords + Google): API 24
 *   - Passkeys: effectively API 28 (Credential Manager enforces this at runtime)
 */
internal class AndroidCredentialsImpl(
    private val reactContext: ReactApplicationContext
) {

    private val TAG = "AndroidCredentials"
    private val scope = CoroutineScope(Dispatchers.Main)

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private fun getActivity(promise: Promise): Activity? {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("UNKNOWN", "No current Activity found. Make sure the app is in the foreground.")
        }
        return activity
    }

    private fun mapGetError(e: GetCredentialException): Pair<String, String> = when (e) {
        is GetCredentialCancellationException -> "USER_CANCELED" to (e.message ?: "User canceled the operation")
        is NoCredentialException -> "NO_CREDENTIAL" to (e.message ?: "No credentials found")
        is GetCredentialInterruptedException -> "INTERRUPTED" to (e.message ?: "Operation was interrupted")
        else -> "UNKNOWN" to (e.message ?: "Unknown error")
    }

    private fun mapCreateError(e: CreateCredentialException): Pair<String, String> = when (e) {
        is CreateCredentialCancellationException -> "USER_CANCELED" to (e.message ?: "User canceled the operation")
        is CreateCredentialInterruptedException -> "INTERRUPTED" to (e.message ?: "Operation was interrupted")
        else -> "UNKNOWN" to (e.message ?: "Unknown error")
    }

    // ------------------------------------------------------------------
    // Public methods
    // ------------------------------------------------------------------

    fun createPasswordCredential(username: String, password: String, promise: Promise) {
        val activity = getActivity(promise) ?: return
        val credentialManager = CredentialManager.create(activity)

        scope.launch {
            try {
                credentialManager.createCredential(
                    context = activity,
                    request = CreatePasswordRequest(id = username, password = password)
                )
                promise.resolve(null)
            } catch (e: CreateCredentialException) {
                val (code, msg) = mapCreateError(e)
                promise.reject(code, msg, e)
            } catch (e: Exception) {
                Log.e(TAG, "createPasswordCredential unexpected error", e)
                promise.reject("UNKNOWN", e.message ?: "Unexpected error", e)
            }
        }
    }

    fun savePasskey(requestJson: String, promise: Promise) {
        val activity = getActivity(promise) ?: return
        val credentialManager = CredentialManager.create(activity)

        scope.launch {
            try {
                val result = credentialManager.createCredential(
                    context = activity,
                    request = CreatePublicKeyCredentialRequest(requestJson = requestJson)
                )
                val pubKeyCred = result.data.getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON")
                    ?: result.data.toString()
                promise.resolve(pubKeyCred)
            } catch (e: CreateCredentialException) {
                val (code, msg) = mapCreateError(e)
                promise.reject(code, msg, e)
            } catch (e: Exception) {
                Log.e(TAG, "savePasskey unexpected error", e)
                promise.reject("UNKNOWN", e.message ?: "Unexpected error", e)
            }
        }
    }

    fun getCredential(optionsJson: String, promise: Promise) {
        val activity = getActivity(promise) ?: return
        val credentialManager = CredentialManager.create(activity)

        val opts = JSONObject(optionsJson)
        val includePassword = opts.optBoolean("password", true)
        val includePasskey = opts.optBoolean("passkey", true)
        val includeGoogle = opts.optBoolean("google", false)
        val passkeyRequestJson = opts.optString("passkeyRequestJson", "")
        val googleServerClientId = opts.optString("googleServerClientId", "")
        val googleNonce = opts.optString("googleNonce", "")
        val autoSelectEnabled = opts.optBoolean("autoSelectEnabled", false)

        val credentialOptions = mutableListOf<androidx.credentials.CredentialOption>()

        if (includePassword) {
            credentialOptions.add(GetPasswordOption())
        }

        if (includePasskey && passkeyRequestJson.isNotEmpty()) {
            credentialOptions.add(GetPublicKeyCredentialOption(requestJson = passkeyRequestJson))
        }

        if (includeGoogle && googleServerClientId.isNotEmpty()) {
            val googleIdOption = GetGoogleIdOption.Builder()
                .setServerClientId(googleServerClientId)
                .setAutoSelectEnabled(autoSelectEnabled)
                .apply {
                    if (googleNonce.isNotEmpty()) setNonce(googleNonce)
                }
                .build()
            credentialOptions.add(googleIdOption)
        }

        if (credentialOptions.isEmpty()) {
            promise.reject("UNKNOWN", "No credential options specified. Pass at least one of: password, passkey (with passkeyRequestJson), or google (with googleServerClientId).")
            return
        }

        val request = GetCredentialRequest(credentialOptions)

        scope.launch {
            try {
                val result = credentialManager.getCredential(context = activity, request = request)
                val credential = result.credential

                val json = when (credential) {
                    is PasswordCredential -> JSONObject().apply {
                        put("type", "Password")
                        put("username", credential.id)
                        put("password", credential.password)
                    }
                    is PublicKeyCredential -> JSONObject().apply {
                        put("type", "Passkey")
                        put("responseJson", credential.authenticationResponseJson)
                    }
                    else -> {
                        // Try to parse as GoogleIdTokenCredential
                        try {
                            val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
                            JSONObject().apply {
                                put("type", "Google")
                                put("idToken", googleCred.idToken)
                                put("email", googleCred.id)
                                put("displayName", googleCred.displayName ?: "")
                                put("givenName", googleCred.givenName ?: "")
                                put("familyName", googleCred.familyName ?: "")
                                put("profilePictureUri", googleCred.profilePictureUri?.toString() ?: "")
                            }
                        } catch (e: Exception) {
                            JSONObject().apply {
                                put("type", "Unknown")
                                put("rawType", credential.type)
                            }
                        }
                    }
                }

                promise.resolve(json.toString())
            } catch (e: GetCredentialException) {
                val (code, msg) = mapGetError(e)
                promise.reject(code, msg, e)
            } catch (e: Exception) {
                Log.e(TAG, "getCredential unexpected error", e)
                promise.reject("UNKNOWN", e.message ?: "Unexpected error", e)
            }
        }
    }

    fun signInWithGoogle(optionsJson: String, promise: Promise) {
        val activity = getActivity(promise) ?: return
        val credentialManager = CredentialManager.create(activity)

        val opts = JSONObject(optionsJson)
        val serverClientId = opts.optString("serverClientId", "")
        val nonce = opts.optString("nonce", "")
        val autoSelectEnabled = opts.optBoolean("autoSelectEnabled", false)
        val filterByAuthorizedAccounts = opts.optBoolean("filterByAuthorizedAccounts", false)

        if (serverClientId.isEmpty()) {
            promise.reject("UNKNOWN", "serverClientId is required for signInWithGoogle")
            return
        }

        val googleIdOption = GetSignInWithGoogleOption.Builder(serverClientId)
            .apply {
                if (nonce.isNotEmpty()) setNonce(nonce)
            }
            .build()

        val request = GetCredentialRequest(listOf(googleIdOption))

        scope.launch {
            try {
                val result = credentialManager.getCredential(context = activity, request = request)
                val googleCred = GoogleIdTokenCredential.createFrom(result.credential.data)

                val json = JSONObject().apply {
                    put("type", "Google")
                    put("idToken", googleCred.idToken)
                    put("email", googleCred.id)
                    put("displayName", googleCred.displayName ?: "")
                    put("givenName", googleCred.givenName ?: "")
                    put("familyName", googleCred.familyName ?: "")
                    put("profilePictureUri", googleCred.profilePictureUri?.toString() ?: "")
                }

                promise.resolve(json.toString())
            } catch (e: GetCredentialException) {
                val (code, msg) = mapGetError(e)
                promise.reject(code, msg, e)
            } catch (e: Exception) {
                Log.e(TAG, "signInWithGoogle unexpected error", e)
                promise.reject("UNKNOWN", e.message ?: "Unexpected error", e)
            }
        }
    }

    fun clearCredentialState(promise: Promise) {
        val activity = getActivity(promise) ?: return
        val credentialManager = CredentialManager.create(activity)

        scope.launch {
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
                promise.resolve(null)
            } catch (e: ClearCredentialException) {
                promise.reject("UNKNOWN", e.message ?: "Failed to clear credential state", e)
            } catch (e: Exception) {
                Log.e(TAG, "clearCredentialState unexpected error", e)
                promise.reject("UNKNOWN", e.message ?: "Unexpected error", e)
            }
        }
    }
}
