import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.MEMBER_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.MEMBER_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Wait for login redirection to complete successfully
WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_heading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard', true)

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/exchange')
WebUI.verifyMatch(WebUI.getUrl(), '.*/exchange', true)

WebUI.waitForElementVisible(findTestObject('Page_Exchange/input_exchangeAmount'), 15)
WebUI.setText(findTestObject('Page_Exchange/input_exchangeAmount'), '99999')

// In frontend, entering an amount higher than current balance automatically caps/clamps the input to max balance
String actualValue = WebUI.getAttribute(findTestObject('Page_Exchange/input_exchangeAmount'), 'value')
WebUI.verifyNotMatch(actualValue, '99999', false)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Exchange_Insufficient_Points' + '.png')

WebUI.closeBrowser()