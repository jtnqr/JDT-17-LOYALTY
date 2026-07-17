import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.ADMIN_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.ADMIN_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/dashboard')
WebUI.delay(2)
// Access to member dashboard should redirect back to /login (because useMember hook rejects wrong role and clears token)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.closeBrowser()
