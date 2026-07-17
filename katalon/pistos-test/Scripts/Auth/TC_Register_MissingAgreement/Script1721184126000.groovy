import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

String timestamp = System.currentTimeMillis().toString()

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/register')

WebUI.setText(findTestObject('Page_Register/input_name'), 'NoAgree User')
WebUI.setText(findTestObject('Page_Register/input_email'), "noagree${timestamp}@example.com")
WebUI.setText(findTestObject('Page_Register/input_phone'), "08123456" + timestamp.substring(timestamp.length()-4))
WebUI.setText(findTestObject('Page_Register/input_password'), 'Test123!')
WebUI.setText(findTestObject('Page_Register/input_confirmPassword'), 'Test123!')

// Skip checking chk_agree
WebUI.click(findTestObject('Page_Register/btn_createAccount'))

WebUI.delay(2)
WebUI.verifyMatch(WebUI.getUrl(), '.*/register', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Register_MissingAgreement' + '.png')

WebUI.closeBrowser()