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

// Wait for admin login to complete successfully
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// 1. Try accessing member dashboard (should redirect back to /admin)
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/dashboard')
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// 2. Try accessing member exchange page (should redirect back to /admin)
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/exchange')
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// 3. Try accessing member rewards page (should redirect back to /admin)
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/rewards')
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// 4. Try accessing member history page (should redirect back to /admin)
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/history')
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Privacy_Restriction' + '.png')

WebUI.closeBrowser()