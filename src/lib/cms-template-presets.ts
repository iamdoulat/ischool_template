export interface CmsTemplatePreset {
    website_template: "ischool" | "imadrasha";
    current_theme: string;
    footer_text: string;
    header_footer_sections: Record<string, unknown>;
    about_us: Record<string, unknown>;
    main_courses: Record<string, unknown>[];
    experienced_staffs: Record<string, unknown>[];
    latest_notices: Record<string, unknown>[];
}

export const TEMPLATE_PRESETS: Record<string, CmsTemplatePreset> = {
    ischool: {
        website_template: "ischool",
        current_theme: "material_pink",
        footer_text: "© iSchool 2026. All rights reserved",
        header_footer_sections: {
            header_text: "Enrolment Open: 2026-27",
            header_link: "/online_admission",
            hero_background: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=2070&auto=format&fit=crop",
            hero_title_part1: "Empowering",
            hero_title_highlight: "Minds",
            hero_title_part2: "Shaping",
            hero_title_gradient: "Futures",
            hero_subtitle: "Provide your children with the best education possible. We focus on holistic development, academic excellence, and character building.",
            hero_btn1_text: "Apply for Admission",
            hero_btn1_link: "/online_admission",
            hero_btn2_text: "Take a Tour",
            hero_btn2_link: "#about-us",
            courses_section_badge: "Academic Programs",
            courses_section_title: "Our Main Courses",
            courses_section_subtitle: "Comprehensive modern curriculum designed for academic excellence.",
            staff_section_badge: "Dedicated Educators",
            staff_section_title: "Our Experienced Staffs",
            staff_section_subtitle: "Dedicated educators guiding students to achieve their highest potential.",
            ischool_logo_width: 220,
            ischool_logo_height: 48,
            ischool_logo_auto_ratio: true,
            ischool_header_bg: "#044E43",
            ischool_header_bg_enabled: true,
            header_bg_enabled: true,
            ischool_custom_color_presets: [],
            header_enabled: true,
            hero_enabled: true,
            about_enabled: true,
            courses_enabled: true,
            staff_enabled: true,
            notices_enabled: true,
            stats_enabled: true,
            stats_students: 2500,
            stats_teachers: 150,
            stats_awards: 50,
            stats_courses: 30,
            footer_enabled: true,
            ischool_footer_bg: "#0F172A",
            ischool_footer_bg_enabled: true,
            ischool_custom_footer_color_presets: [],
            footer_show_logo: true,
            footer_show_school_name: true,
            footer_show_institute_name: true,
            footer_show_established_year: true,
            footer_arabic_title: "",
            footer_madrasa_name: "",
            footer_about_text: "Providing quality education for over two decades. Committed to fostering academic excellence, critical thinking, and character development.",
            footer_established_year: "Established: 2005",
            footer_info_label: "Academic Programs",
            footer_department_links: [
                { title: "English Literature", url: "/online_admission" },
                { title: "Computer Science & Robotics", url: "/online_admission" },
                { title: "Advanced Mathematics", url: "/online_admission" },
                { title: "Integrated Sciences", url: "/online_admission" }
            ],
            footer_menu_label: "Quick Links",
            footer_quick_links: [
                { title: "Online Admission", url: "/online_admission" },
                { title: "School Notice Board", url: "#notices" },
                { title: "About School", url: "#about-us" },
                { title: "Our Faculty", url: "#faculty" },
                { title: "Portal Login", url: "/login" }
            ],
            footer_contact_info_label: "Contact & Location",
            footer_address: "123 Academic Avenue, Knowledge Park, City Center",
            footer_phone: "+1 234 567 8900",
            footer_email: "info@ischool-portal.edu",
            copyright_text: "© iSchool 2026. All rights reserved",
            footer_powered_by_text: "Powered by: iSchool Management System",
            section_order: ["hero", "notices", "about", "courses", "staff", "stats", "footer"],
            footer_links: [
                { title: "Privacy Policy", url: "/privacy" },
                { title: "Terms of Service", url: "/terms" }
            ]
        },
        about_us: {
            section_title: "About Us",
            section_subtitle: "Providing quality education with moral integrity and innovative teaching.",
            title: "Welcome to iSchool",
            description: "Providing quality education for over two decades. Our institution is committed to fostering academic excellence, critical thinking, and character development in every learner.",
            image_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop",
            experience_years: "25+",
            experience_label: "Years Of Educational Excellence",
            bullet_point_1: "Innovative STEM Curriculum",
            bullet_point_2: "Personalized Mentorship",
            bullet_point_3: "Global Ethical Values",
            bullet_point_4: "Comprehensive Sports & Arts",
            mission_title: "Our Mission",
            mission_description: "To empower students with critical thinking, ethical leadership, and academic excellence in an inclusive learning environment.",
            vision_title: "Our Vision",
            vision_description: "To be a world-class institution nurturing innovative minds that positively impact global society.",
            values_title: "Core Values",
            values_description: "Integrity, Curiosity, Inclusivity, Excellence, and Compassion guide everything we do.",
            accordions: [
                { id: 1, title: "Modern Laboratories & STEM", content: "Fully equipped science and computer laboratories designed for interactive experiential learning." },
                { id: 2, title: "Holistic Student Care", content: "Dedicated counselling, co-curricular clubs, and sports training for all-round personality development." },
                { id: 3, title: "Digital Smart Classrooms", content: "Interactive multimedia displays and LMS connectivity for modern blended learning." },
            ]
        },
        main_courses: [
            { id: 1, title: "English Literature", description: "Advanced study of classic and contemporary literature, critical analysis and composition.", price: "Free", category: "Humanities", link: "/online_admission", btn_text: "Apply Now" },
            { id: 2, title: "Computer Science & Robotics", description: "Modern coding, computational thinking, artificial intelligence and robotics laboratory.", price: "Free", category: "Technology", link: "/online_admission", btn_text: "Apply Now" },
            { id: 3, title: "Advanced Mathematics", description: "Algebra, calculus, geometry, and competitive olympiad preparation.", price: "Free", category: "Science", link: "/online_admission", btn_text: "Apply Now" },
            { id: 4, title: "Integrated Sciences", description: "Physics, chemistry, biology and environmental science practical inquiry.", price: "Free", category: "Science", link: "/online_admission", btn_text: "Apply Now" }
        ],
        experienced_staffs: [
            { id: 1, name: "Jason Sharlton", role: "Principal", image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop" },
            { id: 2, name: "Elena Gilbert", role: "Vice Principal", image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop" },
            { id: 3, name: "Dr. Robert Vance", role: "Head of Science", image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop" }
        ],
        latest_notices: [
            { id: 1, title: "Annual Sports Day Competition 2026", date: "2026-03-15" },
            { id: 2, title: "Admissions Open for Academic Session 2026-27", date: "2026-04-01" },
            { id: 3, title: "Mid-Term Examination Schedule Published", date: "2026-05-10" }
        ]
    },

    imadrasha: {
        website_template: "imadrasha",
        current_theme: "darkgray",
        footer_text: "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur",
        header_footer_sections: {
            madrasha_header_bg: "#014739",
            madrasha_header_bg_enabled: true,
            header_bg_enabled: true,
            arabic_title: "مدرسة البنات دار الحديث انواره بيغم محمدفور",
            madrasa_name_bn: "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর",
            madrasa_name_en: "ANWARA BEGUM GIRLS TITEL MADRASHA MUHAMMADPUR",
            madrasa_phone: "+8801719606713",
            madrasa_email: "anwarabegumgirlsmadrasa@gmail.com",
            madrasa_address: "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার",
            imadrasha_header_logo: "/anwara-web-banner.png",
            madrasha_logo_width: 580,
            madrasha_logo_height: 105,
            madrasha_logo_auto_ratio: true,
            header_text: "নতুন শিক্ষাবর্ষে ভর্তি চলছে: ২০২৬-২৭",
            header_link: "/online_admission",
            hero_background: "/madrasha/dawra-daras.jpg",
            hero_slider_images: [
                { url: "/madrasha/Dawra-Class.jpg", title: "দাওরায়ে হাদিস ক্লাস" },
                { url: "/madrasha/dawra-daras.jpg", title: "দরসে হাদিস ও কিতাব অধ্যায়ন" },
                { url: "/madrasha/Building-under-construction.jpg", title: "মাদ্রাসার নির্মাণাধীন বহুতল ভবন" },
                { url: "/madrasha/Madrasah-gate-update.jpg", title: "মাদরাসার প্রধান ফটক" },
                { url: "/madrasha/hdiya-prodan.jpg", title: "কৃতী ছাত্রীদের পুরস্কার ও হাদিয়া প্রদান" }
            ],
            hero_title_part1: "ইলমে দ্বীন",
            hero_title_highlight: "অর্জন",
            hero_title_part2: "ও আদর্শ",
            hero_title_gradient: "নারী সমাজ গঠন",
            hero_subtitle: "মা খাদিজাতুল কুবরা (রা.) ও মা আয়েশা (রা.)-এর আদর্শে উজ্জীবিত হয়ে নারীসমাজকে দ্বীনি শিক্ষার সুশীতল ছায়াতলে আনার লক্ষ্যে প্রতিষ্ঠিত এক অনন্য দ্বীনি শিক্ষাপ্রতিষ্ঠান।",
            hero_btn1_text: "ভর্তির আবেদন করুন",
            hero_btn1_link: "/online_admission",
            hero_btn2_text: "মাদরাসা পরিচিতি",
            hero_btn2_link: "#about-madrasa",
            courses_section_badge: "দ্বীনি ও আধুনিক শিক্ষা",
            courses_section_title: "জামিয়ার শিক্ষাবিভাগ",
            courses_section_subtitle: "দ্বীনি শিক্ষার পাশাপাশি আধুনিক তথ্যপ্রযুক্তি ও নারীদের কারিগরি আত্মকর্মসংস্থানের সুসমন্বয়।",
            staff_section_badge: "বিজ্ঞ উলামায়ে কেরাম ও শিক্ষকমণ্ডলী",
            staff_section_title: "শিক্ষক ও পরিচালকমণ্ডলী",
            staff_section_subtitle: "দেশবরেণ্য খ্যাতনামা উলামায়ে কেরাম ও অভিজ্ঞ শিক্ষিকাবৃন্দের তত্ত্বাবধানে পরিচালিত।",
            features_enabled: true,
            features_section_badge: "সুশৃঙ্খল পরিবেশ",
            features_section_title: "মাদরাসার বৈশিষ্ট্যসমূহ",
            features_section_subtitle: "দ্বীনি শিক্ষার পূর্ণাঙ্গ বিকাশ ও চরিত্র গঠনে আমাদের বিশেষ বৈশিষ্ট্য ও সুযোগ-সুবিধা।",
            projects_enabled: true,
            projects_section_badge: "অগ্রযাত্রা ও ভবিষ্যৎ",
            projects_section_title: "নির্মাণাধীন প্রজেক্ট ও পরিকল্পনা",
            projects_section_subtitle: "মাদ্রাসার অবকাঠামোগত উন্নয়ন, বহুতল ভবন নির্মাণ ও ভবিষ্যৎ সম্প্রসারণের ধারাবাহিক পরিকল্পনা।",
            projects: [
                {
                    id: 1,
                    title: "মাদ্রাসার বহুতল ভবন নির্মাণ",
                    status: "চলমান",
                    badge_bg: "bg-amber-500",
                    image: "/madrasha/Building-under-construction.jpg",
                    description: "ছাত্রীদের ক্রমবর্ধমান সংখ্যা ও নিরাপদ আবাসিক ধারণক্ষমতা বৃদ্ধির লক্ষ্যে নতুন বহুতল শিক্ষা ভবনের নির্মাণ কাজ দ্রুত এগিয়ে চলছে।"
                },
                {
                    id: 2,
                    title: "উচ্চতর ইসলামিক গবেষণা কেন্দ্র",
                    status: "পরিকল্পনা",
                    badge_bg: "bg-[#014739]",
                    image: "/madrasha/dawra-daras.jpg",
                    description: "নারী শিক্ষার্থীদের জন্য ইফতা, তাফসির ও হাদিস গবেষণায় উচ্চতর শিক্ষা বিস্তারের বিশেষ পরিকল্পনা গৃহীত হয়েছে।"
                },
                {
                    id: 3,
                    title: "আলহুদা ম্যাগাজিন ও প্রকাশনা",
                    status: "প্রকাশনা",
                    badge_bg: "bg-emerald-600",
                    image: "/madrasha/hdiya-prodan.jpg",
                    description: "শিক্ষার্থীদের প্রবন্ধ, ক্যালিগ্রাফি ও সাহিত্যচর্চাকে উৎসাহিত করতে নিয়মিত ত্রৈমাসিক দেয়াল পত্রিকা ও স্মরণিকা প্রকাশনা।"
                }
            ],
            header_enabled: true,
            hero_enabled: true,
            about_enabled: true,
            courses_enabled: true,
            staff_enabled: true,
            notices_enabled: true,
            stats_enabled: true,
            stats_students: 850,
            stats_teachers: 42,
            stats_awards: 18,
            stats_courses: 6,
            footer_enabled: true,
            madrasha_footer_bg: "#01352A",
            madrasha_footer_bg_enabled: true,
            madrasha_custom_footer_color_presets: [],
            footer_show_logo: true,
            footer_show_school_name: true,
            footer_show_institute_name: true,
            footer_show_established_year: true,
            footer_arabic_title: "مدرسة البنات دار الحديث انواره بيغم محمدفور",
            footer_madrasa_name: "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর",
            footer_about_text: "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় নারীসমাজ গঠনের লক্ষ্যে প্রতিষ্ঠিত এক ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান।",
            footer_established_year: "স্থাপিত: ২০০৩ খ্রিষ্টাব্দ",
            footer_info_label: "জামিয়ার শিক্ষাবিভাগ",
            footer_department_links: [
                { title: "নুরানি ও নাজেরা বিভাগ", url: "#departments" },
                { title: "হিফজুল কুরআন বিভাগ", url: "#departments" },
                { title: "কিতাব ও দাওরায়ে হাদিস বিভাগ", url: "#departments" },
                { title: "আইটি ও কম্পিউটার প্রশিক্ষণ", url: "#departments" },
                { title: "কারিগরি ও সেলাই প্রশিক্ষণ", url: "#departments" }
            ],
            footer_menu_label: "জরুরি লিংকসমূহ",
            footer_quick_links: [
                { title: "অনলাইন ভর্তি আবেদন", url: "/online_admission" },
                { title: "মাদরাসা নোটিশ বোর্ড", url: "#notices" },
                { title: "মাদ্রাসা পরিচিতি ও ইতিহাস", url: "#about-madrasa" },
                { title: "মুহতামিম সাহেবের বাণী", url: "#muhtamim" },
                { title: "শিক্ষক ও পরিচালকমণ্ডলী", url: "#faculty" },
                { title: "এডমিন / শিক্ষক লগইন", url: "/login" }
            ],
            footer_contact_info_label: "যোগাযোগের ঠিকানা",
            footer_address: "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার",
            footer_phone: "+8801719606713",
            footer_email: "anwarabegumgirlsmadrasa@gmail.com",
            copyright_text: "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur",
            footer_powered_by_text: "চালিত হচ্ছে: iSchool Management System",
            section_order: ["hero", "notices", "about", "campus_card", "muhtamim", "courses", "staff", "features", "projects", "stats", "footer"],
            footer_links: [
                { title: "মাদরাসার বৈশিষ্ট্য", url: "#characteristics" },
                { title: "আমাদের শিক্ষা কার্যক্রম", url: "#activities" }
            ]
        },
        about_us: {
            section_title: "আমাদের মাদ্রাসা সম্পর্কে কিছু কথা",
            section_subtitle: "আল্লাহ প্রদত্ত ইলম অর্জনের মাধ্যমে আল্লাহ তায়ালার সন্তুষ্টি অর্জন।",
            title: "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা",
            description: "আল্লাহ তায়ালার প্রিয় হাবিব সর্বশ্রেষ্ঠ মহামানব মানবতার মুক্তির দিশারী হযরত মুহাম্মদ (সা.)-এর উপর প্রথম ওহি অবতীর্ণ হয় 'ইকরা'—পড়। হুজুর (সা.) এরশাদ করেছেন নর-নারী সকলের উপর ইলমে দ্বীন শিক্ষা করা ফরজ। কিন্তু দুঃখজনক হলেও সত্য যে বর্তমানে আমাদের দেশে সিংহভাগ মানুষই সেই শিক্ষা থেকে বঞ্চিত। বিশেষ করে মা-বোনদের মধ্যে দ্বীনি শিক্ষার প্রচলন খুবই সীমিত।\n\nবর্তমান অপসংস্কৃতির যুগে অবহেলিত নারীসমাজকে মুক্তির লক্ষ্যে মা খাদিজাতুল কুবরা (রা.) ও মা আয়েশা (রা.)-এর মতো আদর্শ মা হিসেবে গড়ে তোলার লক্ষ্যে দেশের খ্যাতনামা উলামায়ে কেরাম, সচেতন দ্বীনদরদী ও বুদ্ধিজীবী ব্যক্তিবর্গের পরামর্শে মৌলভীবাজার জেলার সদর উপজেলাধীন ১২ নং গিয়াসনগর ইউনিয়নের অন্তর্গত মোহাম্মদপুর গ্রামে ১৭ই মার্চ ২০০৩ সালে প্রতিষ্ঠা করা হয় আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর।\n\nআল্লাহ তায়ালা যেন এই প্রতিষ্ঠানকে মিল্লাতে ইসলামিয়ার অবহেলিত নারীসমাজকে ইলমে দ্বীনের আওতায় নিয়ে আসার জন্য কবুল করেন এবং আমাদের সকলের জন্য নাজাতের উসিলা বানিয়ে দেন। আমিন।",
            image_url: "https://anwarabegumgirlsmadrasa.com/wp-content/uploads/2019/05/dawra-daras.jpg",
            experience_years: "২০+",
            experience_label: "বছরের দ্বীনি খিদমত ও শিক্ষার আলো",
            card_badge: "ঐতিহ্যের দ্বীনি শিক্ষাঙ্গন • স্থাপিত ২০০৩",
            card_title: "আদর্শ ইসলামী নারী গড়ার অনন্য জামিয়া",
            card_description: "সম্পূর্ণ শরিয়তসম্মত শালীন পর্দা, অভিজ্ঞ শিক্ষিকাবৃন্দের যত্ন এবং আধুনিক তথ্যপ্রযুক্তির সমন্বয়ে গড়ে উঠেছে আমাদের এই শিক্ষাঙ্গন।",
            card_contact_text: "ভর্তি সংক্রান্ত যেকোনো তথ্যে যোগাযোগ করুন",
            card_btn_text: "ভর্তি নির্দেশিকা",
            card_btn_url: "/online_admission",
            bullet_point_1: "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় পাঠদান",
            bullet_point_2: "দাওরায়ে হাদিস (মাস্টার্স সমমান) স্তর পর্যন্ত পূর্ণাঙ্গ শিক্ষাব্যবস্থা",
            bullet_point_3: "হিফজুল কুরআন ও আন্তর্জাতিক মানের বিশুদ্ধ তাজবিদ চর্চা",
            bullet_point_4: "কম্পিউটার শিক্ষা ও নারীদের প্রয়োজনীয় হস্তশিল্প প্রশিক্ষণ",
            muhtamim_badge: "মুহতামিম সাহেবের বাণী",
            muhtamim_heading: "দ্বীনি শিক্ষার গুরুত্ব ও খোদাভীরু নারীসমাজ গঠনের আহ্বান",
            muhtamim_subtitle: "দিকনির্দেশনামূলক নসিহত ও বার্তা",
            muhtamim_name: "শায়খ মাওলানা মুজিবুর রহমান মুজাহিদ",
            muhtamim_designation: "মুহতামিম ও শায়খুল হাদিস",
            muhtamim_institute: "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মাদপুর",
            muhtamim_image: "https://anwarabegumgirlsmadrasa.com/wp-content/uploads/2019/05/muhtamim-anwara.jpg",
            muhtamim_message_title: "মুহতামিম সাহেবের বাণী",
            muhtamim_message: "আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ। দ্বীনি শিক্ষা প্রতিটি মুসলমানের জন্য আত্মিক পথনির্দেশ। বিশেষ করে আমাদের সমাজে কন্যাশিশু ও মা-বোনদের খাঁটি ইসলামি অনুশাসনে শিক্ষিত করে গড়ে তোলা আজ সময়ের সবচেয়ে বড় দাবি। আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা আল্লাহর রহমতে সেই মহান লক্ষ্য নিয়ে এগিয়ে যাচ্ছে। আপনারা সকলেই এই প্রতিষ্ঠানের জন্য দোয়া করবেন এবং সার্বিক সহযোগিতা করবেন। জাযাকুমুল্লাহু খাইরান।",
            muhtamim_btn1_text: "ভর্তির বিস্তারিত নির্দেশিকা ও আবেদন",
            muhtamim_btn1_url: "/online_admission",
            muhtamim_btn2_text: "যোগাযোগ করুন",
            muhtamim_btn2_url: "#contact",
            accordions_badge: "সুশৃঙ্খল পরিবেশ",
            accordions_title: "মাদরাসার বৈশিষ্ট্যসমূহ",
            accordions_subtitle: "দ্বীনি শিক্ষার পূর্ণাঙ্গ বিকাশ ও চরিত্র গঠনে আমাদের বিশেষ বৈশিষ্ট্য ও সুযোগ-সুবিধা।",
            projects_section_badge: "অগ্রযাত্রা ও ভবিষ্যৎ",
            projects_section_title: "নির্মাণাধীন প্রজেক্ট ও পরিকল্পনা",
            projects_section_subtitle: "মাদ্রাসার অবকাঠামোগত উন্নয়ন, বহুতল ভবন নির্মাণ ও ভবিষ্যৎ সম্প্রসারণের ধারাবাহিক পরিকল্পনা।",
            projects: [
                {
                    id: 1,
                    title: "মাদ্রাসার বহুতল ভবন নির্মাণ",
                    status: "চলমান",
                    badge_bg: "bg-amber-500",
                    image: "/madrasha/Building-under-construction.jpg",
                    description: "ছাত্রীদের ক্রমবর্ধমান সংখ্যা ও নিরাপদ আবাসিক ধারণক্ষমতা বৃদ্ধির লক্ষ্যে নতুন বহুতল শিক্ষা ভবনের নির্মাণ কাজ দ্রুত এগিয়ে চলছে।"
                },
                {
                    id: 2,
                    title: "উচ্চতর ইসলামিক গবেষণা কেন্দ্র",
                    status: "পরিকল্পনা",
                    badge_bg: "bg-[#014739]",
                    image: "/madrasha/dawra-daras.jpg",
                    description: "নারী শিক্ষার্থীদের জন্য ইফতা, তাফসির ও হাদিস গবেষণায় উচ্চতর শিক্ষা বিস্তারের বিশেষ পরিকল্পনা গৃহীত হয়েছে।"
                },
                {
                    id: 3,
                    title: "আলহুদা ম্যাগাজিন ও প্রকাশনা",
                    status: "প্রকাশনা",
                    badge_bg: "bg-emerald-600",
                    image: "/madrasha/hdiya-prodan.jpg",
                    description: "শিক্ষার্থীদের প্রবন্ধ, ক্যালিগ্রাফি ও সাহিত্যচর্চাকে উৎসাহিত করতে নিয়মিত ত্রৈমাসিক দেয়াল পত্রিকা ও স্মরণিকা প্রকাশনা।"
                }
            ],
            accordions: [
                { id: 1, title: "সার্বক্ষণিক পর্দার সুব্যবস্থা", content: "নারী শিক্ষার্থীদের পরিপূর্ণ ইসলামি অনুশাসন ও শরিয়তসম্মত শালীন পর্দা নিশ্চিতকরণ।" },
                { id: 2, title: "চরিত্রগঠনমূলক নিবিড় তারবিয়াত", content: "আদর্শ ও খোদাভীরু মা হিসেবে গড়ে তুলতে প্রতিনিয়ত বিশেষ তারবিয়াতি ও নসিহতমূলক পরিবেশ।" },
                { id: 3, title: "সম্পূর্ণ অরাজনৈতিক পরিবেশ", content: "দলীয় রাজনৈতিক প্রভাবমুক্ত, নিবেদিতপ্রাণ খাঁটি দ্বীনি শিক্ষার অনুকূল শান্তিময় ক্যাম্পাস।" },
                { id: 4, title: "অভিজ্ঞ উস্তাদ ও উস্তাযাহ", content: "বিজ্ঞ উলামায়ে কেরাম ও অভিজ্ঞ শিক্ষিকাবৃন্দের নিবিড় তত্ত্বাবধানে যত্নসহকারে পাঠদান।" },
                { id: 5, title: "স্বাস্থ্যসম্মত নিরাপদ আবাসন", content: "দূর-দূরান্ত থেকে আগত ছাত্রীদের জন্য সুষম খাবার, নিরাপদ হোস্টেল ও মাতৃতুল্য অভিভাবকত্ব নিশ্চিত করা হয়।" },
                { id: 6, title: "কেন্দ্রীয় বোর্ডে সাফল্য", content: "বেফাক ও হাইয়াতুল উলয়ার অধীনে অনুষ্ঠিত কেন্দ্রীয় সমাপনী পরীক্ষায় প্রতি বছর মেধা তালিকায় গৌরবময় স্থান অধিকার করে আসছে।" }
            ]
        },
        main_courses: [
            { id: 1, title: "নুরানি বিভাগ", description: "শিশুদের সহিহ কুরআন তিলাওয়াত, কালিমা, নামাজ, প্রয়োজনীয় দোয়া ও প্রাথমিক মাসআলা শিক্ষা।", image: "/madrasha/1111-300x300.png", price: "ভর্তি চলমান", status: "ভর্তি চলমান", category: "নুরানি", link: "/online_admission", btn_text: "আবেদন করুন" },
            { id: 2, title: "কিতাব বিভাগ", description: "মিযান, নাহবেমীর থেকে শুরু করে শরহে বেকায়া, জালালাইন ও দাওরায়ে হাদিস পর্যন্ত সর্বোচ্চ স্তর।", image: "/madrasha/events-5-300x300.jpg", price: "ভর্তি চলমান", status: "ভর্তি চলমান", category: "কিতাব", link: "/online_admission", btn_text: "আবেদন করুন" },
            { id: 3, title: "মাহে রমজানের আয়োজন", description: "পবিত্র মাহে রমজান উপলক্ষে কুরআনুল কারীমের বিশুদ্ধ মাখরাজ, তাজবিদ ও মাসআলা শিক্ষা বিশেষ কোর্স।", image: "/madrasha/al-quran1-300x300.jpg", price: "ভর্তি চলমান", status: "ভর্তি চলমান", category: "বিশেষ কোর্স", link: "/online_admission", btn_text: "আবেদন করুন" },
            { id: 4, title: "আইটি বিভাগ", description: "ছাত্রীদের স্বাবলম্বী করে গড়ে তুলতে আধুনিক কম্পিউটার লিটারেসি ও ডিজিটাল জ্ঞান প্রশিক্ষণ।", image: "/madrasha/it_Computer-300x300.jpg", price: "ভর্তি চলমান", status: "ভর্তি চলমান", category: "তথ্যপ্রযুক্তি", link: "/online_admission", btn_text: "আবেদন করুন" },
            { id: 5, title: "কারিগরি বিভাগ", description: "সেলাই, কাটিং, এমব্রয়ডারি ও নারীদের দৈনন্দিন হস্তশিল্প বিষয়ে হাতেকলমে বাস্তবসম্মত প্রশিক্ষণ।", image: "/madrasha/sewing-machine-1369658_1920-300x300.jpg", price: "ভর্তি চলমান", status: "ভর্তি চলমান", category: "কারিগরি", link: "/online_admission", btn_text: "আবেদন করুন" },
            { id: 6, title: "স্পোকেন কোর্স", description: "বিশুদ্ধ আরবি ও ইংরেজি ভাষায় কথন এবং লিখন দক্ষতার বিশেষ ব্যবহারিক প্রশিক্ষণ।", image: "/madrasha/Example_of_Arabic_text_Wellcome_L0040185-300x300.jpg", price: "ভর্তি চলমান", status: "ভর্তি চলমান", category: "ভাষা শিক্ষা", link: "/online_admission", btn_text: "আবেদন করুন" }
        ],
        experienced_staffs: [
            { id: 1, name: "শায়খ মাওলানা মুজিবুর রহমান মুজাহিদ", role: "মুহতামিম", image_url: "https://anwarabegumgirlsmadrasa.com/wp-content/uploads/2019/05/muhtamim-anwara.jpg" },
            { id: 2, name: "মাওলানা মোহাম্মদ আব্দুল্লাহ", role: "নায়েবে মুহতামিম ও শায়খুল আদব", image_url: "" },
            { id: 3, name: "হাফেজ ক্বারী ফখরুল ইসলাম", role: "প্রধান ক্বারী ও তাজবিদ শিক্ষক", image_url: "" }
        ],
        latest_notices: [
            { id: 1, title: "লন্ডন সফরে মাদরাসার মুহতামিম, দোয়া কামনা", date: "2026-07-12" },
            { id: 2, title: "মাদরাসার বার্ষিক জলসা ২০ জুন বুধবার", date: "2026-05-30" },
            { id: 3, title: "নতুন বছরের ভর্তি পরীক্ষা শাওয়াল মাসে অনুষ্ঠিত হবে", date: "2026-05-24" },
            { id: 4, title: "মাহে রমজান বিশেষ তাজবিদ ও দোয়া কোর্স চলবে", date: "2026-05-24" },
            { id: 5, title: "বার্ষিক পরীক্ষা ১০ শাবান থেকে শুরু", date: "2026-05-24" }
        ]
    }
};
