import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable
import com.kms.katalon.core.configuration.RunConfiguration
import java.io.File

// Create a temp oversized image file (> 2MB)
File tempFile = File.createTempFile("test_reward_oversized", ".png")
byte[] oversizedBytes = new byte[2 * 1024 * 1024 + 1024]
tempFile.withOutputStream { it.write(oversizedBytes) }
tempFile.deleteOnExit()

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

WebUI.waitForElementVisible(findTestObject('Page_AdminRewards/input_fileImage'), 5)
WebUI.uploadFile(findTestObject('Page_AdminRewards/input_fileImage'), tempFile.getAbsolutePath())

WebUI.delay(2)
WebUI.takeScreenshot(RunConfiguration.getProjectDir() + '/Screenshots/' + 'TC_Reward_Upload_Image_Exceeds_Size' + '.png')

WebUI.closeBrowser()
