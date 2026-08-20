/**
 * Resolves header shortcut color definitions to rich, guaranteed CSS linear-gradients.
 * Prevents Tailwind JIT dynamic class purging / transparent fade bugs.
 */

const COLOR_HEX_MAP: Record<string, string> = {
    // Tailwind base palette colors
    'amber-500': '#f59e0b',
    'amber-600': '#d97706',
    'amber-700': '#b45309',
    'orange-500': '#f97316',
    'orange-600': '#ea580c',
    'orange-700': '#c2410c',
    'yellow-500': '#eab308',
    'yellow-600': '#ca8a04',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'indigo-700': '#4338ca',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'purple-700': '#7e22ce',
    'violet-500': '#8b5cf6',
    'violet-600': '#7c3aed',
    'violet-700': '#6d28d9',
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'blue-700': '#1d4ed8',
    'cyan-500': '#06b6d4',
    'cyan-600': '#0891b2',
    'sky-500': '#0ea5e9',
    'sky-600': '#0284c7',
    'emerald-500': '#10b981',
    'emerald-600': '#059669',
    'emerald-700': '#047857',
    'teal-500': '#14b8a6',
    'teal-600': '#0d9488',
    'teal-700': '#0f766e',
    'green-500': '#22c55e',
    'green-600': '#16a34a',
    'green-700': '#15803d',
    'rose-500': '#f43f5e',
    'rose-600': '#e11d48',
    'pink-500': '#ec4899',
    'pink-600': '#db2777',
    'red-500': '#ef4444',
    'red-600': '#dc2626',
    'red-700': '#b91c1c',
    'slate-600': '#475569',
    'slate-700': '#334155',
    'gray-500': '#6b7280',
    'gray-800': '#1f2937',
    'primary': '#6366f1',
    'brand-orange': '#FF9800',
    'brand-indigo': '#6366F1',
};

const EXACT_GRADIENTS: Record<string, string> = {
    'from-amber-500 to-orange-600': 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    'from-indigo-500 to-purple-600': 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
    'from-blue-500 to-cyan-600': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    'from-emerald-500 to-teal-600': 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    'from-rose-500 to-pink-600': 'linear-gradient(135deg, #f43f5e 0%, #db2777 100%)',
    'from-sky-500 to-blue-600': 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    'from-violet-500 to-purple-600': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'from-green-500 to-emerald-600': 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
    'from-red-500 to-rose-600': 'linear-gradient(135deg, #ef4444 0%, #e11d48 100%)',
    'from-indigo-600 to-violet-700': 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)',
    'from-amber-600 to-indigo-600': 'linear-gradient(135deg, #d97706 0%, #4f46e5 100%)',
    'from-slate-600 to-gray-800': 'linear-gradient(135deg, #475569 0%, #1f2937 100%)',
    'from-orange-500 to-amber-600': 'linear-gradient(135deg, #f97316 0%, #d97706 100%)',
    'from-teal-500 to-cyan-600': 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
    'from-[#FF9800] to-[#6366F1]': 'linear-gradient(135deg, #FF9800 0%, #6366F1 100%)',
    'from-purple-500 to-indigo-600': 'linear-gradient(135deg, #a855f7 0%, #4f46e5 100%)',
    'from-cyan-500 to-blue-600': 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
    'from-teal-500 to-emerald-600': 'linear-gradient(135deg, #14b8a6 0%, #059669 100%)',
    'from-blue-500 to-indigo-600': 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
    'from-rose-500 to-red-600': 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
    'from-gray-500 to-slate-700': 'linear-gradient(135deg, #6b7280 0%, #334155 100%)',
    'from-blue-600 to-indigo-700': 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)',
    'from-orange-500 to-rose-600': 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
    'from-yellow-500 to-amber-600': 'linear-gradient(135deg, #eab308 0%, #d97706 100%)',
    'from-emerald-600 to-green-700': 'linear-gradient(135deg, #059669 0%, #15803d 100%)',
    'from-indigo-600 to-purple-700': 'linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%)',
    'from-purple-500 to-pink-600': 'linear-gradient(135deg, #a855f7 0%, #db2777 100%)',
    'from-indigo-500 to-blue-600': 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)',
    'from-amber-600 to-orange-700': 'linear-gradient(135deg, #d97706 0%, #c2410c 100%)',
    'from-emerald-600 to-teal-700': 'linear-gradient(135deg, #059669 0%, #0f766e 100%)',
    'from-primary to-indigo-600': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
};

/**
 * Returns a CSS inline style object with a guaranteed, non-washed-out linear gradient.
 */
export function getShortcutGradientStyle(colorClass?: string): React.CSSProperties {
    if (!colorClass || typeof colorClass !== 'string') {
        return {
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
        };
    }

    const trimmed = colorClass.trim();

    // Check exact matches
    if (EXACT_GRADIENTS[trimmed]) {
        return {
            background: EXACT_GRADIENTS[trimmed],
            color: '#ffffff',
        };
    }

    // Direct linear-gradient string support
    if (trimmed.startsWith('linear-gradient') || trimmed.startsWith('#')) {
        return {
            background: trimmed,
            color: '#ffffff',
        };
    }

    // Try parsing "from-{color} to-{color}"
    const fromMatch = trimmed.match(/from-\[?([^\]\s]+)\]?/);
    const toMatch = trimmed.match(/to-\[?([^\]\s]+)\]?/);

    const fromKey = fromMatch ? fromMatch[1] : 'indigo-500';
    const toKey = toMatch ? toMatch[1] : 'purple-600';

    const fromColor = COLOR_HEX_MAP[fromKey] || (fromKey.startsWith('#') ? fromKey : '#6366f1');
    const toColor = COLOR_HEX_MAP[toKey] || (toKey.startsWith('#') ? toKey : '#4f46e5');

    return {
        background: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
        color: '#ffffff',
    };
}
