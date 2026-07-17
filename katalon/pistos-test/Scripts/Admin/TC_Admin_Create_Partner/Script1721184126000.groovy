import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

String timestamp = System.currentTimeMillis().toString().substring(5)
String pName = "Starbucks " + timestamp
String pCode = "SBUX" + timestamp.substring(timestamp.length()-4)

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.ADMIN_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.ADMIN_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Wait for admin dashboard to be fully visible
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// Click partners tab in sidebar
WebUI.click(findTestObject('Page_Admin/link_partnersTab'))

// WAIT for the partners page content to load first to allow URL transition in Single Page Application
WebUI.waitForElementVisible(findTestObject('Page_AdminPartners/btn_openCreateModal'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin/partners', true)

WebUI.click(findTestObject('Page_AdminPartners/btn_openCreateModal'))

WebUI.waitForElementVisible(findTestObject('Page_AdminPartners/input_createName'), 5)
WebUI.setText(findTestObject('Page_AdminPartners/input_createName'), pName)
WebUI.setText(findTestObject('Page_AdminPartners/input_createCode'), pCode)
WebUI.setText(findTestObject('Page_AdminPartners/input_createPointsRate'), '2')
WebUI.setText(findTestObject('Page_AdminPartners/input_createExpiryDays'), '180')
WebUI.click(findTestObject('Page_AdminPartners/btn_submitCreate'))

WebUI.waitForElementVisible(findTestObject('Page_AdminPartners/btn_maybeLater'), 5)
WebUI.click(findTestObject('Page_AdminPartners/btn_maybeLater'))
WebUI.delay(2)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Create_Partner' + '.png')

WebUI.closeBrowser()