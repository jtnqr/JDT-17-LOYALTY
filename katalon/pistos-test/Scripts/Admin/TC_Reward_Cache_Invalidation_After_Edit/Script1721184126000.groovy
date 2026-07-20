import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.ADMIN_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.ADMIN_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

WebUI.waitForElementVisible(findTestObject('Page_Admin/lbl_performanceHeading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/admin', true)

WebUI.click(findTestObject('Page_Admin/link_rewardsTab'))
WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/lbl_rewardsHeading'), 10)
WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/btn_openCreateModal'), 10)

WebUI.click(findTestObject('Page_AdminRewards/btn_openCreateModal'))

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/input_name'), 5)
WebUI.setText(findTestObject('Page_AdminRewards/input_name'), 'Reward Edit Name Test')
WebUI.selectOptionByIndex(findTestObject('Page_AdminRewards/select_partner'), 1)
WebUI.setText(findTestObject('Page_AdminRewards/input_pointsCost'), '150')
WebUI.click(findTestObject('Page_AdminRewards/btn_submitCreate'))

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/lbl_rewardCreatedSuccess'), 10)
WebUI.delay(2)

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/btn_editFirstReward'), 10)
WebUI.click(findTestObject('Page_AdminRewards/btn_editFirstReward'))

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/input_editName'), 5)
WebUI.setText(findTestObject('Page_AdminRewards/input_editName'), 'Reward Edit Updated Name')
WebUI.click(findTestObject('Page_AdminRewards/btn_saveRewardChanges'))

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/lbl_rewardUpdatedSuccess'), 10)
WebUI.delay(2)

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Reward_Cache_Invalidation_After_Edit' + '.png')

WebUI.closeBrowser()
