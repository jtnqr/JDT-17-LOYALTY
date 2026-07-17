import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), 'wrong.email@example.com')
WebUI.setText(findTestObject('Page_Login/input_password'), 'WrongPassword123!')
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Verify that the error alert is displayed
WebUI.waitForElementVisible(findTestObject('Page_Login/lbl_loginError'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/login', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Login_Invalid_Credentials' + '.png')

WebUI.closeBrowser()