let themeManager = null;
let settingsManager = null;

MicroModal.init();

$(document).on("ready", () => {

    /**
     * Banned Pages
     */
    {
        // noinspection HttpUrlsUsage
        if (window.location.href.includes("banredir.html") || window.location.href === "http://omegle.com/static/ban.html" || window.location.href.includes("ban.html")) {
            $("html")
                .load(browser.runtime.getURL("/resources/html/banned.html"))
                .css("background-color", "#17191a");
        }

    }

    /**
     * Not the main page
     */
    {
        if (window.location.pathname !== "/") {
            $("html")
                .css("visibility", "visible");
            return;
        }
    }

    /**
     * General Start-Up
     */
    {
        settingsManager = new SettingsManager();

        [
            ConfigManager,
            TopicSyncManager,
            ChatRegistry,
            PasteMenu,
            ChatManager,
            FilterManager,
            ConfirmManager,
            GreetingManager,
            ReconnectManager,
            AutoSkipManager,
            IPGrabberManager,
            UnmoderatedChatManager,
            VideoBlockerManager,
            VideoScreenshotManager,
            MuteMicrophoneManager,
            IPBlockingManager,
            WebRTCLeakHandling,
            SpeechEngineManager,
            FullScreenVideoManager,
            SplashImageHandler,
            ClearInterestsManager
        ].forEach((manager) => {
            try {
                manager.initialize();
            } catch (ex) {
                Logger.ERROR("A module failed to initialize, stack-trace below:");
                throw ex
            }
        })

    }

    /**
     * Load Theme Data
     */
    {

        let themeQuery = {}
        themeQuery[config.semiLightModeOption.getName()] = config.semiLightModeOption.getDefault();

        browser.storage.sync.get(themeQuery, (result) => {
            themeManager = new ThemeManager(config[result[config.semiLightModeOption.getName()]].getValue());
            themeManager.loadCurrentTheme();
            document.getElementsByTagName("html")[0].style.visibility = "visible";
        });
    }

    /**
     * Load Tips
     */
    {
        loadHelpfulTips();
    }

});

