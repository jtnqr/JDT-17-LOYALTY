import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/dashboard')

// Wait dynamically for redirection to /login to finish
WebUI.waitForElementVisible(findTestObject('Page_Login/input_email'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Guard_Unauthenticated_Redirect' + '.png')

WebUI.closeBrowser()