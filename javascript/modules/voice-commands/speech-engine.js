class ChromegleSpeechEngine {

    #engineSupported;
    #engine;
    #wakeWords;
    #engineActive;
    #commandEventName;

    constructor(wakeWords, commandEventName) {
        this.#wakeWords = wakeWords;
        this.#commandEventName = commandEventName;
        this.#engineSupported = this.#buildEngine();
    }

    #buildEngine() {
        try {
            // noinspection JSUnresolvedVariable
            this.#engine = new (window.webkitSpeechRecognition || window.speechRecognition || window.SpeechRecognition);
        } catch (ex) {

        }

        if (!this.#engine) {
            return false;
        }


        this.#engine.continuous = true;
        this.#engine.interimResults = false;
        this.#engine.lang = "en-US";
        this.#engine.onstart = () => ChromegleSpeechEngine.#onStart(this);
        this.#engine.onend = () => ChromegleSpeechEngine.#onEnd(this);
        this.#engine.onresult = (event) => ChromegleSpeechEngine.#onResult(this, event);

        return true;
    }

    start() {

        if (!this.#engineSupported) {
            setTimeout(() => {
                alert("Voice Commands are NOT supported on your browser, please disable the setting or use a supported browser.")
                Logger.ERROR("This browser does NOT support the speech engine and Voice Commands should be disabled in Chromegle's settings.");
            }, 150);
            return;
        }

        if (!this.#engineActive) {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(() => Logger.INFO("Microphone permission enabled, started Chromegle Speech Engine"))
                .catch(() => Logger.ERROR("Microphone permission rejected, Chromegle Speech Engine will not work"));
        }

        this.#engineActive = true;
        this.#engine.start();
    }

    stop() {
        if (!this.#engineSupported) {
            return;
        }

        Logger.INFO("Stopped Chromegle Speech Engine");
        this.#engineActive = false;
        this.#engine.stop();
    }

    isActive() {
        return this.#engineActive;
    }

    addWakeWord(word) {
        this.#wakeWords.push(word);
    }

    removeWakeWord(word) {
        const index = this.#wakeWords.indexOf(word);
        if (index >= 0) this.#wakeWords.splice(index, 1);
    }

    getWakeWords() {
        return this.#wakeWords;
    }

    getCommandEventName() {
        return this.#commandEventName;
    }

    static #onStart(self) {
    }

    static #onEnd(self) {
        if (self.isActive()) {
            self.start();
        }
    }

    static #onResult(self, event, result = "", request = null) {

        // If not a result
        if (event.type !== "result") return;

        // Build result string
        for (let phrase of event.results[event.resultIndex]) {
            result += phrase.transcript;
        }

        // Lowercase it
        result = result.toLowerCase();

        // Parse message for command using wake word
        for (let testCase of self.getWakeWords()) {
            let indexOf = result.indexOf(testCase)
            if ((indexOf >= 0)) {
                request = result.substr(indexOf + testCase.length, result.length).trim();
                break;
            }
        }

        // No command found
        if (request == null || request.length < 1) {
            return;
        }

        // Dispatch command
        SpeechEngineManager.handleCommand(request);

    }

}


const SpeechEngineManager = {

    engine: null,
    wakeWords: ["omegle", "amigo", "omigo"],
    commandEventName: "speechEngineCommand",
    intents: [],

    initialize() {
        this.engine = new ChromegleSpeechEngine(this.wakeWords, this.commandEventName);
        document.addEventListener("pageStarted", () => this._pageStarted());
        document.addEventListener("storageSettingsUpdate", (event) => this._storageUpdate(event));
        SpeechMenu.initialize();

        this.intents.push(
            new SkipIntentHandler(),
            new StopIntentHandler(),
            new StartIntentHandler(),
            new MessageIntentHandler()
        );

    },

    handleCommand(utterance) {

        for (let intent of this.intents) {
            if (intent.canHandle(utterance)) {
                Logger.INFO(`Executed the <%s> voice command intent handler`, intent.getName());
                intent.handle(utterance);
                return;
            }
        }

        Logger.DEBUG("Received a voice command that did not map to an intent <%s>", utterance);

    },

    _storageUpdate(detail) {
        const keys = Object.keys(detail["detail"]);

        if (keys.includes(config.voiceCommandToggle.getName())) {
            if (detail["detail"][config.voiceCommandToggle.getName()] === "true") {
                if (ChatRegistry.pageStarted()) {
                    SpeechEngineManager.engine.start();
                }
            } else {
                SpeechEngineManager.engine.stop();
            }
        }

    },

    _pageStarted() {

        if (config.voiceCommandToggle.getLocalValue() === "true") {
            SpeechEngineManager.engine.start();
        }

    }


}

const SpeechMenu = {

    settingsModal: undefined,
    settingsModalElementId: "modal-4",

    initialize() {
        SpeechMenu.settingsModal = document.createElement("div");
        $(SpeechMenu.settingsModal).load(getResourceURL("resources/html/voicecmds.html"));
        $("html").append(SpeechMenu.settingsModal);
    },

    loadMenu(noChange) {
        if (noChange) return;
        settingsManager.disable();
        SpeechMenu.enable();
    },

    enable() {
        MicroModal.show(SpeechMenu.settingsModalElementId)
    },

    disable() {
        MicroModal.hide(SpeechMenu.settingsModalElementId)
    }

}
