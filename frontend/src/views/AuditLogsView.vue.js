import { ref, reactive, computed } from 'vue';
import { fetchEventStoreLogs } from '@/lib/proxy-client';
import { useQuery } from '@tanstack/vue-query';
import AuditHistoryModal from '@/components/AuditHistoryModal.vue';
const streamTypeOptions = ['patients', 'operators', 'indicators'];
const eventTypeOptions = ['CREATE', 'UPDATE', 'SOFT_DELETE'];
const filtersForm = reactive({
    search: '',
    streamType: null,
    eventType: null,
});
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);
const jumpPage = ref(null);
const skip = computed(() => (page.value - 1) * pageSize.value);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
const buildQuery = () => {
    const q = {};
    if (filtersForm.search) {
        q.streamId = filtersForm.search;
    }
    if (filtersForm.streamType) {
        q.streamType = filtersForm.streamType;
    }
    if (filtersForm.eventType) {
        q.eventType = filtersForm.eventType;
    }
    return q;
};
const queryKey = computed(() => ['events_store', 'list', page.value, pageSize.value, filtersForm.search, filtersForm.streamType, filtersForm.eventType]);
const { data: events, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
        const res = await fetchEventStoreLogs({
            query: buildQuery(),
            skip: skip.value,
            limit: pageSize.value,
            sort: [['timestamp', -1]],
        });
        if (res.total !== undefined) {
            total.value = res.total;
        }
        return res.result || [];
    }
});
const applySearch = () => {
    page.value = 1;
};
const goToPage = () => {
    if (jumpPage.value && jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
        page.value = jumpPage.value;
        jumpPage.value = null;
    }
};
const getStreamTypeLabel = (streamType) => {
    const labels = {
        patients: 'Paciente',
        operators: 'Operadora',
        indicators: 'Indicador',
    };
    return labels[streamType] || streamType;
};
const eventTypeColor = (eventType) => {
    const colors = {
        CREATE: 'success',
        UPDATE: 'info',
        SOFT_DELETE: 'error',
    };
    return colors[eventType] || 'grey';
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
const historyModal = ref(null);
const openHistory = (eventItem) => {
    historyModal.value?.open(eventItem.streamType, eventItem.streamId);
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: "space-y-8 animate-in fade-in duration-700" },
});
/** @type {__VLS_StyleScopedClasses['space-y-8']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-in']} */ ;
/** @type {__VLS_StyleScopedClasses['fade-in']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: 'd-flex' },
    ...{ class: 'justify-space-between' },
    ...{ class: 'align-center' },
    ...{ class: 'mb-4' },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2)({
    ...{ class: 'text-h5' },
    ...{ class: 'font-weight-bold' },
});
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: 'mb-4' },
    elevation: "0",
    border: true,
}));
const __VLS_2 = __VLS_1({
    ...{ class: 'mb-4' },
    elevation: "0",
    border: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ class: 'pa-3' },
}));
const __VLS_8 = __VLS_7({
    ...{ class: 'pa-3' },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['pa-3']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
let __VLS_12;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    dense: true,
}));
const __VLS_14 = __VLS_13({
    dense: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
let __VLS_18;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    cols: "12",
    md: "4",
}));
const __VLS_20 = __VLS_19({
    cols: "12",
    md: "4",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
let __VLS_24;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.search),
    placeholder: "Buscar por Stream ID...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    prependInnerIcon: "mdi-magnify",
    clearable: true,
}));
const __VLS_26 = __VLS_25({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.search),
    placeholder: "Buscar por Stream ID...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    prependInnerIcon: "mdi-magnify",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_29;
const __VLS_30 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.applySearch) });
var __VLS_27;
var __VLS_28;
// @ts-ignore
[filtersForm, applySearch,];
var __VLS_21;
let __VLS_31;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    cols: "12",
    md: "4",
}));
const __VLS_33 = __VLS_32({
    cols: "12",
    md: "4",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
const { default: __VLS_36 } = __VLS_34.slots;
let __VLS_37;
/** @ts-ignore @type { | typeof __VLS_components.vSelect | typeof __VLS_components.VSelect | typeof __VLS_components['v-select']} */
vSelect;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.streamType),
    items: (__VLS_ctx.streamTypeOptions),
    placeholder: "Filtrar Collection",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_39 = __VLS_38({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.streamType),
    items: (__VLS_ctx.streamTypeOptions),
    placeholder: "Filtrar Collection",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
let __VLS_42;
const __VLS_43 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.applySearch) });
var __VLS_40;
var __VLS_41;
// @ts-ignore
[filtersForm, applySearch, streamTypeOptions,];
var __VLS_34;
let __VLS_44;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    cols: "12",
    md: "4",
}));
const __VLS_46 = __VLS_45({
    cols: "12",
    md: "4",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const { default: __VLS_49 } = __VLS_47.slots;
let __VLS_50;
/** @ts-ignore @type { | typeof __VLS_components.vSelect | typeof __VLS_components.VSelect | typeof __VLS_components['v-select']} */
vSelect;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.eventType),
    items: (__VLS_ctx.eventTypeOptions),
    placeholder: "Filtrar Tipo de Evento",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_52 = __VLS_51({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.eventType),
    items: (__VLS_ctx.eventTypeOptions),
    placeholder: "Filtrar Tipo de Evento",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
let __VLS_55;
const __VLS_56 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.applySearch) });
var __VLS_53;
var __VLS_54;
// @ts-ignore
[filtersForm, applySearch, eventTypeOptions,];
var __VLS_47;
// @ts-ignore
[];
var __VLS_15;
// @ts-ignore
[];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-center' },
        ...{ class: 'py-8' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    let __VLS_57;
    /** @ts-ignore @type { | typeof __VLS_components.vProgressCircular | typeof __VLS_components.VProgressCircular | typeof __VLS_components['v-progress-circular']} */
    vProgressCircular;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_59 = __VLS_58({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
}
else if (!__VLS_ctx.events || !__VLS_ctx.events.length) {
    let __VLS_62;
    /** @ts-ignore @type { | typeof __VLS_components.vAlert | typeof __VLS_components.VAlert | typeof __VLS_components['v-alert']} */
    vAlert;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        type: "info",
        variant: "tonal",
        border: "start",
    }));
    const __VLS_64 = __VLS_63({
        type: "info",
        variant: "tonal",
        border: "start",
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    const { default: __VLS_67 } = __VLS_65.slots;
    // @ts-ignore
    [isLoading, events, events,];
    var __VLS_65;
}
else {
    let __VLS_68;
    /** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
    vRow;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({}));
    const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
    const { default: __VLS_73 } = __VLS_71.slots;
    for (const [item] of __VLS_vFor((__VLS_ctx.events))) {
        let __VLS_74;
        /** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
        vCol;
        // @ts-ignore
        const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
            cols: "12",
            md: "6",
            lg: "4",
            key: (item._id),
        }));
        const __VLS_76 = __VLS_75({
            cols: "12",
            md: "6",
            lg: "4",
            key: (item._id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_75));
        const { default: __VLS_79 } = __VLS_77.slots;
        let __VLS_80;
        /** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
        vCard;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
            ...{ 'onClick': {} },
            elevation: "1",
            ...{ class: "h-100 d-flex flex-column" },
        }));
        const __VLS_82 = __VLS_81({
            ...{ 'onClick': {} },
            elevation: "1",
            ...{ class: "h-100 d-flex flex-column" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        let __VLS_85;
        const __VLS_86 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(!__VLS_ctx.events || !__VLS_ctx.events.length))
                        return;
                    __VLS_ctx.openHistory(item);
                    // @ts-ignore
                    [events, openHistory,];
                } });
        /** @type {__VLS_StyleScopedClasses['h-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
        const { default: __VLS_87 } = __VLS_83.slots;
        let __VLS_88;
        /** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
        vCardTitle;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
            ...{ class: 'd-flex' },
            ...{ class: 'justify-space-between' },
            ...{ class: 'align-start' },
        }));
        const __VLS_90 = __VLS_89({
            ...{ class: 'd-flex' },
            ...{ class: 'justify-space-between' },
            ...{ class: 'align-start' },
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-start']} */ ;
        const { default: __VLS_93 } = __VLS_91.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: 'd-flex' },
            ...{ class: 'flex-column' },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-body-1' },
            ...{ class: 'font-weight-bold' },
            ...{ class: 'text-truncate' },
        });
        /** @type {__VLS_StyleScopedClasses['text-body-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-truncate']} */ ;
        (__VLS_ctx.getStreamTypeLabel(item.streamType));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-caption' },
            ...{ class: 'text-medium-emphasis' },
        });
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
        (item.streamId);
        let __VLS_94;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
            color: (__VLS_ctx.eventTypeColor(item.eventType)),
            size: "small",
            variant: "flat",
        }));
        const __VLS_96 = __VLS_95({
            color: (__VLS_ctx.eventTypeColor(item.eventType)),
            size: "small",
            variant: "flat",
        }, ...__VLS_functionalComponentArgsRest(__VLS_95));
        const { default: __VLS_99 } = __VLS_97.slots;
        (item.eventType);
        // @ts-ignore
        [getStreamTypeLabel, eventTypeColor,];
        var __VLS_97;
        // @ts-ignore
        [];
        var __VLS_91;
        let __VLS_100;
        /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
        vCardText;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
            ...{ class: 'pt-1' },
            ...{ class: 'flex-grow-1' },
            ...{ class: 'd-flex' },
            ...{ class: 'flex-column' },
        }));
        const __VLS_102 = __VLS_101({
            ...{ class: 'pt-1' },
            ...{ class: 'flex-grow-1' },
            ...{ class: 'd-flex' },
            ...{ class: 'flex-column' },
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        /** @type {__VLS_StyleScopedClasses['pt-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
        const { default: __VLS_105 } = __VLS_103.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: 'd-flex' },
            ...{ class: 'align-center' },
            ...{ class: 'gap-2' },
            ...{ class: 'mb-1' },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        let __VLS_106;
        /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
        vIcon;
        // @ts-ignore
        const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
            size: "small",
            color: "grey",
        }));
        const __VLS_108 = __VLS_107({
            size: "small",
            color: "grey",
        }, ...__VLS_functionalComponentArgsRest(__VLS_107));
        const { default: __VLS_111 } = __VLS_109.slots;
        // @ts-ignore
        [];
        var __VLS_109;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-body-2' },
            ...{ class: 'text-medium-emphasis' },
        });
        /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
        (__VLS_ctx.formatTimestamp(item.timestamp));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: 'd-flex' },
            ...{ class: 'align-center' },
            ...{ class: 'gap-2' },
            ...{ class: 'mb-1' },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        let __VLS_112;
        /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
        vIcon;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
            size: "small",
            color: "grey",
        }));
        const __VLS_114 = __VLS_113({
            size: "small",
            color: "grey",
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        const { default: __VLS_117 } = __VLS_115.slots;
        // @ts-ignore
        [formatTimestamp,];
        var __VLS_115;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-body-2' },
            ...{ class: 'text-medium-emphasis' },
        });
        /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
        (item.version);
        if (item.actor) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: 'd-flex' },
                ...{ class: 'align-center' },
                ...{ class: 'gap-2' },
                ...{ class: 'mb-2' },
            });
            /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
            let __VLS_118;
            /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
            vIcon;
            // @ts-ignore
            const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({
                size: "small",
                color: "grey",
            }));
            const __VLS_120 = __VLS_119({
                size: "small",
                color: "grey",
            }, ...__VLS_functionalComponentArgsRest(__VLS_119));
            const { default: __VLS_123 } = __VLS_121.slots;
            // @ts-ignore
            [];
            var __VLS_121;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
                ...{ class: 'text-body-2' },
                ...{ class: 'text-medium-emphasis' },
            });
            /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
            (item.actor);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: 'd-flex' },
            ...{ class: 'flex-wrap' },
            ...{ class: 'gap-1' },
            ...{ class: 'mt-auto' },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
        let __VLS_124;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
            size: "x-small",
            color: "info",
            variant: "tonal",
            prependIcon: "mdi-database",
        }));
        const __VLS_126 = __VLS_125({
            size: "x-small",
            color: "info",
            variant: "tonal",
            prependIcon: "mdi-database",
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        const { default: __VLS_129 } = __VLS_127.slots;
        (item.streamType);
        // @ts-ignore
        [];
        var __VLS_127;
        let __VLS_130;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
            size: "x-small",
            color: "secondary",
            variant: "tonal",
            prependIcon: "mdi-source-commit",
        }));
        const __VLS_132 = __VLS_131({
            size: "x-small",
            color: "secondary",
            variant: "tonal",
            prependIcon: "mdi-source-commit",
        }, ...__VLS_functionalComponentArgsRest(__VLS_131));
        const { default: __VLS_135 } = __VLS_133.slots;
        (item.version);
        // @ts-ignore
        [];
        var __VLS_133;
        // @ts-ignore
        [];
        var __VLS_103;
        let __VLS_136;
        /** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
        vDivider;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({}));
        const __VLS_138 = __VLS_137({}, ...__VLS_functionalComponentArgsRest(__VLS_137));
        let __VLS_141;
        /** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
        vCardActions;
        // @ts-ignore
        const __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({}));
        const __VLS_143 = __VLS_142({}, ...__VLS_functionalComponentArgsRest(__VLS_142));
        const { default: __VLS_146 } = __VLS_144.slots;
        let __VLS_147;
        /** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
        vSpacer;
        // @ts-ignore
        const __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({}));
        const __VLS_149 = __VLS_148({}, ...__VLS_functionalComponentArgsRest(__VLS_148));
        let __VLS_152;
        /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
        vBtn;
        // @ts-ignore
        const __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152({
            size: "small",
            color: "primary",
            variant: "text",
            prependIcon: "mdi-eye",
        }));
        const __VLS_154 = __VLS_153({
            size: "small",
            color: "primary",
            variant: "text",
            prependIcon: "mdi-eye",
        }, ...__VLS_functionalComponentArgsRest(__VLS_153));
        const { default: __VLS_157 } = __VLS_155.slots;
        // @ts-ignore
        [];
        var __VLS_155;
        // @ts-ignore
        [];
        var __VLS_144;
        // @ts-ignore
        [];
        var __VLS_83;
        var __VLS_84;
        // @ts-ignore
        [];
        var __VLS_77;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_71;
}
if (__VLS_ctx.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-center' },
        ...{ class: 'align-center' },
        ...{ class: 'gap-4' },
        ...{ class: 'mt-4' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    let __VLS_158;
    /** @ts-ignore @type { | typeof __VLS_components.vPagination | typeof __VLS_components.VPagination | typeof __VLS_components['v-pagination']} */
    vPagination;
    // @ts-ignore
    const __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
        modelValue: (__VLS_ctx.page),
        length: (__VLS_ctx.totalPages),
        totalVisible: (5),
        density: "compact",
    }));
    const __VLS_160 = __VLS_159({
        modelValue: (__VLS_ctx.page),
        length: (__VLS_ctx.totalPages),
        totalVisible: (5),
        density: "compact",
    }, ...__VLS_functionalComponentArgsRest(__VLS_159));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'text-caption' },
        ...{ class: 'text-medium-emphasis' },
    });
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
    (__VLS_ctx.page);
    (__VLS_ctx.totalPages);
    let __VLS_163;
    /** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
    vTextField;
    // @ts-ignore
    const __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
        ...{ 'onKeydown': {} },
        modelValue: (__VLS_ctx.jumpPage),
        modelModifiers: { number: true, },
        type: "number",
        variant: "outlined",
        density: "compact",
        hideDetails: true,
        placeholder: "Ir p/",
        ...{ style: {} },
        min: (1),
        max: (__VLS_ctx.totalPages),
    }));
    const __VLS_165 = __VLS_164({
        ...{ 'onKeydown': {} },
        modelValue: (__VLS_ctx.jumpPage),
        modelModifiers: { number: true, },
        type: "number",
        variant: "outlined",
        density: "compact",
        hideDetails: true,
        placeholder: "Ir p/",
        ...{ style: {} },
        min: (1),
        max: (__VLS_ctx.totalPages),
    }, ...__VLS_functionalComponentArgsRest(__VLS_164));
    let __VLS_168;
    const __VLS_169 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.goToPage) });
    var __VLS_166;
    var __VLS_167;
}
const __VLS_170 = AuditHistoryModal;
// @ts-ignore
const __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
    ref: "historyModal",
}));
const __VLS_172 = __VLS_171({
    ref: "historyModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_171));
var __VLS_175 = {};
var __VLS_173;
// @ts-ignore
var __VLS_176 = __VLS_175;
// @ts-ignore
[totalPages, totalPages, totalPages, totalPages, page, page, jumpPage, goToPage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
