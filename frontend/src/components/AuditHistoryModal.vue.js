import { ref, reactive, computed } from 'vue';
import { fetchEntityEvents } from '@/lib/proxy-client';
import { useTheme } from 'vuetify';
const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');
const isOpen = ref(false);
const isLoading = ref(false);
const streamType = ref('');
const streamId = ref('');
const events = ref([]);
const expandedEntries = reactive({});
const open = async (targetStreamType, targetStreamId) => {
    streamType.value = targetStreamType;
    streamId.value = targetStreamId;
    isOpen.value = true;
    isLoading.value = true;
    // Reset expanded state
    Object.keys(expandedEntries).forEach(k => delete expandedEntries[Number(k)]);
    try {
        const res = await fetchEntityEvents(targetStreamType, targetStreamId);
        // Eventos vêm em ordem crescente de version (do endpoint dedicado)
        events.value = (res.result || []).reverse();
    }
    catch (err) {
        console.error('Failed to load event stream:', err);
        events.value = [];
    }
    finally {
        isLoading.value = false;
    }
};
const close = () => {
    isOpen.value = false;
};
const toggleExpand = (idx) => {
    expandedEntries[idx] = !expandedEntries[idx];
};
const getStreamTypeLabel = (st) => {
    const labels = {
        patients: 'Paciente',
        operators: 'Operadora',
        indicators: 'Indicador',
    };
    return labels[st] || st;
};
const formatAction = (eventType) => {
    const labels = {
        CREATE: 'Criação',
        UPDATE: 'Atualização',
        SOFT_DELETE: 'Exclusão'
    };
    return labels[eventType] || eventType;
};
const dotColor = (eventType) => {
    const colors = {
        CREATE: 'success',
        UPDATE: 'info',
        SOFT_DELETE: 'error'
    };
    return colors[eventType] || 'grey';
};
const actionIcon = (eventType) => {
    const icons = {
        CREATE: 'mdi-plus',
        UPDATE: 'mdi-pencil',
        SOFT_DELETE: 'mdi-delete'
    };
    return icons[eventType] || 'mdi-information';
};
const formatTimestamp = (ts) => {
    if (!ts)
        return '—';
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};
const formatState = (state) => {
    if (!state)
        return '(vazio)';
    try {
        const cleaned = { ...state };
        // Remove binary placeholders for cleaner display
        if (cleaned.file) {
            cleaned.file = {
                name: cleaned.file.name,
                type: cleaned.file.type,
                size: cleaned.file.size,
                data: cleaned.file.data === '__BINARY_STRIPPED__' ? '[BINARY]' : cleaned.file.data ? '[BINARY]' : undefined
            };
        }
        if (cleaned.events) {
            cleaned.events = cleaned.events.map((e) => {
                const eventCopy = { ...e };
                if (eventCopy.file) {
                    eventCopy.file = {
                        name: eventCopy.file.name,
                        type: eventCopy.file.type,
                        size: eventCopy.file.size,
                        data: '[BINARY]'
                    };
                }
                return eventCopy;
            });
        }
        return JSON.stringify(cleaned, null, 2);
    }
    catch {
        return String(state);
    }
};
const getDataFields = (data) => {
    if (!data || typeof data !== 'object')
        return [];
    return Object.keys(data).filter(k => !['_id', 'updatedAt', 'createdAt'].includes(k));
};
const __VLS_exposed = { open, close };
defineExpose(__VLS_exposed);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vDialog | typeof __VLS_components.VDialog | typeof __VLS_components['v-dialog']} */
vDialog;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.isOpen),
    maxWidth: "900px",
    scrollable: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.isOpen),
    maxWidth: "900px",
    scrollable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
/** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
vCardTitle;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    ...{ class: 'd-flex' },
    ...{ class: 'justify-space-between' },
    ...{ class: 'align-center' },
    ...{ class: 'pa-4' },
}));
const __VLS_15 = __VLS_14({
    ...{ class: 'd-flex' },
    ...{ class: 'justify-space-between' },
    ...{ class: 'align-center' },
    ...{ class: 'pa-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const { default: __VLS_18 } = __VLS_16.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: 'd-flex' },
    ...{ class: 'flex-column' },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span)({
    ...{ class: 'text-h6' },
    ...{ class: 'font-weight-bold' },
});
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span)({
    ...{ class: 'text-caption' },
    ...{ class: 'text-medium-emphasis' },
});
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
(__VLS_ctx.getStreamTypeLabel(__VLS_ctx.streamType));
(__VLS_ctx.streamId);
let __VLS_19;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    ...{ 'onClick': {} },
    icon: true,
    variant: "text",
}));
const __VLS_21 = __VLS_20({
    ...{ 'onClick': {} },
    icon: true,
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_24;
const __VLS_25 = ({ click: {} },
    { onClick: (__VLS_ctx.close) });
const { default: __VLS_26 } = __VLS_22.slots;
let __VLS_27;
/** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
vIcon;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
const { default: __VLS_32 } = __VLS_30.slots;
// @ts-ignore
[isOpen, getStreamTypeLabel, streamType, streamId, close,];
var __VLS_30;
// @ts-ignore
[];
var __VLS_22;
var __VLS_23;
// @ts-ignore
[];
var __VLS_16;
let __VLS_33;
/** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
vDivider;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({}));
const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_38;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    ...{ class: 'pa-0' },
    ...{ style: {} },
}));
const __VLS_40 = __VLS_39({
    ...{ class: 'pa-0' },
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
/** @type {__VLS_StyleScopedClasses['pa-0']} */ ;
const { default: __VLS_43 } = __VLS_41.slots;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-center' },
        ...{ class: 'py-8' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    let __VLS_44;
    /** @ts-ignore @type { | typeof __VLS_components.vProgressCircular | typeof __VLS_components.VProgressCircular | typeof __VLS_components['v-progress-circular']} */
    vProgressCircular;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_46 = __VLS_45({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
}
else if (!__VLS_ctx.events || !__VLS_ctx.events.length) {
    let __VLS_49;
    /** @ts-ignore @type { | typeof __VLS_components.vAlert | typeof __VLS_components.VAlert | typeof __VLS_components['v-alert']} */
    vAlert;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        ...{ class: 'ma-4' },
        type: "info",
        variant: "tonal",
    }));
    const __VLS_51 = __VLS_50({
        ...{ class: 'ma-4' },
        type: "info",
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    /** @type {__VLS_StyleScopedClasses['ma-4']} */ ;
    const { default: __VLS_54 } = __VLS_52.slots;
    // @ts-ignore
    [isLoading, events, events,];
    var __VLS_52;
}
else {
    let __VLS_55;
    /** @ts-ignore @type { | typeof __VLS_components.vTimeline | typeof __VLS_components.VTimeline | typeof __VLS_components['v-timeline']} */
    vTimeline;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        density: "compact",
        side: "end",
    }));
    const __VLS_57 = __VLS_56({
        density: "compact",
        side: "end",
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    const { default: __VLS_60 } = __VLS_58.slots;
    for (const [entry, idx] of __VLS_vFor((__VLS_ctx.events))) {
        let __VLS_61;
        /** @ts-ignore @type { | typeof __VLS_components.vTimelineItem | typeof __VLS_components.VTimelineItem | typeof __VLS_components['v-timeline-item']} */
        vTimelineItem;
        // @ts-ignore
        const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
            key: (entry._id || idx),
            dotColor: (__VLS_ctx.dotColor(entry.eventType)),
            size: "small",
        }));
        const __VLS_63 = __VLS_62({
            key: (entry._id || idx),
            dotColor: (__VLS_ctx.dotColor(entry.eventType)),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_62));
        const { default: __VLS_66 } = __VLS_64.slots;
        {
            const { icon: __VLS_67 } = __VLS_64.slots;
            let __VLS_68;
            /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
            vIcon;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                size: "x-small",
                color: "white",
            }));
            const __VLS_70 = __VLS_69({
                size: "x-small",
                color: "white",
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            const { default: __VLS_73 } = __VLS_71.slots;
            (__VLS_ctx.actionIcon(entry.eventType));
            // @ts-ignore
            [events, dotColor, actionIcon,];
            var __VLS_71;
            // @ts-ignore
            [];
        }
        let __VLS_74;
        /** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
        vCard;
        // @ts-ignore
        const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
            ...{ class: 'ma-2' },
            elevation: "1",
            border: true,
        }));
        const __VLS_76 = __VLS_75({
            ...{ class: 'ma-2' },
            elevation: "1",
            border: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_75));
        /** @type {__VLS_StyleScopedClasses['ma-2']} */ ;
        const { default: __VLS_79 } = __VLS_77.slots;
        let __VLS_80;
        /** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
        vCardTitle;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
            ...{ class: 'd-flex' },
            ...{ class: 'justify-space-between' },
            ...{ class: 'align-center' },
            ...{ class: 'pa-3' },
        }));
        const __VLS_82 = __VLS_81({
            ...{ class: 'd-flex' },
            ...{ class: 'justify-space-between' },
            ...{ class: 'align-center' },
            ...{ class: 'pa-3' },
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['pa-3']} */ ;
        const { default: __VLS_85 } = __VLS_83.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: 'd-flex' },
            ...{ class: 'align-center' },
            ...{ class: 'gap-2' },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        let __VLS_86;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
            color: (__VLS_ctx.dotColor(entry.eventType)),
            size: "small",
            variant: "flat",
        }));
        const __VLS_88 = __VLS_87({
            color: (__VLS_ctx.dotColor(entry.eventType)),
            size: "small",
            variant: "flat",
        }, ...__VLS_functionalComponentArgsRest(__VLS_87));
        const { default: __VLS_91 } = __VLS_89.slots;
        (__VLS_ctx.formatAction(entry.eventType));
        // @ts-ignore
        [dotColor, formatAction,];
        var __VLS_89;
        let __VLS_92;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
            size: "x-small",
            color: "secondary",
            variant: "tonal",
        }));
        const __VLS_94 = __VLS_93({
            size: "x-small",
            color: "secondary",
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        const { default: __VLS_97 } = __VLS_95.slots;
        (entry.version);
        // @ts-ignore
        [];
        var __VLS_95;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-caption' },
            ...{ class: 'text-medium-emphasis' },
        });
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
        (__VLS_ctx.formatTimestamp(entry.timestamp));
        if (entry.data) {
            let __VLS_98;
            /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
            vBtn;
            // @ts-ignore
            const __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
                ...{ 'onClick': {} },
                size: "x-small",
                variant: "text",
                icon: (__VLS_ctx.expandedEntries[idx] ? 'mdi-chevron-up' : 'mdi-chevron-down'),
            }));
            const __VLS_100 = __VLS_99({
                ...{ 'onClick': {} },
                size: "x-small",
                variant: "text",
                icon: (__VLS_ctx.expandedEntries[idx] ? 'mdi-chevron-up' : 'mdi-chevron-down'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_99));
            let __VLS_103;
            const __VLS_104 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(!__VLS_ctx.events || !__VLS_ctx.events.length))
                            return;
                        if (!(entry.data))
                            return;
                        __VLS_ctx.toggleExpand(idx);
                        // @ts-ignore
                        [formatTimestamp, expandedEntries, toggleExpand,];
                    } });
            var __VLS_101;
            var __VLS_102;
        }
        // @ts-ignore
        [];
        var __VLS_83;
        if (entry.actor) {
            let __VLS_105;
            /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
            vCardText;
            // @ts-ignore
            const __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({
                ...{ class: 'pa-3' },
                ...{ class: 'pt-0' },
            }));
            const __VLS_107 = __VLS_106({
                ...{ class: 'pa-3' },
                ...{ class: 'pt-0' },
            }, ...__VLS_functionalComponentArgsRest(__VLS_106));
            /** @type {__VLS_StyleScopedClasses['pa-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['pt-0']} */ ;
            const { default: __VLS_110 } = __VLS_108.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: 'd-flex' },
                ...{ class: 'align-center' },
                ...{ class: 'gap-1' },
            });
            /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            let __VLS_111;
            /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
            vIcon;
            // @ts-ignore
            const __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
                size: "small",
                color: "grey",
            }));
            const __VLS_113 = __VLS_112({
                size: "small",
                color: "grey",
            }, ...__VLS_functionalComponentArgsRest(__VLS_112));
            const { default: __VLS_116 } = __VLS_114.slots;
            // @ts-ignore
            [];
            var __VLS_114;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                ...{ class: 'text-body-2' },
                ...{ class: 'text-medium-emphasis' },
            });
            /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
            (entry.actor);
            // @ts-ignore
            [];
            var __VLS_108;
        }
        let __VLS_117;
        /** @ts-ignore @type { | typeof __VLS_components.vExpandTransition | typeof __VLS_components.VExpandTransition | typeof __VLS_components['v-expand-transition']} */
        vExpandTransition;
        // @ts-ignore
        const __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({}));
        const __VLS_119 = __VLS_118({}, ...__VLS_functionalComponentArgsRest(__VLS_118));
        const { default: __VLS_122 } = __VLS_120.slots;
        if (__VLS_ctx.expandedEntries[idx]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({});
            let __VLS_123;
            /** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
            vDivider;
            // @ts-ignore
            const __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({}));
            const __VLS_125 = __VLS_124({}, ...__VLS_functionalComponentArgsRest(__VLS_124));
            let __VLS_128;
            /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
            vCardText;
            // @ts-ignore
            const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
                ...{ class: 'pa-3' },
            }));
            const __VLS_130 = __VLS_129({
                ...{ class: 'pa-3' },
            }, ...__VLS_functionalComponentArgsRest(__VLS_129));
            /** @type {__VLS_StyleScopedClasses['pa-3']} */ ;
            const { default: __VLS_133 } = __VLS_131.slots;
            let __VLS_134;
            /** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
            vRow;
            // @ts-ignore
            const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({}));
            const __VLS_136 = __VLS_135({}, ...__VLS_functionalComponentArgsRest(__VLS_135));
            const { default: __VLS_139 } = __VLS_137.slots;
            let __VLS_140;
            /** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
            vCol;
            // @ts-ignore
            const __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
                cols: "12",
            }));
            const __VLS_142 = __VLS_141({
                cols: "12",
            }, ...__VLS_functionalComponentArgsRest(__VLS_141));
            const { default: __VLS_145 } = __VLS_143.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: 'text-caption' },
                ...{ class: 'font-weight-bold' },
                ...{ class: 'mb-2' },
                ...{ class: 'd-flex' },
                ...{ class: 'align-center' },
                ...{ class: 'gap-1' },
                ...{ class: 'text-info' },
            });
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
            let __VLS_146;
            /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
            vIcon;
            // @ts-ignore
            const __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({
                size: "small",
            }));
            const __VLS_148 = __VLS_147({
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_147));
            const { default: __VLS_151 } = __VLS_149.slots;
            // @ts-ignore
            [expandedEntries,];
            var __VLS_149;
            let __VLS_152;
            /** @ts-ignore @type { | typeof __VLS_components.vSheet | typeof __VLS_components.VSheet | typeof __VLS_components['v-sheet']} */
            vSheet;
            // @ts-ignore
            const __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152({
                ...{ class: 'pa-2' },
                ...{ class: 'rounded' },
                color: (__VLS_ctx.isDark ? 'grey-darken-3' : 'grey-lighten-4'),
                ...{ style: {} },
            }));
            const __VLS_154 = __VLS_153({
                ...{ class: 'pa-2' },
                ...{ class: 'rounded' },
                color: (__VLS_ctx.isDark ? 'grey-darken-3' : 'grey-lighten-4'),
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_153));
            /** @type {__VLS_StyleScopedClasses['pa-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const { default: __VLS_157 } = __VLS_155.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.pre)({
                ...{ class: 'text-caption' },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            (__VLS_ctx.formatState(entry.data));
            // @ts-ignore
            [isDark, formatState,];
            var __VLS_155;
            // @ts-ignore
            [];
            var __VLS_143;
            // @ts-ignore
            [];
            var __VLS_137;
            if (idx > 0 && entry.eventType === 'UPDATE') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                    ...{ class: 'mt-3' },
                });
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                    ...{ class: 'text-caption' },
                    ...{ class: 'font-weight-bold' },
                    ...{ class: 'mb-1' },
                    ...{ class: 'd-flex' },
                    ...{ class: 'align-center' },
                    ...{ class: 'gap-1' },
                    ...{ class: 'text-warning' },
                });
                /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
                /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
                let __VLS_158;
                /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
                vIcon;
                // @ts-ignore
                const __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
                    size: "small",
                }));
                const __VLS_160 = __VLS_159({
                    size: "small",
                }, ...__VLS_functionalComponentArgsRest(__VLS_159));
                const { default: __VLS_163 } = __VLS_161.slots;
                // @ts-ignore
                [];
                var __VLS_161;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                    ...{ class: 'd-flex' },
                    ...{ class: 'flex-wrap' },
                    ...{ class: 'gap-1' },
                });
                /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
                for (const [field] of __VLS_vFor((__VLS_ctx.getDataFields(entry.data)))) {
                    let __VLS_164;
                    /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
                    vChip;
                    // @ts-ignore
                    const __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164({
                        key: (field),
                        size: "x-small",
                        color: "warning",
                        variant: "tonal",
                    }));
                    const __VLS_166 = __VLS_165({
                        key: (field),
                        size: "x-small",
                        color: "warning",
                        variant: "tonal",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
                    const { default: __VLS_169 } = __VLS_167.slots;
                    (field);
                    // @ts-ignore
                    [getDataFields,];
                    var __VLS_167;
                    // @ts-ignore
                    [];
                }
            }
            // @ts-ignore
            [];
            var __VLS_131;
        }
        // @ts-ignore
        [];
        var __VLS_120;
        // @ts-ignore
        [];
        var __VLS_77;
        // @ts-ignore
        [];
        var __VLS_64;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_58;
}
// @ts-ignore
[];
var __VLS_41;
let __VLS_170;
/** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
vDivider;
// @ts-ignore
const __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({}));
const __VLS_172 = __VLS_171({}, ...__VLS_functionalComponentArgsRest(__VLS_171));
let __VLS_175;
/** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
vCardActions;
// @ts-ignore
const __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
    ...{ class: 'pa-4' },
}));
const __VLS_177 = __VLS_176({
    ...{ class: 'pa-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_176));
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const { default: __VLS_180 } = __VLS_178.slots;
if (__VLS_ctx.events && __VLS_ctx.events.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-caption' },
        ...{ class: 'text-medium-emphasis' },
    });
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
    (__VLS_ctx.events.length);
}
let __VLS_181;
/** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
vSpacer;
// @ts-ignore
const __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181({}));
const __VLS_183 = __VLS_182({}, ...__VLS_functionalComponentArgsRest(__VLS_182));
let __VLS_186;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
    ...{ 'onClick': {} },
    variant: "text",
}));
const __VLS_188 = __VLS_187({
    ...{ 'onClick': {} },
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_187));
let __VLS_191;
const __VLS_192 = ({ click: {} },
    { onClick: (__VLS_ctx.close) });
const { default: __VLS_193 } = __VLS_189.slots;
// @ts-ignore
[close, events, events, events,];
var __VLS_189;
var __VLS_190;
// @ts-ignore
[];
var __VLS_178;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
});
export default {};
