/**
 * Student Portal menu permission definitions.
 *
 * Single source of truth shared by:
 *  - The Roles & Permissions admin page (Module Permissions tree)
 *  - The student portal sidebar (`user-sidebar.tsx`) — filters menus by role
 *
 * The `permission` strings here MUST stay in sync with the backend
 * `PortalPermissionSeeder` (database/seeders/PortalPermissionSeeder.php),
 * which creates one `permissions` row per entry under the
 * "Student Portal" module.
 */

export type PortalSubmenuPermission = {
  name: string;
  label: string;
  permission: string;
};

export type PortalMenuPermission = {
  name: string;
  label: string;
  permission: string;
  submenus?: PortalSubmenuPermission[];
};

const perm = (name: string) => `portal.${name}.view`;
const subPerm = (parent: string, name: string) => `portal.${parent}.${name}.view`;

/**
 * Mirrors the `menuItems` modules group in `src/components/layout/user-sidebar.tsx`.
 * `dashboard` is intentionally omitted — the portal dashboard is always visible.
 */
export const portalMenuPermissions: PortalMenuPermission[] = [
  { name: "profile", label: "My Profile", permission: perm("profile") },
  { name: "fees", label: "Fees", permission: perm("fees") },
  { name: "online_course", label: "Online Course", permission: perm("online_course") },
  { name: "zoom_live_classes", label: "Zoom Live Classes", permission: perm("zoom_live_classes") },
  { name: "gmeet_live_classes", label: "Gmeet Live Classes", permission: perm("gmeet_live_classes") },
  { name: "class_timetable", label: "Class Timetable", permission: perm("class_timetable") },
  { name: "lesson_plan", label: "Lesson Plan", permission: perm("lesson_plan") },
  { name: "syllabus_status", label: "Syllabus Status", permission: perm("syllabus_status") },
  { name: "homework", label: "Homework", permission: perm("homework") },
  { name: "online_exam", label: "Online Exam", permission: perm("online_exam") },
  { name: "apply_leave", label: "Apply Leave", permission: perm("apply_leave") },
  { name: "visitor_book", label: "Visitor Book", permission: perm("visitor_book") },
  {
    name: "download_center",
    label: "Download Center",
    permission: perm("download_center"),
    submenus: [
      { name: "contents", label: "Contents", permission: subPerm("download_center", "contents") },
      { name: "video_tutorial", label: "Video Tutorial", permission: subPerm("download_center", "video_tutorial") },
    ],
  },
  { name: "attendance", label: "Attendance", permission: perm("attendance") },
  { name: "behaviour", label: "Behaviour Records", permission: perm("behaviour") },
  {
    name: "cbse_examination",
    label: "CBSE Examination",
    permission: perm("cbse_examination"),
    submenus: [
      { name: "exam_schedule", label: "Exam Schedule", permission: subPerm("cbse_examination", "exam_schedule") },
      { name: "exam_result", label: "Exam Result", permission: subPerm("cbse_examination", "exam_result") },
    ],
  },
  {
    name: "examinations",
    label: "Examinations",
    permission: perm("examinations"),
    submenus: [
      { name: "exam_schedule", label: "Exam Schedule", permission: subPerm("examinations", "exam_schedule") },
      { name: "exam_result", label: "Exam Result", permission: subPerm("examinations", "exam_result") },
    ],
  },
  { name: "notice_board", label: "Notice Board", permission: perm("notice_board") },
  { name: "teachers_reviews", label: "Teachers Reviews", permission: perm("teachers_reviews") },
  {
    name: "library",
    label: "Library",
    permission: perm("library"),
    submenus: [
      { name: "books", label: "Books", permission: subPerm("library", "books") },
      { name: "book_issued", label: "Book Issued", permission: subPerm("library", "book_issued") },
    ],
  },
  { name: "transport_routes", label: "Transport Routes", permission: perm("transport_routes") },
  { name: "hostel_rooms", label: "Hostel Rooms", permission: perm("hostel_rooms") },
  { name: "certificates", label: "Certificates", permission: perm("certificates") },
  { name: "id_card", label: "ID Card", permission: perm("id_card") },
  { name: "my_qr_pass", label: "My QR Pass", permission: perm("my_qr_pass") },
  { name: "branches", label: "Our Branches", permission: perm("branches") },
  { name: "events", label: "Events", permission: perm("events") },
  { name: "news", label: "News", permission: perm("news") },
  { name: "gallery", label: "Gallery", permission: perm("gallery") },
  { name: "annual_calendar", label: "Annual Calendar", permission: perm("annual_calendar") },
];

/** Flat list of every portal permission name (parents + submenus). */
export const allPortalPermissionNames: string[] = portalMenuPermissions.flatMap((m) => [
  m.permission,
  ...(m.submenus?.map((s) => s.permission) ?? []),
]);

/**
 * Returns true if the portal menu item with `menuName` is visible for the
 * given user permission list. `dashboard` is always visible.
 *
 * - `userPermissions` containing "all" (Super Admin) grants everything.
 * - A parent with submenus is visible if its own permission is granted OR any
 *   of its submenus are granted.
 */
export function isPortalMenuVisible(menuName: string, userPermissions: string[] | Set<string>): boolean {
  if (menuName === "dashboard") return true;
  const set = userPermissions instanceof Set ? userPermissions : new Set(userPermissions);
  if (set.has("all")) return true;

  const node = portalMenuPermissions.find((m) => m.name === menuName);
  if (!node) return true; // unknown items default visible (e.g. static links)

  if (set.has(node.permission)) return true;
  if (node.submenus?.some((s) => set.has(s.permission))) return true;
  return false;
}

/**
 * Returns the visible submenu names for a portal menu item, given the user's
 * permissions. Empty array means "no specific submenu filtering applies".
 */
export function visiblePortalSubmenus(menuName: string, userPermissions: string[] | Set<string>): string[] {
  const set = userPermissions instanceof Set ? userPermissions : new Set(userPermissions);
  const node = portalMenuPermissions.find((m) => m.name === menuName);
  if (!node?.submenus) return [];
  if (set.has("all")) return node.submenus.map((s) => s.name);
  return node.submenus.filter((s) => set.has(s.permission)).map((s) => s.name);
}
