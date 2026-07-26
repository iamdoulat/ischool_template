<?php

namespace Database\Seeders;

use App\Models\FrontCmsPage;
use App\Models\FrontCmsMenu;
use Illuminate\Database\Seeder;

class FrontCmsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Pages ────────────────────────────────────────────────────
        $pages = [
            ['title' => 'Home',             'url' => 'home',             'page_type' => 'Standard', 'is_system' => true],
            ['title' => 'About Us',         'url' => 'about-us',         'page_type' => 'Standard', 'is_system' => true],
            ['title' => 'Contact Us',       'url' => 'contact-us',       'page_type' => 'Standard', 'is_system' => true],
            ['title' => 'Online Admission', 'url' => 'online_admission', 'page_type' => 'Standard', 'is_system' => true],
            ['title' => 'Exam Results',     'url' => 'exam-results',     'page_type' => 'Standard', 'is_system' => true],
            ['title' => 'Notices',          'url' => 'notices',           'page_type' => 'Standard', 'is_system' => true],
        ];

        foreach ($pages as $page) {
            FrontCmsPage::create($page);
        }

        // ── Main Menus ───────────────────────────────────────────────
        $mainMenus = [
            ['title' => 'Home',         'page' => 'home',             'type' => 'main', 'order' => 0],
            ['title' => 'Academics',    'page' => 'academics',        'type' => 'main', 'order' => 1],
            ['title' => 'Admissions',   'page' => 'admission',        'type' => 'main', 'order' => 2],
            ['title' => 'Exam Results', 'page' => 'exam-results',     'type' => 'main', 'order' => 3],
            ['title' => 'Notices',      'page' => 'notices',           'type' => 'main', 'order' => 4],
            ['title' => 'About Us',     'page' => 'about-us',         'type' => 'main', 'order' => 5],
            ['title' => 'Contact',      'page' => 'contact-us',       'type' => 'main', 'order' => 6],
        ];

        foreach ($mainMenus as $menu) {
            FrontCmsMenu::create($menu);
        }

        // ── Bottom / Footer Menus ────────────────────────────────────
        $bottomMenus = [
            // Column 1 (Logo & Bio)
            ['title' => 'About',       'page' => 'about-us',     'type' => 'bottom', 'column' => 1, 'order' => 0],
            ['title' => 'Contact',      'page' => 'contact-us',   'type' => 'bottom', 'column' => 1, 'order' => 1],
            // Column 2 (Quick Links)
            ['title' => 'Home',         'page' => 'home',         'type' => 'bottom', 'column' => 2, 'order' => 0],
            ['title' => 'Academics',    'page' => 'academics',    'type' => 'bottom', 'column' => 2, 'order' => 1],
            ['title' => 'Admissions',   'page' => 'admission',    'type' => 'bottom', 'column' => 2, 'order' => 2],
            // Column 3 (Information)
            ['title' => 'Exam Results', 'page' => 'exam-results', 'type' => 'bottom', 'column' => 3, 'order' => 0],
            ['title' => 'Notices',      'page' => 'notices',       'type' => 'bottom', 'column' => 3, 'order' => 1],
        ];

        foreach ($bottomMenus as $menu) {
            FrontCmsMenu::create($menu);
        }
    }
}
