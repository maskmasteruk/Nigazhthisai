import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'TA' | 'ML' | 'KN' | 'TE' | 'HI';

interface Translations {
  [key: string]: {
    EN: string;
    TA: string;
    ML?: string;
    KN?: string;
    TE?: string;
    HI?: string;
  };
}

export const translations: Translations = {
  // App Name
  'app.name': { EN: 'Nigazhthisai', TA: 'நிகழ்திசை', ML: 'നികഴ്തിസൈ', KN: 'ನಿಗழ்த்தಿಸೈ', TE: 'నిగళ్తిసై', HI: 'निगझथिसई' },
  'app.tagline': { EN: 'Management Portal', TA: 'நிர்வாக போர்டல்', ML: 'മാനേജ്മെന്റ് പോർട്ടൽ', KN: 'ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್', TE: 'నిర్వహణ పోర్టల్', HI: 'प्रबंधन पोर्टल' },
  'app.conductor': { EN: 'Conductor App', TA: 'நடத்துனர் செயலி', ML: 'കണ്ടക്ടർ ആപ്പ്', KN: 'ನಿರ್ವಾಹಕ ಆಪ್', TE: 'కండక్టర్ యాప్', HI: 'कंडक्टर ऐप' },
  'app.passenger': { EN: 'Passenger App', TA: 'பயணிகள் செயலி', ML: 'യാത്രക്കാരൻ ആപ്പ്', KN: 'ಪ್ರಯಾಣಿಕರ ಆಪ್', TE: 'ప్రయాణీకుల యాప్', HI: 'यात्री ऐप' },

  // Navigation
  'nav.dashboard': { EN: 'Dashboard', TA: 'டாஷ்போர்டு' },
  'nav.operations': { EN: 'Operations', TA: 'செயல்பாடுகள்' },
  'nav.routes': { EN: 'Routes', TA: 'வழித்தடங்கள்' },
  'nav.stops': { EN: 'Stops', TA: 'நிறுத்தங்கள்' },
  'nav.buses': { EN: 'Buses & ETM', TA: 'பேருந்துகள் & ETM' },
  'nav.trips': { EN: 'Trips & Schedules', TA: 'பயணங்கள் & கால அட்டவணைகள்' },
  'nav.alerts': { EN: 'Idle & Alerts', TA: 'தாமத எச்சரிக்கைகள்' },
  'nav.live': { EN: 'Live Monitoring', TA: 'நேரடி கண்காணிப்பு' },
  'nav.revenue': { EN: 'Tickets & Revenue', TA: 'டிக்கெட்டுகள் & வருவாய்' },
  'nav.users': { EN: 'Users & Roles', TA: 'பயனர்கள் & பாத்திரங்கள்' },
  'nav.settings': { EN: 'Settings', TA: 'அமைப்புகள்' },

  // Alerts Page
  'alerts.active_idle': { EN: 'Active Idle Alerts', TA: 'செயலில் உள்ள தாமத எச்சரிக்கைகள்' },
  'alerts.resolved_today': { EN: 'Resolved (Today)', TA: 'தீர்வு காணப்பட்டவை (இன்று)' },
  'alerts.avg_response': { EN: 'Avg. Response Time', TA: 'சராசரி பதில் நேரம்' },
  'alerts.realtime_detection': { EN: 'Real-time Detection', TA: 'நேரடி கண்டறிதல்' },
  'alerts.history': { EN: 'Alert History', TA: 'எச்சரிக்கை வரலாறு' },
  'alerts.stationary_outside': { EN: 'Stationary outside stop', TA: 'நிறுத்தத்திற்கு வெளியே நிற்கிறது' },
  'alerts.idle_duration': { EN: 'Idle Duration', TA: 'நின்ற நேரம்' },
  'alerts.status': { EN: 'Status', TA: 'நிலை' },
  'alerts.abnormal_stop': { EN: 'Abnormal Stop', TA: 'இயல்பற்ற நிறுத்தம்' },
  'alerts.last_movement': { EN: 'Last Movement', TA: 'கடைசி இயக்கம்' },
  'alerts.distance_to_stop': { EN: 'Distance to Stop', TA: 'நிறுத்தத்திற்கான தூரம்' },
  'alerts.acknowledge': { EN: 'Acknowledge', TA: 'ஏற்றுக்கொள்' },
  'alerts.map_link': { EN: 'Map Link', TA: 'வரைபட இணைப்பு' },
  'alerts.escalate': { EN: 'Escalate to Support', TA: 'உதவிக்கு அனுப்பவும்' },
  'alerts.no_alerts': { EN: 'No Idle Alerts Detected', TA: 'தாமத எச்சரிக்கைகள் எதுவும் இல்லை' },
  'alerts.scanning': { EN: 'System scanning... All 120 active buses are operational.', TA: 'கணினி சோதிக்கிறது... அனைத்து 120 பேருந்துகளும் இயங்குகின்றன.' },
  'alerts.last_24h': { EN: 'Showing last 24 hours', TA: 'கடந்த 24 மணிநேரத்தைக் காட்டுகிறது' },
  'alerts.bus_trip': { EN: 'Bus / Trip', TA: 'பேருந்து / பயணம்' },
  'alerts.alert_time': { EN: 'Alert Time', TA: 'எச்சரிக்கை நேரம்' },
  'alerts.duration': { EN: 'Duration', TA: 'காலம்' },
  'alerts.resolution': { EN: 'Resolution', TA: 'தீர்வு' },
  'alerts.details': { EN: 'Details', TA: 'விவரங்கள்' },
  'alerts.acknowledged_status': { EN: 'Acknowledged', TA: 'ஏற்கப்பட்டது' },
  'alerts.min_ago': { EN: 'min ago', TA: 'நிமிடங்களுக்கு முன்' },
  'alerts.gps': { EN: 'GPS', TA: 'ஜிபிஎஸ்' },
  'alerts.route': { EN: 'Route', TA: 'வழித்தடம்' },
  'alerts.stationary_label': { EN: 'Stationary outside stop', TA: 'நிறுத்தத்திற்கு வெளியே நிற்கிறது' },
  'alerts.export': { EN: 'Export CSV Report', TA: 'CSV அறிக்கையை ஏற்றுமதி செய்' },
  'alerts.investigate': { EN: 'Investigate Alert', TA: 'எச்சரிக்கையை ஆராயுங்கள்' },
  'nav.support': { EN: 'Support', TA: 'ஆதரவு' },
  'nav.logout': { EN: 'Logout', TA: 'வெளியேறு' },
  'nav.operational_setup': { EN: 'Operational Setup', TA: 'செயல்பாட்டு அமைப்பு' },

  // Operational Setup page
  'ops.route_stops': { EN: 'Route & Stops', TA: 'வழித்தடம் & நிறுத்தங்கள்' },
  'ops.bus_etm': { EN: 'Bus & ETM', TA: 'பேருந்து & ETM' },
  'ops.trip_schedule': { EN: 'Trip Schedule', TA: 'பயண அட்டவணை' },
  'ops.confirmation': { EN: 'Confirmation', TA: 'உறுதிப்படுத்தல்' },
  'ops.route_name': { EN: 'Route Name', TA: 'வழித்தடப் பெயர்' },
  'ops.route_code': { EN: 'Route Code', TA: 'வழித்தடக் குறியீடு' },
  'ops.district': { EN: 'District', TA: 'மாவட்டம்' },
  'ops.zone': { EN: 'Zone', TA: 'மண்டலம்' },
  'ops.route_stops_sequence': { EN: 'Route Stops Sequence', TA: 'வழித்தட நிறுத்தங்களின் வரிசை' },
  'ops.enter_stop_name': { EN: 'Enter stop name...', TA: 'நிறுத்தத்தின் பெயரை உள்ளிடவும்...' },
  'ops.add_stop': { EN: 'Add Stop', TA: 'நிறுத்தத்தைச் சேர்' },
  'ops.no_stops_added': { EN: 'No stops added yet', TA: 'நிறுத்தங்கள் இன்னும் சேர்க்கப்படவில்லை' },
  'ops.registration_number': { EN: 'Registration Number', TA: 'பதிவு எண்' },
  'ops.model_chassis': { EN: 'Model / Chassis', TA: 'மாடல் / சேஸ்' },
  'ops.etm_device_id': { EN: 'ETM Device ID', TA: 'ETM சாதன ஐடி' },
  'ops.bus_type': { EN: 'Bus Type', TA: 'பேருந்து வகை' },
  'ops.start_time': { EN: 'Start Time', TA: 'தொடக்க நேரம்' },
  'ops.operations_base': { EN: 'Operations Base', TA: 'செயல்பாட்டுத் தளம்' },
  'ops.auto_synced': { EN: 'Auto-synced:', TA: 'தானாக ஒத்திசைக்கப்பட்டது:' },
  'ops.allocated_driver': { EN: 'Allocated Driver', TA: 'ஒதுக்கப்பட்ட ஓட்டுநர்' },
  'ops.allocated_conductor': { EN: 'Allocated Conductor', TA: 'ஒதுக்கப்பட்ட நடத்துனர்' },
  'ops.operator_name_placeholder': { EN: 'Operator Name', TA: 'இயக்குனர் பெயர்' },
  'ops.staff_name_placeholder': { EN: 'Staff Name', TA: 'ஊழியர் பெயர்' },
  'ops.setup_complete': { EN: 'Setup Complete!', TA: 'அமைப்பு முடிந்தது!' },
  'ops.setup_complete_desc': { EN: 'All operational entities (Route, Bus, and Trip) have been successfully linked and created in the system database.', TA: 'அனைத்து செயல்பாட்டு நிறுவனங்களும் (வழித்தடம், பேருந்து மற்றும் பயணம்) வெற்றிகரமாக இணைக்கப்பட்டு கணினி தரவுத்தளத்தில் உருவாக்கப்பட்டுள்ளன.' },
  'ops.setup_new_pipeline': { EN: 'Setup New Pipeline', TA: 'புதிய செயல்பாட்டை அமை' },
  'ops.return_dashboard': { EN: 'Return to Dashboard', TA: 'டாஷ்போர்டுக்குத் திரும்பு' },
  'ops.previous_phase': { EN: 'Previous Phase', TA: 'முந்தைய நிலை' },
  'ops.cancel_setup': { EN: 'Cancel Setup', TA: 'அமைப்பை ரத்துசெய்' },
  'ops.complete_pipeline': { EN: 'Complete Pipeline', TA: 'செயல்பாட்டை முடி' },
  'ops.proceed_next_phase': { EN: 'Proceed to Next Phase', TA: 'அடுத்த நிலைக்குச் செல்' },
  'ops.relational_integrity': { EN: 'Relational Integrity', TA: 'உறவுமுறை ஒருமைப்பாடு' },
  'ops.relational_integrity_desc': { EN: 'Entities are cross-linked via unique IDs', TA: 'நிறுவனங்கள் தனித்துவமான ஐடிகள் மூலம் குறுக்கு-இணைக்கப்பட்டுள்ளன' },
  'ops.enforced': { EN: 'Enforced', TA: 'அமல்படுத்தப்பட்டது' },
  'ops.data_validation': { EN: 'Data Validation', TA: 'தரவு சரிபார்ப்பு' },
  'ops.data_validation_desc': { EN: 'Real-time schema check active', TA: 'நிகழ்நேர திட்ட சரிபார்ப்பு செயலில் உள்ளது' },
  'ops.healthy': { EN: 'Healthy', TA: 'நலம்' },
  'ops.etm_sync': { EN: 'ETM Sync', TA: 'ETM ஒத்திசைவு' },
  'ops.etm_sync_desc': { EN: 'Ready for device provisioning', TA: 'சாதன ஒதுக்கீட்டிற்கு தயார்' },
  'ops.ready': { EN: 'Ready', TA: 'தயார்' },
  'ops.err_route': { EN: 'Complete Route information first', TA: 'முதலில் வழித்தட தகவலை முடிக்கவும்' },
  'ops.err_bus': { EN: 'Complete Bus & ETM information', TA: 'பேருந்து & ETM தகவலை முடிக்கவும்' },
  'ops.err_staff': { EN: 'Staff assignment is required', TA: 'ஊழியர் ஒதுக்கீடு தேவை' },
  'ops.success_pipeline': { EN: 'Operational Pipeline completed successfully!', TA: 'செயல்பாட்டுப் பாதை வெற்றிகரமாக முடிந்தது!' },
  'ops.err_pipeline': { EN: 'Failed to complete pipeline. Check all details.', TA: 'செயல்பாட்டை முடிக்க முடியவில்லை. அனைத்து விவரங்களையும் சரிபார்க்கவும்.' },
  'ops.zone.North': { EN: 'North', TA: 'வடக்கு' },
  'ops.zone.South': { EN: 'South', TA: 'தெற்கு' },
  'ops.zone.West': { EN: 'West', TA: 'மேற்கு' },
  'ops.zone.East': { EN: 'East', TA: 'கிழக்கு' },
  'ops.zone.Central': { EN: 'Central', TA: 'மத்திய' },

  // Passenger Nav
  'pnav.spot': { EN: 'SPOT', TA: 'இடம்', ML: 'സ്പോട്ട്', KN: 'ಸ್ಪಾಟ್', TE: 'స్పాట్', HI: 'स्पॉट' },
  'pnav.track': { EN: 'TRACK', TA: 'கண்காணிப்பு', ML: 'ട്രാക്ക്', KN: 'ಟ್ರ್ಯಾಕ್', TE: 'ట్రాక్', HI: 'ट्रैक' },
  'pnav.history': { EN: 'HISTORY', TA: 'வரலாறு', ML: 'ചരിത്രം', KN: 'ಇತಿಹಾಸ', TE: 'చరిత్ర', HI: 'इतिहास' },
  'pnav.more': { EN: 'MORE', TA: 'மேலும்', ML: 'കൂടുതൽ', KN: 'ಇನ್ನಷ್ಟು', TE: 'మరింత', HI: 'अधिक' },

  // Passenger UI
  'ui.select_district': { EN: 'SELECT DISTRICT', TA: 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்', ML: 'ജില്ല തിരഞ്ഞെടുക്കുക', KN: 'ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', TE: 'జిల్లాను ఎంచుకోండి', HI: 'जिला चुनें' },
  'ui.from': { EN: 'FROM', TA: 'இருந்து', ML: 'ഇതിൽ നിന്ന്', KN: 'ಇಂದ', TE: 'నుండి', HI: 'से' },
  'ui.to': { EN: 'TO', TA: 'வரை', ML: 'ഇതിലേക്ക്', KN: 'ಗೆ', TE: 'కు', HI: 'तक' },
  'ui.eta': { EN: 'ETA', TA: 'வருகை நேரம்', ML: 'പ്രതീക്ഷിക്കുന്ന സമയം (ETA)', KN: 'ಆಗಮನದ ಸಮಯ (ETA)', TE: 'రాక సమయం (ETA)', HI: 'आगमन समय (ETA)' },
  'ui.book_ticket': { EN: 'BOOK TICKET', TA: 'டிக்கெட் முன்பதிவு', ML: 'ടിക്കറ്റ് ബുക്ക് ചെയ്യുക', KN: 'ಟಿಕೆಟ್ ಬುಕ್ ಮಾಡಿ', TE: 'టికెట్ బుక్ చేయండి', HI: 'टिकट बुक करें' },
  'ui.boarding_from': { EN: 'Boarding From', TA: 'ஏறும் இடம்', ML: 'കയറുന്ന സ്ഥലം', KN: 'ಬೋರ್ಡಿಂಗ್ ಪಾಯಿಂറ്', TE: 'బోర్డింగ్ పాయింట్', HI: 'बोर्डिंग स्टेशन' },
  'ui.destination_to': { EN: 'Destination To', TA: 'இறங்கும் இடம்', ML: 'ഇറങ്ങേണ്ട സ്ഥലം', KN: 'ಗಮ್ಯಸ್ಥಾನ', TE: 'గమ్యస్థానం', HI: 'गंतव्य स्टेशन' },
  'ui.num_seats': { EN: 'Number of Seats', TA: 'இருக்கைகளின் எண்ணிக்கை', ML: 'സീറ്റുകളുടെ എണ്ണം', KN: 'ಸೀಟುಗಳ ಸಂಖ್ಯೆ', TE: 'సీట్ల సంఖ్య', HI: 'सीटों की संख्या' },
  'ui.seats_selected': { EN: 'SEATS SELECTED', TA: 'தேர்ந்தெடுக்கப்பட்ட இருக்கைகள்', ML: 'സീറ്റുകൾ തിരഞ്ഞെടുത്തു', KN: 'ಸೀಟುಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ', TE: 'సీట్లు ఎంచుకోబడ్డాయి', HI: 'चयनित सीटें' },
  'ui.total_amount': { EN: 'TOTAL AMOUNT', TA: 'மொத்த தொகை', ML: 'ആകെ തുക', KN: 'ಒಟ್ಟು ಮೊತ್ತ', TE: 'మొత్తం ధర', HI: 'कुल राशि' },
  'ui.confirm_booking': { EN: 'CONFIRM BOOKING', TA: 'முன்பதிவை உறுதிப்படுத்து', ML: 'ബുക്കിംഗ് സ്ഥിരീകരിക്കുക', KN: 'ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಿ', TE: 'బుకింగ్ నిర్ధారించండి', HI: 'बुकिंग की पुष्टि करें' },
  'ui.back': { EN: 'Back', TA: 'பின்னால்', ML: 'പിന്നോട്ട്', KN: 'ಹಿಂದೆ', TE: 'వెనుకకు', HI: 'पीछे' },
  'ui.ticket_booked': { EN: 'Ticket booked successfully!', TA: 'டிக்கெட் வெற்றிகரமாக முன்பதிவு செய்யப்பட்டது!', ML: 'ടിക്കറ്റ് വിജയകരമായി ബുക്ക് ചെയ്തു!', KN: 'ಟಿಕೆಟ್ ಯಶಸ್ವಿಯಾಗಿ ಬುಕ್ ಆಗಿದೆ!', TE: 'టికెట్ విజయవంతంగా బుక్ చేయబడింది!', HI: 'टिकट सफलतापूर्वक बुक हो गया!' },
  'ui.your_ticket': { EN: 'Your Ticket', TA: 'உங்கள் டிக்கெட்', ML: 'നിങ്ങളുടെ ടിക്കറ്റ്', KN: 'ನಿಮ್ಮ ಟಿಕೆಟ್', TE: 'మీ టికెట్', HI: 'आपका टिकट' },
  'ui.booking_confirmed': { EN: 'BOOKING CONFIRMED', TA: 'முன்பதிவு உறுதி செய்யப்பட்டது', ML: 'ബുക്കിംഗ് സ്ഥിരീകരിച്ചു', KN: 'ಬುಕಿಂಗ್ ಖಚಿತಪಟ್ಟಿದೆ', TE: 'బుకింగ్ నిర్ధారించబడింది', HI: 'बुकिंग की पुष्टि हो गई' },
  'ui.ticket_ref': { EN: 'TICKET REFERENCE', TA: 'டிக்கெட் குறிப்பு', ML: 'ടിക്കറ്റ് റഫറൻസ്', KN: 'ಟಿಕೆಟ್ ಉಲ್ಲೇಖ', TE: 'టికెట్ రిఫరెన్స్', HI: 'टिकट संदर्भ' },
  'ui.share_ticket': { EN: 'SHARE TICKET', TA: 'டிக்கெட்டைப் பகிரவும்', ML: 'ടിക്കറ്റ് പങ്കിടുക', KN: 'ಟಿಕೆಟ್ ಹಂಚಿಕೊಳ್ಳಿ', TE: 'టికెట్ షేర్ చేయండి', HI: 'टिकट साझा करें' },
  'ui.show_qr': { EN: 'PLEASE SHOW THIS QR TO THE CONDUCTOR', TA: 'தயவுசெய்து இந்த QR குறியீட்டை நடத்துனரிடம் காட்டவும்', ML: 'ദയവായി ഈ ക്യുആർ കോഡ് കണ്ടക്ടറെ കാണിക്കുക', KN: 'ದಯವಿಟ್ಟು ಈ ಕ್ಯೂಆರ್ ಕೋಡ್ ಅನ್ನು ನಿರ್ವಾಹಕರಿಗೆ ತೋರಿಸಿ', TE: 'దయచేసి ఈ QR కోడ్‌ను కండక్టర్‌కు చూపించండి', HI: 'कृपया यह QR कोड कंडक्टर को दिखाएं' },
  'ui.active_tickets': { EN: 'ACTIVE TICKETS', TA: 'செயலில் உள்ள டிக்கெட்டுகள்', ML: 'സജീവ ടിക്കറ്റുകൾ', KN: 'ಸಕ್ರಿಯ ಟಿಕೆಟ್‌ಗಳು', TE: 'క్రియాశీల టిక్కెట్లు', HI: 'सक्रिय टिकट' },
  'ui.recent_activity': { EN: 'RECENT ACTIVITY', TA: 'சமீபத்திய செயல்பாடு', ML: 'സമീപകാല പ്രവർത്തനം', KN: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ', TE: 'ఇటీవలి కార్యాచరణ', HI: 'हालिया गतिविधि' },
  'ui.refresh': { EN: 'REFRESH', TA: 'புதுப்பி', ML: 'പുതുക്കുക', KN: 'ರಿಫ್ರೆಶ್', TE: 'రిఫ్రెష్', HI: 'रिफ्रेश' },
  'ui.search_stop': { EN: 'Search for a stop or area...', TA: 'நிறுத்தம் அல்லது பகுதியைத் தேடுங்கள்...', ML: 'ഒരു സ്റ്റോപ്പ് അല്ലെങ്കിൽ പ്രദേശം തിരയുക...', KN: 'ನಿಲ್ದಾಣ ಅಥವಾ ಪ್ರದೇಶವನ್ನು ಹುಡುಕಿ...', TE: 'ఒక స్టాప్ లేదా ప్రాంతం కోసం శోధించండి...', HI: 'स्टॉप या क्षेत्र खोजें...' },
  'ui.select_stop': { EN: 'Select Stop', TA: 'நிறுத்தத்தைத் தேர்ந்தெடுக்கவும்', ML: 'സ്റ്റോപ്പ് തിരഞ്ഞെടുക്കുക', KN: 'ನಿಲ್ದಾಣವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ', TE: 'స్టాప్ ఎంచుకోండి', HI: 'स्टॉप चुनें' },
  'ui.trip_completed': { EN: 'Trip Completed', TA: 'பയணம் முடிந்தது', ML: 'യാത്ര പൂർത്തിയായി', KN: 'ಪ್ರಯಾಣ ಪೂರ್ಣಗೊಂಡಿದೆ', TE: 'ప్రయాణం పూర్తయింది', HI: 'यात्रा पूरी हुई' },
  'ui.start': { EN: 'START', TA: 'தொடக்கம்', ML: 'ആരംഭം', KN: 'ಪ್ರಾರಂಭ', TE: 'ప్రారంభం', HI: 'शुरू' },
  'ui.end': { EN: 'END', TA: 'முடிவு', ML: 'അവസാനം', KN: 'ಅಂತ್ಯ', TE: 'ముగింపు', HI: 'अंत' },
  'ui.live': { EN: 'LIVE', TA: 'நேரடி', ML: 'ലൈവ്', KN: 'ಲೈವ್', TE: 'లైవ్', HI: 'लाइव' },
  'ui.fare': { EN: 'Fare', TA: 'கட்டணம்', ML: 'നിരക്ക്', KN: 'ದರ', TE: 'చార్జీ', HI: 'किराया' },
  'ui.mins': { EN: 'mins', TA: 'நிமிடங்கள்', ML: 'മിനിറ്റുകൾ', KN: 'ನಿಮಿಷಗಳು', TE: 'నిమిషాలు', HI: 'मिनट' },
  'ui.ready_to_book': { EN: 'READY TO BOOK', TA: 'முன்பதிவு செய்ய தயார்', ML: 'ബുക്കിംഗിന് തയ്യാറാണ്', KN: 'ಬುಕ್ ಮಾಡಲು ಸಿದ್ಧ', TE: 'బుక్ చేయడానికి సిద్ధంగా ఉంది', HI: 'बुक करने के लिए तैयार' },
  'ui.ticket_ref_label': { EN: 'TICKET REFERENCE', TA: 'டிக்கெட் குறிப்பு', ML: 'ടിക്കറ്റ് റഫറൻസ്', KN: 'ಟಿಕೆಟ್ ಉಲ್ಲೇಖ', TE: 'టికెట్ రిఫరెన్స్', HI: 'टिकट संदर्भ' },
  'ui.passengers': { EN: 'PASSENGERS', TA: 'பயணிகள்', ML: 'യാത്രക്കാർ', KN: 'ಪ್ರಯಾಣಿಕರು', TE: 'ప్రయాణీకులు', HI: 'यात्री' },
  'ui.amount_paid': { EN: 'AMOUNT PAID', TA: 'செலுத்தப்பட்ட தொகை', ML: 'അടച്ച തുക', KN: 'ಪಾವತಿಸಿದ ಮೊತ್ತ', TE: 'చెల్లించిన మొత్తం', HI: 'भुगतान की गई राशि' },
  'ui.total': { EN: 'Total', TA: 'மொத்தம்', ML: 'ആകെ', KN: 'ಒಟ್ಟು', TE: 'మొత్తం', HI: 'कुल' },
  'ui.complaint': { EN: 'COMPLAINT', TA: 'புகார்', ML: 'പരാതി', KN: 'ದೂರು', TE: 'ఫిర్యాదు', HI: 'शिकायत' },
  'ui.home': { EN: 'HOME', TA: 'முகப்பு', ML: 'ഹോം', KN: 'ಮುಖಪುಟ', TE: 'హోమ్', HI: 'होम' },
  'ui.active': { EN: 'ACTIVE', TA: 'செயலில்' },
  'ui.boarding_now': { EN: 'Arriving in 5 mins', TA: '5 நிமிடங்களில் வரும்' },
  'ui.live_status': { EN: 'LIVE STATUS', TA: 'நேரடி நிலை' },
  'complaint.desc': { EN: 'Got any issues or feedback? Let us know using the form below.', TA: 'ஏதேனும் சிக்கல்கள் அல்லது கருத்துக்கள் உள்ளதா? கீழே உள்ள படிவத்தைப் பயன்படுத்தி எங்களுக்குத் தெரிவிக்கவும்.' },
  'complaint.issue_type': { EN: 'ISSUE TYPE', TA: 'பிரிவு' },
  'complaint.description': { EN: 'DESCRIPTION', TA: 'விளக்கம்' },
  'complaint.placeholder': { EN: 'Please describe here...', TA: 'தயவுசெய்து இங்கே விவரிக்கவும்...' },
  'complaint.submit': { EN: 'SUBMIT COMPLAINT', TA: 'புகாரைச் சமர்ப்பிக்கவும்' },
  'complaint.success': { EN: 'Complaint Submitted!', TA: 'புகார் சமர்ப்பிக்கப்பட்டது!' },
  'complaint.type.delay': { EN: 'Bus Delay', TA: 'பேருந்து தாமதம்' },
  'complaint.type.behavior': { EN: 'Behavior Issue', TA: 'நடத்தை சிக்கல்' },
  'complaint.type.fare': { EN: 'Fare Issue', TA: 'கட்டண சிக்கல்' },
  'complaint.type.other': { EN: 'Other', TA: 'பிற' },
  'date.28_mar': { EN: '28 MAR', TA: 'மார்ச் 28' },
  'date.20_mar': { EN: '20 MAR', TA: 'மார்ச் 20' },
  'date.28_mar_2026': { EN: '28 MAR 2026', TA: 'மார்ச் 28, 2026' },

  // Conductor UI
  'con.select_bus': { EN: 'Select Your Bus', TA: 'உங்கள் பேருந்தைத் தேர்ந்தெடுக்கவும்' },
  'con.bus_desc': { EN: 'Identify the vehicle you are operating today', TA: 'இன்று நீங்கள் இயக்கும் வாகனத்தைக் கண்டறியவும்' },
  'con.today_trips': { EN: "Today's Assignments", TA: 'இன்றைய பணிகள்' },
  'con.active_trip': { EN: 'Active Trip', TA: 'செயலில் உள்ள பயணம்' },
  'con.onboard': { EN: 'Onboard', TA: 'பேருந்தில் உள்ளவர்கள்' },
  'con.revenue': { EN: 'Revenue', TA: 'வருவாய்' },
  'dash.today_revenue': { EN: "Today's Revenue", TA: 'இன்றைய வருவாய்' },
  'dash.total_tickets': { EN: 'Total Tickets', TA: 'மொத்த டிக்கெட்டுகள்' },
  'dash.active_trips': { EN: 'Active Trips', TA: 'செயலில் உள்ள பயணங்கள்' },
  'dash.total_passengers': { EN: 'Total Passengers', TA: 'மொத்த பயணிகள்' },
  'dash.revenue_by_route': { EN: 'Revenue by Route', TA: 'வழித்தட வாரியாக வருவாய்' },
  'dash.booking_channels': { EN: 'Booking Channels', TA: 'முன்பதிவு சேனல்கள்' },
  'dash.system_alerts': { EN: 'System Alerts', TA: 'கணினி எச்சரிக்கைகள்' },
  'dash.recent_trips': { EN: 'Recent Trips', TA: 'சமீபத்திய பயணங்கள்' },
  'con.issue_ticket': { EN: 'Issue Ticket', TA: 'டிக்கெட் வழங்கவும்' },
  'con.scan_qr': { EN: 'Scan QR Ticket', TA: 'QR டிக்கெட்டை ஸ்கேன் செய்யவும்' },
  'con.trip_summary': { EN: 'Trip Summary / End Trip', TA: 'பயணச் சுருக்கம் / பயணத்தை முடிக்கவும்' },
  'con.end_trip': { EN: 'End Trip Now', TA: 'இப்போது பயணத்தை முடிக்கவும்' },
  'con.continue_trip': { EN: 'Continue Trip', TA: 'பயணத்தைத் தொடரவும்' },

  // Districts
  'dist.Ariyalur': { EN: 'Ariyalur', TA: 'அரியலூர்' },
  'dist.Chengalpattu': { EN: 'Chengalpattu', TA: 'செங்கல்பட்டு' },
  'dist.Chennai': { EN: 'Chennai', TA: 'சென்னை' },
  'dist.Coimbatore': { EN: 'Coimbatore', TA: 'கோயம்புத்தூர்' },
  'dist.Cuddalore': { EN: 'Cuddalore', TA: 'கடலூர்' },
  'dist.Dharmapuri': { EN: 'Dharmapuri', TA: 'தர்மபுரி' },
  'dist.Dindigul': { EN: 'Dindigul', TA: 'திண்டுக்கல்' },
  'dist.Erode': { EN: 'Erode', TA: 'ஈரோடு' },
  'dist.Kallakurichi': { EN: 'Kallakurichi', TA: 'கள்ளக்குறிச்சி' },
  'dist.Kanchipuram': { EN: 'Kanchipuram', TA: 'காஞ்சிபுரம்' },
  'dist.Kanyakumari': { EN: 'Kanyakumari', TA: 'கன்னியாகுமரி' },
  'dist.Karur': { EN: 'Karur', TA: 'கரூர்' },
  'dist.Krishnagiri': { EN: 'Krishnagiri', TA: 'கிருஷ்ணகிரி' },
  'dist.Madurai': { EN: 'Madurai', TA: 'மதுரை' },
  'dist.Mayiladuthurai': { EN: 'Mayiladuthurai', TA: 'மயிலாடுதுறை' },
  'dist.Nagapattinam': { EN: 'Nagapattinam', TA: 'நாகப்பட்டினம்' },
  'dist.Namakkal': { EN: 'Namakkal', TA: 'நாமக்கல்' },
  'dist.Nilgiris': { EN: 'Nilgiris', TA: 'நீலகிரி' },
  'dist.Perambalur': { EN: 'Perambalur', TA: 'பெரம்பலூர்' },
  'dist.Pudukkottai': { EN: 'Pudukkottai', TA: 'புதுக்கோட்டை' },
  'dist.Ramanathapuram': { EN: 'Ramanathapuram', TA: 'இராமநாதபுரம்' },
  'dist.Ranipet': { EN: 'Ranipet', TA: 'ராணிப்பேட்டை' },
  'dist.Salem': { EN: 'Salem', TA: 'சேலம்' },
  'dist.Sivaganga': { EN: 'Sivaganga', TA: 'சிவங்கை' },
  'dist.Tenkasi': { EN: 'Tenkasi', TA: 'தென்காசி' },
  'dist.Thanjavur': { EN: 'Thanjavur', TA: 'தஞ்சாவூர்' },
  'dist.Theni': { EN: 'Theni', TA: 'தேனி' },
  'dist.Thoothukudi': { EN: 'Thoothukudi', TA: 'தூத்துக்குடி' },
  'dist.Tiruchirappalli': { EN: 'Tiruchirappalli', TA: 'திருச்சிராப்பள்ளி' },
  'dist.Trichy': { EN: 'Trichy', TA: 'திருச்சி' },
  'dist.Tirunelveli': { EN: 'Tirunelveli', TA: 'திருநெல்வேலி' },
  'dist.Tirupathur': { EN: 'Tirupathur', TA: 'திருப்பத்தூர்' },
  'dist.Tiruppur': { EN: 'Tiruppur', TA: 'திருப்பூர்' },
  'dist.Tiruvallur': { EN: 'Tiruvallur', TA: 'திருவள்ளூர்' },
  'dist.Tiruvannamalai': { EN: 'Tiruvannamalai', TA: 'திருவண்ணாமலை' },
  'dist.Tiruvarur': { EN: 'Tiruvarur', TA: 'திருவாரூர்' },
  'dist.Vellore': { EN: 'Vellore', TA: 'வேலூர்' },
  'dist.Viluppuram': { EN: 'Viluppuram', TA: 'விழுப்புரம்' },
  'dist.Virudhunagar': { EN: 'Virudhunagar', TA: 'விருதுநகர்' },

  // Stops
  'stop.Ariyalur Bus Stand': { EN: 'Ariyalur Bus Stand', TA: 'அரியலூர் பேருந்து நிலையம்' },
  'stop.Jayamkondam': { EN: 'Jayamkondam', TA: 'ஜெயங்கொண்டம்' },
  'stop.Maduranthakam': { EN: 'Maduranthakam', TA: 'மதுராந்தகம்' },
  'stop.Tambaram': { EN: 'Tambaram', TA: 'தாம்பரம்' },
  'stop.Adyar': { EN: 'Adyar', TA: 'அடையார்' },
  'stop.Broadway': { EN: 'Broadway', TA: 'பிராட்வே' },
  'stop.Mettupalayam': { EN: 'Mettupalayam', TA: 'மேட்டுப்பாளையம்' },
  'stop.Pollachi': { EN: 'Pollachi', TA: 'பொள்ளாச்சி' },
  'stop.Chidambaram': { EN: 'Chidambaram', TA: 'சிதம்பரம்' },
  'stop.Virudhachalam': { EN: 'Virudhachalam', TA: 'விருத்தாசலம்' },
  'stop.Hosur': { EN: 'Hosur', TA: 'ஓசூர்' },
  'stop.Ooty': { EN: 'Ooty', TA: 'ஊட்டி' },
  'stop.Koonoor': { EN: 'Coonoor', TA: 'குன்னூர்' },
  'stop.Kanyakumari': { EN: 'Kanyakumari', TA: 'கன்னியாகுமரி' },
  'stop.Nagercoil': { EN: 'Nagercoil', TA: 'நாகர்கோவில்' },
  'stop.Kumbakonam': { EN: 'Kumbakonam', TA: 'கும்பகோணம்' },
  'stop.Karaikudi': { EN: 'Karaikudi', TA: 'காரைக்குடி' },
  'stop.Sivakasi': { EN: 'Sivakasi', TA: 'சிவகாசி' },
  'stop.Rajapalayam': { EN: 'Rajapalayam', TA: 'ராஜபாளையம்' },
  'stop.Srirangam': { EN: 'Srirangam', TA: 'ஸ்ரீரங்கம்' },
  'stop.Nellai Bus Stand': { EN: 'Nellai Bus Stand', TA: 'நெல்லை பேருந்து நிலையம்' },
  'stop.Green Circle': { EN: 'Green Circle', TA: 'கிரீன் சர்க்கிள்' },
  'stop.Old Bus Stand': { EN: 'Old Bus Stand', TA: 'பழைய பேருந்து நிலையம்' },
  'stop.New Bus Stand': { EN: 'New Bus Stand', TA: 'புதிய பேருந்து நிலையம்' },
  'stop.Railway Station': { EN: 'Railway Station', TA: 'இரயில் நிலையம்' },
  'stop.Pushpa Theatre': { EN: 'Pushpa Theatre', TA: 'புஷ்பா தியேட்டர்' },
  'stop.Kumar Nagar': { EN: 'Kumar Nagar', TA: 'குமார் நகர்' },
  'stop.Avinashi': { EN: 'Avinashi', TA: 'அவினாசி' },
  'stop.Palladam': { EN: 'Palladam', TA: 'பல்லடம்' },
  'stop.Koyambedu (CMBT)': { EN: 'Koyambedu (CMBT)', TA: 'கோயம்பேடு (CMBT)' },
  'stop.Central Railway Station': { EN: 'Central Railway Station', TA: 'மத்திய இரயில் நிலையம்' },
  'stop.Egmore': { EN: 'Egmore', TA: 'எழும்பூர்' },
  'stop.Guindy': { EN: 'Guindy', TA: 'கிண்டி' },
  'stop.T. Nagar': { EN: 'T. Nagar', TA: 'தி. நகர்' },
  'stop.Gandhipuram': { EN: 'Gandhipuram', TA: 'காந்திபுரம்' },
  'stop.Singanallur': { EN: 'Singanallur', TA: 'சிங்காநல்லூர்' },
  'stop.Ukkadam': { EN: 'Ukkadam', TA: 'உக்கடம்' },
  'stop.RS Puram': { EN: 'RS Puram', TA: 'ஆர்.எஸ். புரம்' },
  'stop.Peelamedu': { EN: 'Peelamedu', TA: 'பீளமேடு' },
  'stop.Mattuthavani': { EN: 'Mattuthavani', TA: 'மாட்டுத்தாவணி' },
  'stop.Periyar Bus Stand': { EN: 'Periyar Bus Stand', TA: 'பெரியார் பேருந்து நிலையம்' },
  'stop.Anna Nagar': { EN: 'Anna Nagar', TA: 'அண்ணா நகர்' },
  'stop.Goripalayam': { EN: 'Goripalayam', TA: 'கோரிப்பாளையம்' },
  'stop.Salem New Bus Stand': { EN: 'Salem New Bus Stand', TA: 'சேலம் புதிய பேருந்து நிலையம்' },
  'stop.Hasthampatti': { EN: 'Hasthampatti', TA: 'அஸ்தம்பட்டி' },
  'stop.Fairlands': { EN: 'Fairlands', TA: 'ஃபேர்லேண்ட்ஸ்' },
  'stop.Central Bus Stand': { EN: 'Central Bus Stand', TA: 'மத்திய பேருந்து நிலையம்' },
  'stop.Chatram Bus Stand': { EN: 'Chatram Bus Stand', TA: 'சத்திரம் பேருந்து நிலையம்' },
  'stop.Thillai Nagar': { EN: 'Thillai Nagar', TA: 'தில்லை நகர்' },
  'stop.Brough Road': { EN: 'Brough Road', TA: 'பிராக் ரோடு' },
  'stop.Paneer Selvam Park': { EN: 'Paneer Selvam Park', TA: 'பன்னீர் செல்வம் பார்க்' },
  'stop.Main Bus Stand': { EN: 'Main Bus Stand', TA: 'முக்கிய பேருந்து நிலையம்' },
  'stop.Town Center': { EN: 'Town Center', TA: 'நகர மையம்' },
  'stop.Market Stop': { EN: 'Market Stop', TA: 'சந்தை நிறுத்தம்' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'EN';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key]['EN'] || key;
    }
    
    // Case-insensitive lookup for stops and districts
    if (key.startsWith('stop.') || key.startsWith('dist.')) {
      const lowerKey = key.toLowerCase();
      const foundKey = Object.keys(translations).find(k => k.toLowerCase() === lowerKey);
      if (foundKey) {
        return translations[foundKey][language] || translations[foundKey]['EN'] || key.split('.')[1];
      }
      
      return key.split('.')[1];
    }
    
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
