import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration
import java.io.File

// Create a temp valid logo file (PNG)
File tempFile = File.createTempFile("test_partner_logo_valid", ".png")
byte[] pngBytes = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 213, 196, 205, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 97, 0, 2, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130] as byte[]
tempFile.withOutputStream { it.write(pngBytes) }
tempFile.deleteOnExit()

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

WebUI.waitForElementVisible(findTestObject('Page_AdminPartners/input_fileLogo'), 5)
WebUI.uploadFile(findTestObject('Page_AdminPartners/input_fileLogo'), tempFile.getAbsolutePath())

WebUI.delay(2)
WebUI.click(findTestObject('Page_AdminPartners/btn_savePartnerChanges'))

WebUI.delay(2)
WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Partner_Upload_Logo_Success' + '.png')

WebUI.closeBrowser()
