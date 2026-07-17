import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.MEMBER_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.MEMBER_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/admin')
WebUI.delay(2)
// Access to admin dashboard should redirect back to /login (because useAdmin hook rejects wrong role and clears token)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.closeBrowser()
