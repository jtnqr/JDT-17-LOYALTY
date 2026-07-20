import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.MEMBER_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.MEMBER_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Wait for Member dashboard
WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_heading'), 10)

// Navigate directly to Profile page
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/profile')

// Wait for Profile name to be visible in desktop view
WebUI.waitForElementVisible(findTestObject('Page_Profile/lbl_profileName'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/profile', true)

// Click desktop Log Out button
WebUI.click(findTestObject('Page_Profile/btn_logout'))

// Verify that the user is logged out and redirected to login page
WebUI.waitForElementVisible(findTestObject('Page_Login/input_email'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Member_View_Profile_And_Logout' + '.png')

WebUI.closeBrowser()