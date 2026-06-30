package com.iconifybeyond.androidcredentials

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.iconifybeyond.androidcredentials.NativeAndroidCredentialsSpec

/**
 * New Architecture (Turbo Module) implementation.
 * Extends the codegen-generated spec class.
 */
class AndroidCredentialsModule(reactContext: ReactApplicationContext) :
    NativeAndroidCredentialsSpec(reactContext) {

    private val impl = AndroidCredentialsImpl(reactContext)

    override fun getName(): String = NAME

    override fun createPasswordCredential(username: String, password: String, promise: Promise) {
        impl.createPasswordCredential(username, password, promise)
    }

    override fun savePasskey(requestJson: String, promise: Promise) {
        impl.savePasskey(requestJson, promise)
    }

    override fun getCredential(optionsJson: String, promise: Promise) {
        impl.getCredential(optionsJson, promise)
    }

    override fun signInWithGoogle(optionsJson: String, promise: Promise) {
        impl.signInWithGoogle(optionsJson, promise)
    }

    override fun clearCredentialState(promise: Promise) {
        impl.clearCredentialState(promise)
    }

    companion object {
        const val NAME = "AndroidCredentials"
    }
}
