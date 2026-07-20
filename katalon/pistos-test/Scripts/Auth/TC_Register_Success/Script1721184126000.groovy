import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

String timestamp = System.currentTimeMillis().toString()
String testEmail = "testuser${timestamp}@example.com"
String testPhone = "08123456" + timestamp.substring(timestamp.length()-4)

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/register')

WebUI.setText(findTestObject('Page_Register/input_name'), 'Test User')
WebUI.setText(findTestObject('Page_Register/input_email'), testEmail)
WebUI.setText(findTestObject('Page_Register/input_phone'), testPhone)
WebUI.setText(findTestObject('Page_Register/input_password'), 'Test123!')
WebUI.setText(findTestObject('Page_Register/input_confirmPassword'), 'Test123!')

WebUI.check(findTestObject('Page_Register/chk_agree'))
WebUI.click(findTestObject('Page_Register/btn_createAccount'))

WebUI.verifyElementPresent(findTestObject('Page_Dashboard/lbl_heading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Register_Success' + '.png')

WebUI.closeBrowser()