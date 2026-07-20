import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration

WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

WebUI.setText(findTestObject('Page_Login/input_email'), GlobalVariable.MEMBER_EMAIL)
WebUI.setText(findTestObject('Page_Login/input_password'), GlobalVariable.MEMBER_PASSWORD)
WebUI.click(findTestObject('Page_Login/btn_signIn'))

// Wait for login redirection to complete successfully
WebUI.waitForElementVisible(findTestObject('Page_Dashboard/lbl_heading'), 10)
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard', true)

WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/rewards')
WebUI.verifyMatch(WebUI.getUrl(), '.*/rewards', true)

// Click the first active reward catalog item directly (independent of brand)
WebUI.waitForElementVisible(findTestObject('Page_Rewards/card_firstReward'), 15)
WebUI.click(findTestObject('Page_Rewards/card_firstReward'))

WebUI.waitForElementVisible(findTestObject('Page_Rewards/btn_confirmRedeem'), 5)
WebUI.click(findTestObject('Page_Rewards/btn_confirmRedeem'))

// Verify that the redemption success screen is visible
WebUI.waitForElementVisible(findTestObject('Page_Rewards/lbl_rewardRedeemed'), 10)
WebUI.click(findTestObject('Page_Rewards/btn_doneRedeem'))

WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Member_Redeem_Reward' + '.png')

WebUI.closeBrowser()