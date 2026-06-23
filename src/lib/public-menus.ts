import api from "@/lib/api";

export interface PublicMenuItem {
    id: number;
    title: string;
    is_external: boolean;
    open_new_tab: boolean;
    url?: string;
    page?: string;
    type: string;
    parent_id?: number | null;
    order?: number;
    column?: number;
    sub_items?: PublicMenuItem[];
}

// Module-level cache so the header and footer (and any other consumer)
// share a single `front-cms/menus` request per page load instead of each
// firing its own. The in-flight promise is cached to dedupe concurrent calls.
let menusCache: PublicMenuItem[] | null = null;
let inFlight: Promise<PublicMenuItem[]> | null = null;

export async function getPublicMenus(): Promise<PublicMenuItem[]> {
    if (menusCache) return menusCache;
    if (inFlight) return inFlight;

    inFlight = api
        .get("front-cms/menus")
        .then((res) => {
            const data =
                res.data?.status === "Success" && Array.isArray(res.data.data)
                    ? (res.data.data as PublicMenuItem[])
                    : [];
            menusCache = data;
            return data;
        })
        .catch(() => {
            return [];
        })
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
}
