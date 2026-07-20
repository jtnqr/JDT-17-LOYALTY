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

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/history')
WebUI.verifyMatch(WebUI.getUrl(), '.*/history', true)

WebUI.waitForElementVisible(findTestObject('Page_History/item_firstTransaction'), 15)

// Deep content verification of the transaction row
String partnerName = WebUI.getText(findTestObject('Page_History/lbl_firstTxPartner'))
WebUI.verifyMatch(partnerName, '.+', true) // Should not be empty

String pointsValue = WebUI.getText(findTestObject('Page_History/lbl_firstTxPoints'))
WebUI.verifyMatch(pointsValue, '.*\\d+.*', true) // Should contain digits (e.g. +500 or -10)

WebUI.verifyElementNotPresent(findTestObject('Page_History/lbl_noTransactions'), 5)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Member_Transaction_History' + '.png')

WebUI.closeBrowser()