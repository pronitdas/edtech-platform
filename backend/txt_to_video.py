from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import os
import glob

def get_filename():
    # Path to your Downloads folder
    # downloads_folder = os.path.expanduser("~/Downloads")
    downloads_folder = os.path.expanduser(".")

    # Get all files with 'testfile' in the name
    testfile_pattern = os.path.join(downloads_folder, "*invideo*")
    testfiles = glob.glob(testfile_pattern)

    # Check if there are any matching files
    if not testfiles:
        print("No files found with 'testfile' in the name.")
        return ""
    else:
        # Get the latest file by modification time
        latest_file = max(testfiles, key=os.path.getmtime).strip("./")
        print("Latest file:", latest_file)
        return latest_file

def get_driver():
    """
    Create and configure a Chrome WebDriver for automated web browsing.

    Returns:
    - WebDriver: An instance of the Chrome WebDriver configured with options for detached mode, window size (1920x1080), and maximized window.

    Example:
    ```python
    driver = get_driver()
    driver.get("https://example.com")
    """
    chrome_options = Options()
    # chrome_options.add_experimental_option("detach", True)
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    # chrome_options.add_argument("--headless")

    driver = webdriver.Chrome(options=chrome_options)
    driver.set_window_size(1920, 1080)
    driver.maximize_window()
    return driver

def generate_video(txt = "There was a fearce lion in the jungle. He used to kill lot of animals. Then he became very kind."):
    try:
        driver = get_driver()
        url = "https://ai.invideo.io/"
        driver.get(url)
        wait = WebDriverWait(driver, 300)  # Wait up to 60 seconds for elements to appear

        print("1")
        # Wait for the prompt input box to be clickable
        prompt_box = wait.until(EC.element_to_be_clickable((By.XPATH,"/html/body/div[1]/div/div[1]/div[3]/div/div[1]/div[1]/div[1]/div/form/div[1]/textarea")))
        print("2")
        # Enter your prompt
        prompt_box.send_keys(txt)
        print("3")
        # Click the 'Create' or 'Generate' button
        generate_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[1]/div/div[1]/div[3]/div/div[1]/div[1]/div[1]/div/form/div[2]/button")))
        generate_button.click()

        print("3.1")
        # Click on continue button
        continue_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='root']/div/div[1]/div[3]/div/div[1]/div/div/div/div[2]/div/div[2]/div/button")))
        continue_button.click()
        print("4")
        # Wait for the download button to appear
        download_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div/div/div[1]/div[3]/div/div[1]/div/div/div/div[4]/div/div[1]/div[2]/button[2]/div")))
        # Click the download button
        download_button.click()
        print("5")
        # Wait for the stock watermark button to appear
        stock_watermark_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[3]/div/div[3]/div/div[1]/div/button[1]/p")))
        # Click the stock watermark button
        stock_watermark_button.click()
        print("6")
        # Wait for the branding button to appear
        normal_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[3]/div/div[3]/div/div[2]/div/button[1]/p")))
        # Click the download button
        normal_button.click()
        print("7")
        # Wait for the 480p button to appear
        pixel_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[3]/div/div[3]/div/div[3]/div/button[1]/p")))
        # Click the download button
        pixel_button.click()
        print("8")
        # Wait for continue button to appear
        download_continue_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[3]/div/div[5]/div[2]/button/p")))
        # Click the download button
        download_continue_button.click()
        print("9")
        # Wait for the download button to appear
        download_button = wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div/div/div[1]/div[3]/div/div/div[1]/div[3]/div[2]/div[2]/button[1]/div")))
        # Click the download button
        download_button.click()
        return get_filename()
    except Exception as e:
        print("Error while downloading the video : ", e)
        return ""


    # %%
    # /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/ChromeAutomation"


