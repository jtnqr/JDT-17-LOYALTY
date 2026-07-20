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

WebUI.click(findTestObject('Page_Admin/link_rewardsTab'))
WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/btn_editFirstReward'), 10)
WebUI.click(findTestObject('Page_AdminRewards/btn_editFirstReward'))

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/input_editName'), 5)
WebUI.setText(findTestObject('Page_AdminRewards/input_editName'), 'Updated Reward Name')
WebUI.click(findTestObject('Page_AdminRewards/btn_saveRewardChanges'))

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Reward_Edit_Update_Name' + '.png')

WebUI.closeBrowser()
