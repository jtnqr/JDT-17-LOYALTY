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

// Navigate to Rewards catalog page
WebUI.click(findTestObject('Page_Admin/link_rewardsTab'))

// Wait for catalog content to load
WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/btn_openCreateModal'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin/rewards', true)

// Open modal
WebUI.click(findTestObject('Page_AdminRewards/btn_openCreateModal'))

// Wait for modal form elements to appear
WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/input_name'), 5)

// Fill form details
WebUI.setText(findTestObject('Page_AdminRewards/input_name'), 'KFC Super Besar E2E Test')

// Select partner option (KFC Indonesia is usually index 1)
WebUI.selectOptionByIndex(findTestObject('Page_AdminRewards/select_partner'), 1)

WebUI.setText(findTestObject('Page_AdminRewards/input_pointsCost'), '150')

// Submit form
WebUI.click(findTestObject('Page_AdminRewards/btn_submitCreate'))

// Verify that the success alert pops up
WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/lbl_rewardCreatedSuccess'), 10)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Admin_Create_New_Reward' + '.png')

WebUI.closeBrowser()