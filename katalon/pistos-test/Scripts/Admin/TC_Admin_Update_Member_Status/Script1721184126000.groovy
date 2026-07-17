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

// Wait for admin dashboard to be fully visible
WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

// Click members tab in sidebar
WebUI.click(findTestObject('Page_Admin/link_membersTab'))

// WAIT for the members page content to load first to allow URL transition in Single Page Application
WebUI.waitForElementVisible(findTestObject('Page_AdminMembers/btn_editFirstMember'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin/members', true)

// Edit the SECOND member (not Budi Santoso, who is the first) to prevent session lock/invalidation on Budi's account
WebUI.click(findTestObject('Page_AdminMembers/btn_editSecondMember'))

WebUI.waitForElementVisible(findTestObject('Page_AdminMembers/select_status'), 5)
WebUI.selectOptionByValue(findTestObject('Page_AdminMembers/select_status'), 'INACTIVE', false)
WebUI.click(findTestObject('Page_AdminMembers/btn_saveChanges'))
WebUI.delay(2)

// Change back to ACTIVE to preserve seed data status
WebUI.waitForElementVisible(findTestObject('Page_AdminMembers/btn_editSecondMember'), 10)
WebUI.click(findTestObject('Page_AdminMembers/btn_editSecondMember'))

WebUI.waitForElementVisible(findTestObject('Page_AdminMembers/select_status'), 5)
WebUI.selectOptionByValue(findTestObject('Page_AdminMembers/select_status'), 'ACTIVE', false)
WebUI.click(findTestObject('Page_AdminMembers/btn_saveChanges'))
WebUI.delay(2)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Update_Member_Status' + '.png')

WebUI.closeBrowser()