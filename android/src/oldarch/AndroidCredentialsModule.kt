package com.iconifybeyond.androidcredentials

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Old Architecture (Bridge) implementation.
 * Used when New Architecture is disabled.
 */
class AndroidCredentialsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val impl = AndroidCredentialsImpl(reactContext)

    override fun getName(): String = NAME

    @ReactMethod
    fun createPasswordCredential(username: String, password: String, promise: Promise) {
        impl.createPasswordCredential(username, password, promise)
    }

    @ReactMethod
    fun savePasskey(requestJson: String, promise: Promise) {
        impl.savePasskey(requestJson, promise)
    }

    @ReactMethod
    fun getCredential(optionsJson: String, promise: Promise) {
        impl.getCredential(optionsJson, promise)
    }

    @ReactMethod
    fun signInWithGoogle(optionsJson: String, promise: Promise) {
        impl.signInWithGoogle(optionsJson, promise)
    }

    @ReactMethod
    fun clearCredentialState(promise: Promise) {
        impl.clearCredentialState(promise)
    }

    companion object {
        const val NAME = "AndroidCredentials"
    }
}
