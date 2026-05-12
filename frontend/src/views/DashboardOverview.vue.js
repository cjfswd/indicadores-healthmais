import { ref } from 'vue';
import { useCrud } from '@/composables/useCrud';
import { useDashboardAnalytics } from '@/composables/useDashboardAnalytics';
const startDate = ref('');
const endDate = ref('');
const clearFilters = () => {
    startDate.value = '';
    endDate.value = '';
};
const { data: patients } = useCrud('patients', { defaultPageSize: 1000 });
const { data: indicators } = useCrud('indicators', { defaultPageSize: 100 });
const analytics = useDashboardAnalytics(patients, indicators, startDate, endDate);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: "space-y-6 animate-in fade-in duration-700" },
});
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
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
    ...{ class: 'mb-6' },
    elevation: "0",
    border: true,
}));
const __VLS_2 = __VLS_1({
    ...{ class: 'mb-6' },
    elevation: "0",
    border: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
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
    align: "center",
}));
const __VLS_14 = __VLS_13({
    dense: true,
    align: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
let __VLS_18;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    cols: "12",
    sm: "4",
    md: "3",
}));
const __VLS_20 = __VLS_19({
    cols: "12",
    sm: "4",
    md: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
let __VLS_24;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    modelValue: (__VLS_ctx.startDate),
    type: "date",
    label: "Data Inicial",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_26 = __VLS_25({
    modelValue: (__VLS_ctx.startDate),
    type: "date",
    label: "Data Inicial",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
// @ts-ignore
[startDate,];
var __VLS_21;
let __VLS_29;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    cols: "12",
    sm: "4",
    md: "3",
}));
const __VLS_31 = __VLS_30({
    cols: "12",
    sm: "4",
    md: "3",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const { default: __VLS_34 } = __VLS_32.slots;
let __VLS_35;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    modelValue: (__VLS_ctx.endDate),
    type: "date",
    label: "Data Final",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_37 = __VLS_36({
    modelValue: (__VLS_ctx.endDate),
    type: "date",
    label: "Data Final",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
// @ts-ignore
[endDate,];
var __VLS_32;
let __VLS_40;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    cols: "12",
    sm: "4",
    md: "6",
}));
const __VLS_42 = __VLS_41({
    cols: "12",
    sm: "4",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const { default: __VLS_45 } = __VLS_43.slots;
if (__VLS_ctx.startDate || __VLS_ctx.endDate) {
    let __VLS_46;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        prependIcon: "mdi-filter-off",
    }));
    const __VLS_48 = __VLS_47({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        prependIcon: "mdi-filter-off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    let __VLS_51;
    const __VLS_52 = ({ click: {} },
        { onClick: (__VLS_ctx.clearFilters) });
    const { default: __VLS_53 } = __VLS_49.slots;
    // @ts-ignore
    [startDate, endDate, clearFilters,];
    var __VLS_49;
    var __VLS_50;
}
// @ts-ignore
[];
var __VLS_43;
// @ts-ignore
[];
var __VLS_15;
// @ts-ignore
[];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
let __VLS_54;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({}));
const __VLS_56 = __VLS_55({}, ...__VLS_functionalComponentArgsRest(__VLS_55));
const { default: __VLS_59 } = __VLS_57.slots;
for (const [card] of __VLS_vFor((__VLS_ctx.analytics.indicatorsCards))) {
    let __VLS_60;
    /** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
    vCol;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
        cols: "12",
        md: "6",
        lg: "4",
        key: (card.id),
    }));
    const __VLS_62 = __VLS_61({
        cols: "12",
        md: "6",
        lg: "4",
        key: (card.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    const { default: __VLS_65 } = __VLS_63.slots;
    let __VLS_66;
    /** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
    vCard;
    // @ts-ignore
    const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        elevation: "1",
        ...{ class: "h-100 d-flex flex-column" },
    }));
    const __VLS_68 = __VLS_67({
        elevation: "1",
        ...{ class: "h-100 d-flex flex-column" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_67));
    /** @type {__VLS_StyleScopedClasses['h-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
    const { default: __VLS_71 } = __VLS_69.slots;
    let __VLS_72;
    /** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
    vCardTitle;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        ...{ class: 'text-subtitle-1' },
        ...{ class: 'font-weight-bold' },
        ...{ class: 'text-wrap' },
        ...{ style: {} },
    }));
    const __VLS_74 = __VLS_73({
        ...{ class: 'text-subtitle-1' },
        ...{ class: 'font-weight-bold' },
        ...{ class: 'text-wrap' },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    /** @type {__VLS_StyleScopedClasses['text-subtitle-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-wrap']} */ ;
    const { default: __VLS_77 } = __VLS_75.slots;
    (card.name);
    // @ts-ignore
    [analytics,];
    var __VLS_75;
    let __VLS_78;
    /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
    vCardText;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        ...{ class: 'flex-grow-1' },
        ...{ class: 'd-flex' },
        ...{ class: 'flex-column' },
    }));
    const __VLS_80 = __VLS_79({
        ...{ class: 'flex-grow-1' },
        ...{ class: 'd-flex' },
        ...{ class: 'flex-column' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    /** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
    const { default: __VLS_83 } = __VLS_81.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'align-center' },
        ...{ class: 'mb-3' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-h4' },
        ...{ class: 'font-weight-bold' },
        ...{ class: 'text-primary' },
    });
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (card.totalEvents);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-caption' },
        ...{ class: 'text-medium-emphasis' },
        ...{ class: 'ml-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
    /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
    let __VLS_84;
    /** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
    vDivider;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
        ...{ class: 'mb-2' },
    }));
    const __VLS_86 = __VLS_85({
        ...{ class: 'mb-2' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    if (card.subindicators.length) {
        let __VLS_89;
        /** @ts-ignore @type { | typeof __VLS_components.vList | typeof __VLS_components.VList | typeof __VLS_components['v-list']} */
        vList;
        // @ts-ignore
        const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
            ...{ class: 'flex-grow-1' },
            lines: "one",
            density: "compact",
        }));
        const __VLS_91 = __VLS_90({
            ...{ class: 'flex-grow-1' },
            lines: "one",
            density: "compact",
        }, ...__VLS_functionalComponentArgsRest(__VLS_90));
        /** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
        const { default: __VLS_94 } = __VLS_92.slots;
        for (const [sub] of __VLS_vFor((card.subindicators))) {
            let __VLS_95;
            /** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
            vListItem;
            // @ts-ignore
            const __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({
                ...{ class: 'px-0' },
                key: (sub.name),
            }));
            const __VLS_97 = __VLS_96({
                ...{ class: 'px-0' },
                key: (sub.name),
            }, ...__VLS_functionalComponentArgsRest(__VLS_96));
            /** @type {__VLS_StyleScopedClasses['px-0']} */ ;
            const { default: __VLS_100 } = __VLS_98.slots;
            let __VLS_101;
            /** @ts-ignore @type { | typeof __VLS_components.vListItemTitle | typeof __VLS_components.VListItemTitle | typeof __VLS_components['v-list-item-title']} */
            vListItemTitle;
            // @ts-ignore
            const __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101({
                ...{ class: 'text-body-2' },
                ...{ class: 'text-wrap' },
            }));
            const __VLS_103 = __VLS_102({
                ...{ class: 'text-body-2' },
                ...{ class: 'text-wrap' },
            }, ...__VLS_functionalComponentArgsRest(__VLS_102));
            /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-wrap']} */ ;
            const { default: __VLS_106 } = __VLS_104.slots;
            (sub.name);
            // @ts-ignore
            [];
            var __VLS_104;
            {
                const { append: __VLS_107 } = __VLS_98.slots;
                let __VLS_108;
                /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
                vChip;
                // @ts-ignore
                const __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
                    size: "small",
                    variant: "tonal",
                    color: (sub.eventos > 0 ? 'secondary' : 'grey'),
                }));
                const __VLS_110 = __VLS_109({
                    size: "small",
                    variant: "tonal",
                    color: (sub.eventos > 0 ? 'secondary' : 'grey'),
                }, ...__VLS_functionalComponentArgsRest(__VLS_109));
                const { default: __VLS_113 } = __VLS_111.slots;
                (sub.eventos);
                // @ts-ignore
                [];
                var __VLS_111;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
            var __VLS_98;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_92;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: 'text-caption' },
            ...{ class: 'text-medium-emphasis' },
            ...{ class: 'mt-4' },
            ...{ class: 'text-center' },
        });
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_81;
    // @ts-ignore
    [];
    var __VLS_69;
    // @ts-ignore
    [];
    var __VLS_63;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_57;
let __VLS_114;
/** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
vDivider;
// @ts-ignore
const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
    ...{ class: 'my-6' },
}));
const __VLS_116 = __VLS_115({
    ...{ class: 'my-6' },
}, ...__VLS_functionalComponentArgsRest(__VLS_115));
/** @type {__VLS_StyleScopedClasses['my-6']} */ ;
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
    ...{ class: 'text-h6' },
    ...{ class: 'font-weight-bold' },
});
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
let __VLS_119;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({}));
const __VLS_121 = __VLS_120({}, ...__VLS_functionalComponentArgsRest(__VLS_120));
const { default: __VLS_124 } = __VLS_122.slots;
let __VLS_125;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
    cols: "12",
    md: "6",
}));
const __VLS_127 = __VLS_126({
    cols: "12",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_126));
const { default: __VLS_130 } = __VLS_128.slots;
let __VLS_131;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({
    elevation: "1",
    ...{ class: "h-100 d-flex flex-column" },
}));
const __VLS_133 = __VLS_132({
    elevation: "1",
    ...{ class: "h-100 d-flex flex-column" },
}, ...__VLS_functionalComponentArgsRest(__VLS_132));
/** @type {__VLS_StyleScopedClasses['h-100']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
const { default: __VLS_136 } = __VLS_134.slots;
let __VLS_137;
/** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
vCardTitle;
// @ts-ignore
const __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137({}));
const __VLS_139 = __VLS_138({}, ...__VLS_functionalComponentArgsRest(__VLS_138));
const { default: __VLS_142 } = __VLS_140.slots;
// @ts-ignore
[];
var __VLS_140;
let __VLS_143;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
    ...{ class: 'flex-grow-1' },
}));
const __VLS_145 = __VLS_144({
    ...{ class: 'flex-grow-1' },
}, ...__VLS_functionalComponentArgsRest(__VLS_144));
/** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
const { default: __VLS_148 } = __VLS_146.slots;
let __VLS_149;
/** @ts-ignore @type { | typeof __VLS_components.vList | typeof __VLS_components.VList | typeof __VLS_components['v-list']} */
vList;
// @ts-ignore
const __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149({
    lines: "one",
    density: "compact",
}));
const __VLS_151 = __VLS_150({
    lines: "one",
    density: "compact",
}, ...__VLS_functionalComponentArgsRest(__VLS_150));
const { default: __VLS_154 } = __VLS_152.slots;
for (const [item] of __VLS_vFor((__VLS_ctx.analytics.adverseEventsData))) {
    let __VLS_155;
    /** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
    vListItem;
    // @ts-ignore
    const __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
        ...{ class: 'px-0' },
        key: (item.name),
    }));
    const __VLS_157 = __VLS_156({
        ...{ class: 'px-0' },
        key: (item.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_156));
    /** @type {__VLS_StyleScopedClasses['px-0']} */ ;
    const { default: __VLS_160 } = __VLS_158.slots;
    let __VLS_161;
    /** @ts-ignore @type { | typeof __VLS_components.vListItemTitle | typeof __VLS_components.VListItemTitle | typeof __VLS_components['v-list-item-title']} */
    vListItemTitle;
    // @ts-ignore
    const __VLS_162 = __VLS_asFunctionalComponent1(__VLS_161, new __VLS_161({
        ...{ class: 'text-body-2' },
        ...{ class: 'text-wrap' },
    }));
    const __VLS_163 = __VLS_162({
        ...{ class: 'text-body-2' },
        ...{ class: 'text-wrap' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_162));
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-wrap']} */ ;
    const { default: __VLS_166 } = __VLS_164.slots;
    (item.name);
    // @ts-ignore
    [analytics,];
    var __VLS_164;
    {
        const { append: __VLS_167 } = __VLS_158.slots;
        let __VLS_168;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168({
            size: "small",
            color: "error",
            variant: "tonal",
        }));
        const __VLS_170 = __VLS_169({
            size: "small",
            color: "error",
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_169));
        const { default: __VLS_173 } = __VLS_171.slots;
        (item.eventos);
        // @ts-ignore
        [];
        var __VLS_171;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_158;
    // @ts-ignore
    [];
}
if (!__VLS_ctx.analytics.adverseEventsData.length) {
    let __VLS_174;
    /** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
    vListItem;
    // @ts-ignore
    const __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({}));
    const __VLS_176 = __VLS_175({}, ...__VLS_functionalComponentArgsRest(__VLS_175));
    const { default: __VLS_179 } = __VLS_177.slots;
    let __VLS_180;
    /** @ts-ignore @type { | typeof __VLS_components.vListItemTitle | typeof __VLS_components.VListItemTitle | typeof __VLS_components['v-list-item-title']} */
    vListItemTitle;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
        ...{ class: 'text-medium-emphasis' },
    }));
    const __VLS_182 = __VLS_181({
        ...{ class: 'text-medium-emphasis' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
    const { default: __VLS_185 } = __VLS_183.slots;
    // @ts-ignore
    [analytics,];
    var __VLS_183;
    // @ts-ignore
    [];
    var __VLS_177;
}
// @ts-ignore
[];
var __VLS_152;
// @ts-ignore
[];
var __VLS_146;
// @ts-ignore
[];
var __VLS_134;
// @ts-ignore
[];
var __VLS_128;
let __VLS_186;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
    cols: "12",
    md: "6",
}));
const __VLS_188 = __VLS_187({
    cols: "12",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_187));
const { default: __VLS_191 } = __VLS_189.slots;
let __VLS_192;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({
    elevation: "1",
    ...{ class: "h-100 d-flex flex-column" },
}));
const __VLS_194 = __VLS_193({
    elevation: "1",
    ...{ class: "h-100 d-flex flex-column" },
}, ...__VLS_functionalComponentArgsRest(__VLS_193));
/** @type {__VLS_StyleScopedClasses['h-100']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
const { default: __VLS_197 } = __VLS_195.slots;
let __VLS_198;
/** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
vCardTitle;
// @ts-ignore
const __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198({}));
const __VLS_200 = __VLS_199({}, ...__VLS_functionalComponentArgsRest(__VLS_199));
const { default: __VLS_203 } = __VLS_201.slots;
// @ts-ignore
[];
var __VLS_201;
let __VLS_204;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
    ...{ class: 'flex-grow-1' },
}));
const __VLS_206 = __VLS_205({
    ...{ class: 'flex-grow-1' },
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
/** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
const { default: __VLS_209 } = __VLS_207.slots;
let __VLS_210;
/** @ts-ignore @type { | typeof __VLS_components.vList | typeof __VLS_components.VList | typeof __VLS_components['v-list']} */
vList;
// @ts-ignore
const __VLS_211 = __VLS_asFunctionalComponent1(__VLS_210, new __VLS_210({
    lines: "one",
    density: "compact",
}));
const __VLS_212 = __VLS_211({
    lines: "one",
    density: "compact",
}, ...__VLS_functionalComponentArgsRest(__VLS_211));
const { default: __VLS_215 } = __VLS_213.slots;
for (const [item] of __VLS_vFor((__VLS_ctx.analytics.ouvidoriasData))) {
    let __VLS_216;
    /** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
    vListItem;
    // @ts-ignore
    const __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({
        ...{ class: 'px-0' },
        key: (item.name),
    }));
    const __VLS_218 = __VLS_217({
        ...{ class: 'px-0' },
        key: (item.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_217));
    /** @type {__VLS_StyleScopedClasses['px-0']} */ ;
    const { default: __VLS_221 } = __VLS_219.slots;
    let __VLS_222;
    /** @ts-ignore @type { | typeof __VLS_components.vListItemTitle | typeof __VLS_components.VListItemTitle | typeof __VLS_components['v-list-item-title']} */
    vListItemTitle;
    // @ts-ignore
    const __VLS_223 = __VLS_asFunctionalComponent1(__VLS_222, new __VLS_222({
        ...{ class: 'text-body-2' },
        ...{ class: 'text-wrap' },
    }));
    const __VLS_224 = __VLS_223({
        ...{ class: 'text-body-2' },
        ...{ class: 'text-wrap' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_223));
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-wrap']} */ ;
    const { default: __VLS_227 } = __VLS_225.slots;
    (item.name);
    // @ts-ignore
    [analytics,];
    var __VLS_225;
    {
        const { append: __VLS_228 } = __VLS_219.slots;
        let __VLS_229;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_230 = __VLS_asFunctionalComponent1(__VLS_229, new __VLS_229({
            size: "small",
            color: "warning",
            variant: "tonal",
        }));
        const __VLS_231 = __VLS_230({
            size: "small",
            color: "warning",
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_230));
        const { default: __VLS_234 } = __VLS_232.slots;
        (item.eventos);
        // @ts-ignore
        [];
        var __VLS_232;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_219;
    // @ts-ignore
    [];
}
if (!__VLS_ctx.analytics.ouvidoriasData.length) {
    let __VLS_235;
    /** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
    vListItem;
    // @ts-ignore
    const __VLS_236 = __VLS_asFunctionalComponent1(__VLS_235, new __VLS_235({}));
    const __VLS_237 = __VLS_236({}, ...__VLS_functionalComponentArgsRest(__VLS_236));
    const { default: __VLS_240 } = __VLS_238.slots;
    let __VLS_241;
    /** @ts-ignore @type { | typeof __VLS_components.vListItemTitle | typeof __VLS_components.VListItemTitle | typeof __VLS_components['v-list-item-title']} */
    vListItemTitle;
    // @ts-ignore
    const __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241({
        ...{ class: 'text-medium-emphasis' },
    }));
    const __VLS_243 = __VLS_242({
        ...{ class: 'text-medium-emphasis' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_242));
    /** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
    const { default: __VLS_246 } = __VLS_244.slots;
    // @ts-ignore
    [analytics,];
    var __VLS_244;
    // @ts-ignore
    [];
    var __VLS_238;
}
// @ts-ignore
[];
var __VLS_213;
// @ts-ignore
[];
var __VLS_207;
// @ts-ignore
[];
var __VLS_195;
// @ts-ignore
[];
var __VLS_189;
// @ts-ignore
[];
var __VLS_122;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
