import type { AppLanguage } from "../types/app";

export interface AppText {
  addApiKeyPrompt: string;
  aiTheme: string;
  analyze: string;
  askAboutAttachedFiles: string;
  attachmentReady: string;
  attachments: string;
  autoSpeak: string;
  builtInDesktopAiActive: string;
  builtInDesktopAiDescription: string;
  captureScreen: string;
  capturedScreenAlt: string;
  chat: string;
  clearSelection: string;
  close: string;
  compactDesktop: string;
  compactSettings: string;
  copyCode: string;
  copyMessage: string;
  createImage: string;
  currentModelCatalog: string;
  customApiUrl: string;
  customApiUrlDescription: string;
  customModelId: string;
  dark: string;
  deleteChat: string;
  desktopAiUnavailable: string;
  downloadImage: string;
  dragToAnalyze: string;
  editMessage: string;
  emptyChatDescription: string;
  emptyChatTitle: string;
  enterAnotherModelId: string;
  errorPrefix: string;
  fileReadyToSend: string;
  imagesLibrary: string;
  language: string;
  light: string;
  memory: string;
  messages: string;
  microphoneAccessFailed: string;
  inputDevice: string;
  outputDevice: string;
  inputVolume: string;
  defaultDevice: string;
  outputDeviceUnsupported: string;
  noImagesYet: string;
  model: string;
  betaVersion: string;
  protectedAiLayer: string;
  protectedAiLayerDescription: string;
  modelPickerDescription: string;
  modelPickerTitle: string;
  newChat: string;
  newSession: string;
  openAiApiKey: string;
  optionalSystemPrompt: string;
  pasteOpenAiApiKey: string;
  recentChats: string;
  readyForQuestions: string;
  recaptureScreen: string;
  removeAttachment: string;
  renameChat: string;
  save: string;
  screenAssistant: string;
  screenAssistantDescription: string;
  liveScreenShare: string;
  liveScreenShareDescription: string;
  liveScreenActive: string;
  liveScreenWatching: string;
  liveScreenVoiceReplies: string;
  liveScreenMicQuestion: string;
  liveScreenAskPlaceholder: string;
  liveScreenWaitingFrame: string;
  liveScreenLatestQuestion: string;
  liveScreenLatestAnswer: string;
  liveScreenAnswerPlaceholder: string;
  liveScreenAnswersAlsoInChat: string;
  liveScreenSession: string;
  liveScreenSessionOnly: string;
  screenSelectionDescription: string;
  screenSelectionTitle: string;
  searchChats: string;
  searchNoResults: string;
  searchNoResultsTitle: string;
  searchNoResultsDescription: string;
  selectModel: string;
  send: string;
  settings: string;
  sizeLabel: string;
  speakResponse: string;
  startByTyping: string;
  stopGenerating: string;
  stopRecording: string;
  supportedFileError: string;
  systemPrompt: string;
  tasks: string;
  temperature: string;
  theme: string;
  tools: string;
  additionalTools: string;
  moreToolsSoon: string;
  transcribing: string;
  tryAnotherModel: string;
  terminalAllow: string;
  terminalAllowOnce: string;
  terminalAllowSession: string;
  terminalAllowed: string;
  terminalApprovalSession: string;
  terminalApprovalMode: string;
  terminalApprovalAlways: string;
  terminalApprovalAsk: string;
  terminalCompleted: string;
  terminalCommand: string;
  terminalDeny: string;
  terminalDenied: string;
  terminalFailed: string;
  terminalFiles: string;
  terminalCopied: string;
  terminalCopyLogs: string;
  terminalCurrentShell: string;
  terminalErrorLogs: string;
  terminalAnalyzeError: string;
  terminalCompact: string;
  terminalOpenConsole: string;
  terminalNoFiles: string;
  terminalOutput: string;
  terminalPrepared: string;
  terminalRunning: string;
  terminalShow: string;
  terminalStarting: string;
  terminalStopped: string;
  terminalStopping: string;
  terminalExpand: string;
  terminalRestart: string;
  terminalShell: string;
  terminalShellCmd: string;
  terminalShellPowershell: string;
  terminalStop: string;
  terminalWorkingDirectory: string;
  uploadAFile: string;
  uploadFile: string;
  voice: string;
  voiceToText: string;
  voiceChatConversation: string;
  voiceChatDescription: string;
  voiceChatError: string;
  voiceChatHeard: string;
  voiceChatHint: string;
  voiceChatLive: string;
  voiceChatListening: string;
  voiceChatReady: string;
  voiceChatReply: string;
  voiceChatResume: string;
  voiceChatSpeaking: string;
  voiceChatStart: string;
  voiceChatThinking: string;
  voiceChatTitle: string;
  voiceChatTranscribing: string;
  endVoiceChat: string;
  voiceHelp: string;
  voiceInputError: string;
  voiceMode: string;
  whatShouldFocus: string;
  webSearch: string;
  writeMessage: string;
  imageGenerated: string;
  preview: string;
  previewUnavailable: string;
}

const textByLanguage: Record<AppLanguage, AppText> = {
  en: {
    addApiKeyPrompt: "Add your OpenAI API key in Settings to use the built-in desktop AI.",
    aiTheme: "AI theme",
    analyze: "Analyze",
    askAboutAttachedFiles: "Use the attached file context below when answering.",
    attachmentReady: "Attached and ready",
    attachments: "Attachments",
    autoSpeak: "Auto-speak",
    builtInDesktopAiActive: "Built-in desktop AI is active.",
    builtInDesktopAiDescription: "Required for the built-in desktop AI. The key stays on this device.",
    captureScreen: "Capture Screen",
    capturedScreenAlt: "Captured screen",
    chat: "Chat",
    clearSelection: "Clear Selection",
    close: "Close",
    compactDesktop: "Compact Desktop",
    compactSettings: "Compact app controls",
    copyCode: "Copy code",
    copyMessage: "Copy message",
    createImage: "Create image",
    currentModelCatalog: "Choose from the current GPT catalog or type your own model ID below.",
    customApiUrl: "Custom API URL (optional)",
    customApiUrlDescription: "Custom NovaMind API URL is active.",
    customModelId: "Custom model ID",
    dark: "Dark",
    deleteChat: "Delete chat",
    desktopAiUnavailable: "Desktop AI commands are only available inside the app.",
    downloadImage: "Download image",
    dragToAnalyze: "Drag a rectangle over the captured screen to analyze a specific region.",
    editMessage: "Edit message",
    emptyChatDescription: "Write a prompt and keep everything in one clean chat flow.",
    emptyChatTitle: "Start chatting with NovaMind",
    enterAnotherModelId: "Enter another model ID",
    errorPrefix: "Error",
    fileReadyToSend: "This file will be sent with your next message.",
    imagesLibrary: "Images",
    language: "Language",
    light: "Light",
    memory: "Memory",
    messages: "messages",
    microphoneAccessFailed: "Microphone access failed.",
    inputDevice: "Input device",
    outputDevice: "Output device",
    inputVolume: "Input volume",
    defaultDevice: "System default",
    outputDeviceUnsupported: "Output device selection is not supported in this environment.",
    noImagesYet: "Generated images will appear here.",
    model: "Model",
    betaVersion: "Beta Version",
    protectedAiLayer: "Protected AI layer",
    protectedAiLayerDescription:
      "NovaMind now routes requests through protected backend channels. API secrets are no longer configured from the UI.",
    modelPickerDescription: "Choose from the current GPT catalog or type your own model ID below.",
    modelPickerTitle: "Select a model",
    newChat: "New chat",
    newSession: "New Session",
    openAiApiKey: "OpenAI API key",
    optionalSystemPrompt: "Optional guidance for how NovaMind should answer.",
    pasteOpenAiApiKey: "Paste your OpenAI API key",
    recentChats: "Recent chats",
    readyForQuestions: "I've read the attached file(s) and I'm ready for your questions.",
    recaptureScreen: "Recapture Screen",
    removeAttachment: "Remove attachment",
    renameChat: "Rename chat",
    save: "Save",
    screenAssistant: "Screen Assistant",
    screenAssistantDescription: "Capture the screen, select an area, and tell NovaMind what to focus on.",
    liveScreenShare: "Live screen share",
    liveScreenShareDescription: "Share your screen live and ask NovaMind what it sees right now.",
    liveScreenActive: "Share active",
    liveScreenWatching: "AI watching",
    liveScreenVoiceReplies: "Voice replies",
    liveScreenMicQuestion: "Ask with mic",
    liveScreenAskPlaceholder: "Ask about what is on this screen right now...",
    liveScreenWaitingFrame: "NovaMind is still locking onto your shared screen. Try again in a moment.",
    liveScreenLatestQuestion: "Latest question",
    liveScreenLatestAnswer: "Latest answer",
    liveScreenAnswerPlaceholder: "NovaMind's screen-aware answer will appear here.",
    liveScreenAnswersAlsoInChat: "Each answer is also added to the main chat.",
    liveScreenSession: "Screen share session",
    liveScreenSessionOnly: "This conversation stays inside the live screen share panel.",
    screenSelectionDescription:
      "Capture the current display, then draw a region over the preview. NovaMind will send that cropped image to the vision model and explain what it sees.",
    screenSelectionTitle: "Screen selection tool",
    searchChats: "Search chats and messages...",
    searchNoResults: "No conversations match this search yet.",
    searchNoResultsTitle: "No messages found",
    searchNoResultsDescription:
      "Try another keyword or clear the search to see the full conversation again.",
    selectModel: "Select a model",
    send: "Send",
    settings: "Settings",
    sizeLabel: "Size",
    speakResponse: "Speak response",
    startByTyping: "Ask NovaMind...",
    stopGenerating: "Stop",
    stopRecording: "Stop recording",
    supportedFileError:
      "The current protected desktop pipeline supports TXT, MD, and DOCX files. PDF support is coming next.",
    systemPrompt: "System prompt",
    tasks: "Tasks",
    temperature: "Temperature",
    theme: "Theme",
    tools: "Tools",
    additionalTools: "Additional tools",
    moreToolsSoon: "More NovaMind tools will appear here soon.",
    transcribing: "Transcribing...",
    tryAnotherModel: "If your model is unavailable for this key, try gpt-4o-mini.",
    terminalAllow: "Allow",
    terminalAllowOnce: "Allow once",
    terminalAllowSession: "Allow for session",
    terminalAllowed: "Allowed",
    terminalApprovalSession: "Allow for this session",
    terminalApprovalMode: "Terminal approval",
    terminalApprovalAlways: "Always allow",
    terminalApprovalAsk: "Ask every time",
    terminalCompleted: "Completed",
    terminalCommand: "Terminal command",
    terminalDeny: "Deny",
    terminalDenied: "Denied",
    terminalFailed: "Failed",
    terminalFiles: "Files",
    terminalCopied: "Copied",
    terminalCopyLogs: "Copy logs",
    terminalCurrentShell: "Current shell",
    terminalErrorLogs: "Error logs",
    terminalAnalyzeError: "Analyze with AI",
    terminalCompact: "Compact",
    terminalOpenConsole: "Open console",
    terminalNoFiles: "No files detected yet.",
    terminalOutput: "Terminal output",
    terminalPrepared: "I prepared a terminal command you can approve below.",
    terminalRunning: "Running",
    terminalShow: "Show terminal",
    terminalStarting: "Starting",
    terminalStopped: "Stopped",
    terminalStopping: "Stopping",
    terminalExpand: "Expand",
    terminalRestart: "Run again",
    terminalShell: "Terminal shell",
    terminalShellCmd: "Command Prompt (CMD)",
    terminalShellPowershell: "PowerShell",
    terminalStop: "Stop",
    terminalWorkingDirectory: "Working directory",
    uploadAFile: "Upload a file",
    uploadFile: "Upload file",
    voice: "Voice",
    voiceToText: "Speech to text",
    voiceChatConversation: "Live conversation",
    voiceChatDescription: "Hands-free loop with live listening, spoken replies, and a focused voice-first layout.",
    voiceChatError: "Voice chat hit an error.",
    voiceChatHeard: "Last thing NovaMind heard",
    voiceChatHint: "NovaMind listens for your voice, thinks, speaks back, and returns to listening until you end the session.",
    voiceChatLive: "Voice chat live",
    voiceChatListening: "Listening",
    voiceChatReady: "Ready",
    voiceChatReply: "Latest reply",
    voiceChatResume: "Listen again",
    voiceChatSpeaking: "Speaking",
    voiceChatStart: "Start voice chat",
    voiceChatThinking: "Thinking",
    voiceChatTitle: "Voice Chat",
    voiceChatTranscribing: "Transcribing",
    endVoiceChat: "End session",
    voiceHelp: "Record a prompt, transcribe it, and send it straight into the assistant.",
    voiceInputError: "Voice transcription failed.",
    voiceMode: "Talk to NovaMind",
    whatShouldFocus: "What should NovaMind focus on?",
    webSearch: "Web search",
    writeMessage: "Write a prompt and keep everything in one clean chat flow.",
    imageGenerated: "Here is your generated image.",
    preview: "Preview",
    previewUnavailable: "Preview unavailable for this file."
  },
  tr: {
    addApiKeyPrompt: "Dahili masaustu yapay zekayi kullanmak icin Ayarlar bolumune OpenAI API key ekleyin.",
    aiTheme: "AI temasi",
    analyze: "Analiz et",
    askAboutAttachedFiles: "Yaniti verirken asagidaki ek dosya icerigini kullan.",
    attachmentReady: "Ek dosya hazir",
    attachments: "Ekler",
    autoSpeak: "Otomatik seslendir",
    builtInDesktopAiActive: "Dahili masaustu AI aktif.",
    builtInDesktopAiDescription: "Dahili masaustu AI icin gerekir. Anahtar bu cihazda kalir.",
    captureScreen: "Ekrani yakala",
    capturedScreenAlt: "Yakalanan ekran",
    chat: "Sohbet",
    clearSelection: "Secimi temizle",
    close: "Kapat",
    compactDesktop: "Kompakt Masaustu",
    compactSettings: "Kompakt uygulama ayarlari",
    copyCode: "Kodu kopyala",
    copyMessage: "Mesaji kopyala",
    createImage: "Gorsel olustur",
    currentModelCatalog: "Guncel GPT katalogundan secin veya kendi model kimliginizi yazin.",
    customApiUrl: "Ozel API URL'si (opsiyonel)",
    customApiUrlDescription: "Ozel NovaMind API URL'si aktif.",
    customModelId: "Ozel model kimligi",
    dark: "Koyu",
    deleteChat: "Sohbeti sil",
    desktopAiUnavailable: "Masaustu AI komutlari yalnizca uygulama icinde kullanilabilir.",
    downloadImage: "Gorseli indir",
    dragToAnalyze: "Belirli bir bolgeyi analiz etmek icin yakalanan ekran uzerinde bir alan surukleyin.",
    editMessage: "Mesaji duzenle",
    emptyChatDescription: "Bir istem yazin ve her seyi tek bir temiz sohbet akisinda yonetin.",
    emptyChatTitle: "NovaMind ile sohbete basla",
    enterAnotherModelId: "Baska bir model kimligi girin",
    errorPrefix: "Hata",
    fileReadyToSend: "Bu dosya bir sonraki mesajinizla birlikte gonderilecek.",
    imagesLibrary: "Gorseller",
    language: "Dil",
    light: "Acik",
    memory: "Hafiza",
    messages: "mesaj",
    microphoneAccessFailed: "Mikrofon erisimi basarisiz oldu.",
    inputDevice: "Giris cihazi",
    outputDevice: "Cikis cihazi",
    inputVolume: "Giris seviyesi",
    defaultDevice: "Sistem varsayilani",
    outputDeviceUnsupported: "Bu ortamda cikis cihazi secimi desteklenmiyor.",
    noImagesYet: "Olusturulan gorseller burada gorunecek.",
    model: "Model",
    betaVersion: "Beta Surum",
    protectedAiLayer: "Korumali AI katmani",
    protectedAiLayerDescription:
      "NovaMind artik istekleri korumali backend kanallarindan gecirir. API gizli bilgileri arayuzden ayarlanmaz.",
    modelPickerDescription: "Guncel GPT katalogundan secin veya kendi model kimliginizi yazin.",
    modelPickerTitle: "Model secin",
    newChat: "Yeni sohbet",
    newSession: "Yeni Oturum",
    openAiApiKey: "OpenAI API key",
    optionalSystemPrompt: "NovaMind'in nasil cevap vermesi gerektigi icin opsiyonel yonlendirme.",
    pasteOpenAiApiKey: "OpenAI API key girin",
    recentChats: "Son sohbetler",
    readyForQuestions: "Eklenen dosyalari okudum, artik sorularinizi yanitlamaya hazirim.",
    recaptureScreen: "Ekrani yeniden yakala",
    removeAttachment: "Eki kaldir",
    renameChat: "Sohbeti yeniden adlandir",
    save: "Kaydet",
    screenAssistant: "Ekran Asistani",
    screenAssistantDescription: "Ekrani yakalayin, bir alan secin ve NovaMind'in neye odaklanmasi gerektigini yazin.",
    liveScreenShare: "Canli ekran paylasimi",
    liveScreenShareDescription: "Ekraninizi canli paylasin ve NovaMind'e o an ne gordugunu sorun.",
    liveScreenActive: "Paylasim aktif",
    liveScreenWatching: "AI izliyor",
    liveScreenVoiceReplies: "Sesli yanitlar",
    liveScreenMicQuestion: "Mikrofonla sor",
    liveScreenAskPlaceholder: "Bu ekranda su an ne oldugunu sor...",
    liveScreenWaitingFrame: "NovaMind paylasilan ekrani henuz alamadi. Bir an sonra tekrar deneyin.",
    liveScreenLatestQuestion: "Son soru",
    liveScreenLatestAnswer: "Son yanit",
    liveScreenAnswerPlaceholder: "NovaMind'in ekrani gorerek uretecegi yanit burada gorunecek.",
    liveScreenAnswersAlsoInChat: "Her yanit ana sohbete de eklenir.",
    liveScreenSession: "Ekran paylasim oturumu",
    liveScreenSessionOnly: "Bu konusma yalnizca canli ekran paylasim panelinde kalir.",
    screenSelectionDescription:
      "Mevcut ekrani yakalayin, sonra onizleme uzerinde bir bolge cizin. NovaMind bu kirpilmis goruntuyu vision modele gonderip gordugunu aciklar.",
    screenSelectionTitle: "Ekran secim araci",
    searchChats: "Sohbet ve mesajlarda ara...",
    searchNoResults: "Bu aramaya uyan sohbet bulunamadi.",
    searchNoResultsTitle: "Mesaj bulunamadi",
    searchNoResultsDescription:
      "Farkli bir anahtar kelime deneyin veya tam konusmayi gormek icin aramayi temizleyin.",
    selectModel: "Model secin",
    send: "Gonder",
    settings: "Ayarlar",
    sizeLabel: "Boyut",
    speakResponse: "Yaniti seslendir",
    startByTyping: "NovaMind'e sor...",
    stopGenerating: "Durdur",
    stopRecording: "Kaydi durdur",
    supportedFileError:
      "Mevcut korumali masaustu hatti su an TXT, MD ve DOCX destekler. PDF destegi yakinda gelecek.",
    systemPrompt: "Sistem istemi",
    tasks: "Gorevler",
    temperature: "Sicaklik",
    theme: "Tema",
    tools: "Araclar",
    additionalTools: "Ek araclar",
    moreToolsSoon: "Yakinda burada daha fazla NovaMind araci olacak.",
    transcribing: "Yaziya cevriliyor...",
    tryAnotherModel: "Bu anahtar icin model kullanilamiyorsa gpt-4o-mini deneyin.",
    terminalAllow: "Izin ver",
    terminalAllowOnce: "Bir kez izin ver",
    terminalAllowSession: "Oturum boyunca izin ver",
    terminalAllowed: "Izin verildi",
    terminalApprovalSession: "Bu oturum icin izin ver",
    terminalApprovalMode: "Terminal izni",
    terminalApprovalAlways: "Her zaman izin ver",
    terminalApprovalAsk: "Her seferinde sor",
    terminalCompleted: "Tamamlandi",
    terminalCommand: "Terminal komutu",
    terminalDeny: "Reddet",
    terminalDenied: "Reddedildi",
    terminalFailed: "Basarisiz",
    terminalFiles: "Dosyalar",
    terminalCopied: "Kopyalandi",
    terminalCopyLogs: "Loglari kopyala",
    terminalCurrentShell: "Aktif shell",
    terminalErrorLogs: "Hata loglari",
    terminalAnalyzeError: "AI ile analiz et",
    terminalCompact: "Kucult",
    terminalOpenConsole: "Konsolu ac",
    terminalNoFiles: "Henuz dosya algilanmadi.",
    terminalOutput: "Terminal cikti",
    terminalPrepared: "Asagida onaylayabileceginiz bir terminal komutu hazirladim.",
    terminalRunning: "Calisiyor",
    terminalShow: "Terminali goster",
    terminalStarting: "Baslatiliyor",
    terminalStopped: "Durduruldu",
    terminalStopping: "Durduruluyor",
    terminalExpand: "Genislet",
    terminalRestart: "Tekrar calistir",
    terminalShell: "Terminal shell",
    terminalShellCmd: "Komut Istemi (CMD)",
    terminalShellPowershell: "PowerShell",
    terminalStop: "Durdur",
    terminalWorkingDirectory: "Calisma klasoru",
    uploadAFile: "Dosya yukle",
    uploadFile: "Dosya yukle",
    voice: "Ses",
    voiceToText: "Konusmayi yaziya cevir",
    voiceChatConversation: "Canli konusma",
    voiceChatDescription: "Canli dinleme, sesli yanitlar ve odakli bir ses modu arayuzu.",
    voiceChatError: "Sesli sohbet bir hatayla karsilasti.",
    voiceChatHeard: "NovaMind'in son duydugu sey",
    voiceChatHint: "NovaMind sesinizi dinler, dusunur, sesli yanit verir ve siz oturumu bitirene kadar yeniden dinlemeye doner.",
    voiceChatLive: "Sesli sohbet aktif",
    voiceChatListening: "Dinliyor",
    voiceChatReady: "Hazir",
    voiceChatReply: "Son yanit",
    voiceChatResume: "Yeniden dinle",
    voiceChatSpeaking: "Konusuyor",
    voiceChatStart: "Sesli sohbeti baslat",
    voiceChatThinking: "Dusunuyor",
    voiceChatTitle: "Sesli Sohbet",
    voiceChatTranscribing: "Yaziya ceviriyor",
    endVoiceChat: "Sonlandir",
    voiceHelp: "Bir istem kaydedin, yaziya cevirin ve dogrudan asistana gonderin.",
    voiceInputError: "Ses donusumu basarisiz oldu.",
    voiceMode: "NovaMind ile konus",
    whatShouldFocus: "NovaMind neye odaklanmali?",
    webSearch: "Web aramasi",
    writeMessage: "Bir istem yazin ve her seyi tek bir temiz sohbet akisinda yonetin.",
    imageGenerated: "Olusturulan gorsel burada.",
    preview: "Onizleme",
    previewUnavailable: "Bu dosya icin onizleme kullanilamiyor."
  }
};

export function getAppText(language: AppLanguage) {
  return textByLanguage[language];
}
