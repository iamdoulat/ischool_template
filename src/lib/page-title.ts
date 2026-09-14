export function getPageTitleFromPathname(pathname: string, t?: (key: string) => string): string {
    if (!pathname || pathname === "/" || pathname === "") return "Home";

    const cleanPath = pathname.split("?")[0].split("#")[0];
    const segments = cleanPath.split("/").filter(Boolean);

    if (segments.length === 0) return "Home";

    // Known custom route overrides
    const knownMap: Record<string, string> = {
        "/login": "login",
        "/forgot-password": "forgot_password",
        "/reset-password": "reset_password",
        "/dashboard": "dashboard",
        "/user/profile": "my_profile",
        "/user/dashboard": "student_dashboard",
        "/dashboard/transport/fees-master": "transport_fees_master",
        "/dashboard/transport/pickup-point": "pickup_point_list",
        "/dashboard/transport/route": "route_list",
        "/dashboard/transport/vehicles": "vehicle_list",
        "/dashboard/transport/assign-vehicle": "vehicle_route_list",
        "/dashboard/transport/route-pickup-point": "route_pickup_point",
        "/dashboard/transport/student-transport-fees": "student_transport_fees",
        "/dashboard/hostel/hostel-room": "hostel_room_list",
        "/dashboard/hostel/room-type": "room_type_list",
        "/dashboard/hostel/hostel": "hostel_list",
        "/dashboard/hostel": "hostel_list",
        "/dashboard/behaviour-records/assign-incident": "assign_incident",
        "/dashboard/behaviour-records/incidents": "incidents",
        "/dashboard/behaviour-records/reports": "behaviour_reports",
    };

    if (knownMap[cleanPath]) {
        const key = knownMap[cleanPath];
        if (t) {
            try {
                const translated = t(key);
                if (translated && translated !== key) return translated;
            } catch {
                // Ignore
            }
        }
        return key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    const last = segments[segments.length - 1];
    const secondLast = segments.length > 1 ? segments[segments.length - 2] : "";
    const thirdLast = segments.length > 2 ? segments[segments.length - 3] : "";

    let isEdit = false;
    let isCreate = false;
    let targetSegment = last;

    if (last === "edit") {
        isEdit = true;
        targetSegment = isNaN(Number(secondLast)) ? secondLast : thirdLast;
    } else if (last === "create" || last === "add") {
        isCreate = true;
        targetSegment = secondLast;
    } else if (!isNaN(Number(last))) {
        targetSegment = secondLast;
    }

    if (!targetSegment || targetSegment === "dashboard") {
        return "Dashboard";
    }

    // Try i18n translation key first if provided
    const snakeKey = targetSegment.replace(/-/g, "_");
    if (t) {
        try {
            const translated = t(snakeKey);
            if (translated && translated !== snakeKey) {
                let title = translated;
                if (isEdit) title = `Edit ${title}`;
                if (isCreate) title = `Add ${title}`;
                return title;
            }
        } catch {
            // Ignore error
        }
    }

    // Fallback: Title-case conversion (e.g. notice-board -> Notice Board)
    let words = targetSegment
        .replace(/[-_]/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

    if (isEdit) words = `Edit ${words}`;
    if (isCreate) words = `Add ${words}`;

    return words;
}

export function formatDocumentTitle(pathname: string, schoolName: string, t?: (key: string) => string): string {
    const cleanSchoolName = schoolName || "iSchool";
    if (!pathname || pathname === "/" || pathname === "") {
        return cleanSchoolName;
    }
    const pageName = getPageTitleFromPathname(pathname, t);
    if (!pageName || pageName === "Home") {
        return cleanSchoolName;
    }
    return `${pageName} || ${cleanSchoolName}`;
}

