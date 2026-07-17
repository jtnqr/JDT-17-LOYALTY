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

// Navigate to Exchange tab
WebUI.click(findTestObject('Page_Admin/link_exchangeTab'))

// Wait for configuration table to load
WebUI.waitForElementVisible(findTestObject('Page_AdminExchange/btn_configureKfc'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin/exchange', true)

// Select KFC and configure rates
WebUI.click(findTestObject('Page_AdminExchange/btn_configureKfc'))

// Wait for details inputs to appear
WebUI.waitForElementVisible(findTestObject('Page_AdminExchange/input_kfcToMcdRate'), 10)

// Set KFC -> McD rate
WebUI.setText(findTestObject('Page_AdminExchange/input_kfcToMcdRate'), '0.85')

// Set McD -> KFC rate
WebUI.setText(findTestObject('Page_AdminExchange/input_mcdToKfcRate'), '0.95')

// Click save
WebUI.click(findTestObject('Page_AdminExchange/btn_savePairRates'))

// Verify success state (Saved! text appears on the button)
WebUI.waitForElementVisible(findTestObject('Page_AdminExchange/btn_savePairRates'), 5)
WebUI.verifyMatch(WebUI.getText(findTestObject('Page_AdminExchange/btn_savePairRates')), '.*Saved!.*', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Configure_Exchange_Rate' + '.png')

WebUI.closeBrowser()