import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/register')

WebUI.setText(findTestObject('Page_Register/input_name'), 'Duplicate Phone User')
WebUI.setText(findTestObject('Page_Register/input_email'), 'newuniqueemail@example.com')
WebUI.setText(findTestObject('Page_Register/input_phone'), '081234567890') // Existing member Budi's phone
WebUI.setText(findTestObject('Page_Register/input_password'), 'Test123!')
WebUI.setText(findTestObject('Page_Register/input_confirmPassword'), 'Test123!')

WebUI.check(findTestObject('Page_Register/chk_agree'))
WebUI.click(findTestObject('Page_Register/btn_createAccount'))
WebUI.delay(2)

// Verification: Registration should fail and stay on register page
WebUI.verifyMatch(WebUI.getUrl(), '.*/register', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Register_Duplicate_Phone' + '.png')

WebUI.closeBrowser()