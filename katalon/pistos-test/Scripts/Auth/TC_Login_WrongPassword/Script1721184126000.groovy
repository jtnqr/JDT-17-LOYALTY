import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.MEMBER_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), 'wrongpass123')
WebUI.click(findTestObject('Page_Login/btn_signIn'))

WebUI.delay(2)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.closeBrowser()
