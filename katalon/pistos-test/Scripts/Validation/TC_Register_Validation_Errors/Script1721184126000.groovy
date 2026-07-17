import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/register')

// 1. Enter invalid email and short password to trigger client-side validation errors
WebUI.setText(findTestObject('Page_Register/input_name'), 'Tester E2E')
WebUI.setText(findTestObject('Page_Register/input_email'), 'invalid-email')
WebUI.setText(findTestObject('Page_Register/input_phone'), '08999999999')
WebUI.setText(findTestObject('Page_Register/input_password'), '123')
WebUI.setText(findTestObject('Page_Register/input_confirmPassword'), '123')

// Click submit (using the stable btn_createAccount object)
WebUI.click(findTestObject('Page_Register/btn_createAccount'))

// Verify that the validation error messages are visible on screen
WebUI.waitForElementVisible(findTestObject('Page_Register/lbl_emailError'), 10)
WebUI.waitForElementVisible(findTestObject('Page_Register/lbl_passwordError'), 10)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Register_Validation_Errors' + '.png')

WebUI.closeBrowser()