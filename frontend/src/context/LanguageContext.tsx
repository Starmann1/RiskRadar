import React, { createContext, useContext, useState } from "react";

export type Language = 
  | "en" | "hi" | "bn" | "as" | "mr" | "te" | "ta" 
  | "gu" | "ur" | "kn" | "or" | "ml" | "pa" | "mai" | "sa";

export interface LanguageOption {
  code: Language;
  nativeScript: string;
  englishName: string;
}

export const MAIN_LANGUAGES: LanguageOption[] = [
  { code: "en", nativeScript: "EN", englishName: "English" },
  { code: "hi", nativeScript: "हिन्दी", englishName: "Hindi" },
];

export const DROPDOWN_LANGUAGES: LanguageOption[] = [
  { code: "hi", nativeScript: "हिंदी", englishName: "Hindi" },
  { code: "bn", nativeScript: "বাংলা", englishName: "Bengali" },
  { code: "as", nativeScript: "অসমীয়া", englishName: "Assamese" },
  { code: "mr", nativeScript: "मराठी", englishName: "Marathi" },
  { code: "te", nativeScript: "తెలుగు", englishName: "Telugu" },
  { code: "ta", nativeScript: "தமிழ்", englishName: "Tamil" },
  { code: "gu", nativeScript: "ગુજરાતી", englishName: "Gujarati" },
  { code: "ur", nativeScript: "اردو", englishName: "Urdu" },
  { code: "kn", nativeScript: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "or", nativeScript: "ଓଡ଼ିଆ", englishName: "Odia" },
  { code: "ml", nativeScript: "മലയാളം", englishName: "Malayalam" },
  { code: "pa", nativeScript: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  { code: "mai", nativeScript: "मैथिली", englishName: "Maithili" },
  { code: "sa", nativeScript: "संस्कृतम्", englishName: "Sanskrit" },
];

export const ALL_LANGUAGES: LanguageOption[] = [
  { code: "en", nativeScript: "English", englishName: "English" },
  ...DROPDOWN_LANGUAGES
];

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, Partial<Record<Language, string>>> = {
  // Navigation & Brand
  "nav.dashboard": {
    en: "Safety Dashboard",
    hi: "सुरक्षा डैशबोर्ड",
    bn: "সুরক্ষা ড্যাশবোর্ড",
    mr: "सुरक्षा डॅशबोर्ड",
    te: "భద్రతా డాష్‌బోర్డ్",
    ta: "பாதுகாப்பு டாஷ்போர்டு"
  },
  "nav.queue": {
    en: "HSE Priority Queue",
    hi: "एचएसई प्राथमिकता कतार",
    bn: "এইচএসই অগ্রাধিকার তালিকা",
    mr: "एचएसई प्राधान्य रांग",
    te: "HSE ప్రాధాన్యతా వరుస",
    ta: "HSE முன்னுரிமை வரிசை"
  },
  "nav.ingest": {
    en: "Add Safety Report",
    hi: "सुरक्षा रिपोर्ट जोड़ें",
    bn: "সুরক্ষা প্রতিবেদন যোগ করুন",
    mr: "सुरक्षा अहवाल जोडा",
    te: "భద్రతా నివేదికను జోడించండి",
    ta: "பாதுகாப்பு அறிக்கையைச் சேர்க்கவும்"
  },
  "nav.chain": {
    en: "SIF Precursor Chain",
    hi: "एसआईएफ पूर्वगामी श्रृंखला",
    bn: "এসআইএফ পূর্বসূরী শৃঙ্খল",
    mr: "SIF अग्रदूत साखळी",
    te: "SIF ప్రికిర్సర్ చైన్",
    ta: "SIF முன்னோடி சங்கிலி"
  },
  "nav.iogp": {
    en: "IOGP 9 Rules Matrix",
    hi: "आईओजीपी 9 नियम मैट्रिक्स",
    bn: "আইওজিপি ৯ নিয়ম ম্যাট্রিক্স",
    mr: "IOGP ९ नियम मॅट्रिक्स",
    te: "IOGP 9 నిబంధనల మ్యాట్రిక్స్",
    ta: "IOGP 9 விதிகள் மேட்ரிக்ஸ்"
  },
  "nav.site": {
    en: "Multi-Site Risk Heatmap",
    hi: "मल्टी-साइट जोखिम हीटमैप",
    bn: "বহু-সাইট ঝুঁকি হিটম্যাপ",
    mr: "मल्टी-साइट जोखीम हिटमॅप",
    te: "మల్టీ-సైట్ రిస్క్ హీట్‌మ్యాప్",
    ta: "மல்டி-சைட் ஆபத்து ஹீட்மேப்"
  },
  "nav.activity": {
    en: "Activity Risk Breakdown",
    hi: "गतिविधि जोखिम विश्लेषण",
    bn: "কার্যকলাপ ঝুঁকি বিশ্লেষণ",
    mr: "कृती जोखीम विश्लेषण",
    te: "కార్యాచరణ రిస్క్ విభజన",
    ta: "செயல்பாட்டு ஆபத்து பகுப்பாய்வு"
  },
  "nav.barrier": {
    en: "Barrier Intelligence",
    hi: "सुरक्षा बैरियर खुफिया",
    bn: "ব্যারিয়ার ইন্টেলিজেন্স",
    mr: "बॅरियर इंटेलिजन्स",
    te: "బారియర్ ఇంటెలిజెన్స్",
    ta: "தடை நுண்ணறிவு"
  },
  "nav.detail": {
    en: "Safety Report Detail & Evidence",
    hi: "सुरक्षा रिपोर्ट विवरण और साक्ष्य",
    bn: "সুরক্ষা প্রতিবেদন বিবরণ ও প্রমাণ",
    mr: "सुरक्षा अहवाल तपशील आणि पुरावे",
    te: "భద్రతా నివేదిక వివరాలు మరియు ఆధారాలు",
    ta: "பாதுகாப்பு அறிக்கை விவரம் மற்றும் சான்றுகள்"
  },
  "nav.online": {
    en: "System Online",
    hi: "सिस्टम ऑनलाइन",
    bn: "সিস্টেম অনলাইন",
    mr: "सिस्टम ऑनलाईन",
    te: "సిస్టమ్ ఆన్‌లైన్",
    ta: "சிஸ்டம் ஆன்லைன்"
  },
  "nav.version": {
    en: "Version 2.4",
    hi: "संस्करण 2.4",
    bn: "সংস্করণ ২.৪",
    mr: "आवृत्ती २.४",
    te: "వెర్షన్ 2.4",
    ta: "பதிப்பு 2.4"
  },
  "nav.oil": {
    en: "OIL INDIA LIMITED • HSSE",
    hi: "ऑयल इंडिया लिमिटेड • एचएसएसई",
    bn: "অয়েল ইন্ডিয়া লিমিটেড • এইচএসএসই",
    mr: "ऑइल इंडिया लिमिटेड • एचएसएसई",
    te: "ఆయిల్ ఇండియా లిమిటెడ్ • HSSE",
    ta: "ஆயில் இந்தியா லிமிடெட் • HSSE"
  },
  "nav.brand_sub": {
    en: "Oil India Limited • HSSE AI",
    hi: "ऑयल इंडिया लिमिटेड • एचएसएसई एआई",
    bn: "অয়েল ইন্ডিয়া লিমিটেড • এইচএসএসই এআই",
    mr: "ऑइल इंडिया लिमिटेड • एचएसएसई एआय",
    te: "ఆయిల్ ఇండియా లిమిటెడ్ • HSSE AI",
    ta: "ஆயில் இந்தியா லிமிடெட் • HSSE AI"
  },

  // SIF Telemetry Engine
  "telem.title": {
    en: "Asset Safety Telemetry & Risk Trajectory",
    hi: "परिसंपत्ति सुरक्षा टेलीमेट्री और जोखिम प्रक्षेपवक्र",
    bn: "সম্পদ নিরাপত্তা টেলিমেট্রি এবং ঝুঁকি ট্র্যাজেক্টরি",
    mr: "परिसंपत्ती सुरक्षा टेलिमेट्री आणि जोखीम मार्ग",
    te: "ఆస్తి భద్రతా టెలిమెట్రీ & రిస్క్ ట్రాజెక్టరీ",
    ta: "சொத்து பாதுகாப்பு தொலைநிலை மற்றும் ஆபத்து பாதை"
  },
  "telem.sub": {
    en: "Continuous temporal tracking of barrier integrity, personnel exposure, and early warning precursor drift across operational shifts.",
    hi: "कार्य पारियों में सुरक्षा बैरियर अखंडता, कार्मिक जोखिम और प्रारंभिक चेतावनी बहाव की निरंतर ट्रैकिंग।",
    bn: "অপারেশনাল শিফট জুড়ে বাধা অখণ্ডতা, কর্মীদের এক্সপোজার এবং প্রাথমিক সতর্কতার ধারাবাহিক ট্র্যাকিং।",
    mr: "कार्य शिफ्ट दरम्यान अडथळा अखंडता, कर्मचाऱ्यांचा धोका आणि पूर्वसूचनेची सतत ट्रॅकिंग.",
    te: "ఆపరేషనల్ షిఫ్ట్‌లలో బారియర్ సమగ్రత, సిబ్బంది ఎక్స్‌పోజర్ మరియు ముందస్తు హెచ్చరిక ట్రాకింగ్.",
    ta: "செயல்பாட்டு மாற்றங்களில் தடைகளின் நம்பகத்தன்மை மற்றும் முன்னெச்சரிக்கை கண்காணிப்பு."
  },
  "telem.site_selector": {
    en: "Installation Site",
    hi: "संयंत्र / कार्य स्थल",
    bn: "ইনস্টলেশন সাইট",
    mr: "स्थापना जागा",
    te: "ఇన్‌స్టాలేషన్ సైట్",
    ta: "நிறுவல் தளம்"
  },
  "telem.activity_selector": {
    en: "Operational Activity",
    hi: "कार्य गतिविधि",
    bn: "অপারেশনাল কার্যক্রম",
    mr: "कार्यरत हालचाली",
    te: "ఆపరేషనల్ కార్యాచరణ",
    ta: "செயல்பாட்டு நடவடிக்கை"
  },
  "telem.time_range": {
    en: "Observation Window",
    hi: "अवलोकन अवधि",
    bn: "পর্যবেক্ষণ সময়সীমা",
    mr: "निरीक्षण कालावधी",
    te: "పరిశీలన సమయం",
    ta: "கண்காணிப்பு காலம்"
  },
  "telem.current_state": {
    en: "CURRENT SAFETY STATE",
    hi: "वर्तमान सुरक्षा स्थिति",
    bn: "বর্তমান নিরাপত্তা অবস্থা",
    mr: "सध्याची सुरक्षा स्थिती",
    te: "ప్రస్తుత భద్రతా స్థితి",
    ta: "தற்போதைய பாதுகாப்பு நிலை"
  },
  "telem.risk_drift": {
    en: "Risk Drift",
    hi: "जोखिम बहाव (ड्रिफ्ट)",
    bn: "ঝুঁকি ড্রাফ্ট",
    mr: "जोखीम प्रवाह",
    te: "రిస్క్ డ్రిఫ్ట్",
    ta: "ஆபத்து மாற்றம்"
  },
  "telem.safety_trajectory": {
    en: "Safety Trajectory Sequence",
    hi: "सुरक्षा प्रक्षेपवक्र अनुक्रम",
    bn: "নিরাপত্তা ট্র্যাজেক্টরি সিকোয়েন্স",
    mr: "सुरक्षा मार्ग क्रम",
    te: "భద్రతా ట్రాజెక్టరీ క్రమం",
    ta: "பாதுகாப்பு பாதை வரிசை"
  },
  "telem.what_changing": {
    en: "WHAT IS CHANGING?",
    hi: "क्या बदल रहा है?",
    bn: "কী পরিবর্তিত হচ্ছে?",
    mr: "काय बदलत आहे?",
    te: "ఏమి మారుతోంది?",
    ta: "என்ன மாறுகிறது?"
  },
  "telem.why_changing": {
    en: "WHY IS IT CHANGING?",
    hi: "यह क्यों बदल रहा है?",
    bn: "কেন এটি পরিবর্তিত হচ্ছে?",
    mr: "हे का बदलत आहे?",
    te: "ఇది ఎందుకు మారుతోంది?",
    ta: "ஏன் மாறுகிறது?"
  },
  "telem.primary_driver": {
    en: "PRIMARY DRIVER",
    hi: "प्राथमिक संचालक / कारण",
    bn: "প্রধান চালক",
    mr: "मुख्य कारण",
    te: "ప్రధాన కారణం",
    ta: "முதன்மை காரணம்"
  },
  "telem.contributing_factors": {
    en: "CONTRIBUTING FACTORS",
    hi: "योगदान करने वाले कारक",
    bn: "সহায়ক কারণসমূহ",
    mr: "साहाय्यक घटक",
    te: "తోడ్పడే అంశాలు",
    ta: "பங்களிக்கும் காரணிகள்"
  },
  "telem.hse_attention": {
    en: "HSE DECISION SUPPORT",
    hi: "एचएसई निर्णय सहायता",
    bn: "এইচএসই সিদ্ধান্ত সহায়তা",
    mr: "एचएसई निर्णय समर्थन",
    te: "HSE నిర్ణయ మద్దతు",
    ta: "HSE முடிவு ஆதரவு"
  },

  // FilterBar
  "filter.search_placeholder": {
    en: "Search narrative text, canonical hazard, barrier, or Ref ID...",
    hi: "रिपोर्ट विवरण, खतरा, बैरियर या संदर्भ आईडी खोजें...",
    bn: "বিবরণ পাঠ্য, বিপদ, বাধা বা রেফারেন্স আইডি অনুসন্ধান করুন...",
    mr: "अहवाल मजकूर, धोका, अडथळा किंवा संदर्भ आयडी शोधा...",
    te: "వివరణాత్మక వచనం, ప్రమాదం, బారియర్ లేదా సూచన ID ని శోధించండి...",
    ta: "விவரிப்பு உரை, ஆபத்து, தடை அல்லது குறிப்பு ID ஐத் தேடுங்கள்..."
  },
  "filter.all_sites": {
    en: "All Operational Sites",
    hi: "सभी कार्य स्थल",
    bn: "সমস্ত অপারেশনাল সাইট",
    mr: "सर्व कार्यस्थळे",
    te: "అన్ని ఆపరేషనల్ సైట్లు",
    ta: "அனைத்து செயல்பாட்டு தளங்கள்"
  },
  "filter.all_activities": {
    en: "All Activities",
    hi: "सभी कार्य गतिविधियां",
    bn: "সমস্ত কার্যকলাপ",
    mr: "सर्व कृती",
    te: "అన్ని కార్యకలాపాలు",
    ta: "அனைத்து செயல்பாடுகள்"
  },
  "filter.all_sif": {
    en: "All SIF Tiers",
    hi: "सभी एसआईएफ श्रेणियां",
    bn: "সমস্ত এসআইএফ স্তর",
    mr: "सर्व SIF स्तर",
    te: "అన్ని SIF అంచెలు",
    ta: "அனைத்து SIF நிலைகள்"
  },
  "filter.all_rules": {
    en: "All Life-Saving Rules",
    hi: "सभी जीवन-रक्षक नियम",
    bn: "সমস্ত জীবন রক্ষাকারী নিয়ম",
    mr: "सर्व जीवनरक्षक नियम",
    te: "అన్ని ప్రాణరక్షణ నిబంధనలు",
    ta: "அனைத்து உயிர் காக்கும் விதிகள்"
  },

  "tab.all": {
    en: "All",
    hi: "सभी",
    bn: "সমস্ত",
    mr: "सर्व",
    te: "అన్నీ",
    ta: "அனைத்தும்"
  },
  "tab.high": {
    en: "High SIF",
    hi: "उच्च SIF",
    bn: "উচ্চ SIF",
    mr: "उच्च SIF",
    te: "అధిక SIF",
    ta: "அதிக SIF"
  },
  "tab.high_quick": {
    en: "High SIF • Quick Action",
    hi: "उच्च SIF • त्वरित कार्रवाई",
    bn: "উচ্চ SIF • দ্রুত পদক্ষেপ",
    mr: "उच्च SIF • जलद कारवाई",
    te: "అధిక SIF • త్వరిత చర్య",
    ta: "அதிக SIF • விரைவு நடவடிக்கை"
  },
  "tab.medium": {
    en: "Medium SIF",
    hi: "मध्यम SIF",
    bn: "মাঝারি SIF",
    mr: "मध्यम SIF",
    te: "మధ్యస్థ SIF",
    ta: "நடுத்தர SIF"
  },
  "tab.low": {
    en: "Low SIF",
    hi: "निम्न SIF",
    bn: "নিম্ন SIF",
    mr: "कमी SIF",
    te: "తక్కువ SIF",
    ta: "குறைந்த SIF"
  },
  "tab.needs_review": {
    en: "Needs Review",
    hi: "समीक्षा आवश्यक",
    bn: "পর্যালোচনা প্রয়োজন",
    mr: "पुनरावलोकन आवश्यक",
    te: "సమీక్ష అవసరం",
    ta: "பரிசீலனை தேவை"
  },
  "tab.reviewed": {
    en: "Reviewed",
    hi: "समीक्षित",
    bn: "পর্যালোচিত",
    mr: "तपासलेले",
    te: "సమీక్షించబడింది",
    ta: "பரிசீலிக்கப்பட்டது"
  },

  "filter.reset": {
    en: "Reset",
    hi: "रीसेट करें",
    bn: "পুনরায় সেট করুন",
    mr: "रीसेट करा",
    te: "రీసెట్ చేయండి",
    ta: "மீட்டமை"
  },

  // Dashboard Metrics & Headers
  "dash.title": {
    en: "Safety Dashboard",
    hi: "सुरक्षा डैशबोर्ड",
    bn: "সুরক্ষা ড্যাশবোর্ড",
    mr: "सुरक्षा डॅशबोर्ड",
    te: "భద్రతా డాష్‌బోర్డ్",
    ta: "பாதுகாப்பு டாஷ்போர்டு"
  },
  "dash.density": {
    en: "ENTERPRISE SIF DENSITY",
    hi: "संस्थान एसआईएफ घनत्व",
    bn: "এন্টারপ্রাইজ এসআইএফ ঘনত্ব",
    mr: "एंटरप्राइझ SIF घनता",
    te: "ఎంటర్‌ప్రైజ్ SIF డెన్సిటీ",
    ta: "நிறுவன SIF அடர்த்தி"
  },
  "dash.baseline": {
    en: "TARGET BASELINE",
    hi: "लक्ष्य आधार रेखा",
    bn: "লক্ষ্য বেসলাইন",
    mr: "लक्ष्य बेसलाइन",
    te: "లక్ష్య బేస్‌లైన్",
    ta: "இலக்கு அடிப்படை"
  },
  "dash.elevated": {
    en: "+70.8% Elevated",
    hi: "+70.8% उच्च जोखिम",
    bn: "+৭০.৮% বৃদ্ধি",
    mr: "+७०.८% वाढलेले",
    te: "+70.8% పెరిగింది",
    ta: "+70.8% அதிகரித்துள்ளது"
  },
  "dash.total_obs": {
    en: "of total observations",
    hi: "कुल अवलोकनों में से",
    bn: "মোট পর্যবেক্ষণের মধ্যে",
    mr: "एकूण निरीक्षणांपैकी",
    te: "మొత్తం పరిశీలనలలో",
    ta: "மொத்த அவதானிப்புகளில்"
  },
  "dash.high_sif": {
    en: "High SIF Precursors",
    hi: "उच्च एसआईएफ पूर्वगामी",
    bn: "উচ্চ এসআইএফ পূর্বসূরী",
    mr: "उच्च SIF अग्रदूत",
    te: "అధిక SIF ప్రికిర్సర్లు",
    ta: "அதிக SIF முன்னோடிகள்"
  },
  "dash.high_sif_sub": {
    en: "High-energy source + absent or unverified barrier",
    hi: "उच्च ऊर्जा स्रोत + अनुपस्थित या असत्यापित बैरियर",
    bn: "উচ্চ শক্তি উৎস + অনুপস্থিত বা অযাচাইকৃত বাধা",
    mr: "उच्च ऊर्जा स्त्रोत + गैरहजर किंवा न तपासलेला अडथळा",
    te: "అధిక శక్తి మూలం + లేని లేదా తనిఖీ చేయని బారియర్",
    ta: "அதிக ஆற்றல் ஆதாரம் + இல்லாத அல்லது சரிபார்க்கப்படாத தடை"
  },
  "dash.critical_priority": {
    en: "Critical Priority",
    hi: "अति महत्वपूर्ण प्राथमिकता",
    bn: "গুরুত্বপূর্ণ অগ্রাধিকার",
    mr: "अत्यंत महत्वाचे",
    te: "కీలక ప్రాధాన్యత",
    ta: "முக்கிய முன்னுரிமை"
  },
  "dash.med_sif": {
    en: "Medium SIF Potential",
    hi: "मध्यम एसआईएफ क्षमता",
    bn: "মাঝারি এসআইএফ সম্ভাবনা",
    mr: "मध्यम SIF क्षमता",
    te: "మధ్యస్థ SIF సామర్థ్యం",
    ta: "நடுத்தர SIF சாத்தியம்"
  },
  "dash.med_sif_sub": {
    en: "Barrier degraded or intercepted before worker harm",
    hi: "श्रमिक को नुकसान से पहले बैरियर ख़राब या रोका गया",
    bn: "কর্মীর ক্ষতির আগে বাধা ক্ষতিগ্রস্ত বা আটকানো হয়েছে",
    mr: "कामगारांच्या दुखापतीपूर्वी अडथळा कमी किंवा रोखला गेला",
    te: "కార్మికుడికి హాని జరగడానికి ముందే బారియర్ నిరోధించబడింది",
    ta: "ஊழியர் பாதிப்புக்கு முன் தடை தடுக்கப்பட்டது"
  },
  "dash.degradation": {
    en: "Degradation",
    hi: "अपघटन",
    bn: "অবক্ষয়",
    mr: "कमी होणे",
    te: "క్షీణత",
    ta: "சீர்குலைவு"
  },
  "dash.low_sif": {
    en: "Low SIF Potential",
    hi: "निम्न एसआईएफ क्षमता",
    bn: "নিম্ন এসআইএফ সম্ভাবনা",
    mr: "कमी SIF क्षमता",
    te: "తక్కువ SIF సామర్థ్యం",
    ta: "குறைந்த SIF சாத்தியம்"
  },
  "dash.low_sif_sub": {
    en: "Energy controlled with verified physical barriers",
    hi: "सत्यापित भौतिक अवरोधों के साथ ऊर्जा नियंत्रित",
    bn: "যাচাইকৃত শারীরিক বাধা দিয়ে শক্তি নিয়ন্ত্রিত",
    mr: "तपासलेल्या भौतिक अडथळ्यांसह ऊर्जा नियंत्रित",
    te: "తనిఖీ చేసిన భౌతిక బారియర్లతో శక్తి నియంత్రించబడింది",
    ta: "சரிபார்க்கப்பட்ட தடைகளுடன் ஆற்றல் கட்டுப்படுத்தப்பட்டது"
  },
  "dash.controlled": {
    en: "Controlled",
    hi: "नियंत्रित",
    bn: "নিয়ন্ত্রিত",
    mr: "नियंत्रित",
    te: "నియంత్రించబడింది",
    ta: "கட்டுப்படுத்தப்பட்டது"
  },
  "dash.pending": {
    en: "Needs Human Review",
    hi: "मानव समीक्षा आवश्यक",
    bn: "মানব পর্যালোচনা প্রয়োজন",
    mr: "मानवी पुनरावलोकन आवश्यक",
    te: "మానవ సమీక్ష అవసరం",
    ta: "மனித பரிசீலனை தேவை"
  },
  "dash.pending_sub": {
    en: "Narratives requiring additional field investigation",
    hi: "अतिरिक्त क्षेत्र जांच की आवश्यकता वाले विवरण",
    bn: "অতিরিক্ত ক্ষেত্র তদন্তের প্রয়োজনীয় বিবরণ",
    mr: "अतिरिक्त क्षेत्र तपासाची आवश्यकता असलेले वर्णन",
    te: "అదనపు క్షేత్ర పరిశోధన అవసరమైన వివరాలు",
    ta: "கூடுதல் கள விசாரணை தேவைப்படும் விவரிப்புகள்"
  },
  "dash.pending_triage": {
    en: "Pending Triage",
    hi: "लंबित ट्राइएज",
    bn: "পেন্ডিং ট্রায়াজ",
    mr: "लंबित ट्रियाज",
    te: "పెండింగ్ ట్రయాజ్",
    ta: "நிலுவையில் உள்ள மதிப்பீடு"
  },
  "dash.top_reports": {
    en: "Top Ranked Reports Awaiting HSE Review",
    hi: "समीक्षा हेतु शीर्ष रैंक की गई रिपोर्टें",
    bn: "এইচএসই পর্যালোচনার অপেক্ষায় শীর্ষস্থানীয় প্রতিবেদন",
    mr: "HSE पुनरावलोकनाच्या प्रतीक्षेत असलेले शीर्ष अहवाल",
    te: "HSE సమీక్ష కోసం వేచి ఉన్న అగ్ర నివేదికలు",
    ta: "HSE பரிசீலனைக்காக காத்திருக்கும் முதன்மை அறிக்கைகள்"
  },
  "dash.go_queue": {
    en: "Go to Queue",
    hi: "कतार पर जाएं",
    bn: "সারিতে যান",
    mr: "रांगेत जा",
    te: "వరుసకు వెళ్లండి",
    ta: "வரிசைக்குச் செல்"
  },
  "dash.site_comparison": {
    en: "Precursor Density by OIL Installation",
    hi: "ऑयल संयंत्र अनुसार पूर्वगामी घनत्व",
    bn: "অয়েল ইনস্টলেশন অনুযায়ী পূর্বসূরী ঘনত্ব",
    mr: "ऑइल इन्स्टॉलेशननुसार अग्रदूत घनता",
    te: "ఆయిల్ ఇన్‌స్టాలేషన్ ప్రకారం ప్రికిర్సర్ డెన్సిటీ",
    ta: "ஆயில் நிறுவனத்தின் முன்னோடி அடர்த்தி"
  },
  "dash.site_comparison_sub": {
    en: "Normalized Precursor Events per 100 Reports (Eliminates raw volume bias)",
    hi: "प्रति 100 रिपोर्ट पर सामान्यीकृत पूर्वगामी घटनाएं",
    bn: "প্রতি ১০০ প্রতিবেদনে স্বাভাবিকীকৃত পূর্বসূরী ঘটনা",
    mr: "प्रति १०० अहवालांमध्ये सामान्यीकृत अग्रदूत घटना",
    te: "ప్రతి 100 నివేదికలకు సాధారణీకరించిన సంఘటనలు",
    ta: "প্রতি 100 அறிக்கைகளுக்கு இயல்பாக்கப்பட்ட நிகழ்வுகள்"
  },
  "dash.risk_distribution": {
    en: "Enterprise SIF Classification Ratio",
    hi: "संस्थान एसआईएफ वर्गीकरण अनुपात",
    bn: "এন্টারপ্রাইজ এসআইএফ শ্রেণিবিন্যাস অনুপাত",
    mr: "एंटरप्राइझ SIF वर्गीकरण गुणोत्तर",
    te: "ఎంటర్‌ప్రైజ్ SIF వర్గీకరణ నిష్పత్తి",
    ta: "நிறுவன SIF வகைப்பாடு অনুপাত"
  },
  "dash.total_reports_label": {
    en: "Total: 65 Reports",
    hi: "कुल: 65 रिपोर्टें",
    bn: "মোট: ৬৫টি প্রতিবেদন",
    mr: "एकूण: ६५ अहवाल",
    te: "మొత్తం: 65 నివేదికలు",
    ta: "மொத்தம்: 65 அறிக்கைகள்"
  },
  "dash.full_benchmark": {
    en: "Full Benchmark",
    hi: "पूर्ण बेंचमार्क",
    bn: "সম্পূর্ণ বেঞ্চমার্ক",
    mr: "पूर्ण बेंचमार्क",
    te: "పూర్తి బెంచ్‌మార్క్",
    ta: "முழு ஒப்பீடு"
  },
  "dash.no_reports": {
    en: "No safety reports in database",
    hi: "डेटाबेस में कोई सुरक्षा रिपोर्ट नहीं है",
    bn: "ডেটাবেসে কোনো নিরাপত্তা প্রতিবেদন নেই",
    mr: "डेटाबेसमध्ये कोणताही सुरक्षा अहवाल नाही",
    te: "డేటాబేస్‌లో భద్రతా నివేదికలు లేవు",
    ta: "தரவுத்தளத்தில் பாதுகாப்பு அறிக்கைகள் இல்லை"
  },

  // Screen Ingestion
  "ingest.title": {
    en: "Safety Report Ingestion & AI Classifier",
    hi: "सुरक्षा रिपोर्ट अंतर्ग्रहण और एआई वर्गीकरण",
    bn: "সুরক্ষা প্রতিবেদন গ্রহণ ও এআই ক্লাসিফায়ার",
    mr: "सुरक्षा अहवाल समावेश आणि AI वर्गीकरण",
    te: "భద్రతా నివేదిక ఇన్జెక్షన్ & AI వర్గీకరణ",
    ta: "பாதுகாப்பு அறிக்கை சேர்த்தல் மற்றும் AI வகைப்படுத்தி"
  },
  "ingest.sub": {
    en: "Upload PDF flash reports to automatically extract narrative text, identify barrier states, classify SIF potential, and standardize against IOGP Life-Saving Rules.",
    hi: "विवरण निकालने, बैरियर ऑडिट करने और एसआईएफ क्षमता की गणना के लिए पीडीएफ फ्लैश रिपोर्ट अपलोड करें।",
    bn: "স্বয়ংক্রিয়ভাবে টেক্সট বের করতে এবং এসআইএফ ক্ষমতা শ্রেণীবদ্ধ করতে পিডিএফ ফ্লাশ রিপোর্ট আপলোড করুন।",
    mr: "मजकूर काढण्यासाठी आणि SIF क्षमतेचे वर्गीकरण करण्यासाठी PDF फ्लॅश अहवाल अपलोड करा.",
    te: "వచనాన్ని సేకరించడానికి మరియు SIF వర్గీకరించడానికి PDF నివేదికలను అప్‌లోడ్ చేయండి.",
    ta: "உரையை பிரித்தெடுக்கவும் SIF வகைப்படுத்தவும் PDF அறிக்கைகளை பதிவேற்றவும்."
  },

  // Common Buttons & Tabs




  "btn.previous": {
    en: "Previous",
    hi: "पिछला",
    bn: "আগেরটি",
    mr: "मागील",
    te: "మునుపటి",
    ta: "முந்தைய"
  },
  "btn.next": {
    en: "Next",
    hi: "अगला",
    bn: "পরবর্তী",
    mr: "पुढील",
    te: "తరువాత",
    ta: "அடுத்த"
  },
  "btn.view": {
    en: "View",
    hi: "देखें",
    bn: "দেখুন",
    mr: "पहा",
    te: "చూడండి",
    ta: "பார்"
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("riskradar_lang") as Language) : null;
    if (saved && ["en", "hi", "bn", "mr", "te", "ta"].includes(saved)) {
      return saved;
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("riskradar_lang", lang);
    }
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key]) {
      const val = translations[key][language];
      if (val) return val;
      return translations[key].en || fallback || key;
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
