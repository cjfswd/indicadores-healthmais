import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCrud } from '@/composables/useCrud';
import { useConfirm } from '@/composables/useConfirm';
import { dbExecute, downloadFileFromDb } from '@/lib/proxy-client';
import EventFormModal from '@/components/EventFormModal.vue';
const route = useRoute();
const router = useRouter();
const { data: patients, isLoading, update: updatePatient, } = useCrud('patients', { defaultPageSize: 1000 });
const { data: indicators } = useCrud('indicators', { defaultPageSize: 100 });
const filtersForm = reactive({
    patientId: null,
    indicatorName: null,
    subindicatorName: ''
});
const clearFilters = () => {
    filtersForm.patientId = null;
    filtersForm.indicatorName = null;
    filtersForm.subindicatorName = '';
};
const page = ref(1);
const pageSize = 10;
const cameFromPatient = ref(false);
onMounted(() => {
    if (route.query.patientId) {
        filtersForm.patientId = route.query.patientId;
        cameFromPatient.value = true;
        router.replace({ query: {} });
    }
});
watch(filtersForm, () => {
    page.value = 1;
});
const allEvents = computed(() => {
    if (!patients.value)
        return [];
    const list = [];
    for (const p of patients.value) {
        if (filtersForm.patientId && p._id !== filtersForm.patientId)
            continue;
        if (p.events) {
            for (const e of p.events) {
                if (filtersForm.indicatorName && e.indicator?.name !== filtersForm.indicatorName)
                    continue;
                if (filtersForm.subindicatorName && !e.subindicator?.name?.toLowerCase().includes(filtersForm.subindicatorName.toLowerCase()))
                    continue;
                list.push({ ...e, patientId: p._id, patientName: p.name });
            }
        }
    }
    return list.sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime());
});
const totalPages = computed(() => Math.ceil(allEvents.value.length / pageSize) || 1);
const events = computed(() => {
    const start = (page.value - 1) * pageSize;
    return allEvents.value.slice(start, start + pageSize);
});
const formModal = ref(null);
const jumpToPage = ref(null);
const goToPage = () => {
    if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
        page.value = jumpToPage.value;
        jumpToPage.value = null;
    }
};
const openModal = (event) => {
    formModal.value?.open(event);
};
const downloadFile = (file, patientId, eventId) => {
    downloadFileFromDb('patients', patientId, 0, file.name, eventId);
};
const { confirm } = useConfirm();
const deleteEvent = async (item) => {
    if (!await confirm('Tem certeza que deseja excluir este evento?'))
        return;
    try {
        const res = await dbExecute({ action: 'findOne', collection: 'patients', id: item.patientId });
        if (res.success && res.result) {
            const newEvents = (res.result.events || []).filter((e) => e._id !== item._id);
            await updatePatient({ id: item.patientId, data: { events: newEvents } });
        }
    }
    catch (error) {
        console.error(error);
    }
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: 'd-flex' },
    ...{ class: 'align-center' },
    ...{ class: 'gap-2' },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
if (__VLS_ctx.cameFromPatient) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        icon: "mdi-arrow-left",
        variant: "text",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        icon: "mdi-arrow-left",
        variant: "text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.cameFromPatient))
                    return;
                __VLS_ctx.$router.push('/patients');
                // @ts-ignore
                [cameFromPatient, $router,];
            } });
    var __VLS_3;
    var __VLS_4;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.h2)({
    ...{ class: 'text-h5' },
    ...{ class: 'font-weight-bold' },
});
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onClick': {} },
    color: "primary",
}));
const __VLS_9 = __VLS_8({
    ...{ 'onClick': {} },
    color: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.openModal();
            // @ts-ignore
            [openModal,];
        } });
const { default: __VLS_14 } = __VLS_10.slots;
// @ts-ignore
[];
var __VLS_10;
var __VLS_11;
let __VLS_15;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    ...{ class: 'mb-4' },
    elevation: "0",
    border: true,
}));
const __VLS_17 = __VLS_16({
    ...{ class: 'mb-4' },
    elevation: "0",
    border: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
const { default: __VLS_20 } = __VLS_18.slots;
let __VLS_21;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    ...{ class: 'pa-3' },
}));
const __VLS_23 = __VLS_22({
    ...{ class: 'pa-3' },
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
/** @type {__VLS_StyleScopedClasses['pa-3']} */ ;
const { default: __VLS_26 } = __VLS_24.slots;
let __VLS_27;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
    dense: true,
    align: "center",
}));
const __VLS_29 = __VLS_28({
    dense: true,
    align: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
const { default: __VLS_32 } = __VLS_30.slots;
let __VLS_33;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
    cols: "12",
    sm: "6",
    md: "3",
}));
const __VLS_35 = __VLS_34({
    cols: "12",
    sm: "6",
    md: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const { default: __VLS_38 } = __VLS_36.slots;
let __VLS_39;
/** @ts-ignore @type { | typeof __VLS_components.vAutocomplete | typeof __VLS_components.VAutocomplete | typeof __VLS_components['v-autocomplete']} */
vAutocomplete;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    modelValue: (__VLS_ctx.filtersForm.patientId),
    items: (__VLS_ctx.patients),
    itemTitle: "name",
    itemValue: "_id",
    placeholder: "Filtrar Paciente",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_41 = __VLS_40({
    modelValue: (__VLS_ctx.filtersForm.patientId),
    items: (__VLS_ctx.patients),
    itemTitle: "name",
    itemValue: "_id",
    placeholder: "Filtrar Paciente",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
// @ts-ignore
[filtersForm, patients,];
var __VLS_36;
let __VLS_44;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    cols: "12",
    sm: "6",
    md: "3",
}));
const __VLS_46 = __VLS_45({
    cols: "12",
    sm: "6",
    md: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const { default: __VLS_49 } = __VLS_47.slots;
let __VLS_50;
/** @ts-ignore @type { | typeof __VLS_components.vAutocomplete | typeof __VLS_components.VAutocomplete | typeof __VLS_components['v-autocomplete']} */
vAutocomplete;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    modelValue: (__VLS_ctx.filtersForm.indicatorName),
    items: (__VLS_ctx.indicators),
    itemTitle: "name",
    itemValue: "name",
    placeholder: "Filtrar Indicador",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_52 = __VLS_51({
    modelValue: (__VLS_ctx.filtersForm.indicatorName),
    items: (__VLS_ctx.indicators),
    itemTitle: "name",
    itemValue: "name",
    placeholder: "Filtrar Indicador",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
// @ts-ignore
[filtersForm, indicators,];
var __VLS_47;
let __VLS_55;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
    cols: "12",
    sm: "6",
    md: "3",
}));
const __VLS_57 = __VLS_56({
    cols: "12",
    sm: "6",
    md: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
const { default: __VLS_60 } = __VLS_58.slots;
let __VLS_61;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
    modelValue: (__VLS_ctx.filtersForm.subindicatorName),
    placeholder: "Buscar Sub-indicador...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_63 = __VLS_62({
    modelValue: (__VLS_ctx.filtersForm.subindicatorName),
    placeholder: "Buscar Sub-indicador...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
// @ts-ignore
[filtersForm,];
var __VLS_58;
let __VLS_66;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
    cols: "12",
    sm: "6",
    md: "3",
}));
const __VLS_68 = __VLS_67({
    cols: "12",
    sm: "6",
    md: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_67));
const { default: __VLS_71 } = __VLS_69.slots;
if (__VLS_ctx.filtersForm.patientId || __VLS_ctx.filtersForm.indicatorName || __VLS_ctx.filtersForm.subindicatorName) {
    let __VLS_72;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        prependIcon: "mdi-filter-off",
    }));
    const __VLS_74 = __VLS_73({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        prependIcon: "mdi-filter-off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    let __VLS_77;
    const __VLS_78 = ({ click: {} },
        { onClick: (__VLS_ctx.clearFilters) });
    const { default: __VLS_79 } = __VLS_75.slots;
    // @ts-ignore
    [filtersForm, filtersForm, filtersForm, clearFilters,];
    var __VLS_75;
    var __VLS_76;
}
// @ts-ignore
[];
var __VLS_69;
// @ts-ignore
[];
var __VLS_30;
// @ts-ignore
[];
var __VLS_24;
// @ts-ignore
[];
var __VLS_18;
let __VLS_80;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({}));
const __VLS_82 = __VLS_81({}, ...__VLS_functionalComponentArgsRest(__VLS_81));
const { default: __VLS_85 } = __VLS_83.slots;
for (const [item] of __VLS_vFor((__VLS_ctx.events))) {
    let __VLS_86;
    /** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
    vCol;
    // @ts-ignore
    const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        cols: "12",
        md: "6",
        lg: "4",
        key: (item._id),
    }));
    const __VLS_88 = __VLS_87({
        cols: "12",
        md: "6",
        lg: "4",
        key: (item._id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    const { default: __VLS_91 } = __VLS_89.slots;
    let __VLS_92;
    /** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
    vCard;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
        elevation: "1",
        ...{ class: "h-100 d-flex flex-column" },
    }));
    const __VLS_94 = __VLS_93({
        elevation: "1",
        ...{ class: "h-100 d-flex flex-column" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    /** @type {__VLS_StyleScopedClasses['h-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
    const { default: __VLS_97 } = __VLS_95.slots;
    let __VLS_98;
    /** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
    vCardTitle;
    // @ts-ignore
    const __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-space-between' },
        ...{ class: 'align-start' },
    }));
    const __VLS_100 = __VLS_99({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-space-between' },
        ...{ class: 'align-start' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_99));
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-start']} */ ;
    const { default: __VLS_103 } = __VLS_101.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-wrap' },
        ...{ class: 'text-subtitle-1' },
        ...{ class: 'font-weight-bold' },
        ...{ class: 'pr-2' },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['text-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-subtitle-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-2']} */ ;
    (item.patientName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-caption' },
        ...{ class: 'text-medium-emphasis' },
        ...{ class: 'flex-shrink-0' },
        ...{ class: 'mt-1' },
    });
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    (new Date(item.occurrenceDate).toLocaleDateString());
    // @ts-ignore
    [events,];
    var __VLS_101;
    let __VLS_104;
    /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
    vCardText;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        ...{ class: 'flex-grow-1' },
    }));
    const __VLS_106 = __VLS_105({
        ...{ class: 'flex-grow-1' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    /** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
    const { default: __VLS_109 } = __VLS_107.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    (item.indicator?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    (item.subindicator?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-4' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    if (item.observations) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({});
        (item.observations);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-grey' },
            ...{ class: 'font-italic' },
        });
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-italic']} */ ;
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
    if (item.file) {
        let __VLS_110;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
            ...{ 'onClick': {} },
            size: "x-small",
            color: "primary",
            variant: "tonal",
            prependIcon: "mdi-download",
            ...{ style: {} },
        }));
        const __VLS_112 = __VLS_111({
            ...{ 'onClick': {} },
            size: "x-small",
            color: "primary",
            variant: "tonal",
            prependIcon: "mdi-download",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_111));
        let __VLS_115;
        const __VLS_116 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(item.file))
                        return;
                    __VLS_ctx.downloadFile(item.file, item.patientId, item._id);
                    // @ts-ignore
                    [downloadFile,];
                } });
        const { default: __VLS_117 } = __VLS_113.slots;
        (item.file.name);
        // @ts-ignore
        [];
        var __VLS_113;
        var __VLS_114;
    }
    else {
        let __VLS_118;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({
            size: "x-small",
            color: "grey",
            variant: "tonal",
            prependIcon: "mdi-paperclip",
        }));
        const __VLS_120 = __VLS_119({
            size: "x-small",
            color: "grey",
            variant: "tonal",
            prependIcon: "mdi-paperclip",
        }, ...__VLS_functionalComponentArgsRest(__VLS_119));
        const { default: __VLS_123 } = __VLS_121.slots;
        // @ts-ignore
        [];
        var __VLS_121;
    }
    // @ts-ignore
    [];
    var __VLS_107;
    let __VLS_124;
    /** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
    vDivider;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({}));
    const __VLS_126 = __VLS_125({}, ...__VLS_functionalComponentArgsRest(__VLS_125));
    let __VLS_129;
    /** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
    vCardActions;
    // @ts-ignore
    const __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({}));
    const __VLS_131 = __VLS_130({}, ...__VLS_functionalComponentArgsRest(__VLS_130));
    const { default: __VLS_134 } = __VLS_132.slots;
    let __VLS_135;
    /** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
    vSpacer;
    // @ts-ignore
    const __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135({}));
    const __VLS_137 = __VLS_136({}, ...__VLS_functionalComponentArgsRest(__VLS_136));
    let __VLS_140;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        size: "small",
        icon: "mdi-pencil",
    }));
    const __VLS_142 = __VLS_141({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        size: "small",
        icon: "mdi-pencil",
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    let __VLS_145;
    const __VLS_146 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.openModal(item);
                // @ts-ignore
                [openModal,];
            } });
    var __VLS_143;
    var __VLS_144;
    let __VLS_147;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
        ...{ 'onClick': {} },
        variant: "text",
        color: "error",
        size: "small",
        icon: "mdi-delete",
    }));
    const __VLS_149 = __VLS_148({
        ...{ 'onClick': {} },
        variant: "text",
        color: "error",
        size: "small",
        icon: "mdi-delete",
    }, ...__VLS_functionalComponentArgsRest(__VLS_148));
    let __VLS_152;
    const __VLS_153 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.deleteEvent(item);
                // @ts-ignore
                [deleteEvent,];
            } });
    var __VLS_150;
    var __VLS_151;
    // @ts-ignore
    [];
    var __VLS_132;
    // @ts-ignore
    [];
    var __VLS_95;
    // @ts-ignore
    [];
    var __VLS_89;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_83;
if (__VLS_ctx.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-center' },
        ...{ class: 'align-center' },
        ...{ class: 'pa-4' },
        ...{ class: 'mt-4' },
        ...{ class: 'gap-4' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    let __VLS_154;
    /** @ts-ignore @type { | typeof __VLS_components.vPagination | typeof __VLS_components.VPagination | typeof __VLS_components['v-pagination']} */
    vPagination;
    // @ts-ignore
    const __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
        modelValue: (__VLS_ctx.page),
        length: (__VLS_ctx.totalPages),
        totalVisible: (5),
        density: "compact",
        rounded: true,
    }));
    const __VLS_156 = __VLS_155({
        modelValue: (__VLS_ctx.page),
        length: (__VLS_ctx.totalPages),
        totalVisible: (5),
        density: "compact",
        rounded: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_155));
    let __VLS_159;
    /** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
    vTextField;
    // @ts-ignore
    const __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
        ...{ 'onKeydown': {} },
        ...{ class: 'flex-grow-0' },
        modelValue: (__VLS_ctx.jumpToPage),
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
    const __VLS_161 = __VLS_160({
        ...{ 'onKeydown': {} },
        ...{ class: 'flex-grow-0' },
        modelValue: (__VLS_ctx.jumpToPage),
        modelModifiers: { number: true, },
        type: "number",
        variant: "outlined",
        density: "compact",
        hideDetails: true,
        placeholder: "Ir p/",
        ...{ style: {} },
        min: (1),
        max: (__VLS_ctx.totalPages),
    }, ...__VLS_functionalComponentArgsRest(__VLS_160));
    let __VLS_164;
    const __VLS_165 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.goToPage) });
    /** @type {__VLS_StyleScopedClasses['flex-grow-0']} */ ;
    var __VLS_162;
    var __VLS_163;
}
const __VLS_166 = EventFormModal;
// @ts-ignore
const __VLS_167 = __VLS_asFunctionalComponent1(__VLS_166, new __VLS_166({
    ref: "formModal",
}));
const __VLS_168 = __VLS_167({
    ref: "formModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_167));
var __VLS_171 = {};
var __VLS_169;
// @ts-ignore
var __VLS_172 = __VLS_171;
// @ts-ignore
[totalPages, totalPages, totalPages, page, jumpToPage, goToPage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
