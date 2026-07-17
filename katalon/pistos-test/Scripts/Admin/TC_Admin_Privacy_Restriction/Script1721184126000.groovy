import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.ADMIN_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.ADMIN_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Try accessing member private pages (e.g. member dashboard)
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/dashboard')
WebUI.delay(2)
// Admin should be blocked and redirected back to /login (because useMember hook checks role != MEMBER)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.closeBrowser()
