import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/dashboard')
WebUI.delay(2)
// Direct access without login should redirect to /login
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.closeBrowser()
