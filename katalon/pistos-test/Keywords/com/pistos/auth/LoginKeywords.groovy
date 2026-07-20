package com.pistos.auth

import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import internal.GlobalVariable

public class LoginKeywords {

    static void navigateToLogin() {
        WebUI.openBrowser('')
        WebUI.maximizeWindow()
        WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')
    }

    static void login(String email, String password) {
        WebUI.setText(findTestObject('Page_Login/input_email'), email)
        WebUI.setText(findTestObject('Page_Login/input_password'), password)
        WebUI.click(findTestObject('Page_Login/btn_signIn'))
    }

    static void verifyLoginSuccess() {
        WebUI.verifyElementPresent(findTestObject('Page_Dashboard/lbl_heading'), 10)
        WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard', true)
    }

    static void verifyLoginFailed() {
        WebUI.verifyElementPresent(findTestObject('Page_Login/input_email'), 5)
        WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)
    }

    static void closeBrowser() {
        WebUI.closeBrowser()
    }
}
