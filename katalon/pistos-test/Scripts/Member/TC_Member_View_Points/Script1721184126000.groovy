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

// Verify points balance cards are visible and contain numeric digit values (accepts changes from successive runs)
WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_heading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard', true)

WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_kfcBalance'), 10)
String kfcText = WebUI.getText(findTestObject('Page_Dashboard/lbl_kfcBalance'))
WebUI.verifyMatch(kfcText, '.*\\d+.*', true)

WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_mcdBalance'), 10)
String mcdText = WebUI.getText(findTestObject('Page_Dashboard/lbl_mcdBalance'))
WebUI.verifyMatch(mcdText, '.*\\d+.*', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Member_View_Points' + '.png')

WebUI.closeBrowser()