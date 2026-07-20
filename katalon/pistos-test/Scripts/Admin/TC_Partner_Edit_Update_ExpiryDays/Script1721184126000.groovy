import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.configuration.RunConfiguration
import internal.GlobalVariable as GlobalVariable

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.ADMIN_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.ADMIN_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)

WebUI.click(findTestObject('Page_Admin/link_partnersTab'))
WebUI.waitForElementVisible(findTestObject('Page_AdminPartners/btn_editFirstPartner'), 10)

WebUI.click(findTestObject('Page_AdminPartners/btn_editFirstPartner'))
WebUI.waitForElementVisible(findTestObject('Page_AdminPartners/input_createExpiryDays'), 5)
WebUI.setText(findTestObject('Page_AdminPartners/input_createExpiryDays'), '365')
WebUI.click(findTestObject('Page_AdminPartners/btn_savePartnerChanges'))

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Partner_Edit_Update_ExpiryDays' + '.png')

WebUI.closeBrowser()
