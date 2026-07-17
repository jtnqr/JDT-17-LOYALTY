import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.MEMBER_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.MEMBER_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Wait for login redirection to complete successfully
WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_heading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard', true)

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/history')
WebUI.verifyMatch(WebUI.getUrl(), '.*/history', true)

WebUI.waitForElementVisible(findTestObject('Page_History/item_firstTransaction'), 15)
WebUI.verifyElementNotPresent(findTestObject('Page_History/lbl_noTransactions'), 10)

WebUI.closeBrowser()
