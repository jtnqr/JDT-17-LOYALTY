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

WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// Verify Download PDF button is visible and click it
WebUI.waitForElementVisible(findTestObject('Page_Admin/btn_downloadPDF'), 10)
WebUI.verifyElementPresent(findTestObject('Page_Admin/btn_downloadPDF'), 10)
WebUI.click(findTestObject('Page_Admin/btn_downloadPDF'))

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Export_PDF_Dashboard' + '.png')

WebUI.closeBrowser()
