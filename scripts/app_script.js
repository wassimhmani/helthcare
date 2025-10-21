// Global state
        let selectedDate = new Date();
        let currentCalendarDate = new Date();
        // Track the appointment used to open the consultation (if any)
        let currentConsultationAppointmentId = null;
        // Track current consultation being worked on (for lab assessments from consultation form)
        let currentConsultationPatientId = null;

        // Appointment storage system
        let storedAppointments = [];

        // Patient storage system
        let storedPatients = [];

        // Language system
        let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        
        // Translation objects
        const translations = {
            en: {
                // Navigation
                dashboard: 'Dashboard',
                add_appointment: 'Add Appointment',
                patients: 'Patients',
                billing: 'Billing',
                reports: 'Reports',
                consultation: 'Consultation',
                settings: 'Settings',

                // Language Settings
                language_settings: 'Language Settings',
                select_language: 'Select Language:',
                close: 'Close',
                
                // Settings Menu
                manage_language: 'Change application language',
                bill_descriptions: 'Bill Descriptions',
                manage_bill_descriptions: 'Manage billing service items',
                
                // Bill Descriptions Management
                add_new_description: 'Add New Service',
                service_name: 'Service Name',
                default_price: 'Default Price (TND)',
                add_service: 'Add Service',
                existing_services: 'Existing Services',
                search_services: 'Search services...',
                edit_service: 'Edit Service',
                save_changes: 'Save Changes',
                delete_service: 'Delete Service',
                confirm_delete_service: 'Are you sure you want to delete this service?',
                service_added: 'Service added successfully!',
                service_updated: 'Service updated successfully!',
                service_deleted: 'Service deleted successfully!',
                
                // Cabinet Settings
                cabinet_settings: 'Cabinet Settings',
                manage_cabinet_info: 'Manage cabinet name, logo & schedule',
                cabinet_information: 'Cabinet Information',
                cabinet_name: 'Cabinet Name',
                cabinet_address: 'Cabinet Address',
                cabinet_phone: 'Cabinet Phone',
                cabinet_logo: 'Cabinet Logo',
                upload_logo: 'Upload Logo',
                remove_logo: 'Remove Logo',
                logo_recommendation: 'Recommended: Square image, max 2MB',
                cabinet_timetable: 'Working Hours / Timetable',
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday',
                save_settings: 'Save Settings',
                settings_saved: 'Settings saved successfully!',
                logo_too_large: 'Image is too large. Maximum size is 2MB.',
                invalid_image: 'Invalid image file. Please upload a valid image.',
                
                // User Management
                user_management: 'User Management',
                manage_users_access: 'Manage users and their access',
                add_new_user: 'Add New User',
                existing_users: 'Existing Users',
                total_users: 'Total Users',
                search_users: 'Search users by name, email, or username...',
                user_full_name: 'Full Name',
                user_email: 'Email',
                username: 'Username',
                password: 'Password',
                new_password: 'New Password',
                password_hint: 'Leave empty to keep current password',
                user_role: 'Role',
                user_status: 'Status',
                actions: 'Actions',
                add_user: 'Add User',
                edit_user: 'Edit User',
                delete_user: 'Delete User',
                confirm_delete_user: 'Are you sure you want to delete this user?',
                user_added: 'User added successfully!',
                user_updated: 'User updated successfully!',
                user_deleted: 'User deleted successfully!',
                username_exists: 'Username already exists!',
                email_exists: 'Email already exists!',
                
                // User Permissions
                user_permissions: 'User Permissions',
                patients_module: 'Patients Module',
                perm_view_patients: 'View Patients',
                perm_add_patients: 'Add/Edit Patients',
                perm_delete_patients: 'Delete Patients',
                appointments_module: 'Appointments Module',
                perm_view_appointments: 'View Appointments',
                perm_add_appointments: 'Add/Edit Appointments',
                perm_delete_appointments: 'Delete Appointments',
                billing_module: 'Billing Module',
                perm_view_bills: 'View Bills',
                perm_create_bills: 'Create Bills',
                perm_manage_bills: 'Manage Bills',
                consultations_module: 'Consultations Module',
                perm_view_consultations: 'View Consultations',
                perm_add_consultations: 'Add/Edit Consultations',
                perm_delete_consultations: 'Delete Consultations',
                reports_module: 'Reports Module',
                perm_view_reports: 'View Reports',
                perm_export_reports: 'Export Reports',
                settings_module: 'Settings Module',
                perm_access_settings: 'Access Settings',
                perm_manage_users: 'Manage Users',

                // Main Header
                secretary_agenda: 'Secretary Agenda',
                manage_appointments: 'Manage daily appointments and schedule',

                // Common buttons
                cancel: 'Cancel',
                save: 'Save',
                edit: 'Edit',
                delete: 'Delete',
                add: 'Add',
                create: 'Create',

                // User profile
                secretary: 'Secretary',

                // Patient fields
                patient_file_number: 'Patient File Number',
                file_number: 'File Number',
                cin_passport: 'CIN or Passeport *',

                // Modal titles
                add_new_appointment: 'Add New Appointment',
                patient_management: 'Patient Management',
                edit_patient: 'Edit Patient',
                create_patient_bill: 'Create Patient Bill',

                // Modal buttons
                add_new_patient: 'Add New Patient',
                view_all_patients: 'View All Patients',
                add_patient: 'Add Patient',
                update_patient: 'Update Patient',
                create_bill: 'Create Bill',
                test_print: 'Test Print',

                // Form labels
                select_patient: 'Select Patient *',
                full_name: 'Full Name *',
                email_address: 'Email Address',
                phone_number: 'Phone Number *',

                // Appointment form
                appointment_date: 'Appointment Date',
                appointment_time: 'Appointment Time',
                appointment_type: 'Appointment Type',
                doctor_name: 'Doctor Name *',
                additional_notes: 'Additional Notes',

                // Patient form
                date_of_birth: 'Date of Birth *',
                gender: 'Gender',
                address: 'Address',
                medical_history: 'Medical History / Notes',
                medical_files: 'Medical Files',

                // Billing form
                bill_date: 'Bill Date',
                due_date: 'Due Date',
                bill_items: 'Bill Items',
                description: 'Description',
                quantity: 'Quantité',
                price: 'Prix (TND)',
                notes: 'Notes',
                remove_item: 'Remove Item',
                add_item: 'Add Item',

                // Consultation form
                new_consultation: 'New Consultation',
                patient_info: 'Patient Info',
                name: 'Name',
                phone: 'Phone',
                age_gender: 'Age/Gender',
                height_cm: 'Height (cm)',
                weight_kg: 'Weight (kg)',
                bmi: 'IMC (BMI)',
                temperature_c: 'Temperature (°C)',
                heart_rate_bpm: 'Heart Rate (bpm)',
                blood_sugar_mgdl: 'Blood Sugar (mg/dL)',
                blood_pressure_mmhg: 'Blood Pressure (mmHg)',
                reason: 'Reason for Visit',
                diagnosis: 'Diagnosis',
                clinical_examination: 'Clinical Examination',
                clinical_notes: 'Additional Clinical Notes',
                prescription: 'Prescription',
                payment_status: 'Payment Status',
                paying_patient: 'Paying Patient',
                non_paying_patient: 'Non-Paying Patient',
                save_consultation: 'Save Consultation',
                no_history_available: 'No history available.',

                // Dynamic modals
                printable_bill: 'Printable Bill',

                // Placeholders
                enter_doctor_name: 'Enter doctor\'s name',
                specific_concerns: 'Any specific concerns or symptoms...',
                height_example: 'e.g., 175',
                weight_example: 'e.g., 70.5',
                temperature_example: 'e.g., 37.0',
                heart_rate_example: 'e.g., 72',
                blood_sugar_example: 'e.g., 95',
                blood_pressure_example: 'e.g., 120/80',
                enter_reason: 'Enter reason for consultation',
                enter_diagnosis: 'Enter diagnosis',
                enter_clinical_exam: 'Enter clinical examination findings',
                enter_notes: 'Enter additional notes',
                drugs_dosage: 'Drugs, dosage, duration',
                file_number_example: 'Enter patient file number (e.g., P-2024-001)',
                cin_passport_example: 'Enter CIN or Passport number',
                full_name_example: 'Enter patient\'s full name',
                email_example: 'patient@example.com',
                phone_example: '+1 (555) 123-4567',
                address_example: 'Street address, City, State',
                medical_history_example: 'Any relevant medical history, allergies, or notes...',
                search_patients: 'Search patients by name, CIN/Passport, file number, email, phone, or date of birth...',
                consultation_fee_example: 'e.g., Consultation fee',

                // Alert messages
                no_medical_files: 'No medical files found for this patient.',
                files_selected: 'file(s) selected for upload.',
                select_patient_appointment: 'Please select a patient for the appointment.',
                fill_required_fields: 'Please fill in all required fields.',
                valid_email: 'Please enter a valid email address.',
                future_date: 'Please select a future date for your appointment.',
                appointment_not_found: 'Appointment not found. Please refresh the page and try again.',
                fill_required_patient_fields: 'Please fill in all required fields (File Number, CIN/Passport, Name, Phone, Date of Birth).',
                email_exists: 'A patient with this email address already exists.',
                file_number_exists: 'A patient with this file number already exists.',
                cin_passport_exists: 'A patient with this CIN/Passport number already exists.',
                no_patient_selected: 'No patient selected for editing.',
                patient_not_found_storage: 'Patient not found in storage.',
                patient_not_found: 'Patient not found.',
                delete_patient_confirm: 'Are you sure you want to delete',
                patient_deleted: 'Patient deleted successfully.',
                at_least_one_item: 'At least one item is required for the bill.',
                popup_blocked: 'Popup blocked! Please allow popups for this site and try again, or use the alternative method below.',
                print_error: 'Error opening print window. Using alternative method.',
                select_patient_bill: 'Please select a patient for the bill.',
                bill_created_success: '✅ Bill created successfully!\n\nBill ID: {0}\nPatient: {1}\nTotal: ${2}\n\nWould you like to print the bill now?',
                bill_id: 'Bill ID:',
                patient: 'Patient:',
                total: 'Total:',
                print_bill_now: 'Would you like to print the bill now?',
                error_creating_bill: 'Error creating bill: {0}',
                consultations_doctors_only: 'Consultations are available to doctors only.',
                fill_required_consultation: 'Please fill required fields.',
                consultation_saved: 'Consultation saved.',
                logout_confirm: 'Are you sure you want to logout?',

                // Titles
                logout: 'Logout',
                cancelled: 'Cancelled',

                // Doctor Dashboard
                doctor_dashboard: 'Doctor Dashboard',
                today_appointments: 'Today\'s Appointments',
                today_consultations: 'Today\'s Consultations',
                no_appointments_today: 'No appointments scheduled for today.',
                no_consultations_today: 'No consultations conducted today.',
                consult: 'Consult',
                reject: 'Reject',
                view_details: 'View Details',
                consultation_details: 'Consultation Details',
                close: 'Close',
                
                // Laboratory Assessment
                laboratory_assessment: 'Laboratory Assessment Examination',
                add_lab_assessment: 'Add Lab Assessment',
                lab_assessment_desc: 'Upload laboratory assessment documents and add notes about the examination results.',
                patient: 'Patient',
                consultation_date: 'Consultation Date',
                upload_documents: 'Upload Laboratory Documents',
                upload_documents_hint: 'You can upload multiple files (PDF, images, etc.)',
                lab_notes: 'Laboratory Assessment Notes',
                lab_notes_hint: 'Add notes, observations, or interpretations of the laboratory results',
                previous_assessments: 'Previous Assessments',
                save_assessment: 'Save Assessment',
                assessment_saved: 'Laboratory assessment saved successfully!',
                no_files_selected: 'No files selected',
                file_uploaded: 'File uploaded',
                remove_file: 'Remove file',
                
                // Medical Certificate
                medical_certificate: 'Medical Certificate',
                certificate_type: 'Certificate Type',
                rest_period: 'Rest Period (Days)',
                start_date: 'Start Date',
                end_date: 'End Date',
                diagnosis_condition: 'Diagnosis / Medical Condition',
                recommendations: 'Recommendations',
                additional_notes: 'Additional Notes',
                certificate_info: 'Certificate Information',
                certificate_info_text: 'After saving, you can view and print the certificate from the consultation details.',
                save_certificate: 'Save Certificate',
                certificate_saved: 'Medical certificate saved successfully!',
                date: 'Date'
            },
            fr: {
                // Navigation
                dashboard: 'Tableau de bord',
                add_appointment: 'Ajouter un rendez-vous',
                patients: 'Patients',
                billing: 'Facturation',
                reports: 'Rapports',
                consultation: 'Consultation',
                settings: 'Paramètres',

                // Language Settings
                language_settings: 'Paramètres de langue',
                select_language: 'Sélectionner la langue:',
                close: 'Fermer',
                
                // Settings Menu
                manage_language: 'Changer la langue de l\'application',
                bill_descriptions: 'Descriptions de facture',
                manage_bill_descriptions: 'Gérer les articles de facturation',
                
                // Bill Descriptions Management
                add_new_description: 'Ajouter un nouveau service',
                service_name: 'Nom du service',
                default_price: 'Prix par défaut (TND)',
                add_service: 'Ajouter un service',
                existing_services: 'Services existants',
                search_services: 'Rechercher des services...',
                edit_service: 'Modifier le service',
                save_changes: 'Enregistrer les modifications',
                delete_service: 'Supprimer le service',
                confirm_delete_service: 'Êtes-vous sûr de vouloir supprimer ce service?',
                service_added: 'Service ajouté avec succès!',
                service_updated: 'Service mis à jour avec succès!',
                service_deleted: 'Service supprimé avec succès!',
                
                // Cabinet Settings
                cabinet_settings: 'Paramètres du cabinet',
                manage_cabinet_info: 'Gérer le nom, logo et horaires du cabinet',
                cabinet_information: 'Informations du cabinet',
                cabinet_name: 'Nom du cabinet',
                cabinet_address: 'Adresse du cabinet',
                cabinet_phone: 'Téléphone du cabinet',
                cabinet_logo: 'Logo du cabinet',
                upload_logo: 'Télécharger le logo',
                remove_logo: 'Supprimer le logo',
                logo_recommendation: 'Recommandé: Image carrée, max 2 Mo',
                cabinet_timetable: 'Heures de travail / Horaire',
                monday: 'Lundi',
                tuesday: 'Mardi',
                wednesday: 'Mercredi',
                thursday: 'Jeudi',
                friday: 'Vendredi',
                saturday: 'Samedi',
                sunday: 'Dimanche',
                save_settings: 'Enregistrer les paramètres',
                settings_saved: 'Paramètres enregistrés avec succès!',
                logo_too_large: 'L\'image est trop grande. Taille maximale: 2 Mo.',
                invalid_image: 'Fichier image invalide. Veuillez télécharger une image valide.',
                
                // User Management
                user_management: 'Gestion des utilisateurs',
                manage_users_access: 'Gérer les utilisateurs et leurs accès',
                add_new_user: 'Ajouter un nouvel utilisateur',
                existing_users: 'Utilisateurs existants',
                total_users: 'Total utilisateurs',
                search_users: 'Rechercher des utilisateurs par nom, email ou nom d\'utilisateur...',
                user_full_name: 'Nom complet',
                user_email: 'Email',
                username: 'Nom d\'utilisateur',
                password: 'Mot de passe',
                new_password: 'Nouveau mot de passe',
                password_hint: 'Laisser vide pour conserver le mot de passe actuel',
                user_role: 'Rôle',
                user_status: 'Statut',
                actions: 'Actions',
                add_user: 'Ajouter un utilisateur',
                edit_user: 'Modifier l\'utilisateur',
                delete_user: 'Supprimer l\'utilisateur',
                confirm_delete_user: 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
                user_added: 'Utilisateur ajouté avec succès!',
                user_updated: 'Utilisateur mis à jour avec succès!',
                user_deleted: 'Utilisateur supprimé avec succès!',
                username_exists: 'Le nom d\'utilisateur existe déjà!',
                email_exists: 'L\'email existe déjà!',
                
                // User Permissions
                user_permissions: 'Permissions utilisateur',
                patients_module: 'Module Patients',
                perm_view_patients: 'Voir les patients',
                perm_add_patients: 'Ajouter/Modifier les patients',
                perm_delete_patients: 'Supprimer les patients',
                appointments_module: 'Module Rendez-vous',
                perm_view_appointments: 'Voir les rendez-vous',
                perm_add_appointments: 'Ajouter/Modifier les rendez-vous',
                perm_delete_appointments: 'Supprimer les rendez-vous',
                billing_module: 'Module Facturation',
                perm_view_bills: 'Voir les factures',
                perm_create_bills: 'Créer des factures',
                perm_manage_bills: 'Gérer les factures',
                consultations_module: 'Module Consultations',
                perm_view_consultations: 'Voir les consultations',
                perm_add_consultations: 'Ajouter/Modifier les consultations',
                perm_delete_consultations: 'Supprimer les consultations',
                reports_module: 'Module Rapports',
                perm_view_reports: 'Voir les rapports',
                perm_export_reports: 'Exporter les rapports',
                settings_module: 'Module Paramètres',
                perm_access_settings: 'Accéder aux paramètres',
                perm_manage_users: 'Gérer les utilisateurs',

                // Main Header
                secretary_agenda: 'Agenda de secrétaire',
                manage_appointments: 'Gérer les rendez-vous quotidiens et les horaires',

                // Common buttons
                cancel: 'Annuler',
                save: 'Enregistrer',
                edit: 'Modifier',
                delete: 'Supprimer',
                add: 'Ajouter',
                create: 'Créer',

                // User profile
                secretary: 'Secrétaire',

                // Patient fields
                patient_file_number: 'Numéro de dossier patient',
                file_number: 'Numéro de dossier',
                cin_passport: 'CIN ou Passeport *',

                // Modal titles
                add_new_appointment: 'Ajouter un nouveau rendez-vous',
                patient_management: 'Gestion des patients',
                edit_patient: 'Modifier le patient',
                create_patient_bill: 'Créer une facture patient',

                // Modal buttons
                add_new_patient: 'Ajouter un nouveau patient',
                view_all_patients: 'Voir tous les patients',
                add_patient: 'Ajouter un patient',
                update_patient: 'Mettre à jour le patient',
                create_bill: 'Créer une facture',
                test_print: 'Test d\'impression',

                // Form labels
                select_patient: 'Sélectionner un patient *',
                full_name: 'Nom complet *',
                email_address: 'Adresse e-mail',
                phone_number: 'Numéro de téléphone *',

                // Appointment form
                appointment_date: 'Date du rendez-vous',
                appointment_time: 'Heure du rendez-vous',
                appointment_type: 'Type de rendez-vous',
                doctor_name: 'Nom du médecin *',
                additional_notes: 'Notes supplémentaires',

                // Patient form
                date_of_birth: 'Date de naissance *',
                gender: 'Genre',
                address: 'Adresse',
                medical_history: 'Historique médical / Notes',
                medical_files: 'Dossiers médicaux',

                // Billing form
                bill_date: 'Date de facturation',
                due_date: 'Date d\'échéance',
                bill_items: 'Articles de facturation',
                description: 'Description',
                quantity: 'Quantité',
                price: 'Prix (TND)',
                notes: 'Notes',
                remove_item: 'Supprimer l\'élément',
                add_item: 'Ajouter un élément',

                // Consultation form
                new_consultation: 'Nouvelle Consultation',
                patient_info: 'Informations Patient',
                name: 'Nom',
                phone: 'Téléphone',
                age_gender: 'Âge/Genre',
                height_cm: 'Taille (cm)',
                weight_kg: 'Poids (kg)',
                bmi: 'IMC (BMI)',
                temperature_c: 'Température (°C)',
                heart_rate_bpm: 'Fréquence Cardiaque (bpm)',
                blood_sugar_mgdl: 'Glycémie (mg/dL)',
                blood_pressure_mmhg: 'Pression Artérielle (mmHg)',
                reason: 'Motif de la visite',
                diagnosis: 'Diagnostic',
                clinical_examination: 'Examen Clinique',
                clinical_notes: 'Notes Cliniques Supplémentaires',
                prescription: 'Prescription',
                payment_status: 'Statut de Paiement',
                paying_patient: 'Patient Payant',
                non_paying_patient: 'Patient Non-Payant',
                save_consultation: 'Enregistrer Consultation',
                no_history_available: 'Aucun historique disponible.',

                // Dynamic modals
                printable_bill: 'Facture Imprimable',

                // Placeholders
                enter_doctor_name: 'Entrez le nom du médecin',
                specific_concerns: 'Toute préoccupation ou symptôme spécifique...',
                height_example: 'ex., 175',
                weight_example: 'ex., 70.5',
                temperature_example: 'ex., 37.0',
                heart_rate_example: 'ex., 72',
                blood_sugar_example: 'ex., 95',
                blood_pressure_example: 'ex., 120/80',
                enter_reason: 'Entrez le motif de la consultation',
                enter_diagnosis: 'Entrez le diagnostic',
                enter_clinical_exam: 'Entrez les résultats de l\'examen clinique',
                enter_notes: 'Entrez des notes supplémentaires',
                drugs_dosage: 'Médicaments, posologie, durée',
                file_number_example: 'Entrez le numéro de dossier patient (ex., P-2024-001)',
                cin_passport_example: 'Entrez le CIN ou numéro de passeport',
                full_name_example: 'Entrez le nom complet du patient',
                email_example: 'patient@exemple.com',
                phone_example: '+1 (555) 123-4567',
                address_example: 'Adresse, Ville, État',
                medical_history_example: 'Tout historique médical pertinent, allergies ou notes...',
                search_patients: 'Rechercher des patients par nom, CIN/Passeport, numéro de dossier, email, téléphone ou date de naissance...',
                consultation_fee_example: 'ex., Frais de consultation',

                // Alert messages
                no_medical_files: 'Aucun fichier médical trouvé pour ce patient.',
                files_selected: 'fichier(s) sélectionné(s) pour téléchargement.',
                select_patient_appointment: 'Veuillez sélectionner un patient pour le rendez-vous.',
                fill_required_fields: 'Veuillez remplir tous les champs obligatoires.',
                valid_email: 'Veuillez entrer une adresse email valide.',
                future_date: 'Veuillez sélectionner une date future pour votre rendez-vous.',
                appointment_not_found: 'Rendez-vous non trouvé. Veuillez actualiser la page et réessayer.',
                fill_required_patient_fields: 'Veuillez remplir tous les champs obligatoires (Numéro de dossier, CIN/Passeport, Nom, Téléphone, Date de naissance).',
                email_exists: 'Un patient avec cette adresse email existe déjà.',
                file_number_exists: 'Un patient avec ce numéro de dossier existe déjà.',
                cin_passport_exists: 'Un patient avec ce CIN/numéro de passeport existe déjà.',
                no_patient_selected: 'Aucun patient sélectionné pour modification.',
                patient_not_found_storage: 'Patient non trouvé dans le stockage.',
                patient_not_found: 'Patient non trouvé.',
                delete_patient_confirm: 'Êtes-vous sûr de vouloir supprimer',
                patient_deleted: 'Patient supprimé avec succès.',
                at_least_one_item: 'Au moins un élément est requis pour la facture.',
                popup_blocked: 'Popup bloqué! Veuillez autoriser les popups pour ce site et réessayer, ou utilisez la méthode alternative ci-dessous.',
                print_error: 'Erreur lors de l\'ouverture de la fenêtre d\'impression. Utilisation de la méthode alternative.',
                select_patient_bill: 'Veuillez sélectionner un patient pour la facture.',
                bill_created_success: '✅ Facture créée avec succès!\n\nID de facture: {0}\nPatient: {1}\nTotal: ${2}\n\nVoulez-vous imprimer la facture maintenant?',
                bill_id: 'ID de facture:',
                patient: 'Patient:',
                total: 'Total:',
                print_bill_now: 'Voulez-vous imprimer la facture maintenant?',
                error_creating_bill: 'Erreur lors de la création de la facture: {0}',
                consultations_doctors_only: 'Les consultations sont disponibles uniquement pour les médecins.',
                fill_required_consultation: 'Veuillez remplir les champs obligatoires.',
                consultation_saved: 'Consultation enregistrée.',
                logout_confirm: 'Êtes-vous sûr de vouloir vous déconnecter?',

                // Titles
                logout: 'Déconnexion',
                cancelled: 'Annulé',

                // Doctor Dashboard
                doctor_dashboard: 'Tableau de bord médecin',
                today_appointments: 'Rendez-vous d\'aujourd\'hui',
                today_consultations: 'Consultations d\'aujourd\'hui',
                no_appointments_today: 'Aucun rendez-vous programmé pour aujourd\'hui.',
                no_consultations_today: 'Aucune consultation effectuée aujourd\'hui.',
                consult: 'Consulter',
                reject: 'Rejeter',
                view_details: 'Voir les détails',
                consultation_details: 'Détails de la consultation',
                close: 'Fermer',
                
                // Laboratory Assessment
                laboratory_assessment: 'Examen d\'évaluation de laboratoire',
                add_lab_assessment: 'Ajouter une évaluation de laboratoire',
                lab_assessment_desc: 'Téléchargez les documents d\'évaluation de laboratoire et ajoutez des notes sur les résultats de l\'examen.',
                patient: 'Patient',
                consultation_date: 'Date de consultation',
                upload_documents: 'Télécharger les documents de laboratoire',
                upload_documents_hint: 'Vous pouvez télécharger plusieurs fichiers (PDF, images, etc.)',
                lab_notes: 'Notes d\'évaluation de laboratoire',
                lab_notes_hint: 'Ajoutez des notes, observations ou interprétations des résultats de laboratoire',
                previous_assessments: 'Évaluations précédentes',
                save_assessment: 'Enregistrer l\'évaluation',
                assessment_saved: 'Évaluation de laboratoire enregistrée avec succès!',
                no_files_selected: 'Aucun fichier sélectionné',
                file_uploaded: 'Fichier téléchargé',
                remove_file: 'Supprimer le fichier',
                
                // Medical Certificate
                medical_certificate: 'Certificat médical',
                certificate_type: 'Type de certificat',
                rest_period: 'Période de repos (jours)',
                start_date: 'Date de début',
                end_date: 'Date de fin',
                diagnosis_condition: 'Diagnostic / Condition médicale',
                recommendations: 'Recommandations',
                additional_notes: 'Notes supplémentaires',
                certificate_info: 'Informations sur le certificat',
                certificate_info_text: 'Après l\'enregistrement, vous pouvez consulter et imprimer le certificat à partir des détails de la consultation.',
                save_certificate: 'Enregistrer le certificat',
                certificate_saved: 'Certificat médical enregistré avec succès!',
                date: 'Date'
            },
            ar: {
                // Navigation
                dashboard: 'لوحة التحكم',
                add_appointment: 'إضافة موعد',
                patients: 'المرضى',
                billing: 'الفوترة',
                reports: 'التقارير',
                consultation: 'الاستشارة',
                settings: 'الإعدادات',

                // Language Settings
                language_settings: 'إعدادات اللغة',
                select_language: 'اختر اللغة:',
                close: 'إغلاق',
                
                // Settings Menu
                manage_language: 'تغيير لغة التطبيق',
                bill_descriptions: 'وصف الفواتير',
                manage_bill_descriptions: 'إدارة عناصر خدمات الفواتير',
                
                // Bill Descriptions Management
                add_new_description: 'إضافة خدمة جديدة',
                service_name: 'اسم الخدمة',
                default_price: 'السعر الافتراضي (TND)',
                add_service: 'إضافة خدمة',
                existing_services: 'الخدمات الموجودة',
                search_services: 'البحث عن خدمات...',
                edit_service: 'تعديل الخدمة',
                save_changes: 'حفظ التغييرات',
                delete_service: 'حذف الخدمة',
                confirm_delete_service: 'هل أنت متأكد من حذف هذه الخدمة؟',
                service_added: 'تمت إضافة الخدمة بنجاح!',
                service_updated: 'تم تحديث الخدمة بنجاح!',
                service_deleted: 'تم حذف الخدمة بنجاح!',
                
                // Cabinet Settings
                cabinet_settings: 'إعدادات العيادة',
                manage_cabinet_info: 'إدارة اسم العيادة والشعار والجدول الزمني',
                cabinet_information: 'معلومات العيادة',
                cabinet_name: 'اسم العيادة',
                cabinet_address: 'عنوان العيادة',
                cabinet_phone: 'هاتف العيادة',
                cabinet_logo: 'شعار العيادة',
                upload_logo: 'رفع الشعار',
                remove_logo: 'إزالة الشعار',
                logo_recommendation: 'موصى به: صورة مربعة، بحد أقصى 2 ميجابايت',
                cabinet_timetable: 'ساعات العمل / الجدول الزمني',
                monday: 'الإثنين',
                tuesday: 'الثلاثاء',
                wednesday: 'الأربعاء',
                thursday: 'الخميس',
                friday: 'الجمعة',
                saturday: 'السبت',
                sunday: 'الأحد',
                save_settings: 'حفظ الإعدادات',
                settings_saved: 'تم حفظ الإعدادات بنجاح!',
                logo_too_large: 'الصورة كبيرة جدًا. الحجم الأقصى هو 2 ميجابايت.',
                invalid_image: 'ملف صورة غير صالح. يرجى رفع صورة صالحة.',
                
                // User Management
                user_management: 'إدارة المستخدمين',
                manage_users_access: 'إدارة المستخدمين وصلاحياتهم',
                add_new_user: 'إضافة مستخدم جديد',
                existing_users: 'المستخدمون الحاليون',
                total_users: 'إجمالي المستخدمين',
                search_users: 'البحث عن المستخدمين بالاسم أو البريد الإلكتروني أو اسم المستخدم...',
                user_full_name: 'الاسم الكامل',
                user_email: 'البريد الإلكتروني',
                username: 'اسم المستخدم',
                password: 'كلمة المرور',
                new_password: 'كلمة مرور جديدة',
                password_hint: 'اتركه فارغًا للاحتفاظ بكلمة المرور الحالية',
                user_role: 'الدور',
                user_status: 'الحالة',
                actions: 'الإجراءات',
                add_user: 'إضافة مستخدم',
                edit_user: 'تعديل المستخدم',
                delete_user: 'حذف المستخدم',
                confirm_delete_user: 'هل أنت متأكد من حذف هذا المستخدم؟',
                user_added: 'تمت إضافة المستخدم بنجاح!',
                user_updated: 'تم تحديث المستخدم بنجاح!',
                user_deleted: 'تم حذف المستخدم بنجاح!',
                username_exists: 'اسم المستخدم موجود بالفعل!',
                email_exists: 'البريد الإلكتروني موجود بالفعل!',
                
                // User Permissions
                user_permissions: 'صلاحيات المستخدم',
                patients_module: 'وحدة المرضى',
                perm_view_patients: 'عرض المرضى',
                perm_add_patients: 'إضافة/تعديل المرضى',
                perm_delete_patients: 'حذف المرضى',
                appointments_module: 'وحدة المواعيد',
                perm_view_appointments: 'عرض المواعيد',
                perm_add_appointments: 'إضافة/تعديل المواعيد',
                perm_delete_appointments: 'حذف المواعيد',
                billing_module: 'وحدة الفواتير',
                perm_view_bills: 'عرض الفواتير',
                perm_create_bills: 'إنشاء الفواتير',
                perm_manage_bills: 'إدارة الفواتير',
                consultations_module: 'وحدة الاستشارات',
                perm_view_consultations: 'عرض الاستشارات',
                perm_add_consultations: 'إضافة/تعديل الاستشارات',
                perm_delete_consultations: 'حذف الاستشارات',
                reports_module: 'وحدة التقارير',
                perm_view_reports: 'عرض التقارير',
                perm_export_reports: 'تصدير التقارير',
                settings_module: 'وحدة الإعدادات',
                perm_access_settings: 'الوصول إلى الإعدادات',
                perm_manage_users: 'إدارة المستخدمين',

                // Main Header
                secretary_agenda: 'جدول أعمال السكرتير',
                manage_appointments: 'إدارة المواعيد اليومية والجدولة',

                // Common buttons
                cancel: 'إلغاء',
                save: 'حفظ',
                edit: 'تعديل',
                delete: 'حذف',
                add: 'إضافة',
                create: 'إنشاء',

                // User profile
                secretary: 'سكرتير',

                // Patient fields
                patient_file_number: 'رقم ملف المريض',
                file_number: 'رقم الملف',
                cin_passport: 'بطاقة الهوية أو جواز السفر *',

                // Modal titles
                add_new_appointment: 'إضافة موعد جديد',
                patient_management: 'إدارة المرضى',
                edit_patient: 'تعديل المريض',
                create_patient_bill: 'إنشاء فاتورة مريض',

                // Modal buttons
                add_new_patient: 'إضافة مريض جديد',
                view_all_patients: 'عرض جميع المرضى',
                add_patient: 'إضافة مريض',
                update_patient: 'تحديث المريض',
                create_bill: 'إنشاء فاتورة',
                test_print: 'اختبار الطباعة',

                // Form labels
                select_patient: 'اختر مريض *',
                full_name: 'الاسم الكامل *',
                email_address: 'عنوان البريد الإلكتروني',
                phone_number: 'رقم الهاتف *',

                // Appointment form
                appointment_date: 'تاريخ الموعد',
                appointment_time: 'وقت الموعد',
                appointment_type: 'نوع الموعد',
                doctor_name: 'اسم الطبيب *',
                additional_notes: 'ملاحظات إضافية',

                // Patient form
                date_of_birth: 'تاريخ الميلاد *',
                gender: 'الجنس',
                address: 'العنوان',
                medical_history: 'التاريخ الطبي / ملاحظات',
                medical_files: 'الملفات الطبية',

                // Billing form
                bill_date: 'تاريخ الفاتورة',
                due_date: 'تاريخ الاستحقاق',
                bill_items: 'عناصر الفاتورة',
                description: 'الوصف',
                quantity: 'الكمية',
                price: 'السعر (TND)',
                notes: 'ملاحظات',
                remove_item: 'إزالة العنصر',
                add_item: 'إضافة عنصر',

                // Consultation form
                new_consultation: 'استشارة جديدة',
                patient_info: 'معلومات المريض',
                name: 'الاسم',
                phone: 'الهاتف',
                age_gender: 'العمر/الجنس',
                height_cm: 'الطول (سم)',
                weight_kg: 'الوزن (كغ)',
                bmi: 'مؤشر كتلة الجسم (BMI)',
                temperature_c: 'درجة الحرارة (°C)',
                heart_rate_bpm: 'معدل النبض (نبضة/دقيقة)',
                blood_sugar_mgdl: 'سكر الدم (ملغ/دل)',
                blood_pressure_mmhg: 'ضغط الدم (ملم زئبق)',
                reason: 'سبب الزيارة',
                diagnosis: 'التشخيص',
                clinical_examination: 'الفحص السريري',
                clinical_notes: 'ملاحظات سريرية إضافية',
                prescription: 'الوصفة الطبية',
                payment_status: 'حالة الدفع',
                paying_patient: 'مريض يدفع',
                non_paying_patient: 'مريض غير يدفع',
                save_consultation: 'حفظ الاستشارة',
                no_history_available: 'لا يوجد تاريخ متاح.',

                // Dynamic modals
                printable_bill: 'فاتورة قابلة للطباعة',

                // Placeholders
                enter_doctor_name: 'أدخل اسم الطبيب',
                specific_concerns: 'أي مخاوف أو أعراض محددة...',
                height_example: 'مثال: 175',
                weight_example: 'مثال: 70.5',
                temperature_example: 'مثال: 37.0',
                heart_rate_example: 'مثال: 72',
                blood_sugar_example: 'مثال: 95',
                blood_pressure_example: 'مثال: 120/80',
                enter_reason: 'أدخل سبب الاستشارة',
                enter_diagnosis: 'أدخل التشخيص',
                enter_clinical_exam: 'أدخل نتائج الفحص السريري',
                enter_notes: 'أدخل ملاحظات إضافية',
                drugs_dosage: 'الأدوية، الجرعة، المدة',
                file_number_example: 'أدخل رقم ملف المريض (مثال: P-2024-001)',
                cin_passport_example: 'أدخل رقم الهوية أو جواز السفر',
                full_name_example: 'أدخل الاسم الكامل للمريض',
                email_example: 'patient@example.com',
                phone_example: '+1 (555) 123-4567',
                address_example: 'عنوان الشارع، المدينة، الولاية',
                medical_history_example: 'أي تاريخ طبي ذي صلة، حساسيات أو ملاحظات...',
                search_patients: 'البحث عن المرضى بالاسم، الهوية/جواز السفر، رقم الملف، البريد الإلكتروني، الهاتف أو تاريخ الميلاد...',
                consultation_fee_example: 'مثال: رسوم الاستشارة',

                // Alert messages
                no_medical_files: 'لم يتم العثور على ملفات طبية لهذا المريض.',
                files_selected: 'ملف(ات) محدد(ة) للرفع.',
                select_patient_appointment: 'يرجى اختيار مريض للموعد.',
                fill_required_fields: 'يرجى ملء جميع الحقول المطلوبة.',
                valid_email: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
                future_date: 'يرجى اختيار تاريخ مستقبلي لموعدك.',
                appointment_not_found: 'لم يتم العثور على الموعد. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
                fill_required_patient_fields: 'يرجى ملء جميع الحقول المطلوبة (رقم الملف، الهوية/جواز السفر، الاسم، الهاتف، تاريخ الميلاد).',
                email_exists: 'يوجد مريض بهذا العنوان البريدي بالفعل.',
                file_number_exists: 'يوجد مريض برقم الملف هذا بالفعل.',
                cin_passport_exists: 'يوجد مريض برقم الهوية/جواز السفر هذا بالفعل.',
                no_patient_selected: 'لم يتم اختيار مريض للتعديل.',
                patient_not_found_storage: 'لم يتم العثور على المريض في التخزين.',
                patient_not_found: 'لم يتم العثور على المريض.',
                delete_patient_confirm: 'هل أنت متأكد من أنك تريد حذف',
                patient_deleted: 'تم حذف المريض بنجاح.',
                at_least_one_item: 'عنصر واحد على الأقل مطلوب للفاتورة.',
                popup_blocked: 'تم حظر النافذة المنبثقة! يرجى السماح بالنوافذ المنبثقة لهذا الموقع والمحاولة مرة أخرى، أو استخدم الطريقة البديلة أدناه.',
                print_error: 'خطأ في فتح نافذة الطباعة. استخدام الطريقة البديلة.',
                select_patient_bill: 'يرجى اختيار مريض للفاتورة.',
                bill_created_success: '✅ تم إنشاء الفاتورة بنجاح!\n\nرقم الفاتورة: {0}\nالمريض: {1}\nالمجموع: ${2}\n\nهل تريد طباعة الفاتورة الآن؟',
                bill_id: 'رقم الفاتورة:',
                patient: 'المريض:',
                total: 'المجموع:',
                print_bill_now: 'هل تريد طباعة الفاتورة الآن؟',
                error_creating_bill: 'خطأ في إنشاء الفاتورة: {0}',
                consultations_doctors_only: 'الاستشارات متاحة للأطباء فقط.',
                fill_required_consultation: 'يرجى ملء الحقول المطلوبة.',
                consultation_saved: 'تم حفظ الاستشارة.',
                logout_confirm: 'هل أنت متأكد من أنك تريد تسجيل الخروج؟',

                // Titles
                logout: 'تسجيل الخروج',
                cancelled: 'ملغي',

                // Doctor Dashboard
                doctor_dashboard: 'لوحة تحكم الطبيب',
                today_appointments: 'مواعيد اليوم',
                today_consultations: 'استشارات اليوم',
                no_appointments_today: 'لا توجد مواعيد مجدولة لليوم.',
                no_consultations_today: 'لم يتم إجراء أي استشارات اليوم.',
                consult: 'استشارة',
                reject: 'رفض',
                view_details: 'عرض التفاصيل',
                consultation_details: 'تفاصيل الاستشارة',
                close: 'إغلاق',
                
                // Laboratory Assessment
                laboratory_assessment: 'فحص التقييم المخبري',
                add_lab_assessment: 'إضافة تقييم مخبري',
                lab_assessment_desc: 'قم بتحميل مستندات التقييم المخبري وإضافة ملاحظات حول نتائج الفحص.',
                patient: 'المريض',
                consultation_date: 'تاريخ الاستشارة',
                upload_documents: 'تحميل المستندات المخبرية',
                upload_documents_hint: 'يمكنك تحميل ملفات متعددة (PDF، صور، إلخ.)',
                lab_notes: 'ملاحظات التقييم المخبري',
                lab_notes_hint: 'أضف ملاحظات أو ملاحظات أو تفسيرات لنتائج المختبر',
                previous_assessments: 'التقييمات السابقة',
                save_assessment: 'حفظ التقييم',
                assessment_saved: 'تم حفظ التقييم المخبري بنجاح!',
                no_files_selected: 'لم يتم تحديد ملفات',
                file_uploaded: 'تم رفع الملف',
                remove_file: 'إزالة الملف',
                
                // Medical Certificate
                medical_certificate: 'الشهادة الطبية',
                certificate_type: 'نوع الشهادة',
                rest_period: 'فترة الراحة (أيام)',
                start_date: 'تاريخ البدء',
                end_date: 'تاريخ الانتهاء',
                diagnosis_condition: 'التشخيص / الحالة الطبية',
                recommendations: 'التوصيات',
                additional_notes: 'ملاحظات إضافية',
                certificate_info: 'معلومات الشهادة',
                certificate_info_text: 'بعد الحفظ، يمكنك عرض وطباعة الشهادة من تفاصيل الاستشارة.',
                save_certificate: 'حفظ الشهادة',
                certificate_saved: 'تم حفظ الشهادة الطبية بنجاح!',
                date: 'التاريخ'
            }
        };
        

        // Billing storage system
        let storedBills = [];

        // File storage system

        // Edit mode variables
        let editingPatient = null;
        let editModeNewFiles = [];
        let editModeRemovedFiles = [];


        // Helper function to format date consistently
        const formatDateForStorage = (date) => {
            if (typeof date === 'string') {
                // If it's already a string in YYYY-MM-DD format, return as is
                return date;
            }
            // If it's a Date object, format it consistently
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Load appointments from localStorage
        const loadStoredAppointments = () => {
            const saved = localStorage.getItem('healthcareAppointments');
            console.log('Loading appointments from localStorage:', saved);
            if (saved) {
                storedAppointments = JSON.parse(saved);
                console.log('Loaded appointments:', storedAppointments);
            } else {
                console.log('No saved appointments found');
            }
        };

        // Load patients from localStorage
        const loadStoredPatients = () => {
            const saved = localStorage.getItem('healthcarePatients');
            console.log('Loading patients from localStorage:', saved);
            if (saved) {
                storedPatients = JSON.parse(saved);
                console.log('Loaded patients:', storedPatients);
            } else {
                console.log('No saved patients found');
                // Add some sample patients for demonstration
                storedPatients = [
                    {
                        id: 'patient-1',
                        fullName: 'John Smith',
                        email: 'john.smith@email.com',
                        phone: '+1 (555) 123-4567',
                        dateOfBirth: '1985-03-15',
                        gender: 'Male',
                        address: '123 Main St, New York, NY',
                        medicalHistory: 'No known allergies. Regular check-ups.',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'patient-2',
                        fullName: 'Sarah Johnson',
                        email: 'sarah.j@company.com',
                        phone: '+1 (555) 234-5678',
                        dateOfBirth: '1990-07-22',
                        gender: 'Female',
                        address: '456 Oak Ave, Los Angeles, CA',
                        medicalHistory: 'Allergic to penicillin. Diabetes type 2.',
                        createdAt: new Date().toISOString()
                    }
                ];
                saveStoredPatients();
            }
        };

        // Save appointments to localStorage
        const saveStoredAppointments = () => {
            localStorage.setItem('healthcareAppointments', JSON.stringify(storedAppointments));
        };

        // Save patients to localStorage
        const saveStoredPatients = () => {
            localStorage.setItem('healthcarePatients', JSON.stringify(storedPatients));
        };

        // Add new appointment to storage
        const addAppointment = (appointmentData) => {
            console.log('=== ADDING NEW APPOINTMENT ===');
            console.log('Input appointment data:', appointmentData);
            console.log('Current selectedDate:', selectedDate);
            console.log('Selected date formatted:', formatDateForStorage(selectedDate));

            const formattedDate = formatDateForStorage(appointmentData.appointmentDate);
            console.log('Appointment date from form:', appointmentData.appointmentDate);
            console.log('Appointment date formatted for storage:', formattedDate);

            const newAppointment = {
                id: `appointment-${Date.now()}`,
                time: appointmentData.appointmentTime,
                duration: 30, // Default duration
                clientName: appointmentData.patientName,
                clientPhone: appointmentData.patientPhone,
                clientEmail: appointmentData.patientEmail || '',
                type: appointmentData.appointmentType,
                status: 'confirmed',
                notes: appointmentData.appointmentNotes || '',
                doctor: appointmentData.doctorName,
                date: formattedDate
            };

            console.log('New appointment object:', newAppointment);
            storedAppointments.push(newAppointment);
            saveStoredAppointments();
            console.log('Total appointments after adding:', storedAppointments.length);
            console.log('All stored appointments:', storedAppointments);
            console.log('=== APPOINTMENT ADDED ===');
            return newAppointment;
        };

        // Get appointments for a specific date
        const getAppointmentsForDate = (date) => {
            const dateStr = formatDateForStorage(date);

            console.log('=== GETTING APPOINTMENTS FOR DATE ===');
            console.log('Requested date object:', date);
            console.log('Requested date formatted:', dateStr);
            console.log('Total stored appointments:', storedAppointments.length);

            // Debug each stored appointment's date
            storedAppointments.forEach((apt, index) => {
                console.log(`Appointment ${index + 1}: date="${apt.date}", matches="${apt.date === dateStr}"`);
            });

            // Get stored appointments for this date
            const storedForDate = storedAppointments.filter(apt => {
                const matches = apt.date === dateStr;
                console.log(`Checking appointment ${apt.id}: stored date="${apt.date}" vs requested="${dateStr}" = ${matches}`);
                return matches;
            });

            console.log('Filtered appointments for this date:', storedForDate);
            console.log('=== END GETTING APPOINTMENTS ===');

            // Return only stored appointments, sorted by time
            return storedForDate.sort((a, b) => a.time.localeCompare(b.time));
        };


        // Utility functions
        const formatDate = (date) => {
            // Get current language from i18n system or fallback to English
            const currentLang = localStorage.getItem('app_lang') || 'en';
            const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
            
            return date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'confirmed': return 'bg-green-100 text-green-800';
                case 'completed': return 'bg-blue-100 text-blue-800';
                case 'cancelled': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        const getTypeColor = (type) => {
            switch (type.toLowerCase()) {
                case 'consultation': return 'bg-blue-100 text-blue-800';
                case 'meeting': return 'bg-purple-100 text-purple-800';
                case 'interview': return 'bg-indigo-100 text-indigo-800';
                case 'follow-up': return 'bg-orange-100 text-orange-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        // Get status action buttons for appointment cards
        const getStatusActions = (appointment) => {
            const actions = [];

            switch (appointment.status) {
                case 'confirmed':
                    actions.push(`
                        <button onclick="updateAppointmentStatus('${appointment.id}', 'completed')" 
                                class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${window.t ? window.t('complete', 'Complete') : 'Complete'}
                        </button>
                    `);
                    actions.push(`
                        <button onclick="updateAppointmentStatus('${appointment.id}', 'cancelled')" 
                                class="btn btn-sm bg-red-600 hover:bg-red-700 text-white">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            ${window.t ? window.t('cancel', 'Cancel') : 'Cancel'}
                        </button>
                    `);
                    break;

                case 'completed':
                    actions.push(`
                        <span class="text-sm text-green-600 font-medium">
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${window.t ? window.t('completed', 'Completed') : 'Completed'}
                        </span>
                    `);
                    break;

                case 'cancelled':
                    actions.push(`
                        <span class="text-sm text-red-600 font-medium">
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            ${window.t ? window.t('cancelled', 'Cancelled') : 'Cancelled'}
                        </span>
                    `);
                    break;
            }

            return actions.join('');
        };

        // Generate time slots
        const generateTimeSlots = () => {
            const slots = [];
            for (let hour = 8; hour < 18; hour++) {
                slots.push(`${hour}:00`);
                slots.push(`${hour}:30`);
            }
            return slots;
        };

        // Create appointment card HTML
        const createAppointmentCard = (appointment) => {
            const statusActions = getStatusActions(appointment);

            return `
                <div class="card appointment-card p-4">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <svg class="icon" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <span class="font-medium">${appointment.time}</span>
                            <span class="text-sm text-gray-500">(${appointment.duration} ${window.t ? window.t('min', 'min') : 'min'})</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="badge ${getStatusColor(appointment.status)}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2">
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span class="font-medium">${appointment.clientName}</span>
                            <span class="badge badge-outline ${getTypeColor(appointment.type)}">${window.t ? window.t(appointment.type.toLowerCase().replace(/\s+/g, '_'), appointment.type) : appointment.type}</span>
                        </div>
                        ${appointment.doctor ? `
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="icon-sm" viewBox="0 0 24 24">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                                </svg>
                                <span><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${appointment.doctor}</span>
                            </div>
                        ` : ''}
                        <div class="flex flex-col gap-1 text-sm text-gray-500">
                            ${appointment.clientPhone ? `
                                <div class="flex items-center gap-2">
                                    <svg class="icon-sm" viewBox="0 0 24 24">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                    <span>${appointment.clientPhone}</span>
                                </div>
                            ` : ''}
                            ${appointment.clientEmail ? `
                                <div class="flex items-center gap-2">
                                    <svg class="icon-sm" viewBox="0 0 24 24">
                                        <rect width="20" height="16" x="2" y="4" rx="2"/>
                                        <path d="m22 7-10 5L2 7"/>
                                    </svg>
                                    <span>${appointment.clientEmail}</span>
                                </div>
                            ` : ''}
                        </div>
                        ${appointment.notes ? `
                            <div class="mt-2 p-2 bg-gray-50 rounded-md">
                                <p class="text-sm">${appointment.notes}</p>
                            </div>
                        ` : ''}
                        ${statusActions ? `
                            <div class="mt-3 pt-3 border-t border-gray-200">
                                <div class="flex gap-2">
                                    ${statusActions}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        };
        // Render daily agenda
        const renderDailyAgenda = () => {
            console.log('Rendering daily agenda for date:', selectedDate);
            console.log('Selected date formatted for storage:', formatDateForStorage(selectedDate));
            const appointments = getAppointmentsForDate(selectedDate);
            console.log('Appointments to render:', appointments);
            console.log('Total stored appointments:', storedAppointments.length);
            const timeSlots = generateTimeSlots();

            const appointmentCount = appointments.length;
            const confirmedCount = appointments.filter(apt => apt.status === 'confirmed').length;
            const completedCount = appointments.filter(apt => apt.status === 'completed').length;
            const cancelledCount = appointments.filter(apt => apt.status === 'cancelled').length;

            let agendaHTML = `
                <div class="space-y-4">
                    <div class="card p-6">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <svg class="icon-lg" viewBox="0 0 24 24">
                                    <path d="M8 2v4"/>
                                    <path d="M16 2v4"/>
                                    <rect width="18" height="18" x="3" y="4" rx="2"/>
                                    <path d="M3 10h18"/>
                                </svg>
                                <h2 class="text-xl font-semibold">${formatDate(selectedDate)}</h2>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-primary inline-flex items-center" onclick="showAddAppointmentModal()" title="${window.t ? window.t('add_appointment', 'Add Appointment') : 'Add Appointment'}">
                                <svg class="icon mr-2" viewBox="0 0 24 24">
                                    <path d="M12 4v16M20 12H4" />
                                </svg>
                                    ${window.t ? window.t('add_appointment', 'Add Appointment') : 'Add Appointment'}
                                </button>
                                <button class="btn btn-outline inline-flex items-center" onclick="showPatientManagement()" title="${window.t ? window.t('add_new_patient', 'Add New Patient') : 'Add New Patient'}">
                                    <svg class="icon mr-2" viewBox="0 0 24 24">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    ${window.t ? window.t('add_new_patient', 'Add New Patient') : 'Add New Patient'}
                            </button>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <span class="badge badge-secondary">${appointmentCount} ${window.t ? window.t('total', 'Total') : 'Total'}</span>
                            <span class="badge bg-green-100 text-green-800">${confirmedCount} ${window.t ? window.t('confirmed', 'Confirmed') : 'Confirmed'}</span>
                            <span class="badge bg-blue-100 text-blue-800">${completedCount} ${window.t ? window.t('completed', 'Completed') : 'Completed'}</span>
                            <span class="badge bg-red-100 text-red-800">${cancelledCount} ${window.t ? window.t('cancelled', 'Cancelled') : 'Cancelled'}</span>
                        </div>
                    </div>
            `;

            if (appointmentCount === 0) {
                // Show empty state when no appointments
                agendaHTML += `
                    <div class="card p-8 text-center">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <h3 class="text-lg font-semibold text-gray-600 mb-2">${window.t ? window.t('no_appointments_today', 'No Appointments Scheduled') : 'No Appointments Scheduled'}</h3>
                        <p class="text-gray-500 mb-4">${window.t ? window.t('no_appointments_for_date', 'There are no appointments scheduled for') : 'There are no appointments scheduled for'} ${formatDate(selectedDate)}.</p>
                        <div class="flex gap-2 justify-center">
                        <button class="btn btn-primary" onclick="showAddAppointmentModal()">
                            <svg class="icon-sm mr-2" viewBox="0 0 24 24">
                                <path d="M12 4v16m8-8H4"/>
                            </svg>
                                ${window.t ? window.t('add_first_appointment', 'Add First Appointment') : 'Add First Appointment'}
                            </button>
                            <button class="btn btn-outline" onclick="showPatientManagement()">
                                <svg class="icon-sm mr-2" viewBox="0 0 24 24">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                ${window.t ? window.t('add_new_patient', 'Add New Patient') : 'Add New Patient'}
                        </button>
                        </div>
                    </div>
                `;
            } else {
                // Show appointments in time slots
                agendaHTML += '<div class="space-y-2 current-time-container" id="currentTimeContainer">';

                timeSlots.forEach((timeSlot, index) => {
                    const slotAppointments = appointments.filter(apt => apt.time === timeSlot);

                    agendaHTML += `
                    <div class="time-slot">
                        <div class="time-label">
                            <svg class="icon-sm" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${timeSlot}
                        </div>
                        <div class="slot-content" data-slot-index="${index}">
                `;

                    if (slotAppointments.length > 0) {
                        slotAppointments.forEach(appointment => {
                            agendaHTML += createAppointmentCard(appointment);
                        });
                    } else {
                        agendaHTML += `<div class="available-slot">${window.t ? window.t('available', 'Available') : 'Available'}</div>`;
                    }

                    agendaHTML += '</div></div>';
                });

                agendaHTML += '</div>';
            }

            agendaHTML += '</div>';

            document.getElementById('dailyAgenda').innerHTML = agendaHTML;

            // Draw and update current time indicator if the selected date is today
            try {
                const container = document.getElementById('currentTimeContainer');
                if (container && isSameDay(selectedDate, new Date())) {
                    const update = () => renderOrUpdateCurrentTimeLine(container);
                    update();
                    // Update every minute
                    if (window.__currentTimeInterval) clearInterval(window.__currentTimeInterval);
                    window.__currentTimeInterval = setInterval(update, 60000);
                    // Also update on scroll within the agenda container to keep the line pinned correctly
                    container.addEventListener('scroll', update, { passive: true });
                } else {
                    if (window.__currentTimeInterval) clearInterval(window.__currentTimeInterval);
                }
            } catch {}

            // Update stats
            document.getElementById('totalAppointments').textContent = appointmentCount;
            document.getElementById('confirmedAppointments').textContent = confirmedCount;
            document.getElementById('pendingAppointments').textContent = completedCount;
            const cancelledEl = document.getElementById('cancelledAppointments');
            if (cancelledEl) cancelledEl.textContent = cancelledCount;
        };

        // Expose renderDailyAgenda to global scope for language switching
        window.renderDailyAgenda = renderDailyAgenda;

        function isSameDay(a, b) {
            return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        }

        // Compute Y offset for current time within 08:00-18:00 grid built from 30-min slots
        function computeCurrentTimeOffsetPx(container) {
            const startHour = 8; // matches generateTimeSlots
            const endHour = 18;
            const now = new Date();
            const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
            const totalMinutes = (endHour - startHour) * 60;
            // If outside schedule, do not show
            if (minutesSinceStart < 0 || minutesSinceStart > totalMinutes) return null;
            const clamped = minutesSinceStart;

            // Measure slots by summing heights of .time-slot blocks to avoid overlay issues
            const slots = Array.from(container.querySelectorAll('.time-slot'));
            if (slots.length === 0) return null;
            const containerTop = container.getBoundingClientRect().top;
            const top = slots[0].getBoundingClientRect().top;
            const bottom = slots[slots.length - 1].getBoundingClientRect().bottom;
            const usableHeight = bottom - top;
            if (usableHeight <= 0) return null;

            const ratio = clamped / totalMinutes;
            return (top - containerTop) + usableHeight * ratio;
        }

        function renderOrUpdateCurrentTimeLine(container) {
            let line = container.querySelector('.current-time-line');
            let badge = container.querySelector('.current-time-badge');
            if (!line) {
                line = document.createElement('div');
                line.className = 'current-time-line';
                container.appendChild(line);
            }
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'current-time-badge';
                container.appendChild(badge);
            }

            const y = computeCurrentTimeOffsetPx(container);
            if (y == null) {
                // hide when out of range
                if (line) line.style.display = 'none';
                if (badge) badge.style.display = 'none';
                return;
            }
            line.style.display = 'block';
            badge.style.display = 'block';
            line.style.top = `${y}px`;
            badge.style.top = `${y}px`;
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            badge.textContent = `${hh}:${mm}`;
        }

        // Calendar functions
        const renderCalendar = () => {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();

            // Get current language from i18n system or fallback to English
            const currentLang = localStorage.getItem('app_lang') || 'en';
            const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';

            document.getElementById('currentMonthYear').textContent =
                currentCalendarDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            const calendarGrid = document.getElementById('calendarGrid');
            calendarGrid.innerHTML = '';

            // Add day headers based on current language
            let dayHeaders;
            if (currentLang === 'fr') {
                dayHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Dim, Lun, Mar, Mer, Jeu, Ven, Sam
            } else {
                dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // English
            }
            dayHeaders.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'text-center text-sm font-medium text-gray-500 p-2';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });

            // Add calendar days
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);

                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = date.getDate();

                if (date.getMonth() !== month) {
                    dayElement.className += ' text-gray-300';
                }

                if (date.toDateString() === selectedDate.toDateString()) {
                    dayElement.className += ' selected';
                }

                dayElement.onclick = () => {
                    selectedDate = new Date(date);
                    renderCalendar();
                    renderDailyAgenda();
                };

                calendarGrid.appendChild(dayElement);
            }
        };

        // Expose renderCalendar to global scope for language switching
        window.renderCalendar = renderCalendar;

        // Navigation functions
        const goToPreviousDay = () => {
            selectedDate.setDate(selectedDate.getDate() - 1);
            renderCalendar();
            renderDailyAgenda();
        };

        const goToNextDay = () => {
            selectedDate.setDate(selectedDate.getDate() + 1);
            renderCalendar();
            renderDailyAgenda();
        };

        const goToToday = () => {
            selectedDate = new Date();
            currentCalendarDate = new Date();
            renderCalendar();
            renderDailyAgenda();
        };

        const previousMonth = () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        };

        const nextMonth = () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        };

        // Mobile menu toggle function
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        }

        // Modal functions
        function showAddAppointmentModal() {
            const modal = document.getElementById('addAppointmentModal');
            modal.classList.add('active');

            // Set minimum date to today
            const dateInput = document.getElementById('appointmentDate');
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;

            // Populate patient dropdown
            populatePatientDropdown();

            // Update modal translations
            updateModalTranslations();

            // Reset form and hide patient details
            resetAppointmentForm();

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');
        }

        function closeAddAppointmentModal() {
            const modal = document.getElementById('addAppointmentModal');
            modal.classList.remove('active');

            // Reset form
            resetAppointmentForm();
        }

        // Patient selection functions
        function populatePatientDropdown() {
            const patientSelect = document.getElementById('patientSelection');
            patientSelect.innerHTML = `<option value="">${window.t ? window.t('choose_patient', 'Choose a patient...') : 'Choose a patient...'}</option>`;

            if (storedPatients.length === 0) {
                patientSelect.innerHTML = `<option value="">${window.t ? window.t('no_patients_available', 'No patients available. Add a patient first.') : 'No patients available. Add a patient first.'}</option>`;
                return;
            }

            storedPatients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.fullName} (${patient.fileNumber || 'No file#'}) - ${patient.phone}`;
                patientSelect.appendChild(option);
            });
        }

        function handlePatientSelection() {
            const patientSelect = document.getElementById('patientSelection');
            const selectedPatientId = patientSelect.value;
            const patientDetailsDiv = document.getElementById('selectedPatientDetails');

            if (!selectedPatientId) {
                // No patient selected
                patientDetailsDiv.classList.add('hidden');
                clearPatientData();
                return;
            }

            // Find the selected patient
            const selectedPatient = storedPatients.find(patient => patient.id === selectedPatientId);

            if (selectedPatient) {
                // Display patient details
                displayPatientDetails(selectedPatient);

                // Populate hidden inputs
                populatePatientData(selectedPatient);

                // Show patient details section
                patientDetailsDiv.classList.remove('hidden');
            }
        }

        function displayPatientDetails(patient) {
            document.getElementById('displayPatientName').textContent = patient.fullName;
            document.getElementById('displayPatientEmail').textContent = patient.email;
            document.getElementById('displayPatientPhone').textContent = patient.phone;

            // Calculate and display age
            const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
            document.getElementById('displayPatientAge').textContent = age;
        }

        function populatePatientData(patient) {
            document.getElementById('patientName').value = patient.fullName;
            document.getElementById('patientEmail').value = patient.email;
            document.getElementById('patientPhone').value = patient.phone;
        }

        function clearPatientData() {
            document.getElementById('patientName').value = '';
            document.getElementById('patientEmail').value = '';
            document.getElementById('patientPhone').value = '';
            // Clear doctor name as well
            const doctorField = document.getElementById('doctorName');
            if (doctorField) {
                doctorField.value = '';
            }
        }

        function resetAppointmentForm() {
            document.getElementById('appointmentForm').reset();
            document.getElementById('selectedPatientDetails').classList.add('hidden');
            clearPatientData();
        }





        // Medical file functionality restored

        function viewPatientFiles(patientId) {
            const patient = storedPatients.find(p => p.id === patientId);
            if (!patient || !patient.medicalFiles || patient.medicalFiles.length === 0) {
                showTranslatedAlert('no_medical_files');
                return;
            }

            // Create modal for viewing files
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 class="modal-title" data-translate="medical_files">Medical Files - ${patient.fullName}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="space-y-4">
                        ${patient.medicalFiles.map(file => `
                            <div class="file-item">
                                <div class="file-info">
                                    <div class="file-icon ${file.name.split('.').pop().toLowerCase()}">${file.name.split('.').pop().toUpperCase()}</div>
                                    <div class="file-details">
                                        <h4>${file.name}</h4>
                                        <p>Uploaded ${new Date(file.uploadedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Update translations for the new modal
            updateModalTranslations();

            // Close modal when clicking outside
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.remove();
                }
            });
        }

        function displayCurrentFiles(files) {
            const currentFilesDiv = document.getElementById('editCurrentFiles');

            if (!files || files.length === 0) {
                currentFilesDiv.innerHTML = '<p class="text-gray-500 text-sm">No medical files attached.</p>';
                return;
            }

            currentFilesDiv.innerHTML = files.map(file => `
                <div class="current-file-item">
                    <div class="current-file-info">
                        <div class="file-icon ${file.name.split('.').pop().toLowerCase()}">${file.name.split('.').pop().toUpperCase()}</div>
                        <div class="file-details">
                            <h4>${file.name}</h4>
                            <p>Uploaded ${new Date(file.uploadedAt).toLocaleString()}</p>
                        </div>
                        <span class="current-file-label">${window.t ? window.t('current_file', 'Current File') : 'Current File'}</span>
                    </div>
                </div>
            `).join('');
        }

        function handleEditFileUpload(event) {
            // Basic file upload handler - files will be stored as empty for now
            const files = Array.from(event.target.files);

            files.forEach(file => {
                const fileData = {
                    id: `edit-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    file: file,
                    uploadedAt: new Date().toISOString()
                };

                editModeNewFiles.push(fileData);
            });

            // Clear the input
            event.target.value = '';
            showTranslatedAlert('files_selected', files.length);
        }


        // Patient Management Functions

        function closeEditPatientModal() {
            const modal = document.getElementById('editPatientModal');
            modal.classList.remove('active');

            // Reset form
            document.getElementById('editPatientForm').reset();

            // Clear edit mode variables
            editingPatient = null;
            editModeNewFiles = [];
            editModeRemovedFiles = [];

            // Clear file displays
            const curFilesEl = document.getElementById('editCurrentFiles');
            if (curFilesEl) curFilesEl.innerHTML = '';
            const newFilesEl = document.getElementById('editFileList');
            if (newFilesEl) newFilesEl.innerHTML = '';
        }

        // Close modal when clicking outside
        document.addEventListener('click', function (event) {
            const modal = document.getElementById('addAppointmentModal');
            if (event.target === modal) {
                closeAddAppointmentModal();
            }
        });

        // Handle form submission
        document.getElementById('appointmentForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = {
                patientName: document.getElementById('patientName').value,
                patientEmail: document.getElementById('patientEmail').value,
                patientPhone: document.getElementById('patientPhone').value,
                appointmentDate: document.getElementById('appointmentDate').value,
                appointmentTime: document.getElementById('appointmentTime').value,
                doctorName: document.getElementById('doctorName').value,
                appointmentType: document.getElementById('appointmentType').value,
                appointmentNotes: document.getElementById('appointmentNotes').value
            };

            // Validate form data
            if (!validateAppointmentForm(formData)) {
                return;
            }

            // Add appointment to storage
            console.log('About to add appointment with data:', formData);
            const newAppointment = addAppointment(formData);
            console.log('New appointment created:', newAppointment);

            // Show success message
            showAppointmentSuccess(formData);

            // Force refresh the agenda display
            console.log('Refreshing agenda after appointment creation...');
            renderDailyAgenda();
            renderCalendar();

            // Close modal and reset form
            closeAddAppointmentModal();
        });

        function validateAppointmentForm(data) {
            // Check if patient is selected
            const patientSelect = document.getElementById('patientSelection');
            if (!patientSelect.value) {
                showTranslatedAlert('select_patient_appointment');
                return false;
            }

            // Basic validation
            if (!data.patientName || !data.patientPhone ||
                !data.appointmentDate || !data.appointmentTime || !data.appointmentType) {
                showTranslatedAlert('fill_required_fields');
                return false;
            }

            // Email validation (if provided)
            if (data.patientEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.patientEmail)) {
                    showTranslatedAlert('valid_email');
                    return false;
                }
            }

            // Date validation (not in the past)
            const selectedDate = new Date(data.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                showTranslatedAlert('future_date');
                return false;
            }

            return true;
        }
        function showAppointmentSuccess(data) {
            // Create success message
            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #059669;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">${window.t ? window.t('appointment_added_successfully', 'Appointment Added Successfully!') : 'Appointment Added Successfully!'}</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>${window.t ? window.t('patient', 'Patient') : 'Patient'}:</strong> ${data.patientName}</p>
                        <p><strong>${window.t ? window.t('date', 'Date') : 'Date'}:</strong> ${new Date(data.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>${window.t ? window.t('time', 'Time') : 'Time'}:</strong> ${data.appointmentTime}</p>
                        <p><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${data.doctorName}</p>
                        <p><strong>${window.t ? window.t('type', 'Type') : 'Type'}:</strong> ${data.appointmentType}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        ${window.t ? window.t('appointment_added_to_system', 'The appointment has been added to the system. You can view it in the agenda.') : 'The appointment has been added to the system. You can view it in the agenda.'}
                    </p>
                </div>
            `;

            // Insert success message at the top of the main content
            const mainContent = document.querySelector('.max-w-7xl');
            const existingSuccess = mainContent.querySelector('.appointment-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'appointment-success';
            successDiv.innerHTML = successMessage;
            mainContent.insertBefore(successDiv, mainContent.firstChild);

            // Scroll to success message
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Remove success message after 8 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 8000);

            // Refresh the agenda to show the new appointment
            renderDailyAgenda();
        }

        // Update appointment status
        function updateAppointmentStatus(appointmentId, newStatus) {
            console.log('Updating appointment status:', appointmentId, 'to', newStatus);

            // Find the appointment in stored appointments
            const appointmentIndex = storedAppointments.findIndex(apt => apt.id === appointmentId);

            if (appointmentIndex !== -1) {
                // Update the status
                storedAppointments[appointmentIndex].status = newStatus;

                // Save to localStorage
                saveStoredAppointments();

                // Show success message
                showStatusUpdateMessage(storedAppointments[appointmentIndex], newStatus);

                // Refresh the agenda
                renderDailyAgenda();
            } else {
                console.error('Appointment not found:', appointmentId);
                showTranslatedAlert('appointment_not_found');
            }
        }

        // Show status update success message
        function showStatusUpdateMessage(appointment, newStatus) {
            const statusMessages = {
                'confirmed': window.t ? window.t('appointment_confirmed_successfully', 'Appointment confirmed successfully!') : 'Appointment confirmed successfully!',
                'completed': window.t ? window.t('appointment_marked_completed', 'Appointment marked as completed!') : 'Appointment marked as completed!',
                'cancelled': window.t ? window.t('appointment_cancelled_successfully', 'Appointment cancelled successfully!') : 'Appointment cancelled successfully!'
            };

            const statusColors = {
                'confirmed': '#059669',
                'completed': '#2563eb',
                'cancelled': '#dc2626'
            };

            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid ${statusColors[newStatus]}; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${statusColors[newStatus]};">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: ${statusColors[newStatus]}; margin: 0;">${statusMessages[newStatus]}</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #374151; margin-bottom: 0.75rem;">
                        <p><strong>${window.t ? window.t('patient', 'Patient') : 'Patient'}:</strong> ${appointment.clientName}</p>
                        <p><strong>${window.t ? window.t('time', 'Time') : 'Time'}:</strong> ${appointment.time}</p>
                        <p><strong>${window.t ? window.t('status', 'Status') : 'Status'}:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: 600;">${window.t ? window.t(newStatus.toLowerCase(), newStatus.charAt(0).toUpperCase() + newStatus.slice(1)) : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
                    </div>
                </div>
            `;

            // Insert success message at the top of the main content
            const mainContent = document.querySelector('.max-w-7xl');
            const existingSuccess = mainContent.querySelector('.status-update-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'status-update-success';
            successDiv.innerHTML = successMessage;
            mainContent.insertBefore(successDiv, mainContent.firstChild);

            // Scroll to success message
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Remove success message after 5 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 5000);
        }

        // Patient Management Functions
        function showPatientManagement(fromMenu = false) {
            // Check permission
            if (!hasPermission('view_patients')) {
                alert('You do not have permission to access patient management.');
                return;
            }
            
            const modal = document.getElementById('patientManagementModal');
            modal.classList.add('active');

            // Update modal title based on context
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                if (fromMenu) {
                    modalTitle.textContent = 'Patient Management';
                } else {
                    modalTitle.textContent = 'Patient Addition';
                }
            }

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');

            // Hide all buttons if called from menu
            const addPatientButton = document.getElementById('addPatientTab');
            const viewPatientsButton = document.getElementById('viewPatientsTab');
            const buttonContainer = addPatientButton?.parentElement;
            
            if (fromMenu) {
                // Hide the entire button container when called from menu
                if (buttonContainer) {
                    buttonContainer.style.display = 'none';
                }
                // Switch to view patients tab
                switchPatientTab('view');
            } else {
                // Show buttons when called from other places
                if (buttonContainer) {
                    buttonContainer.style.display = 'flex';
                }
                if (addPatientButton) {
                    addPatientButton.style.display = 'inline-flex';
                }
                if (viewPatientsButton) {
                    viewPatientsButton.style.display = 'inline-flex';
                }
            }

            // Load patients list
            loadPatientsList();

            // Update modal translations
            updateModalTranslations();

            // Set initial tab state based on context
            if (!fromMenu) {
                // When not from menu, ensure we're on the Add tab
                switchPatientTab('add');
            }

            // Auto-generate file number on open (Add tab)
            const fileNumEl = document.getElementById('patientFileNumber');
            if (fileNumEl) {
                fileNumEl.value = generatePatientFileNumber();
                fileNumEl.readOnly = true;
            }
        }

        function closePatientManagement() {
            const modal = document.getElementById('patientManagementModal');
            modal.classList.remove('active');

            // Reset form
            document.getElementById('patientForm').reset();


            // Switch back to add patient tab
            switchPatientTab('add');
        }

        function switchPatientTab(tab) {
            const addContent = document.getElementById('addPatientContent');
            const viewContent = document.getElementById('viewPatientsContent');
            const addTab = document.getElementById('addPatientTab');
            const viewTab = document.getElementById('viewPatientsTab');
            const modal = document.getElementById('patientManagementModal');
            const modalTitle = modal?.querySelector('.modal-title');

            if (tab === 'add') {
                addContent.style.display = 'block';
                viewContent.style.display = 'none';
                addTab.className = 'btn btn-primary';
                viewTab.className = 'btn btn-secondary';
                // Update modal title
                if (modalTitle) {
                    modalTitle.textContent = 'Patient Addition';
                }
                // Ensure file number is generated when switching back to Add tab
                const fileNumEl = document.getElementById('patientFileNumber');
                if (fileNumEl) {
                    fileNumEl.value = generatePatientFileNumber();
                    fileNumEl.readOnly = true;
                }
            } else {
                addContent.style.display = 'none';
                viewContent.style.display = 'block';
                addTab.className = 'btn btn-secondary';
                viewTab.className = 'btn btn-primary';
                // Update modal title
                if (modalTitle) {
                    modalTitle.textContent = 'Patient Management';
                }
                loadPatientsList();
            }
        }

        // Patient Details Modal Functions
        let currentPatientDetailsId = null;

        function viewPatientDetails(patientId) {
            currentPatientDetailsId = patientId;
            const modal = document.getElementById('patientDetailsModal');
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = patients.find(p => p.id === patientId);
            
            if (!patient) {
                alert('Patient not found.');
                return;
            }

            // Load patient information
            const patientDetailsInfo = document.getElementById('patientDetailsInfo');
            const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
            const filesCount = patient.medicalFiles ? patient.medicalFiles.length : 0;
            
            patientDetailsInfo.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('full_name', 'Full Name') : 'Full Name'}:</span>
                        <span class="text-gray-900">${patient.fullName || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('file_number', 'File Number') : 'File Number'}:</span>
                        <span class="text-gray-900">${patient.fileNumber || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('cin_passport', 'CIN/Passport') : 'CIN/Passport'}:</span>
                        <span class="text-gray-900">${patient.cinPassport || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('email', 'Email') : 'Email'}:</span>
                        <span class="text-gray-900">${patient.email || 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('phone', 'Phone') : 'Phone'}:</span>
                        <span class="text-gray-900">${patient.phone || 'N/A'}</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('date_of_birth', 'Date of Birth') : 'Date of Birth'}:</span>
                        <span class="text-gray-900">${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('age', 'Age') : 'Age'}:</span>
                        <span class="text-gray-900">${age}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('gender', 'Gender') : 'Gender'}:</span>
                        <span class="text-gray-900">${patient.gender ? (window.t ? window.t(patient.gender.toLowerCase(), patient.gender) : patient.gender) : 'N/A'}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('address', 'Address') : 'Address'}:</span>
                        <span class="text-gray-900">${patient.address || 'N/A'}</span>
                    </div>
                    ${patient.medicalHistory ? `
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('medical_history', 'Medical History') : 'Medical History'}:</span>
                        <span class="text-gray-900">${patient.medicalHistory}</span>
                    </div>
                    ` : ''}
                    <div class="flex items-start">
                        <span class="font-semibold text-gray-700 w-32">${window.t ? window.t('registered', 'Registered') : 'Registered'}:</span>
                        <span class="text-gray-900">${new Date(patient.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `;

            // Load past consultations
            loadPatientConsultations(patientId);

            // Load past bills
            loadPatientBills(patientId);

            // Load medical files if any
            if (filesCount > 0) {
                const filesSection = document.getElementById('patientFilesSection');
                const filesList = document.getElementById('patientFilesList');
                filesSection.style.display = 'block';
                
                filesList.innerHTML = patient.medicalFiles.map((file, index) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-sm font-medium">${file.name}</span>
                        </div>
                        <button onclick="downloadPatientFile('${patientId}', ${index})" class="btn btn-sm btn-outline">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                        </button>
                    </div>
                `).join('');
            } else {
                document.getElementById('patientFilesSection').style.display = 'none';
            }

            modal.classList.add('active');
        }

        function loadPatientConsultations(patientId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const patientConsultations = consultations.filter(c => c.patientId === patientId).sort((a, b) => new Date(b.date) - new Date(a.date));
            const consultationsList = document.getElementById('patientConsultationsList');

            if (patientConsultations.length === 0) {
                consultationsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p data-translate="no_consultations">No consultations recorded for this patient yet.</p>
                    </div>
                `;
                return;
            }

            consultationsList.innerHTML = patientConsultations.map(consultation => {
                const consultationDate = new Date(consultation.date).toLocaleDateString();
                const consultationTime = new Date(consultation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="font-semibold text-gray-900">${consultationDate} at ${consultationTime}</span>
                                </div>
                                <div class="text-sm text-gray-600 ml-7">
                                    <strong data-translate="doctor">Doctor:</strong> ${consultation.doctorName || 'N/A'}
                                </div>
                            </div>
                            <span class="badge badge-secondary">ID: ${consultation.id}</span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                            ${consultation.height ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('height', 'Height') : 'Height'}:</strong> ${consultation.height} cm</span>
                                </div>
                            ` : ''}
                            ${consultation.weight ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('weight', 'Weight') : 'Weight'}:</strong> ${consultation.weight} kg</span>
                                </div>
                            ` : ''}
                            ${consultation.bloodPressure ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('blood_pressure', 'BP') : 'BP'}:</strong> ${consultation.bloodPressure}</span>
                                </div>
                            ` : ''}
                            ${consultation.temperature ? `
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                    <span><strong>${window.t ? window.t('temperature', 'Temp') : 'Temp'}:</strong> ${consultation.temperature}°C</span>
                                </div>
                            ` : ''}
                        </div>

                        ${consultation.reason ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="reason">Reason:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.reason}</p>
                            </div>
                        ` : ''}

                        ${consultation.diagnosis ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="diagnosis">Diagnosis:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.diagnosis}</p>
                            </div>
                        ` : ''}

                        ${consultation.clinicalExam ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="clinical_examination">Clinical Examination:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.clinicalExam}</p>
                            </div>
                        ` : ''}

                        ${consultation.prescription ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="prescription">Prescription:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.prescription}</p>
                            </div>
                        ` : ''}

                        ${consultation.labTests && consultation.labTests.length > 0 ? `
                            <div class="mb-2">
                                <span class="font-semibold text-gray-700" data-translate="lab_tests">Lab Tests:</span>
                                <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                    ${consultation.labTests.map(test => `<li>${test}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${consultation.notes ? `
                            <div>
                                <span class="font-semibold text-gray-700" data-translate="notes">Notes:</span>
                                <p class="text-gray-600 text-sm mt-1">${consultation.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }

        function loadPatientBills(patientId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const patientBills = bills.filter(b => b.patientId === patientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const billsList = document.getElementById('patientBillsList');

            if (patientBills.length === 0) {
                billsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
                        </svg>
                        <p data-translate="no_bills">No bills recorded for this patient yet.</p>
                    </div>
                `;
                return;
            }

            billsList.innerHTML = patientBills.map(bill => {
                const billDate = new Date(bill.billDate).toLocaleDateString();
                const dueDate = new Date(bill.dueDate).toLocaleDateString();
                const createdDate = new Date(bill.createdAt).toLocaleDateString();
                
                // Status badge styling
                let statusClass = 'bg-yellow-100 text-yellow-800';
                if (bill.status === 'Paid') {
                    statusClass = 'bg-green-100 text-green-800';
                } else if (bill.status === 'Overdue') {
                    statusClass = 'bg-red-100 text-red-800';
                } else if (bill.status === 'Cancelled') {
                    statusClass = 'bg-gray-100 text-gray-800';
                }
                
                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span class="font-semibold text-gray-900" data-translate="bill_id">Bill ID:</span>
                                    <span class="font-semibold text-gray-900 ml-1">${bill.id}</span>
                                </div>
                                <div class="text-sm text-gray-600 ml-7">
                                    <strong data-translate="bill_date">Bill Date:</strong> ${billDate}
                                </div>
                                <div class="text-sm text-gray-600 ml-7">
                                    <strong data-translate="due_date">Due Date:</strong> ${dueDate}
                                </div>
                            </div>
                            <span class="badge ${statusClass} px-3 py-1 rounded-full text-xs font-semibold">
                                ${window.t ? window.t(bill.status.toLowerCase(), bill.status) : bill.status}
                            </span>
                        </div>
                        
                        <!-- Bill Items -->
                        <div class="mb-3">
                            <span class="font-semibold text-gray-700" data-translate="bill_items">Bill Items:</span>
                            <div class="mt-2 space-y-2">
                                ${bill.items.map(item => `
                                    <div class="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                        <div>
                                            <span class="font-medium">${item.description}</span>
                                            <span class="text-gray-500 ml-2">(${window.t ? window.t('qty', 'Qty') : 'Qty'}: ${item.quantity})</span>
                                        </div>
                                        <span class="font-semibold">${(item.price * item.quantity).toFixed(2)} TND</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Bill Summary -->
                        <div class="border-t pt-3 space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600" data-translate="subtotal">Subtotal:</span>
                                <span class="font-medium">${bill.subtotal.toFixed(2)} TND</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600" data-translate="tax">Tax:</span>
                                <span class="font-medium">${bill.tax.toFixed(2)} TND</span>
                            </div>
                            <div class="flex justify-between text-base font-bold border-t pt-2">
                                <span data-translate="total">Total:</span>
                                <span class="text-blue-600">${bill.total.toFixed(2)} TND</span>
                            </div>
                        </div>

                        ${bill.notes ? `
                            <div class="mt-3 pt-3 border-t">
                                <span class="font-semibold text-gray-700 text-sm" data-translate="notes">Notes:</span>
                                <p class="text-gray-600 text-sm mt-1">${bill.notes}</p>
                            </div>
                        ` : ''}

                        <div class="mt-3 pt-3 border-t flex justify-between items-center">
                            <span class="text-xs text-gray-500">
                                <span data-translate="created_on">Created on:</span> ${createdDate}
                            </span>
                            <button onclick="viewBillDetails('${bill.id}')" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                <span data-translate="view_full_bill">View Full Bill</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function viewBillDetails(billId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found.');
                return;
            }

            // Use existing bill display function if available, or show in alert
            if (typeof showPrintableBill === 'function') {
                showPrintableBill(bill);
            } else {
                // Fallback to simple display
                alert(`Bill ID: ${bill.id}\nTotal: ${bill.total.toFixed(2)} TND\nStatus: ${bill.status}`);
            }
        }

        function closePatientDetailsModal() {
            const modal = document.getElementById('patientDetailsModal');
            modal.classList.remove('active');
            currentPatientDetailsId = null;
        }

        function editPatientFromDetails() {
            if (currentPatientDetailsId) {
                closePatientDetailsModal();
                editPatient(currentPatientDetailsId);
            }
        }

        function downloadPatientFile(patientId, fileIndex) {
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
            const patient = patients.find(p => p.id === patientId);
            
            if (patient && patient.medicalFiles && patient.medicalFiles[fileIndex]) {
                const file = patient.medicalFiles[fileIndex];
                const link = document.createElement('a');
                link.href = file.data;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        // Handle patient form submission
        document.getElementById('patientForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = {
                fileNumber: document.getElementById('patientFileNumber').value,
                cinPassport: document.getElementById('patientCinPassport').value,
                fullName: document.getElementById('patientFullName').value,
                email: document.getElementById('patientEmailAddress').value,
                phone: document.getElementById('patientPhoneNumber').value,
                dateOfBirth: document.getElementById('patientDateOfBirth').value,
                gender: document.getElementById('patientGender').value,
                address: document.getElementById('patientAddress').value,
                medicalHistory: document.getElementById('patientMedicalHistory').value
            };

            // Validate form data
            if (!validatePatientForm(formData)) {
                return;
            }

            // Add patient to storage
            const newPatient = addPatient(formData);

            // Show success message
            showPatientSuccess(newPatient);

            // Switch to 'View All Patients' to show the updated list
            switchPatientTab('view');

            // After the list renders, scroll to the new card and highlight it briefly
            setTimeout(() => {
                const newCard = document.getElementById(`patient-card-${newPatient.id}`);
                if (newCard) {
                    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add a temporary highlight using ring and bg utility classes
                    newCard.classList.add('ring-2', 'ring-blue-500', 'bg-yellow-50');
                    setTimeout(() => {
                        newCard.classList.remove('ring-2', 'ring-blue-500', 'bg-yellow-50');
                    }, 2500);
                }
            }, 100);

            // Reset form (for next time)
            document.getElementById('patientForm').reset();
            // Pre-fill a fresh generated file number for the next entry
            const fileNumEl = document.getElementById('patientFileNumber');
            if (fileNumEl) {
                fileNumEl.value = generatePatientFileNumber();
                fileNumEl.readOnly = true;
            }
        });

        // Handle edit patient form submission
        document.getElementById('editPatientForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Get form data
            const formData = {
                fileNumber: document.getElementById('editPatientFileNumber').value,
                cinPassport: document.getElementById('editPatientCinPassport').value,
                fullName: document.getElementById('editPatientFullName').value,
                email: document.getElementById('editPatientEmailAddress').value,
                phone: document.getElementById('editPatientPhoneNumber').value,
                dateOfBirth: document.getElementById('editPatientDateOfBirth').value,
                gender: document.getElementById('editPatientGender').value,
                address: document.getElementById('editPatientAddress').value,
                medicalHistory: document.getElementById('editPatientMedicalHistory').value
            };

            // Validate form data
            if (!validateEditPatientForm(formData)) {
                return;
            }

            // Update patient
            updatePatient(formData);
        });

        function validatePatientForm(data) {
            // Basic validation
            if (!data.fileNumber || !data.cinPassport || !data.fullName || !data.phone || !data.dateOfBirth) {
                showTranslatedAlert('fill_required_patient_fields');
                return false;
            }

            // Normalize inputs for consistent comparisons
            data.cinPassport = (data.cinPassport || '').trim();
            data.email = (data.email || '').trim().toLowerCase();

            // Email validation (if provided) - only format check, duplicates allowed
            if (data.email && data.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    showTranslatedAlert('valid_email');
                    return false;
                }
            }

            // Ensure unique file number: if duplicate, auto-generate a new unique one and update the form
            try {
                const lsPatients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                const existingSet = new Set([
                    ...((storedPatients || []).map(p => p && p.fileNumber).filter(Boolean)),
                    ...(lsPatients.map(p => p && p.fileNumber).filter(Boolean))
                ]);

                if (existingSet.has(data.fileNumber)) {
                    let newNum = generatePatientFileNumber();
                    // Extra safety: loop until unique in case state changed
                    while (existingSet.has(newNum)) {
                        const m = /^P-(\d{4})-(\d{3,})$/i.exec(newNum);
                        const y = new Date().getFullYear();
                        const nextSeq = m ? (parseInt(m[2], 10) + 1) : (existingSet.size + 1);
                        newNum = `P-${y}-${String(nextSeq).padStart(3, '0')}`;
                    }
                    data.fileNumber = newNum;
                    const fileNumEl = document.getElementById('patientFileNumber');
                    if (fileNumEl) fileNumEl.value = newNum;
                    // No blocking alert; proceed with the unique number
                }
            } catch {}

            // CIN/Passport validation removed - duplicates are allowed

            return true;
        }

        function validateEditPatientForm(data) {
            // Basic validation
            if (!data.fileNumber || !data.cinPassport || !data.fullName || !data.phone || !data.dateOfBirth) {
                showTranslatedAlert('fill_required_patient_fields');
                return false;
            }

            // Normalize inputs for consistent comparisons
            data.cinPassport = (data.cinPassport || '').trim();
            data.email = (data.email || '').trim().toLowerCase();

            // Email validation (if provided) - only format check, duplicates allowed
            if (data.email && data.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    showTranslatedAlert('valid_email');
                    return false;
                }
            }

            // Check for duplicate file number (excluding current patient)
            const existingFileNumber = storedPatients.find(patient => patient.fileNumber === data.fileNumber && patient.id !== editingPatient.id);
            if (existingFileNumber) {
                showTranslatedAlert('file_number_exists');
                return false;
            }

            // CIN/Passport validation removed - duplicates are allowed

            return true;
        }

        function updatePatient(formData) {
            if (!editingPatient) {
                showTranslatedAlert('no_patient_selected');
                return;
            }



            // Process new files
            const newFilesPromises = editModeNewFiles.map(fileData => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        resolve({
                            id: fileData.id,
                            name: fileData.name,
                            size: fileData.size,
                            type: fileData.type,
                            uploadedAt: fileData.uploadedAt,
                            data: e.target.result
                        });
                    };
                    reader.readAsDataURL(fileData.file);
                });
            });

            // Wait for new files to be processed
            Promise.all(newFilesPromises).then(newFilesData => {
                // Get current files (excluding removed ones)
                const currentFiles = (editingPatient.medicalFiles || []).filter(file =>
                    !editModeRemovedFiles.includes(file.id)
                );

                // Combine current files with new files
                const updatedFiles = [...currentFiles, ...newFilesData];

                // Update patient data
                const updatedPatient = {
                    ...editingPatient,
                    fileNumber: formData.fileNumber,
                    cinPassport: (formData.cinPassport || '').trim(),
                    fullName: formData.fullName,
                    email: (formData.email || '').trim().toLowerCase(),
                    phone: formData.phone,
                    dateOfBirth: formData.dateOfBirth || '',
                    gender: formData.gender || '',
                    address: formData.address || '',
                    medicalHistory: formData.medicalHistory || '',
                    medicalFiles: updatedFiles,
                    updatedAt: new Date().toISOString()
                };

                // Find and update patient in storage
                const patientIndex = storedPatients.findIndex(p => p.id === editingPatient.id);
                if (patientIndex !== -1) {
                    storedPatients[patientIndex] = updatedPatient;
                    saveStoredPatients();

                    // Show success message
                    showEditPatientSuccess(updatedPatient);

                    // Close modal
                    closeEditPatientModal();

                    // Refresh patient list
                    loadPatientsList();
                } else {
                    showTranslatedAlert('patient_not_found_storage');
                }
            });
        }

        function showEditPatientSuccess(patient) {
            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #059669;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">Patient Updated Successfully!</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>Name:</strong> ${patient.fullName}</p>
                        <p><strong>Email:</strong> ${patient.email}</p>
                        <p><strong>Phone:</strong> ${patient.phone}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        The patient information has been updated successfully.
                    </p>
                </div>
            `;

            // Insert success message at the top of the patient management modal content
            const modalContent = document.querySelector('#patientManagementModal .modal-content');
            const existingSuccess = modalContent.querySelector('.edit-patient-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'edit-patient-success';
            successDiv.innerHTML = successMessage;
            modalContent.insertBefore(successDiv, modalContent.children[1]);

            // Remove success message after 5 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 5000);
        }

        function addPatient(patientData) {
            // Check permission
            if (!hasPermission('add_patients')) {
                alert('You do not have permission to add patients.');
                return;
            }
            
            const newPatient = {
                id: `patient-${Date.now()}`,
                fileNumber: patientData.fileNumber,
                // Store trimmed CIN/Passport to avoid accidental whitespace differences
                cinPassport: (patientData.cinPassport || '').trim(),
                fullName: patientData.fullName,
                // Normalize email for storage
                email: (patientData.email || '').trim().toLowerCase(),
                phone: patientData.phone,
                dateOfBirth: patientData.dateOfBirth || '',
                gender: patientData.gender || '',
                address: patientData.address || '',
                medicalHistory: patientData.medicalHistory || '',
                medicalFiles: [], // No medical files for new patients
                createdAt: new Date().toISOString()
            };

            console.log('Adding patient:', newPatient);
            storedPatients.push(newPatient);
            saveStoredPatients();
            console.log('Stored patients:', storedPatients);

            // Return the new patient for the form handler
            return newPatient;
        }

        function showPatientSuccess(patient) {
            const successMessage = `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #059669;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #065f46; margin: 0;">Patient Added Successfully!</h3>
                    </div>
                    <div style="font-size: 0.875rem; color: #047857; margin-bottom: 0.75rem;">
                        <p><strong>Name:</strong> ${patient.fullName}</p>
                        <p><strong>Email:</strong> ${patient.email}</p>
                        <p><strong>Phone:</strong> ${patient.phone}</p>
                    </div>
                    <p style="font-size: 0.875rem; color: #059669; margin: 0;">
                        The patient has been added to the system. You can now schedule appointments for this patient.
                    </p>
                </div>
            `;

            // Insert success message at the top of the modal content
            const modalContent = document.querySelector('#patientManagementModal .modal-content');
            const existingSuccess = modalContent.querySelector('.patient-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'patient-success';
            successDiv.innerHTML = successMessage;
            modalContent.insertBefore(successDiv, modalContent.children[1]);

            // Refresh the appointment form patient dropdown if it's open
            const appointmentModal = document.getElementById('addAppointmentModal');
            if (appointmentModal.classList.contains('active')) {
                populatePatientDropdown();
            }

            // Remove success message after 5 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 5000);
        }

        function loadPatientsList() {
            const patientsList = document.getElementById('patientsList');
            patientsList.innerHTML = '';

            if (storedPatients.length === 0) {
                patientsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <p>No patients found. Add your first patient using the form above.</p>
                    </div>
                `;
                return;
            }

            storedPatients.forEach(patient => {
                const patientCard = createPatientCard(patient);
                patientsList.appendChild(patientCard);
            });
        }

        function createPatientCard(patient) {
            const card = document.createElement('div');
            card.className = 'patient-card';
            card.id = `patient-card-${patient.id}`;

            const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
            const filesCount = patient.medicalFiles ? patient.medicalFiles.length : 0;
            
            // Check permissions for action buttons
            const canEdit = hasPermission('add_patients');
            const canDelete = hasPermission('delete_patients');

            card.innerHTML = `
                <div class="patient-info">
                    <div class="patient-details">
                        <h3>${patient.fullName}</h3>
                        <p><strong>${window.t ? window.t('file_number', 'File Number') : 'File Number'}:</strong> ${patient.fileNumber || 'N/A'}</p>
                        <p><strong>${window.t ? window.t('cin_passport', 'CIN/Passport') : 'CIN/Passport'}:</strong> ${patient.cinPassport || 'N/A'}</p>
                        <p><strong>${window.t ? window.t('email', 'Email') : 'Email'}:</strong> ${patient.email || 'N/A'}</p>
                        <p><strong>${window.t ? window.t('phone', 'Phone') : 'Phone'}:</strong> ${patient.phone}</p>
                        <p><strong>${window.t ? window.t('age', 'Age') : 'Age'}:</strong> ${age} ${patient.gender ? `• ${window.t ? window.t(patient.gender.toLowerCase(), patient.gender) : patient.gender}` : ''}</p>
                        ${patient.address ? `<p><strong>${window.t ? window.t('address', 'Address') : 'Address'}:</strong> ${patient.address}</p>` : ''}
                        ${patient.medicalHistory ? `<p><strong>${window.t ? window.t('medical_history', 'Medical History') : 'Medical History'}:</strong> ${patient.medicalHistory}</p>` : ''}
                        ${filesCount > 0 ? `<p><strong>${window.t ? window.t('medical_files', 'Medical Files') : 'Medical Files'}:</strong> ${filesCount} ${window.t ? window.t('files_attached', 'file(s) attached') : 'file(s) attached'}</p>` : ''}
                        <p><strong>${window.t ? window.t('added', 'Added') : 'Added'}:</strong> ${new Date(patient.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="patient-actions">
                        <button onclick="viewPatientDetails('${patient.id}')" class="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white" data-translate="view_details">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            View Details
                        </button>
                        ${filesCount > 0 ? `
                            <button onclick="viewPatientFiles('${patient.id}')" class="btn btn-sm bg-green-600 hover:bg-green-700 text-white" data-translate="files">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Files
                            </button>
                        ` : ''}
                        ${canEdit ? `
                        <button onclick="editPatient('${patient.id}')" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white" data-translate="edit">
                            Edit
                        </button>
                        ` : ''}
                        ${canDelete ? `
                        <button onclick="deletePatient('${patient.id}')" class="btn btn-sm bg-red-600 hover:bg-red-700 text-white" data-translate="delete">
                            Delete
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;

            return card;
        }

        function calculateAge(dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        }

        // Generate a unique patient file number for the current year, format: P-YYYY-XXX
        function generatePatientFileNumber() {
            const year = new Date().getFullYear();
            let maxSeq = 0;
            // Build a set of existing numbers across both in-memory and localStorage
            const existingNumbers = new Set();
            try {
                const lsPatients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                lsPatients.forEach(p => { if (p && p.fileNumber) existingNumbers.add(p.fileNumber); });
            } catch {}
            try {
                (storedPatients || []).forEach(p => { if (p && p.fileNumber) existingNumbers.add(p.fileNumber); });
            } catch {}

            // Determine the current max sequence for this year
            existingNumbers.forEach(fn => {
                const m = /^P-(\d{4})-(\d{3,})$/i.exec(fn || '');
                    if (m && parseInt(m[1], 10) === year) {
                        const seq = parseInt(m[2], 10);
                        if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
                    }
                });

            // Generate next and ensure uniqueness by incrementing if needed
            let seqNum = maxSeq + 1;
            let candidate = `P-${year}-${String(seqNum).padStart(3, '0')}`;
            while (existingNumbers.has(candidate)) {
                seqNum += 1;
                candidate = `P-${year}-${String(seqNum).padStart(3, '0')}`;
            }
            return candidate;
        }

        function searchPatients() {
            const searchTerm = document.getElementById('patientSearch').value.toLowerCase().trim();
            const patientsList = document.getElementById('patientsList');
            const searchResults = document.getElementById('searchResults');
            const clearButton = document.getElementById('clearSearch');

            // Show/hide clear button based on search input
            if (searchTerm) {
                clearButton.style.display = 'block';
            } else {
                clearButton.style.display = 'none';
            }

            // If search term is empty, show all patients and hide search results
            if (!searchTerm) {
                loadPatientsList();
                searchResults.style.display = 'none';
                return;
            }

            // Filter patients based on search criteria
            const filteredPatients = storedPatients.filter(patient => {
                // Search in full name
                if (patient.fullName && patient.fullName.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in CIN/Passport
                if (patient.cinPassport && patient.cinPassport.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in file number
                if (patient.fileNumber && patient.fileNumber.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in email
                if (patient.email && patient.email.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in phone
                if (patient.phone && patient.phone.toLowerCase().includes(searchTerm)) {
                    return true;
                }

                // Search in date of birth (format: YYYY-MM-DD)
                if (patient.dateOfBirth && patient.dateOfBirth.includes(searchTerm)) {
                    return true;
                }

                // Search in formatted date of birth (DD/MM/YYYY or MM/DD/YYYY)
                if (patient.dateOfBirth) {
                    const formattedDate = new Date(patient.dateOfBirth).toLocaleDateString();
                    if (formattedDate.toLowerCase().includes(searchTerm)) {
                        return true;
                    }

                    // Also search in year, month, day separately
                    const dateObj = new Date(patient.dateOfBirth);
                    const year = dateObj.getFullYear().toString();
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    const day = dateObj.getDate().toString().padStart(2, '0');

                    if (year.includes(searchTerm) || month.includes(searchTerm) || day.includes(searchTerm)) {
                        return true;
                    }
                }

                return false;
            });

            // Clear and display filtered results
            patientsList.innerHTML = '';

            // Show search results count
            searchResults.style.display = 'block';
            if (filteredPatients.length === 0) {
                searchResults.innerHTML = `No patients found matching "${searchTerm}"`;
                patientsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p>No patients found matching "${searchTerm}"</p>
                        <p class="text-sm mt-2">Try searching by name, CIN/Passport, file number, email, phone, or date of birth</p>
                    </div>
                `;
            } else {
                const resultText = filteredPatients.length === 1 ?
                    `Found 1 patient matching "${searchTerm}"` :
                    `Found ${filteredPatients.length} patients matching "${searchTerm}"`;
                searchResults.innerHTML = resultText;

                filteredPatients.forEach(patient => {
                    const card = createPatientCard(patient);
                    patientsList.appendChild(card);
                });
            }
        }

        function clearPatientSearch() {
            const searchInput = document.getElementById('patientSearch');
            const searchResults = document.getElementById('searchResults');
            const clearButton = document.getElementById('clearSearch');

            // Clear the search input
            searchInput.value = '';

            // Hide search results and clear button
            searchResults.style.display = 'none';
            clearButton.style.display = 'none';

            // Reload all patients
            loadPatientsList();
        }
        function editPatient(patientId) {
            const patient = storedPatients.find(p => p.id === patientId);
            if (!patient) {
                showTranslatedAlert('patient_not_found');
                return;
            }

            // Set editing patient
            editingPatient = patient;

            // Reset edit mode variables
            editModeNewFiles = [];
            editModeRemovedFiles = [];

            // Populate form with patient data
            document.getElementById('editPatientId').value = patient.id;
            document.getElementById('editPatientFileNumber').value = patient.fileNumber || '';
            document.getElementById('editPatientCinPassport').value = patient.cinPassport || '';
            document.getElementById('editPatientFullName').value = patient.fullName;
            document.getElementById('editPatientEmailAddress').value = patient.email;
            document.getElementById('editPatientPhoneNumber').value = patient.phone;
            document.getElementById('editPatientDateOfBirth').value = patient.dateOfBirth || '';
            document.getElementById('editPatientGender').value = patient.gender || '';
            document.getElementById('editPatientAddress').value = patient.address || '';
            document.getElementById('editPatientMedicalHistory').value = patient.medicalHistory || '';

            // Display current files
            displayCurrentFiles(patient.medicalFiles || []);

            // Clear new files list (guarded; upload UI removed)
            const editFileListEl = document.getElementById('editFileList');
            if (editFileListEl) editFileListEl.innerHTML = '';

            // Show modal
            const modal = document.getElementById('editPatientModal');
            modal.classList.add('active');

            // Update modal translations
            updateModalTranslations();

            // Vitals history rendering removed with UI section
        }

        function deletePatient(patientId) {
            // Check permission
            if (!hasPermission('delete_patients')) {
                alert('You do not have permission to delete patients.');
                return;
            }
            
            const patient = storedPatients.find(p => p.id === patientId);
            if (patient && showTranslatedConfirm('delete_patient_confirm', patient.fullName)) {
                storedPatients = storedPatients.filter(p => p.id !== patientId);
                saveStoredPatients();
                loadPatientsList();
                showTranslatedAlert('patient_deleted');
            }
        }

        function viewPatientFiles(patientId) {
            const patient = storedPatients.find(p => p.id === patientId);
            if (!patient || !patient.medicalFiles || patient.medicalFiles.length === 0) {
                showTranslatedAlert('no_medical_files');
                return;
            }

            // Create modal for viewing files
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 class="modal-title" data-translate="medical_files">Medical Files - ${patient.fullName}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="space-y-4">
                        ${patient.medicalFiles.map(file => `
                            <div class="file-item">
                                <div class="file-info">
                                    <div class="file-icon ${file.name.split('.').pop().toLowerCase()}">${file.name.split('.').pop().toUpperCase()}</div>
                                    <div class="file-details">
                                        <h4>${file.name}</h4>
                                        <p>${formatFileSize(file.size)} • Uploaded ${new Date(file.uploadedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div class="file-actions">
                                    <button class="btn-preview" onclick="previewStoredFile('${file.id}', '${file.name}', '${file.data}', '${file.type}')" title="Preview">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                    <button class="btn-download" onclick="downloadStoredFile('${file.id}', '${file.name}', '${file.data}')" title="Download">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Update translations for the new modal
            updateModalTranslations();

            // Close modal when clicking outside
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.remove();
                }
            });
        }

        function downloadStoredFile(fileId, fileName, fileData) {
            // Convert base64 to blob
            const byteCharacters = atob(fileData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // File preview functions
        function previewUploadedFile(fileId) {
            const fileData = uploadedFiles.find(file => file.id === fileId);
            if (fileData) {
                showFilePreview(fileData.name, fileData.file, fileData.type);
            }
        }

        function previewStoredFile(fileId, fileName, fileData, fileType) {
            // Convert base64 to blob
            const byteCharacters = atob(fileData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: fileType });

            showFilePreview(fileName, blob, fileType);
        }

        function showFilePreview(fileName, file, fileType) {
            // Create preview modal
            const modal = document.createElement('div');
            modal.className = 'file-preview-modal';
            modal.innerHTML = `
                <div class="file-preview-content">
                    <div class="file-preview-header">
                        <h3 class="file-preview-title">${fileName}</h3>
                        <div class="file-preview-actions">
                            <button class="btn-close-preview" onclick="this.closest('.file-preview-modal').remove()">&times;</button>
                        </div>
                    </div>
                    <div class="file-preview-body">
                        ${getPreviewContent(fileName, file, fileType)}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Update translations for the new modal
            updateModalTranslations();

            // Close modal when clicking outside
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.remove();
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    modal.remove();
                }
            });
        }

        function getPreviewContent(fileName, file, fileType) {
            const fileExtension = fileName.split('.').pop().toLowerCase();

            // Handle different file types
            if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                // Image preview
                const url = URL.createObjectURL(file);
                return `<img src="${url}" alt="${fileName}" class="file-preview-image" onload="URL.revokeObjectURL('${url}')">`;
            }
            else if (fileType === 'application/pdf' || fileExtension === 'pdf') {
                // PDF preview
                const url = URL.createObjectURL(file);
                return `<iframe src="${url}" class="file-preview-iframe" onload="URL.revokeObjectURL('${url}')"></iframe>`;
            }
            else if (['doc', 'docx'].includes(fileExtension)) {
                // Word document - show unsupported message with download option
                return `
                    <div class="file-preview-unsupported">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3>Preview Not Available</h3>
                        <p>Word documents cannot be previewed in the browser.</p>
                        <p>Please download the file to view it.</p>
                    </div>
                `;
            }
            else {
                // Unsupported file type
                return `
                    <div class="file-preview-unsupported">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3>Preview Not Available</h3>
                        <p>This file type cannot be previewed in the browser.</p>
                        <p>Please download the file to view it.</p>
                    </div>
                `;
            }
        }

        // Billing Functions
        function refreshBillDescriptionSelects() {
            // Refresh all description select elements with latest bill descriptions
            const descriptionSelects = document.querySelectorAll('[id^="itemDescription"]');
            const optionsHTML = getBillDescriptionOptionsHTML();
            
            descriptionSelects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = optionsHTML;
                // Try to restore the previous selection if it still exists
                if (currentValue) {
                    select.value = currentValue;
                }
            });
        }

        function showBillingModal() {
            // Check permission
            if (!hasPermission('create_bills')) {
                alert('You do not have permission to create bills.');
                return;
            }
            
            const modal = document.getElementById('billingModal');
            modal.classList.add('active');
            
            // Update translations after opening modal with a small delay to ensure DOM is ready
            setTimeout(() => {
                if (window.I18n && window.I18n.walkAndTranslate) {
                    window.I18n.walkAndTranslate();
                }
                // Ensure we start with one clean bill item
                resetBillItems();
            }, 100);

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');

            // Load patients for billing
            loadPatientsForBilling();

            // Update modal translations
            updateModalTranslations();

            // Set default due date
            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + 30); // 30 days from today

            document.getElementById('billDueDate').value = dueDate.toISOString().split('T')[0];

            // Reset form
            resetBillingForm();

            // Ensure patient selection is enabled for fresh forms
            const patientSelectInit = document.getElementById('billPatientSelection');
            if (patientSelectInit) patientSelectInit.disabled = false;

            // Refresh bill description selects with managed descriptions
            refreshBillDescriptionSelects();

            // Initialize bill total calculation
            calculateBillTotal();
        }

        function closeBillingModal() {
            const modal = document.getElementById('billingModal');
            modal.classList.remove('active');
        }

        function autoFillPrice(selectElement) {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            
            if (price && price !== '0') {
                // Find the price input in the same bill item (third input field)
                const billItem = selectElement.closest('.bill-item');
                const numberInputs = billItem.querySelectorAll('input[type="number"]');
                const priceInput = numberInputs[1]; // Second number input (index 1) is the price field
                if (priceInput) {
                    priceInput.value = price;
                    // Trigger calculation
                    if (typeof calculateBillTotal === 'function') {
                        calculateBillTotal();
                    }
                }
            }
        }

        // Ready Bills (Secretary)
        function showBillingOrReadyBills() {
            try {
                const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
                if (session && (session.role === 'secretary' || session.role === 'doctor')) {
                    showReadyBillsModal();
                    return;
                }
            } catch {}
            showBillingModal();
        }

        function showReadyBillsModal() {
            const modal = document.getElementById('readyBillsModal');
            modal.classList.add('active');
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Default to ready bills tab
            switchBillsTab('ready');
        }

        function closeReadyBillsModal() {
            const modal = document.getElementById('readyBillsModal');
            modal.classList.remove('active');
        }

        function switchBillsTab(tab) {
            const readyContent = document.getElementById('readyBillsContent');
            const doneContent = document.getElementById('doneBillsContent');
            const readyTab = document.getElementById('readyBillsTab');
            const doneTab = document.getElementById('doneBillsTab');

            if (tab === 'ready') {
                readyContent.style.display = 'block';
                doneContent.style.display = 'none';
                readyTab.className = 'btn btn-primary';
                doneTab.className = 'btn btn-secondary';
                renderReadyBills();
            } else {
                readyContent.style.display = 'none';
                doneContent.style.display = 'block';
                readyTab.className = 'btn btn-secondary';
                doneTab.className = 'btn btn-primary';
                renderDoneBills();
            }
        }

        function renderReadyBills() {
            const container = document.getElementById('readyBillsContainer');
            if (!container) return;

            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');

            // Filter out consultations where patient no longer exists
            const validConsultations = consultations.filter(c => {
                return patients.some(p => p.id === c.patientId);
            });

            // Show most recent first
            const sorted = validConsultations.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (sorted.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-6" data-translate="no_consultations_today">No consultations conducted today.</p>';
                return;
            }

            container.innerHTML = sorted.map(c => {
                const patient = patients.find(p => p.id === c.patientId);
                const patientName = patient ? patient.fullName : 'Unknown Patient';
                const created = new Date(c.createdAt);
                const dateStr = isNaN(created) ? '' : created.toLocaleString();
                const imcStr = (typeof c.imc === 'number' && !isNaN(c.imc)) ? c.imc.toFixed(1) : '-';
                const doctorName = c.doctor || 'Doctor';
                return `
                    <div class="card p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold">${patientName}</div>
                                <div class="text-sm text-gray-600">Consultation • ${dateStr}</div>
                                <div class="text-xs text-gray-500">Doctor: ${doctorName} • BMI: ${imcStr}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button class="btn btn-secondary" onclick="viewConsultationDetails('${c.id}')" data-translate="view">${window.t ? window.t('view', 'View') : 'View'}</button>
                                <button class="btn btn-primary" onclick="createBillFromConsultation('${c.id}')" data-translate="create_bill">${window.t ? window.t('create_bill', 'Create Bill') : 'Create Bill'}</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderDoneBills(searchTerm = '') {
            const container = document.getElementById('doneBillsContainer');
            if (!container) return;

            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');

            // Sort by creation date (newest first)
            let sortedBills = bills.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Apply search filter if provided
            if (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                sortedBills = sortedBills.filter(bill => 
                    bill.patientName.toLowerCase().includes(searchTerm) ||
                    bill.id.toLowerCase().includes(searchTerm) ||
                    bill.status.toLowerCase().includes(searchTerm)
                );
            }

            if (sortedBills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
                        </svg>
                        <p data-translate="no_bills_found">${searchTerm ? 'No bills found matching your search.' : 'No bills have been created yet.'}</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = sortedBills.map(bill => {
                const billDate = new Date(bill.billDate).toLocaleDateString();
                const dueDate = new Date(bill.dueDate).toLocaleDateString();
                const createdDate = new Date(bill.createdAt).toLocaleDateString();
                
                // Status badge styling
                let statusClass = 'bg-yellow-100 text-yellow-800';
                if (bill.status === 'Paid') {
                    statusClass = 'bg-green-100 text-green-800';
                } else if (bill.status === 'Overdue') {
                    statusClass = 'bg-red-100 text-red-800';
                } else if (bill.status === 'Cancelled') {
                    statusClass = 'bg-gray-100 text-gray-800';
                }

                // Get patient info
                const patient = patients.find(p => p.id === bill.patientId);
                const patientFileNumber = patient ? patient.fileNumber : 'N/A';

                return `
                    <div class="card p-4 hover:shadow-lg transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <div>
                                        <span class="font-bold text-gray-900">${bill.patientName}</span>
                                        <span class="text-sm text-gray-500 ml-2">File: ${patientFileNumber}</span>
                                    </div>
                                </div>
                                <div class="ml-7 space-y-1">
                                    <div class="text-sm text-gray-600">
                                        <strong data-translate="bill_id">Bill ID:</strong> ${bill.id}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <strong data-translate="bill_date">Bill Date:</strong> ${billDate} | 
                                        <strong data-translate="due_date">Due Date:</strong> ${dueDate}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <strong data-translate="created_on">Created:</strong> ${createdDate}
                                    </div>
                                </div>
                            </div>
                            <span class="badge ${statusClass} px-3 py-1 rounded-full text-xs font-semibold ml-4">
                                ${window.t ? window.t(bill.status.toLowerCase(), bill.status) : bill.status}
                            </span>
                        </div>

                        <!-- Bill Items Summary -->
                        <div class="border-t pt-3 mb-3">
                            <div class="text-sm font-semibold text-gray-700 mb-2" data-translate="bill_items">Bill Items (${bill.items.length}):</div>
                            <div class="space-y-1">
                                ${bill.items.slice(0, 3).map(item => `
                                    <div class="text-sm text-gray-600 flex justify-between">
                                        <span>${item.description} <span class="text-gray-400">(x${item.quantity})</span></span>
                                        <span class="font-medium">${(item.price * item.quantity).toFixed(2)} TND</span>
                                    </div>
                                `).join('')}
                                ${bill.items.length > 3 ? `<div class="text-sm text-gray-500 italic">+ ${bill.items.length - 3} more items...</div>` : ''}
                            </div>
                        </div>

                        <!-- Bill Total -->
                        <div class="border-t pt-3 flex justify-between items-center">
                            <div>
                                <div class="text-xs text-gray-500" data-translate="subtotal">Subtotal: ${bill.subtotal.toFixed(2)} TND</div>
                                <div class="text-xs text-gray-500" data-translate="tax">Tax: ${bill.tax.toFixed(2)} TND</div>
                                <div class="text-lg font-bold text-blue-600">
                                    <span data-translate="total">Total:</span> ${bill.total.toFixed(2)} TND
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="viewFullBillDetails('${bill.id}')" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <span data-translate="view_details">View Details</span>
                                </button>
                                <button onclick="printBill('${bill.id}')" class="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                    </svg>
                                    <span data-translate="print">Print</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function searchDoneBills() {
            const searchInput = document.getElementById('billSearch');
            const searchTerm = searchInput ? searchInput.value : '';
            renderDoneBills(searchTerm);
        }
        function viewFullBillDetails(billId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found.');
                return;
            }

            // Use existing bill display function if available
            if (typeof showPrintableBill === 'function') {
                showPrintableBill(bill);
            } else {
                // Fallback to simple display
                alert(`Bill ID: ${bill.id}\nPatient: ${bill.patientName}\nTotal: ${bill.total.toFixed(2)} TND\nStatus: ${bill.status}`);
            }
        }

        function printBill(billId) {
            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found.');
                return;
            }

            // Use existing bill display function if available
            if (typeof showPrintableBill === 'function') {
                showPrintableBill(bill);
            } else {
                window.print();
            }
        }

        function viewConsultationDetails(consultationId) {
            try {
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                const c = consultations.find(x => x.id === consultationId);
                if (!c) return;
                // Reuse existing detail modal when available
                const modal = document.getElementById('consultationDetailModal');
                const content = document.getElementById('consultationDetailContent');
                if (modal && content) {
                    const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                    const patient = patients.find(p => p.id === c.patientId);
                    const patientName = patient ? patient.fullName : 'Unknown Patient';
                    content.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><strong>${window.t ? window.t('patient', 'Patient') : 'Patient'}:</strong> ${patientName}</div>
                            <div><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${c.doctor || ''}</div>
                            <div><strong>${window.t ? window.t('date', 'Date') : 'Date'}:</strong> ${new Date(c.createdAt).toLocaleString()}</div>
                            <div><strong>${window.t ? window.t('bmi', 'BMI') : 'BMI'}:</strong> ${(typeof c.imc === 'number' && !isNaN(c.imc)) ? c.imc.toFixed(1) : '-'}</div>
                        </div>
                        <div class="mt-3">
                            <strong>${window.t ? window.t('notes', 'Notes') : 'Notes'}:</strong>
                            <div class="text-sm whitespace-pre-wrap">${(c.notes || '').toString()}</div>
                        </div>
                    `;
                    modal.classList.add('active');
                    // Update modal translations
                    if (window.I18n && window.I18n.walkAndTranslate) {
                        window.I18n.walkAndTranslate();
                    }
                }
            } catch {}
        }

        function createBillFromConsultation(consultationId) {
            try {
                const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                const c = consultations.find(x => x.id === consultationId);
                if (!c) return;

                // Prefill billing with patient and one item (Consultation)
                closeReadyBillsModal();
                showBillingModal();

                const patient = patients.find(p => p.id === c.patientId);
                if (patient) {
                    const select = document.getElementById('billPatientSelection');
                    if (select) {
                        // Ensure patients are loaded first
                        setTimeout(() => {
                            const opt = Array.from(select.options).find(o => o.value === patient.id);
                            if (opt) {
                                select.value = patient.id;
                                if (typeof handleBillPatientSelection === 'function') handleBillPatientSelection();
                                // Lock patient selection for consultation-derived bills
                                select.disabled = true;
                            }
                        }, 0);
                    }
                }

                // Fill first item description and an example price if missing
                setTimeout(() => {
                const desc = document.getElementById('itemDescription1');
                const qty = document.getElementById('itemQuantity1');
                const price = document.getElementById('itemPrice1');
                    
                    // Try to set 'General Consultation' if it exists in the bill descriptions
                    if (desc) {
                        const generalConsultOption = Array.from(desc.options).find(o => o.value === 'General Consultation');
                        if (generalConsultOption) {
                            desc.value = 'General Consultation';
                            // Trigger autoFillPrice
                            if (typeof autoFillPrice === 'function') autoFillPrice(desc);
                        }
                    }
                if (qty) qty.value = 1;
                if (price && !price.value) price.value = 50;
                if (typeof calculateBillTotal === 'function') calculateBillTotal();
                }, 100);
            } catch {}
        }

        // Language Settings Functions
        function showLanguageSettings() {
            const modal = document.getElementById('languageSettingsModal');
            modal.classList.add('active');
            modal.style.opacity = '1'; // Reset opacity

            // Get current language from i18n system or fallback to legacy
            const currentLang = localStorage.getItem('app_lang') || currentLanguage || 'en';
            console.log('Current language when opening modal:', currentLang);

            // Set current language as selected
            const currentLangRadio = document.getElementById(`lang-${currentLang}`);
            if (currentLangRadio) {
                currentLangRadio.checked = true;
                console.log(`Set radio button ${currentLang} as checked`);
            } else {
                console.log(`Radio button for ${currentLang} not found`);
            }

            // Update modal translations immediately
            updateModalTranslations();

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.add('hidden');
        }

        function updateModalTranslations() {
            // Use i18n system if available, otherwise fallback to legacy system
            if (window.I18n && window.I18n.walkAndTranslate) {
                // Use the i18n system to translate all elements
                window.I18n.walkAndTranslate();
            } else {
                // Fallback to legacy translation system
            const modalElements = document.querySelectorAll('.modal [data-translate]');
            modalElements.forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.textContent = translations[currentLanguage][key];
                }
            });

            // Update placeholder translations
            const placeholderElements = document.querySelectorAll('.modal [data-translate-placeholder]');
            placeholderElements.forEach(element => {
                const key = element.getAttribute('data-translate-placeholder');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.placeholder = translations[currentLanguage][key];
                }
            });
            }
        }

        function closeLanguageSettings() {
            const modal = document.getElementById('languageSettingsModal');
            modal.classList.remove('active');
        }

        // ========================================
        // Settings Menu Functions
        // ========================================

        function showSettingsMenu() {
            const modal = document.getElementById('settingsMenuModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Update translations
            updateModalTranslations();
        }

        function closeSettingsMenu() {
            const modal = document.getElementById('settingsMenuModal');
            modal.classList.remove('active');
        }

        function openLanguageSettings() {
            closeSettingsMenu();
            setTimeout(() => showLanguageSettings(), 200);
        }

        function openBillDescriptionsManagement() {
            closeSettingsMenu();
            setTimeout(() => showBillDescriptionsModal(), 200);
        }

        function openCabinetSettings() {
            closeSettingsMenu();
            setTimeout(() => showCabinetSettingsModal(), 200);
        }

        function openUserManagement() {
            // Check permission
            if (!hasPermission('manage_users')) {
                alert('You do not have permission to manage users.');
                closeSettingsMenu();
                return;
            }
            
            closeSettingsMenu();
            setTimeout(() => showUserManagementModal(), 200);
        }

        // ========================================
        // User Management Functions
        // ========================================

        function getSystemUsers() {
            const stored = localStorage.getItem('system_users');
            if (stored) {
                try {
                    const users = JSON.parse(stored);
                    // Validate and fix user roles if needed
                    return users.map(user => {
                        // Ensure role is correct for default users
                        if (user.id === 'user_default_1' && user.username === 'doctor') {
                            user.role = 'doctor';
                        } else if (user.id === 'user_default_2' && user.username === 'secretary') {
                            user.role = 'secretary';
                        }
                        return user;
                    });
                } catch (error) {
                    console.error('Error parsing users:', error);
                    return getDefaultUsers();
                }
            }
            // Default users (include current logged-in user)
            return getDefaultUsers();
        }

        function getDefaultUsers() {
            return [
                { role: 'doctor', username: 'doctor', password: 'doctor123', name: 'Dr. John Smith', email: 'doctor@clinic.com', status: 'active', id: 'user_default_1' },
                { role: 'secretary', username: 'secretary', password: 'secretary123', name: 'Alice Johnson', email: 'secretary@clinic.com', status: 'active', id: 'user_default_2' }
            ];
        }

        function saveSystemUsers(users) {
            localStorage.setItem('system_users', JSON.stringify(users));
        }

        function exportUserCredentials() {
            const users = getSystemUsers();
            const credentials = users.map(user => {
                return `Username: ${user.username}\nPassword: ${user.password}\nRole: ${user.role}\nName: ${user.name}\nEmail: ${user.email}\nStatus: ${user.status}\nID: ${user.id}\n---`;
            }).join('\n\n');
            
            const exportData = `Healthcare System - User Credentials Export\nGenerated: ${new Date().toLocaleString()}\n\n${credentials}`;
            
            // Create and download the file
            const blob = new Blob([exportData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show the content in a modal for easy copying to config/users.txt
            showCredentialsModal(exportData);
        }

        function showCredentialsModal(credentials) {
            // Create modal if it doesn't exist
            let modal = document.getElementById('credentialsModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'credentialsModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 800px;">
                        <div class="modal-header">
                            <h2 class="modal-title">User Credentials Export</h2>
                            <button class="modal-close" onclick="closeCredentialsModal()">&times;</button>
                        </div>
                        <div class="p-6">
                            <p class="mb-4 text-gray-600">Copy the content below and save it to <code>config/users.txt</code>:</p>
                            <textarea id="credentialsText" class="form-textarea" rows="20" style="font-family: monospace; font-size: 12px;" readonly></textarea>
                            <div class="flex gap-2 mt-4">
                                <button onclick="copyCredentials()" class="btn btn-primary">Copy to Clipboard</button>
                                <button onclick="closeCredentialsModal()" class="btn btn-secondary">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            // Set the content
            document.getElementById('credentialsText').value = credentials;
            modal.classList.add('active');
        }

        function closeCredentialsModal() {
            const modal = document.getElementById('credentialsModal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        function copyCredentials() {
            const textarea = document.getElementById('credentialsText');
            textarea.select();
            document.execCommand('copy');
            alert('Credentials copied to clipboard! You can now paste them into config/users.txt');
        }

        function showUserManagementModal() {
            const modal = document.getElementById('userManagementModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            renderUsersList();
            updateModalTranslations();
        }

        function closeUserManagement() {
            const modal = document.getElementById('userManagementModal');
            modal.classList.remove('active');
        }

        function renderUsersList(searchTerm = '') {
            const tbody = document.getElementById('usersTableBody');
            const users = getSystemUsers();
            
            const filtered = searchTerm
                ? users.filter(u => 
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.username.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : users;
            
            // Update total count
            document.getElementById('totalUsersCount').textContent = users.length;
            
            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                            ${searchTerm ? 'No users found' : 'No users yet. Add your first user above.'}
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = filtered.map(user => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap">
                        <div class="font-medium text-gray-900">${user.name}</div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-gray-600">${user.username}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-gray-600">${user.email}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}">
                            ${capitalizeFirst(user.role)}
                        </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(user.status)}">
                            ${capitalizeFirst(user.status)}
                        </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                        <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function getRoleBadgeClass(role) {
            const classes = {
                'doctor': 'bg-blue-100 text-blue-800',
                'secretary': 'bg-green-100 text-green-800',
                'admin': 'bg-purple-100 text-purple-800'
            };
            return classes[role] || 'bg-gray-100 text-gray-800';
        }

        function getStatusBadgeClass(status) {
            return status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800';
        }

        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function searchUsers() {
            const searchTerm = document.getElementById('userSearch').value;
            renderUsersList(searchTerm);
        }

        function editUser(userId) {
            const users = getSystemUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserName').value = user.name;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserUsername').value = user.username;
            document.getElementById('editUserPassword').value = '';
            document.getElementById('editUserRole').value = user.role;
            document.getElementById('editUserStatus').value = user.status;
            
            // Load permissions
            const permissions = user.permissions || {};
            const permissionKeys = [
                'view_patients', 'add_patients', 'delete_patients',
                'view_appointments', 'add_appointments', 'delete_appointments',
                'view_bills', 'create_bills', 'manage_bills',
                'view_consultations', 'add_consultations', 'delete_consultations',
                'view_reports', 'export_reports',
                'access_settings', 'manage_users'
            ];
            
            permissionKeys.forEach(key => {
                const checkbox = document.getElementById(`editPerm_${key}`);
                if (checkbox) {
                    checkbox.checked = permissions[key] || false;
                }
            });
            
            const modal = document.getElementById('editUserModal');
            modal.classList.add('active');
            updateModalTranslations();
        }

        function closeEditUserModal() {
            const modal = document.getElementById('editUserModal');
            modal.classList.remove('active');
        }

        function deleteUser(userId) {
            const confirmMessage = translations[currentLanguage].confirm_delete_user || 'Are you sure you want to delete this user?';
            if (!confirm(confirmMessage)) return;
            
            const users = getSystemUsers();
            const filtered = users.filter(u => u.id !== userId);
            saveSystemUsers(filtered);
            
            renderUsersList();
            
            const successMessage = translations[currentLanguage].user_deleted || 'User deleted successfully!';
            showTranslatedAlert('user_deleted', successMessage);
        }

        // ========================================
        // Cabinet Settings Functions
        // ========================================

        function getCabinetSettings() {
            const stored = localStorage.getItem('cabinet_settings');
            if (stored) {
                return JSON.parse(stored);
            }
            // Default settings
            return {
                name: '',
                address: '',
                phone: '',
                logo: null,
                timetable: {
                    monday: { enabled: true, open: '09:00', close: '17:00' },
                    tuesday: { enabled: true, open: '09:00', close: '17:00' },
                    wednesday: { enabled: true, open: '09:00', close: '17:00' },
                    thursday: { enabled: true, open: '09:00', close: '17:00' },
                    friday: { enabled: true, open: '09:00', close: '17:00' },
                    saturday: { enabled: false, open: '09:00', close: '13:00' },
                    sunday: { enabled: false, open: '09:00', close: '13:00' }
                }
            };
        }

        function saveCabinetSettings(settings) {
            localStorage.setItem('cabinet_settings', JSON.stringify(settings));
            // Refresh cabinet info display after saving
            if (window.updateCabinetInfo) {
                window.updateCabinetInfo();
            }
        }

        function showCabinetSettingsModal() {
            const modal = document.getElementById('cabinetSettingsModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Load existing settings
            loadCabinetSettingsForm();
            updateModalTranslations();
        }

        function closeCabinetSettings() {
            const modal = document.getElementById('cabinetSettingsModal');
            modal.classList.remove('active');
        }

        function loadCabinetSettingsForm() {
            const settings = getCabinetSettings();
            
            // Load basic info
            document.getElementById('cabinetName').value = settings.name || '';
            document.getElementById('cabinetAddress').value = settings.address || 'Tunis, Tunisia';
            document.getElementById('cabinetPhone').value = settings.phone || '00 000 000';
            
            // Load logo
            if (settings.logo) {
                displayLogoPreview(settings.logo);
            }
            
            // Load timetable
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
                const daySettings = settings.timetable[day];
                document.getElementById(`${day}_enabled`).checked = daySettings.enabled;
                document.getElementById(`${day}_open`).value = daySettings.open;
                document.getElementById(`${day}_close`).value = daySettings.close;
                
                // Update schedule visibility
                const schedule = document.getElementById(`${day}_schedule`);
                const openInput = document.getElementById(`${day}_open`);
                const closeInput = document.getElementById(`${day}_close`);
                
                if (daySettings.enabled) {
                    schedule.style.opacity = '1';
                    openInput.disabled = false;
                    closeInput.disabled = false;
                } else {
                    schedule.style.opacity = '0.5';
                    openInput.disabled = true;
                    closeInput.disabled = true;
                }
            });
        }

        function toggleDaySchedule(day) {
            const enabled = document.getElementById(`${day}_enabled`).checked;
            const schedule = document.getElementById(`${day}_schedule`);
            const openInput = document.getElementById(`${day}_open`);
            const closeInput = document.getElementById(`${day}_close`);
            
            if (enabled) {
                schedule.style.opacity = '1';
                openInput.disabled = false;
                closeInput.disabled = false;
            } else {
                schedule.style.opacity = '0.5';
                openInput.disabled = true;
                closeInput.disabled = true;
            }
        }

        function handleLogoUpload(input) {
            const file = input.files[0];
            if (!file) return;
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert(translations[currentLanguage].invalid_image || 'Invalid image file. Please upload a valid image.');
                input.value = '';
                return;
            }
            
            // Check file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                alert(translations[currentLanguage].logo_too_large || 'Image is too large. Maximum size is 2MB.');
                input.value = '';
                return;
            }
            
            // Read and display the image
            const reader = new FileReader();
            reader.onload = function(e) {
                displayLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }

        function displayLogoPreview(imageData) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${imageData}" alt="Cabinet Logo" class="w-full h-full object-cover rounded-lg">`;
        }

        function removeLogo() {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            `;
            document.getElementById('cabinetLogoInput').value = '';
        }

        // ========================================
        // Bill Descriptions Management Functions
        // ========================================

        function getDefaultBillDescriptions() {
            return [
                { id: 1, name: 'General Consultation', price: 50 },
                { id: 2, name: 'Follow-up Consultation', price: 30 },
                { id: 3, name: 'Emergency Consultation', price: 100 },
                { id: 4, name: 'Blood Test', price: 25 },
                { id: 5, name: 'X-Ray', price: 80 },
                { id: 6, name: 'MRI Scan', price: 300 },
                { id: 7, name: 'CT Scan', price: 250 },
                { id: 8, name: 'Ultrasound', price: 120 },
                { id: 9, name: 'ECG', price: 40 },
                { id: 10, name: 'Vaccination', price: 35 },
                { id: 11, name: 'Prescription Medication', price: 15 },
                { id: 12, name: 'Physical Therapy Session', price: 60 },
                { id: 13, name: 'Laboratory Analysis', price: 45 },
                { id: 14, name: 'Minor Surgery', price: 200 },
                { id: 15, name: 'Dressing Change', price: 20 },
                { id: 16, name: 'Injection', price: 25 }
            ];
        }

        function getBillDescriptions() {
            const stored = localStorage.getItem('bill_descriptions');
            if (!stored) {
                const defaults = getDefaultBillDescriptions();
                saveBillDescriptions(defaults);
                return defaults;
            }
            return JSON.parse(stored);
        }

        function saveBillDescriptions(descriptions) {
            localStorage.setItem('bill_descriptions', JSON.stringify(descriptions));
        }

        function showBillDescriptionsModal() {
            const modal = document.getElementById('billDescriptionsModal');
            modal.classList.add('active');
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            renderBillDescriptionsList();
            updateModalTranslations();
        }

        function closeBillDescriptionsModal() {
            const modal = document.getElementById('billDescriptionsModal');
            modal.classList.remove('active');
        }

        function renderBillDescriptionsList(searchTerm = '') {
            const container = document.getElementById('descriptionsListContainer');
            const descriptions = getBillDescriptions();
            
            const filtered = searchTerm
                ? descriptions.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : descriptions;
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>${translations[currentLanguage].no_services || 'No services found'}</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = filtered.map(desc => `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-900">${desc.name}</div>
                        <div class="text-sm text-gray-600">${Number(desc.price).toFixed(2)} TND</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editBillDescription(${desc.id})" class="btn btn-sm btn-outline">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span data-translate="edit">${translations[currentLanguage].edit || 'Edit'}</span>
                        </button>
                        <button onclick="deleteBillDescription(${desc.id})" class="btn btn-sm btn-outline text-red-600 hover:bg-red-50">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span data-translate="delete">${translations[currentLanguage].delete || 'Delete'}</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function searchBillDescriptions() {
            const searchTerm = document.getElementById('descriptionSearch').value;
            renderBillDescriptionsList(searchTerm);
        }
        function editBillDescription(id) {
            const descriptions = getBillDescriptions();
            const desc = descriptions.find(d => d.id === id);
            if (!desc) return;
            
            document.getElementById('editDescriptionId').value = desc.id;
            document.getElementById('editDescriptionName').value = desc.name;
            document.getElementById('editDescriptionPrice').value = desc.price;
            
            const modal = document.getElementById('editDescriptionModal');
            modal.classList.add('active');
            updateModalTranslations();
        }

        function closeEditDescriptionModal() {
            const modal = document.getElementById('editDescriptionModal');
            modal.classList.remove('active');
        }

        function deleteBillDescription(id) {
            const confirmMessage = translations[currentLanguage].confirm_delete_service || 'Are you sure you want to delete this service?';
            if (!confirm(confirmMessage)) return;
            
            const descriptions = getBillDescriptions();
            const filtered = descriptions.filter(d => d.id !== id);
            saveBillDescriptions(filtered);
            
            renderBillDescriptionsList();
            
            const successMessage = translations[currentLanguage].service_deleted || 'Service deleted successfully!';
            showTranslatedAlert('service_deleted', successMessage);
        }

        // ========================================
        // Doctor Profit Reports Functions
        // ========================================

        let currentReportTab = 'daily';
        let currentReportData = null;

        function showReportsModal() {
            // Check permission
            if (!hasPermission('view_reports')) {
                alert('You do not have permission to view reports.');
                return;
            }

            const modal = document.getElementById('reportsModal');
            modal.classList.add('active');
            
            // Update translations after opening modal
            setTimeout(() => {
                if (window.I18n && window.I18n.walkAndTranslate) {
                    window.I18n.walkAndTranslate();
                }
            }, 100);
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');

            // Initialize years dropdown
            initializeYearsDropdown();

            // Set default dates
            const today = new Date();
            document.getElementById('dailyReportDate').valueAsDate = today;
            document.getElementById('weeklyReportDate').valueAsDate = today;
            document.getElementById('monthlyReportMonth').value = today.getMonth();
            document.getElementById('monthlyReportYear').value = today.getFullYear();

            // Default to daily report
            switchReportTab('daily');
        }

        function closeReportsModal() {
            const modal = document.getElementById('reportsModal');
            modal.classList.remove('active');
        }

        function switchReportTab(tab) {
            currentReportTab = tab;

            const dailyContent = document.getElementById('dailyReportContent');
            const weeklyContent = document.getElementById('weeklyReportContent');
            const monthlyContent = document.getElementById('monthlyReportContent');

            const dailyTab = document.getElementById('dailyReportTab');
            const weeklyTab = document.getElementById('weeklyReportTab');
            const monthlyTab = document.getElementById('monthlyReportTab');

            // Hide all content
            dailyContent.style.display = 'none';
            weeklyContent.style.display = 'none';
            monthlyContent.style.display = 'none';

            // Reset all tabs
            dailyTab.className = 'btn btn-secondary';
            weeklyTab.className = 'btn btn-secondary';
            monthlyTab.className = 'btn btn-secondary';

            // Show selected content
            if (tab === 'daily') {
                dailyContent.style.display = 'block';
                dailyTab.className = 'btn btn-primary';
                renderDailyReport();
            } else if (tab === 'weekly') {
                weeklyContent.style.display = 'block';
                weeklyTab.className = 'btn btn-primary';
                renderWeeklyReport();
            } else if (tab === 'monthly') {
                monthlyContent.style.display = 'block';
                monthlyTab.className = 'btn btn-primary';
                renderMonthlyReport();
            }
        }

        function initializeYearsDropdown() {
            const yearSelect = document.getElementById('monthlyReportYear');
            const currentYear = new Date().getFullYear();
            yearSelect.innerHTML = '';
            
            // Add years from 5 years ago to current year
            for (let year = currentYear; year >= currentYear - 5; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
        }

        function getDoctorBillsForPeriod(startDate, endDate) {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const doctorName = session.name || '';

            const bills = JSON.parse(localStorage.getItem('healthcareBills') || '[]');
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');

            // Filter consultations by doctor and date range
            // Check both 'doctor' and 'doctorName' fields for compatibility
            const doctorConsultations = consultations.filter(c => {
                const consultDate = new Date(c.createdAt);
                const consultDoctor = c.doctor || c.doctorName || '';
                
                // Check if consultation is within date range and by this doctor
                const isInDateRange = consultDate >= startDate && consultDate <= endDate;
                const isByThisDoctor = consultDoctor === doctorName || consultDoctor.includes(doctorName) || doctorName.includes(consultDoctor);
                
                return isInDateRange && isByThisDoctor;
            });

            // Get bills that match these consultations by patient
            // If no doctor consultations found, show all bills in the period
            let doctorBills;
            
            if (doctorConsultations.length > 0) {
                // Filter bills by doctor's patients
                doctorBills = bills.filter(bill => {
                    const billDate = new Date(bill.createdAt);
                    // Check if bill is in date range
                    if (billDate < startDate || billDate > endDate) return false;
                    
                    // Check if there's a consultation for this patient by this doctor
                    return doctorConsultations.some(c => c.patientId === bill.patientId);
                });
            } else {
                // Fallback: show all bills in the date range
                // This helps when consultation-bill linking isn't perfect
                doctorBills = bills.filter(bill => {
                    const billDate = new Date(bill.createdAt);
                    return billDate >= startDate && billDate <= endDate;
                });
            }

            return {
                bills: doctorBills,
                consultations: doctorConsultations
            };
        }

        function renderDailyReport() {
            const dateInput = document.getElementById('dailyReportDate');
            const selectedDate = new Date(dateInput.value);
            
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);

            const data = getDoctorBillsForPeriod(startDate, endDate);
            currentReportData = data;

            const container = document.getElementById('dailyReportContainer');
            
            if (data.bills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p data-translate="no_data_for_period">${window.t ? window.t('no_data_for_period', 'No billing data for this date.') : 'No billing data for this date.'}</p>
                    </div>
                `;
                return;
            }

            const totalProfit = data.bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalConsultations = data.consultations.length;
            const totalBills = data.bills.length;

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="card p-4 bg-blue-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_consultations">${window.t ? window.t('total_consultations', 'Total Consultations') : 'Total Consultations'}</div>
                                <div class="text-2xl font-bold text-blue-600">${totalConsultations}</div>
                            </div>
                            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-green-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_bills">${window.t ? window.t('total_bills', 'Total Bills') : 'Total Bills'}</div>
                                <div class="text-2xl font-bold text-green-600">${totalBills}</div>
                            </div>
                            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-yellow-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_profit">${window.t ? window.t('total_profit', 'Total Profit') : 'Total Profit'}</div>
                                <div class="text-2xl font-bold text-yellow-600">${totalProfit.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Bills Details -->
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4" data-translate="bill_details">${window.t ? window.t('bill_details', 'Bill Details') : 'Bill Details'}</h3>
                    <div class="space-y-3">
                        ${data.bills.map(bill => `
                            <div class="border-b pb-3">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="font-semibold text-gray-900">${bill.patientName}</div>
                                        <div class="text-sm text-gray-600">${window.t ? window.t('bill_id', 'Bill ID') : 'Bill ID'}: ${bill.id}</div>
                                        <div class="text-xs text-gray-500">${new Date(bill.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-green-600">${bill.total.toFixed(2)} TND</div>
                                        <div class="text-xs text-gray-500">${bill.items.length} ${window.t ? window.t('items', 'items') : 'items'}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function renderWeeklyReport() {
            const dateInput = document.getElementById('weeklyReportDate');
            const selectedDate = new Date(dateInput.value);
            
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(selectedDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            const data = getDoctorBillsForPeriod(startDate, endDate);
            currentReportData = data;

            const container = document.getElementById('weeklyReportContainer');
            
            if (data.bills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p data-translate="no_data_for_period">No billing data for this week.</p>
                    </div>
                `;
                return;
            }

            const totalProfit = data.bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalConsultations = data.consultations.length;
            const totalBills = data.bills.length;

            // Group bills by day
            const billsByDay = {};
            data.bills.forEach(bill => {
                const dayKey = new Date(bill.createdAt).toLocaleDateString();
                if (!billsByDay[dayKey]) {
                    billsByDay[dayKey] = {
                        bills: [],
                        total: 0
                    };
                }
                billsByDay[dayKey].bills.push(bill);
                billsByDay[dayKey].total += bill.total;
            });

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="card p-4 bg-blue-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_consultations">${window.t ? window.t('total_consultations', 'Total Consultations') : 'Total Consultations'}</div>
                                <div class="text-2xl font-bold text-blue-600">${totalConsultations}</div>
                            </div>
                            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-green-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_bills">${window.t ? window.t('total_bills', 'Total Bills') : 'Total Bills'}</div>
                                <div class="text-2xl font-bold text-green-600">${totalBills}</div>
                            </div>
                            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-yellow-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_profit">${window.t ? window.t('total_profit', 'Total Profit') : 'Total Profit'}</div>
                                <div class="text-2xl font-bold text-yellow-600">${totalProfit.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Daily Breakdown -->
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4" data-translate="daily_breakdown">Daily Breakdown</h3>
                    <div class="space-y-3">
                        ${Object.keys(billsByDay).sort((a, b) => new Date(b) - new Date(a)).map(day => `
                            <div class="border-b pb-3">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="font-semibold text-gray-900">${day}</div>
                                        <div class="text-sm text-gray-600">${billsByDay[day].bills.length} ${window.t ? window.t('bills', 'bills') : 'bills'}</div>
                                    </div>
                                    <div class="text-xl font-bold text-green-600">${billsByDay[day].total.toFixed(2)} TND</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function renderMonthlyReport() {
            const monthSelect = document.getElementById('monthlyReportMonth');
            const yearSelect = document.getElementById('monthlyReportYear');
            
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);

            const startDate = new Date(year, month, 1, 0, 0, 0, 0);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const data = getDoctorBillsForPeriod(startDate, endDate);
            currentReportData = data;

            const container = document.getElementById('monthlyReportContainer');
            
            if (data.bills.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p data-translate="no_data_for_period">No billing data for this month.</p>
                    </div>
                `;
                return;
            }

            const totalProfit = data.bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalConsultations = data.consultations.length;
            const totalBills = data.bills.length;
            const averagePerBill = totalProfit / totalBills;

            // Group bills by week
            const billsByWeek = {};
            data.bills.forEach(bill => {
                const billDate = new Date(bill.createdAt);
                const weekNum = Math.ceil(billDate.getDate() / 7);
                const weekKey = `${window.t ? window.t('week', 'Week') : 'Week'} ${weekNum}`;
                
                if (!billsByWeek[weekKey]) {
                    billsByWeek[weekKey] = {
                        bills: [],
                        total: 0
                    };
                }
                billsByWeek[weekKey].bills.push(bill);
                billsByWeek[weekKey].total += bill.total;
            });

            const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="card p-4 bg-blue-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_consultations">${window.t ? window.t('total_consultations', 'Total Consultations') : 'Total Consultations'}</div>
                                <div class="text-2xl font-bold text-blue-600">${totalConsultations}</div>
                            </div>
                            <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-green-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_bills">${window.t ? window.t('total_bills', 'Total Bills') : 'Total Bills'}</div>
                                <div class="text-2xl font-bold text-green-600">${totalBills}</div>
                            </div>
                            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-yellow-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="total_profit">${window.t ? window.t('total_profit', 'Total Profit') : 'Total Profit'}</div>
                                <div class="text-2xl font-bold text-yellow-600">${totalProfit.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>

                    <div class="card p-4 bg-purple-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm text-gray-600" data-translate="avg_per_bill">Avg. Per Bill</div>
                                <div class="text-2xl font-bold text-purple-600">${averagePerBill.toFixed(2)} TND</div>
                            </div>
                            <svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Weekly Breakdown -->
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4">${monthName} ${year} - <span data-translate="weekly_breakdown">Weekly Breakdown</span></h3>
                    <div class="space-y-3">
                        ${Object.keys(billsByWeek).sort().map(week => `
                            <div class="border-b pb-3">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="font-semibold text-gray-900">${week}</div>
                                        <div class="text-sm text-gray-600">${billsByWeek[week].bills.length} ${window.t ? window.t('bills', 'bills') : 'bills'}</div>
                                    </div>
                                    <div class="text-xl font-bold text-green-600">${billsByWeek[week].total.toFixed(2)} TND</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Update translations after rendering
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
        }

        function exportReport() {
            if (!currentReportData || currentReportData.bills.length === 0) {
                alert('No data to export.');
                return;
            }

            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const doctorName = session.name || 'Doctor';

            let reportText = `Profit Report - ${doctorName}\n`;
            reportText += `Generated: ${new Date().toLocaleString()}\n`;
            reportText += `Report Type: ${currentReportTab.charAt(0).toUpperCase() + currentReportTab.slice(1)}\n`;
            reportText += `\n==========================================\n\n`;

            reportText += `Summary:\n`;
            reportText += `Total Consultations: ${currentReportData.consultations.length}\n`;
            reportText += `Total Bills: ${currentReportData.bills.length}\n`;
            reportText += `Total Profit: $${currentReportData.bills.reduce((sum, b) => sum + b.total, 0).toFixed(2)}\n`;
            reportText += `\n==========================================\n\n`;

            reportText += `Bill Details:\n`;
            currentReportData.bills.forEach((bill, index) => {
                reportText += `\n${index + 1}. ${bill.patientName}\n`;
                reportText += `   Bill ID: ${bill.id}\n`;
                reportText += `   Date: ${new Date(bill.createdAt).toLocaleString()}\n`;
                reportText += `   Total: ${bill.total.toFixed(2)} TND\n`;
                reportText += `   Items: ${bill.items.length}\n`;
            });

            // Create and download file
            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `profit_report_${currentReportTab}_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Report exported successfully!');
        }

        function changeLanguage(lang) {
            currentLanguage = lang;
            localStorage.setItem('selectedLanguage', lang);

            // Update HTML lang attribute
            document.documentElement.lang = lang;

            // Update text direction
                document.documentElement.dir = 'ltr';
                document.body.style.fontFamily = '';

            // Add visual feedback for language change
            const modal = document.getElementById('languageSettingsModal');
            modal.style.opacity = '0.7';

            // Update all translatable elements immediately
            updateTranslations();

            // Also update modal translations specifically
            updateModalTranslations();

            // Refresh dashboard to update dynamic content
            if (typeof renderDailyAgenda === 'function') {
                renderDailyAgenda();
            }
            
            // Refresh calendar to update month/year and day headers
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }

            // Restore modal opacity and close after showing the change
            setTimeout(() => {
                modal.style.opacity = '1';
                setTimeout(() => {
                    closeLanguageSettings();
                }, 300);
            }, 400);
        }

        function updateTranslations() {
            const elements = document.querySelectorAll('[data-translate]');

            elements.forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.textContent = translations[currentLanguage][key];
                }
            });

            // Update placeholder translations
            const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
            placeholderElements.forEach(element => {
                const key = element.getAttribute('data-translate-placeholder');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.placeholder = translations[currentLanguage][key];
                }
            });
        }

        // Helper function for translated alerts
        function showTranslatedAlert(key, ...args) {
            let message;
            if (window.t) {
                message = window.t(key, key);
            } else {
                message = translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
            }
            if (args.length > 0) {
                message = message.replace(/\{(\d+)\}/g, (match, index) => args[index] || match);
            }
            alert(message);
        }

        // Helper function for translated confirm dialogs
        function showTranslatedConfirm(key, ...args) {
            let message;
            if (window.t) {
                message = window.t(key, key);
            } else {
                message = translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
            }
            if (args.length > 0) {
                message = message.replace(/\{(\d+)\}/g, (match, index) => args[index] || match);
            }
            return confirm(message);
        }
        // Initialize language on page load
        function initializeLanguage() {
            // Only initialize legacy system if i18n is not available
            if (window.I18n) {
                console.log('i18n system available, skipping legacy language initialization');
                return;
            }
            
            const savedLang = localStorage.getItem('selectedLanguage') || 'en';
            currentLanguage = savedLang;
            if (savedLang !== 'en') {
                changeLanguage(savedLang);
            } else {
                updateTranslations();
            }
        }

        // Test function for language modal (for debugging)
        function testLanguageModal() {
            console.log('Current language:', currentLanguage);
            console.log('Available translations:', Object.keys(translations));
            console.log('Modal elements with data-translate:');
            const modalElements = document.querySelectorAll('#languageSettingsModal [data-translate]');
            modalElements.forEach(el => {
                console.log(`- ${el.getAttribute('data-translate')}: "${el.textContent}"`);
            });
        }

        function loadPatientsForBilling() {
            const patientSelect = document.getElementById('billPatientSelection');
            patientSelect.innerHTML = `<option value="">${window.t ? window.t('choose_patient', 'Choose a patient...') : 'Choose a patient...'}</option>`;

            storedPatients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.fullName} (${patient.email})`;
                patientSelect.appendChild(option);
            });
        }

        function handleBillPatientSelection() {
            const patientId = document.getElementById('billPatientSelection').value;
            const patientDetails = document.getElementById('billPatientDetails');

            if (patientId) {
                const patient = storedPatients.find(p => p.id === patientId);
                if (patient) {
                    // Show patient details
                    document.getElementById('billPatientName').textContent = patient.fullName;
                    document.getElementById('billPatientEmail').textContent = patient.email;
                    document.getElementById('billPatientPhone').textContent = patient.phone;
                    document.getElementById('billPatientAddress').textContent = patient.address || 'Not provided';

                    // Set hidden inputs
                    document.getElementById('billPatientId').value = patient.id;
                    document.getElementById('billPatientFullName').value = patient.fullName;
                    document.getElementById('billPatientEmailAddress').value = patient.email;
                    document.getElementById('billPatientPhoneNumber').value = patient.phone;

                    patientDetails.classList.remove('hidden');
                }
            } else {
                patientDetails.classList.add('hidden');
            }
        }

        function getBillDescriptionOptionsHTML() {
            const descriptions = getBillDescriptions();
            let optionsHTML = `<option value="">${window.t ? window.t('select_service', 'Select service...') : 'Select service...'}</option>`;
            descriptions.forEach(desc => {
                optionsHTML += `<option value="${desc.name}" data-price="${desc.price}">${desc.name}</option>`;
            });
            return optionsHTML;
        }

        function createBillItemHTML(itemNumber) {
            return `
                <div class="bill-item border border-gray-200 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                            <label class="form-label" for="itemDescription${itemNumber}" data-translate="description">Description</label>
                            <select id="itemDescription${itemNumber}" class="form-input" required onchange="autoFillPrice(this)">
                            ${getBillDescriptionOptionsHTML()}
                        </select>
                    </div>
                    <div>
                            <label class="form-label" for="itemQuantity${itemNumber}" data-translate="quantity">Quantity</label>
                            <input type="number" id="itemQuantity${itemNumber}" class="form-input" min="1" value="1" required onchange="calculateBillTotal()" oninput="calculateBillTotal()">
                    </div>
                    <div>
                            <label class="form-label" for="itemPrice${itemNumber}" data-translate="price">Price</label>
                            <input type="number" id="itemPrice${itemNumber}" class="form-input" min="0" step="0.01" placeholder="0.00" data-translate-placeholder="price_placeholder" required onchange="calculateBillTotal()" oninput="calculateBillTotal()">
                    </div>
                </div>
                <div class="mt-2 flex justify-end">
                        <button type="button" class="btn btn-outline btn-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400" onclick="removeBillItem(this)" title="Remove Item">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    </div>
                </div>
            `;
        }

        function resetBillItems() {
            const billItems = document.getElementById('billItems');
            if (!billItems) {
                console.error('Bill items container not found');
                return;
            }
            
            // Clear all existing items
            billItems.innerHTML = '';
            
            // Add one default item
            billItems.innerHTML = createBillItemHTML(1);
            
            // Update translations
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }
            
            // Recalculate totals
            calculateBillTotal();
        }

        function addBillItem() {
            const billItems = document.getElementById('billItems');
            const itemCount = billItems.children.length + 1;

            const newItem = document.createElement('div');
            newItem.innerHTML = createBillItemHTML(itemCount);
            billItems.appendChild(newItem);

            // Update translations for the new item
            if (window.I18n && window.I18n.walkAndTranslate) {
                window.I18n.walkAndTranslate();
            }

            calculateBillTotal();
        }

        function removeBillItem(button) {
            const billItems = document.getElementById('billItems');
            if (billItems.children.length > 1) {
                button.closest('.bill-item').remove();
                calculateBillTotal();
            } else {
                showTranslatedAlert('at_least_one_item');
            }
        }

        function calculateBillTotal() {
            const billItems = document.getElementById('billItems');
            let subtotal = 0;

            if (!billItems) {
                console.error('Bill items container not found');
                return;
            }

            billItems.querySelectorAll('.bill-item').forEach((item, index) => {
                // Find quantity input (first number input)
                const quantityInput = item.querySelector('input[type="number"]');
                // Find price input (second number input)
                const priceInput = item.querySelectorAll('input[type="number"]')[1];

                if (quantityInput && priceInput) {
                    const quantity = parseFloat(quantityInput.value) || 0;
                    const price = parseFloat(priceInput.value) || 0;
                    const itemTotal = quantity * price;
                    subtotal += itemTotal;

                    console.log(`Item ${index + 1}: Qty=${quantity}, Price=${price}, Total=${itemTotal}`);
                } else {
                    console.warn(`Item ${index + 1}: Missing quantity or price input`);
                }
            });

            const taxRate = 0.08; // 8% tax
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            console.log(`Bill calculation: Subtotal=${subtotal}, Tax=${tax}, Total=${total}`);

            // Update the display
            const subtotalElement = document.getElementById('billSubtotal');
            const taxElement = document.getElementById('billTax');
            const totalElement = document.getElementById('billTotal');

            if (subtotalElement) subtotalElement.textContent = `${subtotal.toFixed(2)} TND`;
            if (taxElement) taxElement.textContent = `${tax.toFixed(2)} TND`;
            if (totalElement) totalElement.textContent = `${total.toFixed(2)} TND`;
        }

        function resetBillingForm() {
            document.getElementById('billingForm').reset();
            document.getElementById('billPatientDetails').classList.add('hidden');
            const patientSelect = document.getElementById('billPatientSelection');
            if (patientSelect) patientSelect.disabled = false;

            // Reset bill items to just one
            resetBillItems();
        }

        function createBill(formData) {
            const billId = 'bill-' + Date.now();
            const billItems = [];

            // Collect bill items
            document.querySelectorAll('.bill-item').forEach((item, index) => {
                // Find quantity input (first number input)
                const quantityInput = item.querySelector('input[type="number"]');
                // Find price input (second number input)
                const priceInput = item.querySelectorAll('input[type="number"]')[1];
                const descriptionInput = item.querySelector('select');

                if (descriptionInput && quantityInput && priceInput) {
                    const description = descriptionInput.value.trim();
                    const quantity = parseFloat(quantityInput.value) || 0;
                    const price = parseFloat(priceInput.value) || 0;

                    if (description && quantity > 0 && price >= 0) {
                        billItems.push({
                            description,
                            quantity,
                            price,
                            total: quantity * price
                        });
                    }
                }
            });

            // Validate that we have at least one bill item
            if (billItems.length === 0) {
                throw new Error('Please add at least one item to the bill.');
            }

            const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
            const tax = subtotal * 0.08;
            const total = subtotal + tax;

            const newBill = {
                id: billId,
                patientId: formData.patientId,
                patientName: formData.patientName,
                patientEmail: formData.patientEmail,
                patientPhone: formData.patientPhone,
                billDate: new Date().toISOString().split('T')[0],
                dueDate: formData.dueDate,
                items: billItems,
                subtotal: subtotal,
                tax: tax,
                total: total,
                notes: formData.notes || '',
                status: 'Pending',
                createdAt: new Date().toISOString()
            };

            console.log('Creating bill:', newBill);
            storedBills.push(newBill);
            saveStoredBills();

            return newBill;
        }

        function saveStoredBills() {
            localStorage.setItem('healthcareBills', JSON.stringify(storedBills));
            console.log('Bills saved to localStorage');
        }

        function loadStoredBills() {
            const saved = localStorage.getItem('healthcareBills');
            console.log('Loading bills from localStorage:', saved);
            if (saved) {
                storedBills = JSON.parse(saved);
                console.log('Loaded bills:', storedBills);
            } else {
                console.log('No saved bills found');
            }
        }

        function generatePrintableBill(bill) {
            const billDate = new Date(bill.billDate).toLocaleDateString();
            const dueDate = new Date(bill.dueDate).toLocaleDateString();
            const createdDate = new Date(bill.createdAt).toLocaleDateString();

            const billHTML = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Bill - ${bill.id}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 20px;
                            background: #f5f5f5;
                        }
                        .printable-bill {
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                            padding: 2rem;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .bill-header {
                            display: flex;
                            align-items: center;
                            gap: 1rem;
                            border-bottom: 3px solid #2563eb;
                            padding-bottom: 1rem;
                            margin-bottom: 2rem;
                        }
                        .bill-logo svg { display:block; }
                        .bill-header-text { display:flex; flex-direction:column; }
                        .bill-title {
                            font-size: 2rem;
                            font-weight: bold;
                            color: #2563eb;
                            margin-bottom: 0.5rem;
                        }
                        .bill-subtitle {
                            color: #666;
                            font-size: 1.1rem;
                        }
                        .bill-info {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 2rem;
                            margin-bottom: 2rem;
                        }
                        .bill-section {
                            background: #f8fafc;
                            padding: 1rem;
                            border-radius: 0.5rem;
                        }
                        .bill-section h3 {
                            margin: 0 0 0.5rem 0;
                            color: #2563eb;
                            font-size: 1.1rem;
                        }
                        .bill-section p {
                            margin: 0.25rem 0;
                            font-size: 0.9rem;
                        }
                        .bill-items-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 2rem 0;
                        }
                        .bill-items-table th,
                        .bill-items-table td {
                            padding: 0.75rem;
                            text-align: left;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .bill-items-table th {
                            background: #f3f4f6;
                            font-weight: 600;
                            color: #374151;
                        }
                        .bill-items-table .text-right {
                            text-align: right;
                        }
                        .bill-items-table .text-center {
                            text-align: center;
                        }
                        .bill-totals {
                            margin-top: 2rem;
                            text-align: right;
                        }
                        .bill-total-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 0.5rem 0;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .bill-total-row.final {
                            font-weight: bold;
                            font-size: 1.2rem;
                            color: #059669;
                            border-top: 2px solid #059669;
                            margin-top: 1rem;
                            padding-top: 1rem;
                        }
                        .bill-footer {
                            margin-top: 3rem;
                            text-align: center;
                            color: #666;
                            font-size: 0.9rem;
                        }
                        .bill-notes {
                            margin-top: 2rem;
                            padding: 1rem;
                            background: #f0f9ff;
                            border-left: 4px solid #0ea5e9;
                        }
                        .bill-notes h4 {
                            margin: 0 0 0.5rem 0;
                            color: #0c4a6e;
                        }
                        .print-actions {
                            text-align: center;
                            margin: 2rem 0;
                        }
                        .btn {
                            display: inline-block;
                            padding: 0.75rem 1.5rem;
                            margin: 0 0.5rem;
                            background: #2563eb;
                            color: white;
                            text-decoration: none;
                            border-radius: 0.5rem;
                            border: none;
                            cursor: pointer;
                            font-size: 1rem;
                        }
                        .btn:hover {
                            background: #1d4ed8;
                        }
                        .btn-secondary {
                            background: #6b7280;
                        }
                        .btn-secondary:hover {
                            background: #4b5563;
                        }
                        @media print {
                            .print-actions {
                                display: none !important;
                            }
                            .printable-bill {
                                margin: 0;
                                padding: 1rem;
                                box-shadow: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="printable-bill">
                        <div class="bill-header">
                            <div class="bill-logo" aria-hidden="true">${(function(){
                                try {
                                    const s = getCabinetSettings();
                                    if (s && s.logo && /^data:image\//.test(s.logo)) {
                                        return `<img src="${s.logo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;"/>`;
                                    }
                                } catch(e) {}
                                return `<svg width="48" height="48" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><path d="M28 8 L22 34 L40 34 Z" fill="#2563eb"/><path d="M28 8 L26 34 L34 34 Z" fill="#3b82f6" opacity="0.85"/><path d="M12 42 Q22 36 28 42 Q34 36 44 42 Q34 48 28 42 Q22 48 12 42 Z" fill="#2563eb"/></svg>`;
                            })()}</div>
                            <div class="bill-header-text">
                                ${(function(){
                                    try {
                                        const s = getCabinetSettings();
                                        const name = (s && s.name && s.name.trim()) ? s.name : 'Medical Center';
                                        const address = (s && s.address && s.address.trim()) ? s.address : '';
                                        const phone = (s && s.phone && s.phone.trim()) ? s.phone : '';
                                        return `<div class="bill-title">${name}</div><div class="bill-subtitle">${address}</div><div style="color:#6b7280;font-size:0.9rem;">${phone ? `Tel: ${phone}` : ''}</div>`;
                                    } catch(e) {
                                        return `<div class="bill-title">Medical Center</div>`;
                                    }
                                })()}
                            </div>
                        </div>
                        
                        <div class="bill-info">
                            <div class="bill-section">
                                <h3>Bill To:</h3>
                                <p><strong>${bill.patientName}</strong></p>
                                <p>${bill.patientEmail}</p>
                                <p>${bill.patientPhone}</p>
                            </div>
                            
                            <div class="bill-section">
                                <h3>Bill Information:</h3>
                                <p><strong>Bill ID:</strong> ${bill.id}</p>
                                <p><strong>Bill Date:</strong> ${billDate}</p>
                                <p><strong>Due Date:</strong> ${dueDate}</p>
                                <p><strong>Status:</strong> ${bill.status}</p>
                            </div>
                        </div>
                        
                        <table class="bill-items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th class="text-center">Quantity</th>
                                    <th class="text-right">Price</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bill.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">${item.price.toFixed(2)} TND</td>
                                        <td class="text-right">${item.total.toFixed(2)} TND</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div class="bill-totals">
                            <div class="bill-total-row">
                                <span>Subtotal:</span>
                                <span>${bill.subtotal.toFixed(2)} TND</span>
                            </div>
                            <div class="bill-total-row">
                                <span>Tax (8%):</span>
                                <span>${bill.tax.toFixed(2)} TND</span>
                            </div>
                            <div class="bill-total-row final">
                                <span>Total Amount:</span>
                                <span>${bill.total.toFixed(2)} TND</span>
                            </div>
                        </div>
                        
                        ${bill.notes ? `
                            <div class="bill-notes">
                                <h4>Notes:</h4>
                                <p>${bill.notes}</p>
                            </div>
                        ` : ''}
                        
                        <div class="bill-footer">
                            <p>Thank you for choosing our healthcare services.</p>
                            <p>For questions about this bill, please contact us at (555) 123-4567</p>
                            <p>Generated on ${createdDate}</p>
                        </div>
                    </div>
                    
                    <div class="print-actions">
                        <button class="btn" onclick="window.print()">🖨️ Print Bill</button>
                        <button class="btn btn-secondary" onclick="window.close()">Close</button>
                    </div>
                </body>
                </html>
            `;

            return billHTML;
        }

        function showPrintableBill(bill) {
            console.log('showPrintableBill called with bill:', bill);

            try {
                const billHTML = generatePrintableBill(bill);
                console.log('Generated bill HTML length:', billHTML.length);

                // Try to open new window
                let printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                console.log('Print window opened:', printWindow);

                if (!printWindow || printWindow.closed || typeof printWindow.closed == 'undefined') {
                    // Popup blocked, show alternative
                    console.log('Popup blocked, using alternative method');
                    showTranslatedAlert('popup_blocked');
                    showAlternativePrint(bill);
                    return;
                }

                printWindow.document.write(billHTML);
                printWindow.document.close();
                console.log('Content written to print window');

                // Wait for content to load, then print
                printWindow.onload = function () {
                    console.log('Print window loaded, triggering print');
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                    }, 1000);
                };

            } catch (error) {
                console.error('Error opening print window:', error);
                showTranslatedAlert('print_error');
                showAlternativePrint(bill);
            }
        }

        function showAlternativePrint(bill) {
            // Create a modal with the printable bill
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 90%; max-height: 90%; overflow-y: auto;">
                    <div class="modal-header">
                        <h2 class="modal-title" data-translate="printable_bill">Printable Bill - ${bill.id}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div style="padding: 1rem;">
                        ${generatePrintableBillContent(bill)}
                        <div style="text-align: center; margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="printCurrentPage()">🖨️ Print This Page</button>
                            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }
        function generatePrintableBillContent(bill) {
            const billDate = new Date(bill.billDate).toLocaleDateString();
            const dueDate = new Date(bill.dueDate).toLocaleDateString();
            const createdDate = new Date(bill.createdAt).toLocaleDateString();

            return `
                <div class="printable-bill">
                    <div class="bill-header" style="display:flex;align-items:center;gap:1rem;border-bottom:3px solid #2563eb;padding-bottom:1rem;margin-bottom:2rem;">
                        <div class="bill-logo" aria-hidden="true">${(function(){
                            try {
                                const s = getCabinetSettings();
                                if (s && s.logo && /^data:image\//.test(s.logo)) {
                                    return `<img src="${s.logo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;"/>`;
                                }
                            } catch(e) {}
                            return `<svg width=\"48\" height=\"48\" viewBox=\"0 0 56 56\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M28 8 L22 34 L40 34 Z\" fill=\"#2563eb\"/><path d=\"M28 8 L26 34 L34 34 Z\" fill=\"#3b82f6\" opacity=\"0.85\"/><path d=\"M12 42 Q22 36 28 42 Q34 36 44 42 Q34 48 28 42 Q22 48 12 42 Z\" fill=\"#2563eb\"/></svg>`;
                        })()}</div>
                        <div class="bill-header-text" style="display:flex;flex-direction:column;">
                            ${(function(){
                                try {
                                    const s = getCabinetSettings();
                                    const name = (s && s.name && s.name.trim()) ? s.name : 'Medical Center';
                                    const address = (s && s.address && s.address.trim()) ? s.address : '';
                                    const phone = (s && s.phone && s.phone.trim()) ? s.phone : '';
                                    return `<div class=\"bill-title\" style=\"font-weight:700;color:#1e40af;font-size:1.5rem;\">${name}</div><div class=\"bill-subtitle\" style=\"color:#2563eb;\">${address}</div><div style=\"color:#6b7280;font-size:0.9rem;\">${phone ? `Tel: ${phone}` : ''}</div>`;
                                } catch(e) {
                                    return `<div class=\"bill-title\" style=\"font-weight:700;color:#1e40af;font-size:1.5rem;\">Medical Center</div>`;
                                }
                            })()}
                        </div>
                    </div>
                    
                    <div class="bill-info">
                        <div class="bill-section">
                            <h3>Bill To:</h3>
                            <p><strong>${bill.patientName}</strong></p>
                            <p>${bill.patientEmail}</p>
                            <p>${bill.patientPhone}</p>
                        </div>
                        
                        <div class="bill-section">
                            <h3>Bill Information:</h3>
                            <p><strong>Bill ID:</strong> ${bill.id}</p>
                            <p><strong>Bill Date:</strong> ${billDate}</p>
                            <p><strong>Due Date:</strong> ${dueDate}</p>
                            <p><strong>Status:</strong> ${bill.status}</p>
                        </div>
                    </div>
                    
                    <table class="bill-items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="text-center">Quantity</th>
                                <th class="text-right">Price</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bill.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-right">${item.price.toFixed(2)} TND</td>
                                    <td class="text-right">${item.total.toFixed(2)} TND</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="bill-totals">
                        <div class="bill-total-row">
                            <span>Subtotal:</span>
                            <span>${bill.subtotal.toFixed(2)} TND</span>
                        </div>
                        <div class="bill-total-row">
                            <span>Tax (8%):</span>
                            <span>${bill.tax.toFixed(2)} TND</span>
                        </div>
                        <div class="bill-total-row final">
                            <span>Total Amount:</span>
                            <span>${bill.total.toFixed(2)} TND</span>
                        </div>
                    </div>
                    
                    ${bill.notes ? `
                        <div class="bill-notes">
                            <h4>Notes:</h4>
                            <p>${bill.notes}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bill-footer">
                        <p>Thank you for choosing our healthcare services.</p>
                        <p>For questions about this bill, please contact us at (555) 123-4567</p>
                        <p>Generated on ${createdDate}</p>
                    </div>
                </div>
            `;
        }

        function printCurrentPage() {
            window.print();
        }

        function testPrintFunction() {
            // Create a test bill for testing the print functionality
            const testBill = {
                id: 'test-bill-123',
                patientId: 'test-patient',
                patientName: 'Test Patient',
                patientEmail: 'test@example.com',
                patientPhone: '(555) 123-4567',
                billDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                items: [
                    {
                        description: 'Test Consultation',
                        quantity: 1,
                        price: 150.00,
                        total: 150.00
                    },
                    {
                        description: 'Test Lab Work',
                        quantity: 2,
                        price: 75.00,
                        total: 150.00
                    }
                ],
                subtotal: 300.00,
                tax: 24.00,
                total: 324.00,
                notes: 'This is a test bill for testing the print functionality.',
                status: 'Pending',
                createdAt: new Date().toISOString()
            };

            console.log('Testing print function with test bill:', testBill);
            showPrintableBill(testBill);
        }

        // Billing form submission
        document.getElementById('billingForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                patientId: document.getElementById('billPatientId').value,
                patientName: document.getElementById('billPatientFullName').value,
                patientEmail: document.getElementById('billPatientEmailAddress').value,
                patientPhone: document.getElementById('billPatientPhoneNumber').value,
                billDate: new Date().toISOString().split('T')[0],
                dueDate: document.getElementById('billDueDate').value,
                notes: document.getElementById('billNotes').value
            };

            if (!formData.patientId) {
                showTranslatedAlert('select_patient_bill');
                return;
            }

            try {
                const newBill = createBill(formData);
                console.log('Bill created successfully:', newBill);

                // Show success message with print option
                const printBill = showTranslatedConfirm('bill_created_success', newBill.id, newBill.patientName, newBill.total.toFixed(2));

                if (printBill) {
                    console.log('Attempting to show printable bill:', newBill);
                    showPrintableBill(newBill);
                } else {
                    // Still show the bill in a modal for review
                    showAlternativePrint(newBill);
                }
            } catch (error) {
                console.error('Error creating bill:', error);
                showTranslatedAlert('error_creating_bill', error.message);
                return;
            }

            closeBillingModal();
        });

        // Add Bill Description Form Submission
        document.getElementById('addDescriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('newDescriptionName').value.trim();
            const price = parseFloat(document.getElementById('newDescriptionPrice').value);
            
            if (!name || isNaN(price) || price < 0) {
                alert('Please provide valid service name and price.');
                return;
            }
            
            const descriptions = getBillDescriptions();
            const newId = descriptions.length > 0 ? Math.max(...descriptions.map(d => d.id)) + 1 : 1;
            
            descriptions.push({
                id: newId,
                name: name,
                price: price
            });
            
            saveBillDescriptions(descriptions);
            renderBillDescriptionsList();
            
            // Clear form
            document.getElementById('newDescriptionName').value = '';
            document.getElementById('newDescriptionPrice').value = '';
            
            const successMessage = translations[currentLanguage].service_added || 'Service added successfully!';
            showTranslatedAlert('service_added', successMessage);
        });

        // Edit Bill Description Form Submission
        document.getElementById('editDescriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = parseInt(document.getElementById('editDescriptionId').value);
            const name = document.getElementById('editDescriptionName').value.trim();
            const price = parseFloat(document.getElementById('editDescriptionPrice').value);
            
            if (!name || isNaN(price) || price < 0) {
                alert('Please provide valid service name and price.');
                return;
            }
            
            const descriptions = getBillDescriptions();
            const index = descriptions.findIndex(d => d.id === id);
            
            if (index !== -1) {
                descriptions[index].name = name;
                descriptions[index].price = price;
                saveBillDescriptions(descriptions);
                renderBillDescriptionsList();
                closeEditDescriptionModal();
                
                const successMessage = translations[currentLanguage].service_updated || 'Service updated successfully!';
                showTranslatedAlert('service_updated', successMessage);
            }
        });

        // Cabinet Settings Form Submission
        document.getElementById('cabinetSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('cabinetName').value.trim();
            
            if (!name) {
                alert('Cabinet name is required.');
                return;
            }
            
            // Get logo (either from file input or existing preview)
            let logo = null;
            const logoPreview = document.getElementById('logoPreview');
            const logoImg = logoPreview.querySelector('img');
            if (logoImg) {
                logo = logoImg.src;
            }
            
            // Build timetable object
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const timetable = {};
            
            days.forEach(day => {
                timetable[day] = {
                    enabled: document.getElementById(`${day}_enabled`).checked,
                    open: document.getElementById(`${day}_open`).value,
                    close: document.getElementById(`${day}_close`).value
                };
            });
            
            // Build settings object
            const addressValue = document.getElementById('cabinetAddress').value.trim();
            const phoneValue = document.getElementById('cabinetPhone').value.trim();
            
            const settings = {
                name: name,
                address: addressValue || 'Tunis, Tunisia',
                phone: phoneValue || '00 000 000',
                logo: logo,
                timetable: timetable
            };
            
            // Save settings
            saveCabinetSettings(settings);
            
            // Close modal
            closeCabinetSettings();
            
            // Show success message
            const successMessage = translations[currentLanguage].settings_saved || 'Settings saved successfully!';
            showTranslatedAlert('settings_saved', successMessage);
        });

        // Add User Form Submission
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('newUserName').value.trim();
            const email = document.getElementById('newUserEmail').value.trim();
            const username = document.getElementById('newUserUsername').value.trim();
            const password = document.getElementById('newUserPassword').value;
            const role = document.getElementById('newUserRole').value;
            const status = document.getElementById('newUserStatus').value;
            
            if (!name || !email || !username || !password || !role) {
                alert('Please fill in all required fields.');
                return;
            }
            
            const users = getSystemUsers();
            
            // Check if username already exists
            if (users.some(u => u.username === username)) {
                const errorMessage = translations[currentLanguage].username_exists || 'Username already exists!';
                alert(errorMessage);
                return;
            }
            
            // Check if email already exists
            if (users.some(u => u.email === email)) {
                const errorMessage = translations[currentLanguage].email_exists || 'Email already exists!';
                alert(errorMessage);
                return;
            }
            
            // Collect permissions
            const permissionKeys = [
                'view_patients', 'add_patients', 'delete_patients',
                'view_appointments', 'add_appointments', 'delete_appointments',
                'view_bills', 'create_bills', 'manage_bills',
                'view_consultations', 'add_consultations', 'delete_consultations',
                'view_reports', 'export_reports',
                'access_settings', 'manage_users'
            ];
            
            const permissions = {};
            permissionKeys.forEach(key => {
                const checkbox = document.getElementById(`newPerm_${key}`);
                if (checkbox) {
                    permissions[key] = checkbox.checked;
                }
            });
            
            // Create new user
            const newUser = {
                id: 'user_' + Date.now(),
                name: name,
                email: email,
                username: username,
                password: password, // In production, this should be hashed
                role: role,
                status: status,
                permissions: permissions,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveSystemUsers(users);
            
            // Clear form
            document.getElementById('addUserForm').reset();
            
            // Refresh list
            renderUsersList();
            
            // Show success message
            const successMessage = translations[currentLanguage].user_added || 'User added successfully!';
            showTranslatedAlert('user_added', successMessage);
        });

        // Edit User Form Submission
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('editUserId').value;
            const name = document.getElementById('editUserName').value.trim();
            const email = document.getElementById('editUserEmail').value.trim();
            const username = document.getElementById('editUserUsername').value.trim();
            const password = document.getElementById('editUserPassword').value;
            const role = document.getElementById('editUserRole').value;
            const status = document.getElementById('editUserStatus').value;
            
            if (!name || !email || !username || !role) {
                alert('Please fill in all required fields.');
                return;
            }
            
            const users = getSystemUsers();
            const index = users.findIndex(u => u.id === userId);
            
            if (index === -1) {
                alert('User not found.');
                return;
            }
            
            // Check if username already exists (excluding current user)
            if (users.some(u => u.username === username && u.id !== userId)) {
                const errorMessage = translations[currentLanguage].username_exists || 'Username already exists!';
                alert(errorMessage);
                return;
            }
            
            // Check if email already exists (excluding current user)
            if (users.some(u => u.email === email && u.id !== userId)) {
                const errorMessage = translations[currentLanguage].email_exists || 'Email already exists!';
                alert(errorMessage);
                return;
            }
            
            // Collect permissions
            const permissionKeys = [
                'view_patients', 'add_patients', 'delete_patients',
                'view_appointments', 'add_appointments', 'delete_appointments',
                'view_bills', 'create_bills', 'manage_bills',
                'view_consultations', 'add_consultations', 'delete_consultations',
                'view_reports', 'export_reports',
                'access_settings', 'manage_users'
            ];
            
            const permissions = {};
            permissionKeys.forEach(key => {
                const checkbox = document.getElementById(`editPerm_${key}`);
                if (checkbox) {
                    permissions[key] = checkbox.checked;
                }
            });
            
            // Update user
            users[index].name = name;
            users[index].email = email;
            users[index].username = username;
            users[index].role = role;
            users[index].status = status;
            users[index].permissions = permissions;
            
            // Update password only if provided
            if (password) {
                users[index].password = password;
            }
            
            saveSystemUsers(users);
            
            // Close modal
            closeEditUserModal();
            
            // Refresh list
            renderUsersList();
            
            // Show success message
            const successMessage = translations[currentLanguage].user_updated || 'User updated successfully!';
            showTranslatedAlert('user_updated', successMessage);
        });


        // ========================================
        // Permission-based UI Functions
        // ========================================

        function getUserPermissions() {
            let session = null;
            try { 
                session = JSON.parse(localStorage.getItem('medconnect_session')); 
            } catch (error) {
                console.error('Error loading session:', error);
                return {};
            }

            if (!session) {
                return {};
            }

            const permissions = session.permissions || {};
            const isDoctor = session.role === 'doctor';
            const isAdmin = session.role === 'admin';

            // For doctors and admins, grant all permissions by default if not set
            if (isDoctor || isAdmin) {
                const defaultPermissions = {
                    view_patients: true,
                    add_patients: true,
                    delete_patients: true,
                    view_appointments: true,
                    add_appointments: true,
                    delete_appointments: true,
                    view_bills: true,
                    create_bills: true,
                    manage_bills: true,
                    view_consultations: true,
                    add_consultations: true,
                    delete_consultations: true,
                    view_reports: true,
                    export_reports: true,
                    access_settings: true,
                    manage_users: true
                };
                
                // Merge with existing permissions
                Object.keys(defaultPermissions).forEach(key => {
                    if (!(key in permissions)) {
                        permissions[key] = defaultPermissions[key];
                    }
                });
            }

            return permissions;
        }

        function hasPermission(permission) {
            const permissions = getUserPermissions();
            return permissions[permission] === true;
        }

        function applyPermissionBasedUI() {
            const permissions = getUserPermissions();

            // Apply permissions to menu items
            const menuItems = document.querySelectorAll('[data-permission]');
            menuItems.forEach(item => {
                const requiredPermission = item.getAttribute('data-permission');
                
                if (requiredPermission && !permissions[requiredPermission]) {
                    // User doesn't have this permission - hide the menu item
                    item.style.display = 'none';
                } else {
                    // User has permission - show the menu item
                    // Don't change display for doctor dashboard link - it has its own logic
                    if (item.id !== 'doctorDashboardLink' && item.id !== 'doctorDashboardLinkMobile') {
                        item.style.display = '';
                    }
                }
            });

            console.log('Permissions applied:', permissions);
        }
        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            loadStoredAppointments();
            loadStoredPatients();
            loadStoredBills();
            initializeLanguage();

            // Fix user roles if needed
            const users = getSystemUsers();
            let needsUpdate = false;
            users.forEach(user => {
                if (user.id === 'user_default_1' && user.username === 'doctor' && user.role !== 'doctor') {
                    user.role = 'doctor';
                    needsUpdate = true;
                } else if (user.id === 'user_default_2' && user.username === 'secretary' && user.role !== 'secretary') {
                    user.role = 'secretary';
                    needsUpdate = true;
                }
            });
            if (needsUpdate) {
                saveSystemUsers(users);
                console.log('Fixed user roles');
            }
            
            // Wait for i18n system to be ready before rendering
            const renderDashboard = () => {
            renderCalendar();
            renderDailyAgenda();
            loadDoctorDashboard();
            };
            
            // If i18n is available, wait for it to initialize
            if (window.I18n) {
                // Small delay to ensure i18n is fully initialized
                setTimeout(renderDashboard, 100);
            } else {
                renderDashboard();
            }
            
            // Apply permission-based UI
            applyPermissionBasedUI();

            // Role-based UI
            let session = null;
            try { session = JSON.parse(localStorage.getItem('medconnect_session')); } catch { }
            
            // Debug: Log session data
            console.log('Session data:', session);
            
            // Function to update user profile
            function updateUserProfile() {
                if (session && session.role) {
                // Update profile UI
                const nameEl = document.querySelector('.user-name');
                const roleEl = document.querySelector('.user-role');
                const avatarEl = document.querySelector('.user-avatar');
                    
                if (nameEl && session.name) nameEl.textContent = session.name;
                    
                    if (roleEl) {
                        // Set role based on actual session role
                        if (session.role === 'doctor') {
                            roleEl.textContent = window.t ? window.t('doctor', 'Doctor') : 'Doctor';
                        } else if (session.role === 'secretary') {
                            roleEl.textContent = window.t ? window.t('secretary', 'Secretary') : 'Secretary';
                        } else {
                            roleEl.textContent = session.role; // fallback to raw role
                        }
                    }
                    
                    if (avatarEl && session.name) {
                        avatarEl.textContent = (session.name.match(/\b([A-Z])/gi) || ['U', 'S']).slice(0, 2).join('').toUpperCase();
                    }
                }
            }
            
            // Update profile immediately
            updateUserProfile();
            
            // Also update after any translation updates (with a small delay to ensure DOM is ready)
            setTimeout(updateUserProfile, 100);
            
            // Make updateUserProfile globally available for other parts of the code
            window.updateUserProfile = updateUserProfile;

            // Consultation modal handlers
            const consultationModal = document.getElementById('consultationModal');
            const consultationForm = document.getElementById('consultationForm');

            window.showConsultationModal = function () {
                if (!isDoctor) {
                    showTranslatedAlert('consultations_doctors_only');
                    return;
                }
                // Populate patients
                const patientSelect = document.getElementById('consultPatient');
                const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                patientSelect.innerHTML = `<option value="">${window.t ? window.t('choose_patient', 'Choose a patient...') : 'Choose a patient...'}</option>` +
                    patients.map(p => `<option value="${p.id}">${p.fullName} (${p.fileNumber || 'No file#'}) - ${p.phone}</option>`).join('');

                // Setup selected patient info section
                const infoBox = document.getElementById('consultPatientInfo');
                const nameEl = document.getElementById('consultPatientName');
                const phoneEl = document.getElementById('consultPatientPhone');
                const ageGenEl = document.getElementById('consultPatientAgeGender');
                const addrEl = document.getElementById('consultPatientAddress');
                const histEl = document.getElementById('consultPatientHistory');

                const renderPatientInfo = () => {
                    const id = patientSelect.value;
                    const p = patients.find(x => x.id === id);
                    if (!p) {
                        if (infoBox) infoBox.classList.add('hidden');
                        return;
                    }
                    if (nameEl) nameEl.textContent = p.fullName || '-';
                    if (phoneEl) phoneEl.textContent = p.phone || '-';
                    const age = p.dateOfBirth ? calculateAge(p.dateOfBirth) : null;
                    if (ageGenEl) ageGenEl.textContent = `${age != null ? age + ' yrs' : 'N/A'}${p.gender ? ' • ' + p.gender : ''}`;
                    if (addrEl) addrEl.textContent = p.address || '-';
                    if (histEl) histEl.textContent = (p.medicalHistory && p.medicalHistory.trim()) ? p.medicalHistory : 'No history available.';
                    if (infoBox) infoBox.classList.remove('hidden');
                };

                patientSelect.removeEventListener('change', renderPatientInfo);
                patientSelect.addEventListener('change', renderPatientInfo);
                // Initial state hidden
                if (infoBox) infoBox.classList.add('hidden');

                // Setup live IMC (BMI) calculation
                const heightInput = document.getElementById('consultHeight');
                const weightInput = document.getElementById('consultWeight');
                const imcEl = document.getElementById('consultIMCValue');
                const bmiCatEl = document.getElementById('consultBMICategory');

                const getBMICategory = (bmi) => {
                    if (!isFinite(bmi)) return '';
                    if (bmi < 18.5) return 'Underweight';
                    if (bmi < 25) return 'Normal';
                    if (bmi < 30) return 'Overweight';
                    return 'Obesity';
                };

                const getBMICategoryStyle = (cat) => {
                    switch (cat) {
                        case 'Underweight':
                            return 'badge bg-yellow-100 text-yellow-800';
                        case 'Normal':
                            return 'badge bg-green-100 text-green-800';
                        case 'Overweight':
                            return 'badge bg-orange-100 text-orange-800';
                        case 'Obesity':
                            return 'badge bg-red-100 text-red-800';
                        default:
                            return 'text-sm text-gray-500';
                    }
                };

                const updateIMC = () => {
                    if (!imcEl) return;
                    const heightValue = heightInput?.value?.trim() || '';
                    const weightValue = weightInput?.value?.trim() || '';
                    const h = parseFloat(heightValue.replace(',', '.'));
                    const w = parseFloat(weightValue.replace(',', '.'));
                    if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) {
                        imcEl.textContent = '—';
                        if (bmiCatEl) {
                            bmiCatEl.textContent = '';
                            bmiCatEl.className = 'text-sm text-gray-500';
                        }
                        return;
                    }
                    // Convert cm to meters and compute BMI
                    const m = h / 100;
                    const bmi = w / (m * m);
                    imcEl.textContent = bmi.toFixed(1);
                    if (bmiCatEl) {
                        const cat = getBMICategory(bmi);
                        bmiCatEl.textContent = cat;
                        bmiCatEl.className = getBMICategoryStyle(cat);
                    }
                };

                if (heightInput && weightInput) {
                    // Remove any existing listeners to avoid duplicates
                    heightInput.removeEventListener('input', updateIMC);
                    weightInput.removeEventListener('input', updateIMC);
                    // Attach fresh listeners
                    heightInput.addEventListener('input', updateIMC);
                    weightInput.addEventListener('input', updateIMC);
                    // Trigger initial calculation
                    setTimeout(() => updateIMC(), 50);
                } else {
                    console.warn('Height or Weight input not found in consultation modal');
                }

                // Enable the patient dropdown for normal consultation
                patientSelect.disabled = false;
                
                // Update modal translations
                updateModalTranslations();
                
                // Show modal first
                consultationModal.classList.add('active');
                
                // Re-attach IMC listeners after modal is visible (ensures DOM is ready)
                setTimeout(() => {
                    const h = document.getElementById('consultHeight');
                    const w = document.getElementById('consultWeight');
                    const imc = document.getElementById('consultIMCValue');
                    const cat = document.getElementById('consultBMICategory');
                    
                    console.log('IMC Setup Check:', { h: !!h, w: !!w, imc: !!imc, cat: !!cat });
                    
                    if (h && w && imc) {
                        const calcIMC = () => {
                            const heightVal = h.value?.trim() || '';
                            const weightVal = w.value?.trim() || '';
                            const height = parseFloat(heightVal.replace(',', '.'));
                            const weight = parseFloat(weightVal.replace(',', '.'));
                            
                            console.log('IMC Calculation:', { height, weight });
                            
                            if (!isFinite(height) || !isFinite(weight) || height <= 0 || weight <= 0) {
                                imc.textContent = '—';
                                if (cat) {
                                    cat.textContent = '';
                                    cat.className = 'text-sm text-gray-500';
                                }
                                return;
                            }
                            
                            const meters = height / 100;
                            const bmi = weight / (meters * meters);
                            imc.textContent = bmi.toFixed(1);
                            
                            if (cat) {
                                let category = '';
                                let style = 'text-sm text-gray-500';
                                if (bmi < 18.5) {
                                    category = 'Underweight';
                                    style = 'badge bg-yellow-100 text-yellow-800';
                                } else if (bmi < 25) {
                                    category = 'Normal';
                                    style = 'badge bg-green-100 text-green-800';
                                } else if (bmi < 30) {
                                    category = 'Overweight';
                                    style = 'badge bg-orange-100 text-orange-800';
                                } else {
                                    category = 'Obesity';
                                    style = 'badge bg-red-100 text-red-800';
                                }
                                cat.textContent = category;
                                cat.className = style;
                            }
                            
                            console.log('IMC Result:', bmi.toFixed(1));
                        };
                        
                        h.addEventListener('input', calcIMC);
                        w.addEventListener('input', calcIMC);
                        calcIMC(); // Initial calculation
                    } else {
                        console.error('IMC elements not found!');
                    }
                }, 100);
            };

            window.closeConsultationModal = function () {
                consultationModal.classList.remove('active');
                if (consultationForm) consultationForm.reset();
                const imcEl = document.getElementById('consultIMCValue');
                if (imcEl) imcEl.textContent = '—';
                const bmiCatEl = document.getElementById('consultBMICategory');
                if (bmiCatEl) {
                    bmiCatEl.textContent = '';
                    bmiCatEl.className = 'text-sm text-gray-500';
                }
                // Reset patient info box
                const infoBox = document.getElementById('consultPatientInfo');
                if (infoBox) infoBox.classList.add('hidden');
            };

            if (consultationForm) {
                consultationForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (!isDoctor) {
                        showTranslatedAlert('consultations_doctors_only');
                        return;
                    }
                    const patientId = document.getElementById('consultPatient').value;
                    const heightVal = document.getElementById('consultHeight')?.value;
                    const weightVal = document.getElementById('consultWeight')?.value;
                    const tempVal = document.getElementById('consultTemperature')?.value;
                    const heartRateVal = document.getElementById('consultHeartRate')?.value;
                    const bloodSugarVal = document.getElementById('consultBloodSugar')?.value;
                    const bpInputVal = document.getElementById('consultBloodPressure')?.value;
                    const notes = document.getElementById('consultNotes').value.trim();
                    const prescription = document.getElementById('consultPrescription').value.trim();
                    const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked')?.value || 'paying';

                    if (!patientId || !notes) {
                        showTranslatedAlert('fill_required_consultation');
                        return;
                    }

                    const height = heightVal ? parseFloat(heightVal) : null;
                    const weight = weightVal ? parseFloat(weightVal) : null;
                    const temperature = tempVal ? parseFloat(tempVal) : null;
                    const heartRate = heartRateVal ? parseInt(heartRateVal, 10) : null;
                    const bloodSugar = bloodSugarVal ? parseInt(bloodSugarVal, 10) : null;
                    // Parse blood pressure in the form "120/80" into systolic/diastolic
                    let bpSystolic = null, bpDiastolic = null;
                    if (bpInputVal && typeof bpInputVal === 'string') {
                        const bpMatch = bpInputVal.trim().match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
                        if (bpMatch) {
                            bpSystolic = parseInt(bpMatch[1], 10);
                            bpDiastolic = parseInt(bpMatch[2], 10);
                        }
                    }
                    let imc = null; let bmiCategory = null;
                    if (height && weight) {
                        const m = height / 100;
                        imc = +(weight / (m * m)).toFixed(1);
                        // same thresholds as UI
                        if (imc < 18.5) bmiCategory = 'Underweight';
                        else if (imc < 25) bmiCategory = 'Normal';
                        else if (imc < 30) bmiCategory = 'Overweight';
                        else bmiCategory = 'Obesity';
                    }

                    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
                    const id = 'CONS-' + Date.now();
                    consultations.push({
                        id,
                        patientId,
                        height,
                        weight,
                        temperature,
                        heartRate,
                        bloodSugar,
                        bpSystolic,
                        bpDiastolic,
                        imc,
                        bmiCategory,
                        notes,
                        prescription,
                        paymentStatus,
                        doctor: session?.name || 'Doctor',
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('consultations', JSON.stringify(consultations));
                    
                    // Link any temporary lab assessments to this consultation
                    try {
                        const labAssessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
                        const updatedAssessments = labAssessments.map(assessment => {
                            // If this assessment was created for a temporary consultation with the same patient
                            if (assessment.consultationId.startsWith('temp_consult_') && currentConsultationPatientId === patientId) {
                                return { ...assessment, consultationId: id };
                            }
                            return assessment;
                        });
                        localStorage.setItem('lab_assessments', JSON.stringify(updatedAssessments));
                    } catch (error) {
                        console.error('Error linking lab assessments:', error);
                    }
                    
                    // Link any temporary medical certificates to this consultation
                    try {
                        const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
                        const updatedCertificates = certificates.map(cert => {
                            // If this certificate was created for a temporary consultation with the same patient
                            if (cert.consultationId.startsWith('temp_cert_consult_') && currentConsultationPatientId === patientId) {
                                return { ...cert, consultationId: id };
                            }
                            return cert;
                        });
                        localStorage.setItem('medical_certificates', JSON.stringify(updatedCertificates));
                        currentConsultationPatientId = null; // Reset
                    } catch (error) {
                        console.error('Error linking medical certificates:', error);
                    }

                    // Optionally update the patient's latest height/weight
                    try {
                        const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                        const idx = patients.findIndex(p => p.id === patientId);
                        if (idx !== -1) {
                            if (height !== null) patients[idx].height = height;
                            if (weight !== null) patients[idx].weight = weight;
                            if (temperature !== null) patients[idx].temperature = temperature;
                            if (heartRate !== null) patients[idx].heartRate = heartRate;
                            if (bloodSugar !== null) patients[idx].bloodSugar = bloodSugar;
                            if (bpSystolic !== null) patients[idx].bpSystolic = bpSystolic;
                            if (bpDiastolic !== null) patients[idx].bpDiastolic = bpDiastolic;
                            // Append vitals history entry
                            const entry = { date: new Date().toISOString(), height, weight, imc, temperature, heartRate, bloodSugar, bpSystolic, bpDiastolic };
                            if (!Array.isArray(patients[idx].vitalsHistory)) patients[idx].vitalsHistory = [];
                            // Only add if at least one of the values is present
                            if (height !== null || weight !== null || imc !== null || temperature !== null || heartRate !== null || bloodSugar !== null || bpSystolic !== null || bpDiastolic !== null) {
                                patients[idx].vitalsHistory.push(entry);
                            }
                            patients[idx].lastUpdated = new Date().toISOString();
                            // Persist to localStorage and sync in-memory list so UI reflects immediately
                            localStorage.setItem('healthcarePatients', JSON.stringify(patients));
                            storedPatients = patients;
                        }
                    } catch { }

                    showTranslatedAlert('consultation_saved');

                    // If this consultation came from an appointment, mark/remove it
                    try {
                        if (currentConsultationAppointmentId) {
                            const appointments = JSON.parse(localStorage.getItem('healthcareAppointments') || '[]');
                            const idx = appointments.findIndex(a => a.id === currentConsultationAppointmentId);
                            if (idx !== -1) {
                                // Mark as completed and remove from today's pending list
                                appointments[idx].status = 'completed';
                                appointments[idx].completedAt = new Date().toISOString();
                                // Remove from the array to ensure it disappears from today's list
                                appointments.splice(idx, 1);
                                localStorage.setItem('healthcareAppointments', JSON.stringify(appointments));
                                // Sync in-memory cache if present
                                if (typeof storedAppointments !== 'undefined') {
                                    storedAppointments = appointments;
                                }
                            }
                            // Reset tracker
                            currentConsultationAppointmentId = null;
                        }
                    } catch {}

                    // Refresh today's lists in doctor dashboard if it's open
                    const dashboardModal = document.getElementById('doctorDashboardModal');
                    if (dashboardModal && dashboardModal.classList.contains('active')) {
                        if (typeof loadTodayAppointments === 'function') loadTodayAppointments();
                        if (typeof loadTodayConsultations === 'function') loadTodayConsultations();
                    }

                    window.closeConsultationModal();
                });
            }
        });

        // Doctor Dashboard Functions
        window.loadDoctorDashboard = function() {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const isDoctor = session && session.role === 'doctor';
            
            if (isDoctor) {
                // Show doctor dashboard menu links
                const dashboardLink = document.getElementById('doctorDashboardLink');
                const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
                if (dashboardLink) dashboardLink.style.display = '';
                if (dashboardLinkMobile) dashboardLinkMobile.style.display = '';
            } else {
                // Hide doctor dashboard menu links
                const dashboardLink = document.getElementById('doctorDashboardLink');
                const dashboardLinkMobile = document.getElementById('doctorDashboardLinkMobile');
                if (dashboardLink) dashboardLink.style.display = 'none';
                if (dashboardLinkMobile) dashboardLinkMobile.style.display = 'none';
            }
        }

        window.showDoctorDashboard = function() {
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const isDoctor = session && session.role === 'doctor';
            
            if (!isDoctor) {
                showTranslatedAlert('consultations_doctors_only');
                return;
            }
            
            loadTodayAppointments();
            loadTodayConsultations();
            updateModalTranslations();
            
            const modal = document.getElementById('doctorDashboardModal');
            if (modal) modal.classList.add('active');
        };

        window.closeDoctorDashboard = function() {
            const modal = document.getElementById('doctorDashboardModal');
            if (modal) modal.classList.remove('active');
        };

        window.startConsultation = function(appointmentId, patientName) {
            // Check if user is doctor
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const isDoctor = session && session.role === 'doctor';
            
            if (!isDoctor) {
                showTranslatedAlert('consultations_doctors_only');
                return;
            }
            
            // Remember which appointment initiated this consultation
            currentConsultationAppointmentId = appointmentId || null;

            // Close the doctor dashboard modal
            closeDoctorDashboard();
            
            // Find the patient by name in storedPatients
            const patient = storedPatients.find(p => p.fullName === patientName);
            if (!patient) {
                showTranslatedAlert('Patient not found in system. Please add patient first.');
                return;
            }
            
            // Open consultation modal directly
            const consultationModal = document.getElementById('consultationModal');
            if (consultationModal) {
                // Populate patients dropdown
                const patientSelect = document.getElementById('consultPatient');
                const patients = JSON.parse(localStorage.getItem('healthcarePatients') || '[]');
                patientSelect.innerHTML = `<option value="">${window.t ? window.t('choose_patient', 'Choose a patient...') : 'Choose a patient...'}</option>` +
                    patients.map(p => `<option value="${p.id}">${p.fullName} (${p.fileNumber || 'No file#'}) - ${p.phone}</option>`).join('');
                
                // Pre-select the patient
                patientSelect.value = patient.id;
                
                // Disable the patient dropdown since patient is pre-selected
                patientSelect.disabled = true;
                
                // Update modal translations
                updateModalTranslations();
                
                // Show the modal
                consultationModal.classList.add('active');
                
                // Setup IMC calculation for this modal
                setTimeout(() => {
                    const heightInput = document.getElementById('consultHeight');
                    const weightInput = document.getElementById('consultWeight');
                    const imcEl = document.getElementById('consultIMCValue');
                    const bmiCatEl = document.getElementById('consultBMICategory');

                    if (heightInput && weightInput && imcEl) {
                        const calculateBMI = () => {
                            const heightValue = heightInput.value?.trim() || '';
                            const weightValue = weightInput.value?.trim() || '';
                            
                            const height = parseFloat(heightValue.replace(',', '.'));
                            const weight = parseFloat(weightValue.replace(',', '.'));
                            
                            if (!isFinite(height) || !isFinite(weight) || height <= 0 || weight <= 0) {
                                imcEl.textContent = '—';
                                if (bmiCatEl) {
                                    bmiCatEl.textContent = '';
                                    bmiCatEl.className = 'text-sm text-gray-500';
                                }
                                return;
                            }
                            
                            const meters = height / 100;
                            const bmi = weight / (meters * meters);
                            imcEl.textContent = bmi.toFixed(1);
                            
                            if (bmiCatEl) {
                                let category = '';
                                let style = 'text-sm text-gray-500';
                                
                                if (bmi < 18.5) {
                                    category = 'Underweight';
                                    style = 'badge bg-yellow-100 text-yellow-800';
                                } else if (bmi < 25) {
                                    category = 'Normal';
                                    style = 'badge bg-green-100 text-green-800';
                                } else if (bmi < 30) {
                                    category = 'Overweight';
                                    style = 'badge bg-orange-100 text-orange-800';
                                } else {
                                    category = 'Obesity';
                                    style = 'badge bg-red-100 text-red-800';
                                }
                                
                                bmiCatEl.textContent = category;
                                bmiCatEl.className = style;
                            }
                        };

                        // Remove existing listeners
                        heightInput.removeEventListener('input', calculateBMI);
                        weightInput.removeEventListener('input', calculateBMI);
                        
                        // Add new listeners
                        heightInput.addEventListener('input', calculateBMI);
                        weightInput.addEventListener('input', calculateBMI);
                        
                        // Initial calculation
                        calculateBMI();
                    }
                }, 200);
                
                // Trigger change event to load patient info
                setTimeout(() => {
                    const event = new Event('change', { bubbles: true });
                    patientSelect.dispatchEvent(event);
                }, 100);
            }
        };

        window.rejectConsultation = function(appointmentId) {
            if (showTranslatedConfirm('Are you sure you want to reject this consultation?')) {
                // Update appointment status to rejected
                const appointments = JSON.parse(localStorage.getItem('healthcareAppointments') || '[]');
                const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
                
                if (appointmentIndex !== -1) {
                    appointments[appointmentIndex].status = 'rejected';
                    localStorage.setItem('healthcareAppointments', JSON.stringify(appointments));
                    
                    // Update stored appointments in memory
                    storedAppointments = appointments;
                    
                    // Refresh the dashboard
                    loadTodayAppointments();
                    
                    showTranslatedAlert('Consultation rejected successfully.');
                } else {
                    showTranslatedAlert('Appointment not found.');
                }
            }
        };

        window.loadTodayAppointments = function() {
            const today = new Date();
            const todayStr = formatDateForStorage(today);
            const allAppointments = getAppointmentsForDate(today);
            
            // Filter only confirmed appointments for doctor dashboard
            const appointments = allAppointments.filter(appointment => 
                appointment.status && appointment.status.toLowerCase() === 'confirmed'
            );
            
            const appointmentCountEl = document.getElementById('appointmentCount');
            const appointmentsListEl = document.getElementById('todayAppointmentsList');
            
            appointmentCountEl.textContent = appointments.length;
            
            if (appointments.length === 0) {
                appointmentsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_appointments_today">${window.t ? window.t('no_appointments_today', 'No appointments scheduled for today.') : 'No appointments scheduled for today.'}</p>`;
                return;
            }
            
            appointmentsListEl.innerHTML = appointments.map(appointment => {
                const patientName = appointment.clientName || 'Unknown Patient';
                const statusColor = getStatusColor(appointment.status);
                
                return `
                    <div class="appointment-item">
                        <div class="patient-name">${patientName}</div>
                        <div class="appointment-time">${appointment.time} (${appointment.duration} min)</div>
                        <div class="flex items-center gap-2 mb-3">
                            <span class="badge ${statusColor}">${window.t ? window.t(appointment.status.toLowerCase(), appointment.status) : appointment.status}</span>
                            ${appointment.notes ? `<span class="text-sm text-gray-600">${appointment.notes}</span>` : ''}
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment.id}', '${patientName}')" data-translate="consult">${window.t ? window.t('consult', 'Consult') : 'Consult'}</button>
                            <button class="btn btn-sm btn-secondary" onclick="rejectConsultation('${appointment.id}')" data-translate="reject">${window.t ? window.t('reject', 'Reject') : 'Reject'}</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        window.loadTodayConsultations = function() {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Filter consultations for today
            const todayConsultations = consultations.filter(consultation => {
                const consultationDate = new Date(consultation.createdAt).toISOString().split('T')[0];
                return consultationDate === todayStr;
            });
            
            const consultationCountEl = document.getElementById('consultationCount');
            const consultationsListEl = document.getElementById('todayConsultationsList');
            
            consultationCountEl.textContent = todayConsultations.length;
            
            if (todayConsultations.length === 0) {
                consultationsListEl.innerHTML = `<p class="text-gray-500 text-center py-4" data-translate="no_consultations_today">${window.t ? window.t('no_consultations_today', 'No consultations conducted today.') : 'No consultations conducted today.'}</p>`;
                return;
            }
            
            consultationsListEl.innerHTML = todayConsultations.map(consultation => {
                const patient = storedPatients.find(p => p.id === consultation.patientId);
                const patientName = patient ? patient.fullName : 'Unknown Patient';
                const consultationTime = new Date(consultation.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <div class="consultation-item">
                        <div class="patient-name">${patientName}</div>
                        <div class="consultation-time">${consultationTime}</div>
                        <div class="consultation-notes">${consultation.notes.substring(0, 100)}${consultation.notes.length > 100 ? '...' : ''}</div>
                        <div class="flex gap-2 mt-3 flex-wrap">
                            <button class="btn btn-sm btn-primary" onclick="viewConsultationDetail('${consultation.id}')" data-translate="view_details">View Details</button>
                            <button class="btn btn-sm btn-outline" onclick="openLaboratoryAssessmentModal('${consultation.id}')" data-translate="add_lab_assessment">Lab Assessment</button>
                            <button class="btn btn-sm btn-outline" onclick="openMedicalCertificateModal('${consultation.id}')" data-translate="medical_certificate">Medical Certificate</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Consultation Detail Modal Functions
        window.viewConsultationDetail = function(consultationId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const consultation = consultations.find(c => c.id === consultationId);
            
            if (!consultation) {
                showTranslatedAlert('Consultation not found.');
                return;
            }
            
            const patient = storedPatients.find(p => p.id === consultation.patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            const consultationTime = new Date(consultation.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const detailContent = document.getElementById('consultationDetailContent');
            detailContent.innerHTML = `
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4 text-gray-900">${window.t ? window.t('patient_information', 'Patient Information') : 'Patient Information'}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><strong>${window.t ? window.t('patient_name', 'Patient Name') : 'Patient Name'}:</strong> ${patientName}</div>
                        <div><strong>${window.t ? window.t('date_time', 'Date & Time') : 'Date & Time'}:</strong> ${consultationTime}</div>
                        <div><strong>${window.t ? window.t('doctor', 'Doctor') : 'Doctor'}:</strong> ${consultation.doctor || 'N/A'}</div>
                        <div><strong>${window.t ? window.t('payment_status', 'Payment Status') : 'Payment Status'}:</strong> ${consultation.paymentStatus === 'paying' ? (window.t ? window.t('paying_patient', 'Paying Patient') : 'Paying Patient') : (window.t ? window.t('non_paying_patient', 'Non-Paying Patient') : 'Non-Paying Patient')}</div>
                    </div>
                </div>
                
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-4 text-gray-900">${window.t ? window.t('vital_signs', 'Vital Signs') : 'Vital Signs'}</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        ${consultation.height ? `<div><strong>${window.t ? window.t('height', 'Height') : 'Height'}:</strong> ${consultation.height} cm</div>` : ''}
                        ${consultation.weight ? `<div><strong>${window.t ? window.t('weight', 'Weight') : 'Weight'}:</strong> ${consultation.weight} kg</div>` : ''}
                        ${consultation.imc ? `<div><strong>${window.t ? window.t('bmi', 'IMC/BMI') : 'IMC/BMI'}:</strong> ${consultation.imc} (${consultation.bmiCategory || 'N/A'})</div>` : ''}
                        ${consultation.temperature ? `<div><strong>${window.t ? window.t('temperature', 'Temperature') : 'Temperature'}:</strong> ${consultation.temperature} °C</div>` : ''}
                        ${consultation.heartRate ? `<div><strong>${window.t ? window.t('heart_rate', 'Heart Rate') : 'Heart Rate'}:</strong> ${consultation.heartRate} bpm</div>` : ''}
                        ${consultation.bloodSugar ? `<div><strong>${window.t ? window.t('blood_sugar', 'Blood Sugar') : 'Blood Sugar'}:</strong> ${consultation.bloodSugar} mg/dL</div>` : ''}
                        ${consultation.bpSystolic && consultation.bpDiastolic ? `<div><strong>${window.t ? window.t('blood_pressure', 'Blood Pressure') : 'Blood Pressure'}:</strong> ${consultation.bpSystolic}/${consultation.bpDiastolic} mmHg</div>` : ''}
                    </div>
                </div>
                
                <div class="card p-4">
                    <h3 class="text-lg font-semibold mb-3 text-gray-900">${window.t ? window.t('clinical_notes', 'Clinical Notes') : 'Clinical Notes'}</h3>
                    <div class="text-sm text-gray-700 whitespace-pre-wrap">${consultation.notes || (window.t ? window.t('no_notes_provided', 'No notes provided.') : 'No notes provided.')}</div>
                </div>
                
                ${consultation.prescription ? `
                    <div class="card p-4">
                        <h3 class="text-lg font-semibold mb-3 text-gray-900">Prescription</h3>
                        <div class="text-sm text-gray-700 whitespace-pre-wrap">${consultation.prescription}</div>
                    </div>
                ` : ''}
            `;
            
            // Add laboratory assessments section if any exist
            const labAssessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
            const consultationAssessments = labAssessments.filter(a => a.consultationId === consultationId);
            
            if (consultationAssessments.length > 0) {
                detailContent.innerHTML += `
                    <div class="card p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">${window.t ? window.t('laboratory_assessments', 'Laboratory Assessments') : 'Laboratory Assessments'}</h3>
                            <button class="btn btn-sm btn-outline" onclick="openLaboratoryAssessmentModal('${consultationId}')">
                                <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span data-translate="add_lab_assessment">Add New</span>
                            </button>
                        </div>
                        <div class="space-y-3">
                            ${consultationAssessments.map((assessment, index) => `
                                <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="font-semibold text-sm text-gray-700">Assessment #${index + 1}</span>
                                        <span class="text-xs text-gray-500">${new Date(assessment.createdAt).toLocaleString()}</span>
                                    </div>
                                    ${assessment.notes ? `
                                        <div class="text-sm text-gray-600 mb-2">
                                            <strong>Notes:</strong> ${assessment.notes}
                                        </div>
                                    ` : ''}
                                    ${assessment.files && assessment.files.length > 0 ? `
                                        <div class="text-sm">
                                            <strong>Uploaded Files (${assessment.files.length}):</strong>
                                            <div class="mt-2 space-y-1">
                                                ${assessment.files.map(file => `
                                                    <div class="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                                        <div class="flex items-center gap-2">
                                                            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                            </svg>
                                                            <span class="text-gray-700">${file.name}</span>
                                                        </div>
                                                        <button onclick="downloadLabFile('${assessment.id}', '${file.name}')" class="text-blue-600 hover:text-blue-800 text-xs">
                                                            Download
                                                        </button>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Show button to add first assessment
                detailContent.innerHTML += `
                    <div class="card p-4 border-dashed border-2 border-gray-300 bg-gray-50">
                        <div class="text-center py-3">
                            <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p class="text-gray-600 mb-3">${window.t ? window.t('no_lab_assessments_yet', 'No laboratory assessments yet') : 'No laboratory assessments yet'}</p>
                            <button class="btn btn-primary btn-sm" onclick="openLaboratoryAssessmentModal('${consultationId}')">
                                <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span data-translate="add_lab_assessment">Add Laboratory Assessment</span>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Add medical certificates section if any exist
            const medicalCertificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            const consultationCertificates = medicalCertificates.filter(c => c.consultationId === consultationId);
            
            if (consultationCertificates.length > 0) {
                detailContent.innerHTML += `
                    <div class="card p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">Medical Certificates</h3>
                            <button class="btn btn-sm btn-outline" onclick="openMedicalCertificateModal('${consultationId}')">
                                <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span data-translate="medical_certificate">Create New</span>
                            </button>
                        </div>
                        <div class="space-y-3">
                            ${consultationCertificates.map((cert, index) => `
                                <div class="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span class="font-semibold text-gray-700">${cert.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        </div>
                                        <span class="text-xs text-gray-500">${new Date(cert.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                        ${cert.startDate ? `
                                            <div><strong>Start Date:</strong> ${new Date(cert.startDate).toLocaleDateString()}</div>
                                        ` : ''}
                                        ${cert.endDate ? `
                                            <div><strong>End Date:</strong> ${new Date(cert.endDate).toLocaleDateString()}</div>
                                        ` : ''}
                                        ${cert.restPeriod ? `
                                            <div><strong>Rest Period:</strong> ${cert.restPeriod} days</div>
                                        ` : ''}
                                    </div>
                                    <div class="text-sm mb-2">
                                        <strong>Diagnosis:</strong>
                                        <div class="mt-1 text-gray-700">${cert.diagnosis}</div>
                                    </div>
                                    ${cert.recommendations ? `
                                        <div class="text-sm mb-2">
                                            <strong>Recommendations:</strong>
                                            <div class="mt-1 text-gray-700">${cert.recommendations}</div>
                                        </div>
                                    ` : ''}
                                    ${cert.notes ? `
                                        <div class="text-sm">
                                            <strong>Additional Notes:</strong>
                                            <div class="mt-1 text-gray-600">${cert.notes}</div>
                                        </div>
                                    ` : ''}
                                    <div class="mt-3 pt-3 border-t border-green-200">
                                        <button onclick="printMedicalCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                                            <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                            </svg>
                                            Print Certificate
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            updateModalTranslations();
            
            const modal = document.getElementById('consultationDetailModal');
            if (modal) {
                // Ensure it appears above other modals
                modal.style.zIndex = '10000';
                modal.classList.add('active');
                // Focus content for accessibility
                const content = document.getElementById('consultationDetailModalContent') || modal.querySelector('.modal-content');
                if (content && typeof content.focus === 'function') {
                    setTimeout(() => content.focus(), 0);
                }
            }
        };
        
        window.closeConsultationDetail = function() {
            const modal = document.getElementById('consultationDetailModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.zIndex = '';
            }
        };

        // Reason, Diagnosis, Clinical Exam Modal Functions
        window.openReasonModal = function() {
            const modal = document.getElementById('reasonModal');
            if (modal) modal.classList.add('active');
        };

        window.closeReasonModal = function() {
            const modal = document.getElementById('reasonModal');
            if (modal) modal.classList.remove('active');
        };

        window.saveReason = function() {
            const text = document.getElementById('reasonText').value;
            // Store or process the reason text
            console.log('Reason saved:', text);
            showTranslatedAlert('Reason documented successfully');
            closeReasonModal();
        };

        window.openDiagnosisModal = function() {
            const modal = document.getElementById('diagnosisModal');
            if (modal) modal.classList.add('active');
        };

        window.closeDiagnosisModal = function() {
            const modal = document.getElementById('diagnosisModal');
            if (modal) modal.classList.remove('active');
        };

        window.saveDiagnosis = function() {
            const text = document.getElementById('diagnosisText').value;
            // Store or process the diagnosis text
            console.log('Diagnosis saved:', text);
            showTranslatedAlert('Diagnosis documented successfully');
            closeDiagnosisModal();
        };

        window.openClinicalExamModal = function() {
            const modal = document.getElementById('clinicalExamModal');
            if (modal) modal.classList.add('active');
        };

        window.closeClinicalExamModal = function() {
            const modal = document.getElementById('clinicalExamModal');
            if (modal) modal.classList.remove('active');
        };

        window.saveClinicalExam = function() {
            const text = document.getElementById('clinicalExamText').value;
            // Store or process the clinical exam text
            console.log('Clinical Exam saved:', text);
            showTranslatedAlert('Clinical examination documented successfully');
            closeClinicalExamModal();
        };

        // Laboratory Assessment Functions
        let selectedLabFiles = [];
        
        window.openLaboratoryAssessmentModal = function(consultationId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const consultation = consultations.find(c => c.id === consultationId);
            
            if (!consultation) {
                showTranslatedAlert('Consultation not found.');
                return;
            }
            
            // Get patient info
            const patient = storedPatients.find(p => p.id === consultation.patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            const consultationDate = new Date(consultation.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Populate modal
            document.getElementById('labAssessmentConsultationId').value = consultationId;
            document.getElementById('labAssessmentPatientName').textContent = patientName;
            document.getElementById('labAssessmentConsultationDate').textContent = consultationDate;
            document.getElementById('labAssessmentNotes').value = '';
            document.getElementById('labAssessmentFiles').value = '';
            document.getElementById('uploadedFilesList').innerHTML = '';
            selectedLabFiles = [];
            
            // Load existing assessments
            loadExistingAssessments(consultationId);
            
            // Open modal with high z-index
            const modal = document.getElementById('laboratoryAssessmentModal');
            if (modal) {
                modal.style.zIndex = '11000'; // Higher than consultation detail modal
                modal.classList.add('active');
                updateModalTranslations();
            }
        };
        
        window.openLabAssessmentFromConsultation = function() {
            // Get selected patient from consultation form
            const patientId = document.getElementById('consultPatient').value;
            
            if (!patientId) {
                alert('Please select a patient first.');
                return;
            }
            
            // Get patient info
            const patient = storedPatients.find(p => p.id === patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            
            // Use a temporary ID for new consultations (not yet saved)
            const tempConsultationId = 'temp_consult_' + Date.now();
            
            // Store the current patient ID for reference
            currentConsultationPatientId = patientId;
            
            // Populate modal
            document.getElementById('labAssessmentConsultationId').value = tempConsultationId;
            document.getElementById('labAssessmentPatientName').textContent = patientName;
            document.getElementById('labAssessmentConsultationDate').textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('labAssessmentNotes').value = '';
            document.getElementById('labAssessmentFiles').value = '';
            document.getElementById('uploadedFilesList').innerHTML = '';
            selectedLabFiles = [];
            
            // Hide existing assessments section for new consultations
            const section = document.getElementById('existingAssessmentsSection');
            if (section) section.classList.add('hidden');
            
            // Open modal with high z-index to appear on top of consultation modal
            const modal = document.getElementById('laboratoryAssessmentModal');
            if (modal) {
                modal.style.zIndex = '11000'; // Higher than consultation modal
                modal.classList.add('active');
                updateModalTranslations();
            }
        };
        
        window.closeLaboratoryAssessmentModal = function() {
            const modal = document.getElementById('laboratoryAssessmentModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.zIndex = ''; // Reset z-index
            }
            selectedLabFiles = [];
        };
        
        function loadExistingAssessments(consultationId) {
            const assessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
            const consultationAssessments = assessments.filter(a => a.consultationId === consultationId);
            
            const section = document.getElementById('existingAssessmentsSection');
            const list = document.getElementById('existingAssessmentsList');
            
            if (consultationAssessments.length === 0) {
                section.classList.add('hidden');
                return;
            }
            
            section.classList.remove('hidden');
            list.innerHTML = consultationAssessments.map((assessment, index) => `
                <div class="card p-3 bg-gray-50">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold text-sm text-gray-700">Assessment #${index + 1}</span>
                        <span class="text-xs text-gray-500">${new Date(assessment.createdAt).toLocaleString()}</span>
                    </div>
                    ${assessment.notes ? `
                        <div class="text-sm text-gray-600 mb-2">
                            <strong>Notes:</strong> ${assessment.notes}
                        </div>
                    ` : ''}
                    ${assessment.files && assessment.files.length > 0 ? `
                        <div class="text-sm">
                            <strong>Files:</strong>
                            <div class="mt-1 space-y-1">
                                ${assessment.files.map(file => `
                                    <div class="flex items-center text-blue-600">
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <span>${file.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
        
        // Handle file selection
        document.addEventListener('DOMContentLoaded', function() {
            const fileInput = document.getElementById('labAssessmentFiles');
            if (fileInput) {
                fileInput.addEventListener('change', function(e) {
                    const files = Array.from(e.target.files);
                    
                    // Process files
                    files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            selectedLabFiles.push({
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: event.target.result
                            });
                            updateUploadedFilesList();
                        };
                        reader.readAsDataURL(file);
                    });
                });
            }
        });
        
        function updateUploadedFilesList() {
            const container = document.getElementById('uploadedFilesList');
            
            if (selectedLabFiles.length === 0) {
                container.innerHTML = '<p class="text-sm text-gray-500" data-translate="no_files_selected">No files selected</p>';
                return;
            }
            
            container.innerHTML = selectedLabFiles.map((file, index) => `
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${file.name}</div>
                            <div class="text-xs text-gray-500">${(file.size / 1024).toFixed(2)} KB</div>
                        </div>
                    </div>
                    <button type="button" onclick="removeLabFile(${index})" class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `).join('');
        }
        
        window.removeLabFile = function(index) {
            selectedLabFiles.splice(index, 1);
            updateUploadedFilesList();
        };
        
        window.downloadLabFile = function(assessmentId, fileName) {
            const assessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
            const assessment = assessments.find(a => a.id === assessmentId);
            
            if (!assessment) {
                alert('Assessment not found.');
                return;
            }
            
            const file = assessment.files.find(f => f.name === fileName);
            if (!file) {
                alert('File not found.');
                return;
            }
            
            // Create download link
            const link = document.createElement('a');
            link.href = file.data;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        // Handle form submission
        document.getElementById('laboratoryAssessmentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const consultationId = document.getElementById('labAssessmentConsultationId').value;
            const notes = document.getElementById('labAssessmentNotes').value.trim();
            
            if (!notes && selectedLabFiles.length === 0) {
                alert('Please add notes or upload at least one file.');
                return;
            }
            
            // Save assessment
            const assessments = JSON.parse(localStorage.getItem('lab_assessments') || '[]');
            
            const newAssessment = {
                id: 'lab_' + Date.now(),
                consultationId: consultationId,
                notes: notes,
                files: selectedLabFiles,
                createdAt: new Date().toISOString()
            };
            
            assessments.push(newAssessment);
            localStorage.setItem('lab_assessments', JSON.stringify(assessments));
            
            // Show success message
            const successMessage = translations[currentLanguage].assessment_saved || 'Laboratory assessment saved successfully!';
            showTranslatedAlert('assessment_saved', successMessage);
            
            // Close modal
            closeLaboratoryAssessmentModal();
            
            // Refresh consultation detail if it's open
            const detailModal = document.getElementById('consultationDetailModal');
            if (detailModal && detailModal.classList.contains('active')) {
                viewConsultationDetail(consultationId);
            }
        });

        // ========================================
        // Medical Certificate Functions
        // ========================================

        window.openMedicalCertificateModal = function(consultationId) {
            const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
            const consultation = consultations.find(c => c.id === consultationId);
            
            if (!consultation) {
                showTranslatedAlert('Consultation not found.');
                return;
            }
            
            // Get patient and doctor info
            const patient = storedPatients.find(p => p.id === consultation.patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            const doctorName = consultation.doctor || 'Doctor';
            const consultationDate = new Date(consultation.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Populate modal
            document.getElementById('certConsultationId').value = consultationId;
            document.getElementById('certPatientName').textContent = patientName;
            document.getElementById('certDate').textContent = consultationDate;
            document.getElementById('certDoctorName').textContent = doctorName;
            
            // Set default start date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('certStartDate').value = today;
            
            // Clear other fields
            document.getElementById('certType').value = '';
            document.getElementById('certRestPeriod').value = '';
            document.getElementById('certEndDate').value = '';
            document.getElementById('certDiagnosis').value = consultation.notes || '';
            document.getElementById('certRecommendations').value = '';
            document.getElementById('certNotes').value = '';
            
            // Open modal with high z-index
            const modal = document.getElementById('medicalCertificateModal');
            if (modal) {
                modal.style.zIndex = '11000'; // Higher than other modals
                modal.classList.add('active');
                updateModalTranslations();
            }
        };
        window.openMedicalCertificateFromConsultation = function() {
            // Get selected patient from consultation form
            const patientId = document.getElementById('consultPatient').value;
            
            if (!patientId) {
                alert('Please select a patient first.');
                return;
            }
            
            // Get patient info and session
            const patient = storedPatients.find(p => p.id === patientId);
            const patientName = patient ? patient.fullName : 'Unknown Patient';
            const session = JSON.parse(localStorage.getItem('medconnect_session') || '{}');
            const doctorName = session?.name || 'Doctor';
            
            // Use a temporary ID for new consultations
            const tempConsultationId = 'temp_cert_consult_' + Date.now();
            
            // Store the current patient ID for reference
            currentConsultationPatientId = patientId;
            
            // Populate modal
            document.getElementById('certConsultationId').value = tempConsultationId;
            document.getElementById('certPatientName').textContent = patientName;
            document.getElementById('certDate').textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('certDoctorName').textContent = doctorName;
            
            // Set default start date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('certStartDate').value = today;
            
            // Pre-fill diagnosis from consultation notes if available
            const consultNotes = document.getElementById('consultNotes').value;
            document.getElementById('certDiagnosis').value = consultNotes || '';
            
            // Clear other fields
            document.getElementById('certType').value = '';
            document.getElementById('certRestPeriod').value = '';
            document.getElementById('certEndDate').value = '';
            document.getElementById('certRecommendations').value = '';
            document.getElementById('certNotes').value = '';
            
            // Open modal with high z-index to appear on top of consultation modal
            const modal = document.getElementById('medicalCertificateModal');
            if (modal) {
                modal.style.zIndex = '11000'; // Higher than consultation modal
                modal.classList.add('active');
                updateModalTranslations();
            }
        };

        window.closeMedicalCertificateModal = function() {
            const modal = document.getElementById('medicalCertificateModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.zIndex = ''; // Reset z-index
            }
        };

        // Auto-calculate end date when rest period changes
        document.addEventListener('DOMContentLoaded', function() {
            const restPeriodInput = document.getElementById('certRestPeriod');
            const startDateInput = document.getElementById('certStartDate');
            const endDateInput = document.getElementById('certEndDate');
            
            if (restPeriodInput && startDateInput && endDateInput) {
                const updateEndDate = function() {
                    const startDate = startDateInput.value;
                    const restPeriod = parseInt(restPeriodInput.value);
                    
                    if (startDate && restPeriod > 0) {
                        const start = new Date(startDate);
                        start.setDate(start.getDate() + restPeriod);
                        endDateInput.value = start.toISOString().split('T')[0];
                    }
                };
                
                restPeriodInput.addEventListener('input', updateEndDate);
                startDateInput.addEventListener('change', updateEndDate);
            }
        });

        // Medical Certificate Form Submission
        document.getElementById('medicalCertificateForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const consultationId = document.getElementById('certConsultationId').value;
            const certType = document.getElementById('certType').value;
            const restPeriod = document.getElementById('certRestPeriod').value;
            const startDate = document.getElementById('certStartDate').value;
            const endDate = document.getElementById('certEndDate').value;
            const diagnosis = document.getElementById('certDiagnosis').value.trim();
            const recommendations = document.getElementById('certRecommendations').value.trim();
            const notes = document.getElementById('certNotes').value.trim();
            
            if (!certType || !startDate || !diagnosis) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Save certificate
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            
            const newCertificate = {
                id: 'cert_' + Date.now(),
                consultationId: consultationId,
                patientName: document.getElementById('certPatientName').textContent,
                doctorName: document.getElementById('certDoctorName').textContent,
                certType: certType,
                restPeriod: restPeriod ? parseInt(restPeriod) : null,
                startDate: startDate,
                endDate: endDate || null,
                diagnosis: diagnosis,
                recommendations: recommendations,
                notes: notes,
                createdAt: new Date().toISOString()
            };
            
            certificates.push(newCertificate);
            localStorage.setItem('medical_certificates', JSON.stringify(certificates));
            
            // Show success message
            const successMessage = translations[currentLanguage].certificate_saved || 'Medical certificate saved successfully!';
            showTranslatedAlert('certificate_saved', successMessage);
            
            // Close modal
            closeMedicalCertificateModal();
            
            // Refresh consultation detail if it's open
            const detailModal = document.getElementById('consultationDetailModal');
            if (detailModal && detailModal.classList.contains('active')) {
                viewConsultationDetail(consultationId);
            }
        });

        window.printMedicalCertificate = function(certificateId) {
            const certificates = JSON.parse(localStorage.getItem('medical_certificates') || '[]');
            const cert = certificates.find(c => c.id === certificateId);
            
            if (!cert) {
                alert('Certificate not found.');
                return;
            }
            
            // Get cabinet settings for letterhead
            const cabinetSettings = getCabinetSettings();
            
            // Create printable certificate
            const printWindow = window.open('', '_blank');
            const certTypeDisplay = cert.certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            let certificateHTML = '<!DOCTYPE html><html><head>';
            certificateHTML += '<title>Medical Certificate - ' + cert.patientName + '</title>';
            certificateHTML += '<style>';
            certificateHTML += 'body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }';
            certificateHTML += '.header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }';
            certificateHTML += '.logo { max-width: 120px; margin-bottom: 10px; }';
            certificateHTML += '.cabinet-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }';
            certificateHTML += '.cabinet-info { font-size: 14px; color: #666; }';
            certificateHTML += '.certificate-title { text-align: center; font-size: 28px; font-weight: bold; color: #059669; margin: 30px 0; text-transform: uppercase; }';
            certificateHTML += '.cert-body { margin: 30px 0; }';
            certificateHTML += '.info-section { margin-bottom: 20px; }';
            certificateHTML += '.info-label { font-weight: bold; color: #374151; }';
            certificateHTML += '.info-value { color: #1f2937; margin-left: 10px; }';
            certificateHTML += '.diagnosis-box { background: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }';
            certificateHTML += '.signature-section { margin-top: 60px; display: flex; justify-content: space-between; }';
            certificateHTML += '.signature-box { text-align: center; min-width: 200px; }';
            certificateHTML += '.signature-line { border-top: 2px solid #000; margin-top: 50px; padding-top: 5px; }';
            certificateHTML += '.footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }';
            certificateHTML += '@media print { body { padding: 20px; } }';
            certificateHTML += '</style></head><body>';
            certificateHTML += '<div class="header">';
            if (cabinetSettings.logo) {
                certificateHTML += '<img src="' + cabinetSettings.logo + '" alt="Logo" class="logo">';
            }
            certificateHTML += '<div class="cabinet-name">' + (cabinetSettings.name || 'Medical Center') + '</div>';
            certificateHTML += '<div class="cabinet-info">' + (cabinetSettings.address || 'Tunis, Tunisia') + '</div>';
            certificateHTML += '<div class="cabinet-info">Tel: ' + (cabinetSettings.phone || '00 000 000') + '</div>';
            certificateHTML += '</div>';
            certificateHTML += '<div class="certificate-title">Medical Certificate</div>';
            certificateHTML += '<div style="text-align: center; margin-bottom: 20px; font-size: 16px; color: #059669;">' + certTypeDisplay + '</div>';
            certificateHTML += '<div class="cert-body">';
            certificateHTML += '<div class="info-section"><span class="info-label">Certificate ID:</span><span class="info-value">' + cert.id + '</span></div>';
            certificateHTML += '<div class="info-section"><span class="info-label">Date of Issue:</span><span class="info-value">' + new Date(cert.createdAt).toLocaleDateString() + '</span></div>';
            certificateHTML += '<div class="info-section"><span class="info-label">Patient Name:</span><span class="info-value">' + cert.patientName + '</span></div>';
            if (cert.startDate) {
                certificateHTML += '<div class="info-section"><span class="info-label">Period:</span><span class="info-value">From ' + new Date(cert.startDate).toLocaleDateString();
                if (cert.endDate) certificateHTML += ' to ' + new Date(cert.endDate).toLocaleDateString();
                if (cert.restPeriod) certificateHTML += ' (' + cert.restPeriod + ' days)';
                certificateHTML += '</span></div>';
            }
            certificateHTML += '<div class="diagnosis-box"><div class="info-label" style="margin-bottom: 10px;">Medical Diagnosis / Condition:</div><div>' + cert.diagnosis + '</div></div>';
            if (cert.recommendations) {
                certificateHTML += '<div class="info-section"><div class="info-label" style="margin-bottom: 5px;">Medical Recommendations:</div><div style="color: #1f2937;">' + cert.recommendations + '</div></div>';
            }
            if (cert.notes) {
                certificateHTML += '<div class="info-section"><div class="info-label" style="margin-bottom: 5px;">Additional Notes:</div><div style="color: #4b5563;">' + cert.notes + '</div></div>';
            }
            certificateHTML += '<div class="signature-section">';
            certificateHTML += '<div class="signature-box"><div class="signature-line"><strong>Patient Signature</strong></div></div>';
            certificateHTML += '<div class="signature-box"><div class="signature-line"><strong>Dr. ' + cert.doctorName + '</strong><br><span style="font-size: 12px;">Medical Doctor</span></div></div>';
            certificateHTML += '</div></div>';
            certificateHTML += '<div class="footer">This is an official medical certificate issued by ' + (cabinetSettings.name || 'Medical Center') + '<br>';
            certificateHTML += 'Certificate ID: ' + cert.id + ' | Issued: ' + new Date(cert.createdAt).toLocaleString() + '</div>';
            certificateHTML += '<scr' + 'ipt>window.onload = function() { window.print(); };</scr' + 'ipt>';
            certificateHTML += '</body></html>';
            
            printWindow.document.write(certificateHTML);
            printWindow.document.close();
        };

        // Logout function
        window.logout = function () {
            if (showTranslatedConfirm('logout_confirm')) {
                // Clear session data
                localStorage.removeItem('medconnect_session');

                // Clear all healthcare data (optional - you might want to keep this)
                // localStorage.removeItem('healthcareAppointments');
                // localStorage.removeItem('healthcarePatients');
                // localStorage.removeItem('healthcareBills');

                // Redirect to login page
                window.location.href = 'loginForm.html';
            }
        };