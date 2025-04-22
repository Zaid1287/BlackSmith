// Translation object for multiple languages
// Includes all user-facing text in the application

export type TranslationKeys = {
  common: {
    loading: string;
    noDataFound: string;
    actions: string;
    delete: string;
    edit: string;
    add: string;
    save: string;
    cancel: string;
    confirm: string;
    search: string;
    submit: string;
    filter: string;
    reset: string;
    yes: string;
    no: string;
    logout: string;
    back: string;
    appTitle: string;
    areYouSure: string;
    thisActionCannot: string;
  };
  navigation: {
    dashboard: string;
    journeys: string;
    history: string;
    users: string;
    vehicles: string;
    fuelPrediction: string;
  };
  auth: {
    login: string;
    username: string;
    password: string;
    signin: string;
    invalidCredentials: string;
  };
  dashboard: {
    welcome: string;
    activeJourneys: string;
    pendingJourneys: string;
    financialStats: string;
  };
  journeys: {
    startJourney: string;
    endJourney: string;
    journey: string;
    licensePlate: string;
    destination: string;
    pouch: string;
    security: string;
    status: string;
    driver: string;
    viewDetails: string;
    noJourneys: string;
    loadingJourneys: string;
    addExpense: string;
    expenseAmount: string;
    expenseType: string;
    expenseNotes: string;
    journeyStarted: string;
    journeyEnded: string;
    journeyTimeElapsed: string;
    addJourneyPhoto: string;
    takePhoto: string;
    photoDescription: string;
    inwardNotEntered: string;
    hydInward: string;
  };
  vehicles: {
    manageVehicles: string;
    addVehicle: string;
    vehicleDetails: string;
    licensePlate: string;
    model: string;
    status: string;
    addedOn: string;
    noVehicles: string;
    loadingVehicles: string;
    vehicleDeleted: string;
    vehicleAdded: string;
    confirmDelete: string;
    deleteVehicle: string;
    vehicleDeleteConfirm: string;
    vehicleInUse: string;
    available: string;
    unavailable: string;
  };
  users: {
    manageUsers: string;
    addUser: string;
    userDetails: string;
    username: string;
    name: string;
    role: string;
    admin: string;
    driver: string;
    addedOn: string;
    noUsers: string;
    loadingUsers: string;
    userDeleted: string;
    userAdded: string;
    confirmDelete: string;
    deleteUser: string;
    userDeleteConfirm: string;
  };
  expenses: {
    totalExpenses: string;
    expenseDetails: string;
    type: string;
    amount: string;
    notes: string;
    time: string;
    noExpenses: string;
    expenseAdded: string;
    failedToAddExpense: string;
    regularExpenses: string;
    topUps: string;
    hydInward: string;
    workingBalance: string;
    finalBalance: string;
    fuel: string;
    toll: string;
    loading: string;
    unloading: string;
    maintenance: string;
    miscellaneous: string;
    weighment: string;
    food: string;
    hydInwardAddedNote: string;
  };
  camera: {
    takePicture: string;
    retake: string;
    cameraError: string;
    uploadInstead: string;
    photoRequired: string;
    documentPhoto: string;
  };
  financial: {
    financialStatus: string;
    pouchAmount: string;
    securityDeposit: string;
    securityReturned: string;
    exportFinancial: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    exportToExcel: string;
    exportFormat: string;
    resetFinancialData: string;
    confirmReset: string;
    resetSuccess: string;
    resetFailed: string;
  };
  fleet: {
    fleetManagement: string;
    vehicleList: string;
    vehicleStatus: string;
    vehicleUtilization: string;
    maintenanceSchedule: string;
    addNewVehicle: string;
    vehicleDetails: string;
    assignDriver: string;
    filterByStatus: string;
  };
};

// Define translations for each language

// English translations
const en_IN: TranslationKeys = {
  common: {
    loading: "Loading...",
    noDataFound: "No data found",
    actions: "Actions",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    search: "Search",
    submit: "Submit",
    filter: "Filter",
    reset: "Reset",
    yes: "Yes",
    no: "No",
    logout: "Log out",
    back: "Back",
    appTitle: "BlackSmith Traders",
    areYouSure: "Are you sure?",
    thisActionCannot: "This action cannot be undone.",
  },
  navigation: {
    dashboard: "Dashboard",
    journeys: "Journeys",
    history: "History",
    users: "Users",
    vehicles: "Vehicles",
    fuelPrediction: "Fuel Prediction",
  },
  auth: {
    login: "Login",
    username: "Username",
    password: "Password",
    signin: "Sign in",
    invalidCredentials: "Invalid username or password",
  },
  dashboard: {
    welcome: "Welcome",
    activeJourneys: "Active Journeys",
    pendingJourneys: "Pending Journeys",
    financialStats: "Financial Stats",
  },
  journeys: {
    startJourney: "Start Journey",
    endJourney: "End Journey",
    journey: "Journey",
    licensePlate: "License Plate",
    destination: "Destination",
    pouch: "Pouch",
    security: "Security",
    status: "Status",
    driver: "Driver",
    viewDetails: "View Details",
    noJourneys: "No journeys found",
    loadingJourneys: "Loading journeys...",
    addExpense: "Add Expense",
    expenseAmount: "Expense Amount",
    expenseType: "Expense Type",
    expenseNotes: "Notes (optional)",
    journeyStarted: "Journey started",
    journeyEnded: "Journey ended",
    journeyTimeElapsed: "Time elapsed",
    addJourneyPhoto: "Add Journey Photo",
    takePhoto: "Take Photo",
    photoDescription: "Photo Description",
    inwardNotEntered: "Inward not entered",
    hydInward: "HYD Inward",
  },
  vehicles: {
    manageVehicles: "Manage Vehicles",
    addVehicle: "Add Vehicle",
    vehicleDetails: "Vehicle Details",
    licensePlate: "License Plate",
    model: "Model",
    status: "Status",
    addedOn: "Added On",
    noVehicles: "No vehicles found",
    loadingVehicles: "Loading vehicles...",
    vehicleDeleted: "The vehicle has been deleted successfully",
    vehicleAdded: "Vehicle added successfully",
    confirmDelete: "Confirm Delete",
    deleteVehicle: "Delete Vehicle",
    vehicleDeleteConfirm: "Are you sure you want to delete this vehicle?",
    vehicleInUse: "This vehicle is currently in use and cannot be deleted",
    available: "Available",
    unavailable: "Unavailable",
  },
  users: {
    manageUsers: "Manage Users",
    addUser: "Add User",
    userDetails: "User Details",
    username: "Username",
    name: "Name",
    role: "Role",
    admin: "Administrator",
    driver: "Driver",
    addedOn: "Added On",
    noUsers: "No users found",
    loadingUsers: "Loading users...",
    userDeleted: "The user has been deleted successfully",
    userAdded: "User added successfully",
    confirmDelete: "Confirm Delete",
    deleteUser: "Delete User",
    userDeleteConfirm: "Are you sure you want to delete this user?",
  },
  expenses: {
    totalExpenses: "Total Expenses",
    expenseDetails: "Expense Details",
    type: "Type",
    amount: "Amount",
    notes: "Notes",
    time: "Time",
    noExpenses: "No expenses recorded yet",
    expenseAdded: "Expense added successfully",
    failedToAddExpense: "Failed to add expense",
    regularExpenses: "Regular Expenses",
    topUps: "Top-ups",
    hydInward: "HYD Inward",
    workingBalance: "Working Balance",
    finalBalance: "Final Balance",
    fuel: "Fuel",
    toll: "Toll",
    loading: "Loading",
    unloading: "Unloading",
    maintenance: "Maintenance",
    miscellaneous: "Miscellaneous",
    weighment: "Weighment",
    food: "Food",
    hydInwardAddedNote: "Added to balance only after journey completion",
  },
  camera: {
    takePicture: "Take Picture",
    retake: "Retake",
    cameraError: "Camera error occurred",
    uploadInstead: "Upload Instead",
    photoRequired: "Photo required",
    documentPhoto: "Document Photo",
  },
  financial: {
    financialStatus: "Financial Status",
    pouchAmount: "Pouch Amount",
    securityDeposit: "Security Deposit",
    securityReturned: "Returned",
    exportFinancial: "Export Financial Data",
    dateRange: "Date Range",
    startDate: "Start Date",
    endDate: "End Date",
    exportToExcel: "Export to Excel",
    exportFormat: "Export Format",
    resetFinancialData: "Reset Financial Data",
    confirmReset: "Confirm Reset",
    resetSuccess: "Financial data has been reset successfully",
    resetFailed: "Failed to reset financial data",
  },
  fleet: {
    fleetManagement: "Fleet Management",
    vehicleList: "Vehicle List",
    vehicleStatus: "Vehicle Status",
    vehicleUtilization: "Vehicle Utilization",
    maintenanceSchedule: "Maintenance Schedule",
    addNewVehicle: "Add New Vehicle",
    vehicleDetails: "Vehicle Details",
    assignDriver: "Assign Driver",
    filterByStatus: "Filter by Status",
  },
};

// Hindi translations
const hi_IN: TranslationKeys = {
  common: {
    loading: "लोड हो रहा है...",
    noDataFound: "कोई डेटा नहीं मिला",
    actions: "कार्रवाई",
    delete: "हटाएं",
    edit: "संपादित करें",
    add: "जोड़ें",
    save: "सहेजें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    search: "खोज",
    submit: "जमा करें",
    filter: "फ़िल्टर",
    reset: "रीसेट",
    yes: "हां",
    no: "नहीं",
    logout: "लॉग आउट",
    back: "वापस",
    appTitle: "ब्लैकस्मिथ ट्रेडर्स",
    areYouSure: "क्या आप सुनिश्चित हैं?",
    thisActionCannot: "यह क्रिया वापस नहीं की जा सकती है।",
  },
  navigation: {
    dashboard: "डैशबोर्ड",
    journeys: "यात्राएं",
    history: "इतिहास",
    users: "उपयोगकर्ता",
    vehicles: "वाहन",
    fuelPrediction: "ईंधन भविष्यवाणी",
  },
  auth: {
    login: "लॉगिन",
    username: "उपयोगकर्ता नाम",
    password: "पासवर्ड",
    signin: "साइन इन करें",
    invalidCredentials: "अमान्य उपयोगकर्ता नाम या पासवर्ड",
  },
  dashboard: {
    welcome: "स्वागत है",
    activeJourneys: "सक्रिय यात्राएं",
    pendingJourneys: "लंबित यात्राएं",
    financialStats: "वित्तीय आंकड़े",
  },
  journeys: {
    startJourney: "यात्रा शुरू करें",
    endJourney: "यात्रा समाप्त करें",
    journey: "यात्रा",
    licensePlate: "लाइसेंस प्लेट",
    destination: "गंतव्य",
    pouch: "थैली",
    security: "सुरक्षा",
    status: "स्थिति",
    driver: "चालक",
    viewDetails: "विवरण देखें",
    noJourneys: "कोई यात्रा नहीं मिली",
    loadingJourneys: "यात्राएं लोड हो रही हैं...",
    addExpense: "खर्च जोड़ें",
    expenseAmount: "खर्च राशि",
    expenseType: "खर्च प्रकार",
    expenseNotes: "नोट्स (वैकल्पिक)",
    journeyStarted: "यात्रा शुरू हुई",
    journeyEnded: "यात्रा समाप्त हुई",
    journeyTimeElapsed: "बीता हुआ समय",
    addJourneyPhoto: "यात्रा फोटो जोड़ें",
    takePhoto: "फोटो लें",
    photoDescription: "फोटो विवरण",
    inwardNotEntered: "इनवार्ड दर्ज नहीं किया गया",
    hydInward: "हैदराबाद इनवार्ड",
  },
  vehicles: {
    manageVehicles: "वाहन प्रबंधित करें",
    addVehicle: "वाहन जोड़ें",
    vehicleDetails: "वाहन विवरण",
    licensePlate: "लाइसेंस प्लेट",
    model: "मॉडल",
    status: "स्थिति",
    addedOn: "जोड़ा गया",
    noVehicles: "कोई वाहन नहीं मिला",
    loadingVehicles: "वाहन लोड हो रहे हैं...",
    vehicleDeleted: "वाहन सफलतापूर्वक हटा दिया गया है",
    vehicleAdded: "वाहन सफलतापूर्वक जोड़ा गया",
    confirmDelete: "हटाने की पुष्टि करें",
    deleteVehicle: "वाहन हटाएं",
    vehicleDeleteConfirm: "क्या आप वाकई इस वाहन को हटाना चाहते हैं?",
    vehicleInUse: "यह वाहन वर्तमान में उपयोग में है और इसे हटाया नहीं जा सकता है",
    available: "उपलब्ध",
    unavailable: "अनुपलब्ध",
  },
  users: {
    manageUsers: "उपयोगकर्ता प्रबंधित करें",
    addUser: "उपयोगकर्ता जोड़ें",
    userDetails: "उपयोगकर्ता विवरण",
    username: "उपयोगकर्ता नाम",
    name: "नाम",
    role: "भूमिका",
    admin: "प्रशासक",
    driver: "चालक",
    addedOn: "जोड़ा गया",
    noUsers: "कोई उपयोगकर्ता नहीं मिले",
    loadingUsers: "उपयोगकर्ता लोड हो रहे हैं...",
    userDeleted: "उपयोगकर्ता सफलतापूर्वक हटा दिया गया है",
    userAdded: "उपयोगकर्ता सफलतापूर्वक जोड़ा गया",
    confirmDelete: "हटाने की पुष्टि करें",
    deleteUser: "उपयोगकर्ता हटाएं",
    userDeleteConfirm: "क्या आप वाकई इस उपयोगकर्ता को हटाना चाहते हैं?",
  },
  expenses: {
    totalExpenses: "कुल खर्च",
    expenseDetails: "खर्च विवरण",
    type: "प्रकार",
    amount: "राशि",
    notes: "नोट्स",
    time: "समय",
    noExpenses: "अभी तक कोई खर्च दर्ज नहीं किया गया है",
    expenseAdded: "खर्च सफलतापूर्वक जोड़ा गया",
    failedToAddExpense: "खर्च जोड़ने में विफल",
    regularExpenses: "नियमित खर्च",
    topUps: "टॉप-अप",
    hydInward: "हैदराबाद इनवार्ड",
    workingBalance: "कार्यशील शेष",
    finalBalance: "अंतिम शेष",
    fuel: "ईंधन",
    toll: "टोल",
    loading: "लोडिंग",
    unloading: "अनलोडिंग",
    maintenance: "रखरखाव",
    miscellaneous: "विविध",
    weighment: "वज़न",
    food: "भोजन",
    hydInwardAddedNote: "यात्रा पूरी होने के बाद ही शेष में जोड़ा जाएगा",
  },
  camera: {
    takePicture: "तस्वीर लें",
    retake: "फिर से लें",
    cameraError: "कैमरा त्रुटि हुई",
    uploadInstead: "इसके बजाय अपलोड करें",
    photoRequired: "फोटो आवश्यक है",
    documentPhoto: "दस्तावेज़ फोटो",
  },
  financial: {
    financialStatus: "वित्तीय स्थिति",
    pouchAmount: "थैली राशि",
    securityDeposit: "सुरक्षा जमा",
    securityReturned: "वापस किया गया",
    exportFinancial: "वित्तीय डेटा निर्यात करें",
    dateRange: "तिथि सीमा",
    startDate: "प्रारंभ तिथि",
    endDate: "अंतिम तिथि",
    exportToExcel: "एक्सेल में निर्यात करें",
    exportFormat: "निर्यात प्रारूप",
    resetFinancialData: "वित्तीय डेटा रीसेट करें",
    confirmReset: "रीसेट की पुष्टि करें",
    resetSuccess: "वित्तीय डेटा सफलतापूर्वक रीसेट कर दिया गया है",
    resetFailed: "वित्तीय डेटा रीसेट करने में विफल",
  },
  fleet: {
    fleetManagement: "बेड़ा प्रबंधन",
    vehicleList: "वाहन सूची",
    vehicleStatus: "वाहन स्थिति",
    vehicleUtilization: "वाहन उपयोग",
    maintenanceSchedule: "रखरखाव अनुसूची",
    addNewVehicle: "नया वाहन जोड़ें",
    vehicleDetails: "वाहन विवरण",
    assignDriver: "चालक असाइन करें",
    filterByStatus: "स्थिति के अनुसार फ़िल्टर करें",
  },
};

// Telugu translations
const te_IN: TranslationKeys = {
  common: {
    loading: "లోడ్ అవుతోంది...",
    noDataFound: "డేటా కనుగొనబడలేదు",
    actions: "చర్యలు",
    delete: "తొలగించు",
    edit: "సవరించు",
    add: "జోడించు",
    save: "సేవ్ చేయి",
    cancel: "రద్దు చేయి",
    confirm: "నిర్ధారించు",
    search: "శోధన",
    submit: "సమర్పించు",
    filter: "ఫిల్టర్",
    reset: "రీసెట్",
    yes: "అవును",
    no: "కాదు",
    logout: "లాగ్ అవుట్",
    back: "వెనుకకు",
    appTitle: "బ్లాక్‌స్మిత్ ట్రేడర్స్",
    areYouSure: "మీరు ఖచ్చితంగా ఉన్నారా?",
    thisActionCannot: "ఈ చర్యను రద్దు చేయడం సాధ్యం కాదు.",
  },
  navigation: {
    dashboard: "డాష్‌బోర్డ్",
    journeys: "ప్రయాణాలు",
    history: "చరిత్ర",
    users: "వినియోగదారులు",
    vehicles: "వాహనాలు",
    fuelPrediction: "ఇంధన అంచనా",
  },
  auth: {
    login: "లాగిన్",
    username: "వినియోగదారు పేరు",
    password: "పాస్‌వర్డ్",
    signin: "సైన్ ఇన్ చేయండి",
    invalidCredentials: "చెల్లని వినియోగదారు పేరు లేదా పాస్‌వర్డ్",
  },
  dashboard: {
    welcome: "స్వాగతం",
    activeJourneys: "యాక్టివ్ ప్రయాణాలు",
    pendingJourneys: "పెండింగ్ ప్రయాణాలు",
    financialStats: "ఆర్థిక గణాంకాలు",
  },
  journeys: {
    startJourney: "ప్రయాణం ప్రారంభించండి",
    endJourney: "ప్రయాణం ముగించండి",
    journey: "ప్రయాణం",
    licensePlate: "లైసెన్స్ ప్లేట్",
    destination: "గమ్యస్థానం",
    pouch: "పౌచ్",
    security: "భద్రత",
    status: "స్థితి",
    driver: "డ్రైవర్",
    viewDetails: "వివరాలు చూడండి",
    noJourneys: "ప్రయాణాలు కనుగొనబడలేదు",
    loadingJourneys: "ప్రయాణాలు లోడ్ అవుతున్నాయి...",
    addExpense: "ఖర్చు జోడించండి",
    expenseAmount: "ఖర్చు మొత్తం",
    expenseType: "ఖర్చు రకం",
    expenseNotes: "నోట్స్ (ఐచ్ఛికం)",
    journeyStarted: "ప్రయాణం ప్రారంభమైంది",
    journeyEnded: "ప్రయాణం ముగిసింది",
    journeyTimeElapsed: "గడిచిన సమయం",
    addJourneyPhoto: "ప్రయాణం ఫోటో జోడించండి",
    takePhoto: "ఫోటో తీయండి",
    photoDescription: "ఫోటో వివరణ",
    inwardNotEntered: "ఇన్వార్డ్ నమోదు చేయబడలేదు",
    hydInward: "హైదరాబాద్ ఇన్వార్డ్",
  },
  vehicles: {
    manageVehicles: "వాహనాలను నిర్వహించండి",
    addVehicle: "వాహనాన్ని జోడించండి",
    vehicleDetails: "వాహన వివరాలు",
    licensePlate: "లైసెన్స్ ప్లేట్",
    model: "మోడల్",
    status: "స్థితి",
    addedOn: "జోడించిన తేదీ",
    noVehicles: "వాహనాలు కనుగొనబడలేదు",
    loadingVehicles: "వాహనాలు లోడ్ అవుతున్నాయి...",
    vehicleDeleted: "వాహనం విజయవంతంగా తొలగించబడింది",
    vehicleAdded: "వాహనం విజయవంతంగా జోడించబడింది",
    confirmDelete: "తొలగింపును నిర్ధారించండి",
    deleteVehicle: "వాహనాన్ని తొలగించండి",
    vehicleDeleteConfirm: "మీరు ఖచ్చితంగా ఈ వాహనాన్ని తొలగించాలనుకుంటున్నారా?",
    vehicleInUse: "ఈ వాహనం ప్రస్తుతం ఉపయోగంలో ఉంది మరియు దీన్ని తొలగించలేరు",
    available: "అందుబాటులో ఉంది",
    unavailable: "అందుబాటులో లేదు",
  },
  users: {
    manageUsers: "వినియోగదారులను నిర్వహించండి",
    addUser: "వినియోగదారుని జోడించండి",
    userDetails: "వినియోగదారు వివరాలు",
    username: "వినియోగదారు పేరు",
    name: "పేరు",
    role: "పాత్ర",
    admin: "నిర్వాహకుడు",
    driver: "డ్రైవర్",
    addedOn: "జోడించిన తేదీ",
    noUsers: "వినియోగదారులు కనుగొనబడలేదు",
    loadingUsers: "వినియోగదారులు లోడ్ అవుతున్నారు...",
    userDeleted: "వినియోగదారు విజయవంతంగా తొలగించబడ్డారు",
    userAdded: "వినియోగదారు విజయవంతంగా జోడించబడ్డారు",
    confirmDelete: "తొలగింపును నిర్ధారించండి",
    deleteUser: "వినియోగదారుని తొలగించండి",
    userDeleteConfirm: "మీరు ఖచ్చితంగా ఈ వినియోగదారుని తొలగించాలనుకుంటున్నారా?",
  },
  expenses: {
    totalExpenses: "మొత్తం ఖర్చులు",
    expenseDetails: "ఖర్చు వివరాలు",
    type: "రకం",
    amount: "మొత్తం",
    notes: "నోట్స్",
    time: "సమయం",
    noExpenses: "ఇంకా ఖర్చులు నమోదు చేయబడలేదు",
    expenseAdded: "ఖర్చు విజయవంతంగా జోడించబడింది",
    failedToAddExpense: "ఖర్చును జోడించడం విఫలమైంది",
    regularExpenses: "సాధారణ ఖర్చులు",
    topUps: "టాప్-అప్‌లు",
    hydInward: "హైదరాబాద్ ఇన్వార్డ్",
    workingBalance: "పని నిల్వ",
    finalBalance: "తుది నిల్వ",
    fuel: "ఇంధనం",
    toll: "టోల్",
    loading: "లోడింగ్",
    unloading: "అన్‌లోడింగ్",
    maintenance: "నిర్వహణ",
    miscellaneous: "ఇతరాలు",
    weighment: "బరువు తూకం",
    food: "ఆహారం",
    hydInwardAddedNote: "ప్రయాణం పూర్తయిన తర్వాత మాత్రమే నిల్వకు జోడించబడుతుంది",
  },
  camera: {
    takePicture: "ఫోటో తీయండి",
    retake: "మళ్ళీ తీయండి",
    cameraError: "కెమెరా లోపం సంభవించింది",
    uploadInstead: "బదులుగా అప్‌లోడ్ చేయండి",
    photoRequired: "ఫోటో అవసరం",
    documentPhoto: "డాక్యుమెంట్ ఫోటో",
  },
  financial: {
    financialStatus: "ఆర్థిక స్థితి",
    pouchAmount: "పౌచ్ మొత్తం",
    securityDeposit: "భద్రతా డిపాజిట్",
    securityReturned: "తిరిగి ఇవ్వబడింది",
    exportFinancial: "ఆర్థిక డేటాను ఎగుమతి చేయండి",
    dateRange: "తేదీ పరిధి",
    startDate: "ప్రారంభ తేదీ",
    endDate: "ముగింపు తేదీ",
    exportToExcel: "ఎక్సెల్‌కి ఎగుమతి చేయండి",
    exportFormat: "ఎగుమతి ఫార్మాట్",
    resetFinancialData: "ఆర్థిక డేటాను రీసెట్ చేయండి",
    confirmReset: "రీసెట్‌ని నిర్ధారించండి",
    resetSuccess: "ఆర్థిక డేటా విజయవంతంగా రీసెట్ చేయబడింది",
    resetFailed: "ఆర్థిక డేటాను రీసెట్ చేయడం విఫలమైంది",
  },
  fleet: {
    fleetManagement: "ఫ్లీట్ నిర్వహణ",
    vehicleList: "వాహనాల జాబితా",
    vehicleStatus: "వాహన స్థితి",
    vehicleUtilization: "వాహన ఉపయోగం",
    maintenanceSchedule: "నిర్వహణ షెడ్యూల్",
    addNewVehicle: "కొత్త వాహనాన్ని జోడించండి",
    vehicleDetails: "వాహన వివరాలు",
    assignDriver: "డ్రైవర్‌ను కేటాయించండి",
    filterByStatus: "స్థితి ద్వారా ఫిల్టర్ చేయండి",
  },
};

// Export translations lookup object
export const translations = {
  'en-IN': en_IN,
  'hi-IN': hi_IN,
  'te-IN': te_IN,
};