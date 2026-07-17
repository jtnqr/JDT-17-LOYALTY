import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.ADMIN_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.ADMIN_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Wait for Admin dashboard
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)

// Navigate directly to Transactions directory URL
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/admin/transactions')

// Verify that the privacy restriction active warning banner is fully visible
WebUI.waitForElementVisible(findTestObject('Page_AdminTransactions/lbl_privacyAlert'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin/transactions', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Verify_Transaction_Privacy_Restriction' + '.png')

WebUI.closeBrowser()