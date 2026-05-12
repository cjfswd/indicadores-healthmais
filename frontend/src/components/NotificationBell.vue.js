import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCrud } from '@/composables/useCrud';
import { NotificationService } from '@/services/NotificationService';
const router = useRouter();
const menu = ref(false);
const permission = ref(typeof window !== 'undefined' ? (window.Notification?.permission || 'default') : 'default');
const showPermissionBanner = computed(() => permission.value === 'default');
const requestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
        await NotificationService.subscribeToPush();
    }
    permission.value = window.Notification.permission;
};
const { data: notificationsData, update: updateNotif, remove: deleteNotif, refetch } = useCrud('notifications', {
    defaultPageSize: 20
});
const notifications = computed(() => notificationsData.value || []);
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
const getTypeColor = (type) => {
    switch (type) {
        case 'success': return 'success';
        case 'error': return 'error';
        case 'warning': return 'warning';
        default: return 'info';
    }
};
const getTypeIcon = (type) => {
    switch (type) {
        case 'success': return 'mdi-check-circle-outline';
        case 'error': return 'mdi-alert-circle-outline';
        case 'warning': return 'mdi-alert-outline';
        default: return 'mdi-information-outline';
    }
};
const formatTime = (dateStr) => {
    if (!dateStr)
        return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
        await updateNotif({ id: notif._id, data: { isRead: true } });
    }
    if (notif.link) {
        router.push(notif.link);
        menu.value = false;
    }
};
const markAllAsRead = async () => {
    const unread = notifications.value.filter(n => !n.isRead);
    for (const n of unread) {
        await updateNotif({ id: n._id, data: { isRead: true } });
    }
};
const clearHistory = async () => {
    for (const n of notifications.value) {
        await deleteNotif(n._id);
    }
};
// Polling simples a cada 30 segundos (ou poderíamos usar WebSockets se tivéssemos suporte no backend)
setInterval(() => {
    refetch();
}, 30000);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vMenu | typeof __VLS_components.VMenu | typeof __VLS_components['v-menu']} */
vMenu;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.menu),
    closeOnContentClick: (false),
    offset: "10",
    transition: "scale-transition",
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.menu),
    closeOnContentClick: (false),
    offset: "10",
    transition: "scale-transition",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
{
    const { activator: __VLS_7 } = __VLS_3.slots;
    const [{ props }] = __VLS_vSlot(__VLS_7);
    let __VLS_8;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
        icon: true,
        ...(props),
        density: "compact",
        ...{ class: "mr-2" },
    }));
    const __VLS_10 = __VLS_9({
        icon: true,
        ...(props),
        density: "compact",
        ...{ class: "mr-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
    const { default: __VLS_13 } = __VLS_11.slots;
    if (__VLS_ctx.unreadCount > 0) {
        let __VLS_14;
        /** @ts-ignore @type { | typeof __VLS_components.vBadge | typeof __VLS_components.VBadge | typeof __VLS_components['v-badge']} */
        vBadge;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            content: (__VLS_ctx.unreadCount),
            color: "error",
        }));
        const __VLS_16 = __VLS_15({
            content: (__VLS_ctx.unreadCount),
            color: "error",
        }, ...__VLS_functionalComponentArgsRest(__VLS_15));
        const { default: __VLS_19 } = __VLS_17.slots;
        let __VLS_20;
        /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
        vIcon;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({}));
        const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
        const { default: __VLS_25 } = __VLS_23.slots;
        // @ts-ignore
        [menu, unreadCount, unreadCount,];
        var __VLS_23;
        // @ts-ignore
        [];
        var __VLS_17;
    }
    else {
        let __VLS_26;
        /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
        vIcon;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
        const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
        const { default: __VLS_31 } = __VLS_29.slots;
        // @ts-ignore
        [];
        var __VLS_29;
    }
    // @ts-ignore
    [];
    var __VLS_11;
    // @ts-ignore
    [];
}
let __VLS_32;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    minWidth: "300",
    maxWidth: "400",
    elevation: "10",
    rounded: "lg",
}));
const __VLS_34 = __VLS_33({
    minWidth: "300",
    maxWidth: "400",
    elevation: "10",
    rounded: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
let __VLS_38;
/** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
vCardTitle;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    ...{ class: 'd-flex' },
    ...{ class: 'justify-space-between' },
    ...{ class: 'align-center' },
    ...{ class: 'pa-4' },
}));
const __VLS_40 = __VLS_39({
    ...{ class: 'd-flex' },
    ...{ class: 'justify-space-between' },
    ...{ class: 'align-center' },
    ...{ class: 'pa-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const { default: __VLS_43 } = __VLS_41.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.span)({
    ...{ class: 'text-subtitle-1' },
    ...{ class: 'font-weight-bold' },
});
/** @type {__VLS_StyleScopedClasses['text-subtitle-1']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
if (__VLS_ctx.unreadCount > 0) {
    let __VLS_44;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        variant: "text",
        size: "x-small",
        color: "primary",
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        variant: "text",
        size: "x-small",
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_49;
    const __VLS_50 = ({ click: {} },
        { onClick: (__VLS_ctx.markAllAsRead) });
    const { default: __VLS_51 } = __VLS_47.slots;
    // @ts-ignore
    [unreadCount, markAllAsRead,];
    var __VLS_47;
    var __VLS_48;
}
// @ts-ignore
[];
var __VLS_41;
let __VLS_52;
/** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
vDivider;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
if (__VLS_ctx.showPermissionBanner) {
    let __VLS_57;
    /** @ts-ignore @type { | typeof __VLS_components.vAlert | typeof __VLS_components.VAlert | typeof __VLS_components['v-alert']} */
    vAlert;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        type: "info",
        variant: "tonal",
        density: "compact",
        ...{ class: "ma-2 text-caption" },
    }));
    const __VLS_59 = __VLS_58({
        type: "info",
        variant: "tonal",
        density: "compact",
        ...{ class: "ma-2 text-caption" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    /** @type {__VLS_StyleScopedClasses['ma-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    const { default: __VLS_62 } = __VLS_60.slots;
    {
        const { append: __VLS_63 } = __VLS_60.slots;
        let __VLS_64;
        /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
        vBtn;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            ...{ 'onClick': {} },
            size: "x-small",
            variant: "flat",
            color: "info",
        }));
        const __VLS_66 = __VLS_65({
            ...{ 'onClick': {} },
            size: "x-small",
            variant: "flat",
            color: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        let __VLS_69;
        const __VLS_70 = ({ click: {} },
            { onClick: (__VLS_ctx.requestPermission) });
        const { default: __VLS_71 } = __VLS_67.slots;
        // @ts-ignore
        [showPermissionBanner, requestPermission,];
        var __VLS_67;
        var __VLS_68;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_60;
}
if (__VLS_ctx.notifications.length > 0) {
    let __VLS_72;
    /** @ts-ignore @type { | typeof __VLS_components.vList | typeof __VLS_components.VList | typeof __VLS_components['v-list']} */
    vList;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        lines: "two",
        maxHeight: "400",
        ...{ class: "overflow-y-auto pa-0" },
    }));
    const __VLS_74 = __VLS_73({
        lines: "two",
        maxHeight: "400",
        ...{ class: "overflow-y-auto pa-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['pa-0']} */ ;
    const { default: __VLS_77 } = __VLS_75.slots;
    for (const [notif] of __VLS_vFor((__VLS_ctx.notifications))) {
        let __VLS_78;
        /** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
        vListItem;
        // @ts-ignore
        const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
            ...{ 'onClick': {} },
            key: (notif._id),
            active: (!notif.isRead),
            ...{ class: "border-b" },
        }));
        const __VLS_80 = __VLS_79({
            ...{ 'onClick': {} },
            key: (notif._id),
            active: (!notif.isRead),
            ...{ class: "border-b" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_79));
        let __VLS_83;
        const __VLS_84 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.notifications.length > 0))
                        return;
                    __VLS_ctx.handleNotifClick(notif);
                    // @ts-ignore
                    [notifications, notifications, handleNotifClick,];
                } });
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        const { default: __VLS_85 } = __VLS_81.slots;
        {
            const { prepend: __VLS_86 } = __VLS_81.slots;
            let __VLS_87;
            /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
            vIcon;
            // @ts-ignore
            const __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
                color: (__VLS_ctx.getTypeColor(notif.type)),
            }));
            const __VLS_89 = __VLS_88({
                color: (__VLS_ctx.getTypeColor(notif.type)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_88));
            const { default: __VLS_92 } = __VLS_90.slots;
            (__VLS_ctx.getTypeIcon(notif.type));
            // @ts-ignore
            [getTypeColor, getTypeIcon,];
            var __VLS_90;
            // @ts-ignore
            [];
        }
        let __VLS_93;
        /** @ts-ignore @type { | typeof __VLS_components.vListItemTitle | typeof __VLS_components.VListItemTitle | typeof __VLS_components['v-list-item-title']} */
        vListItemTitle;
        // @ts-ignore
        const __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
            ...{ class: 'font-weight-bold' },
            ...{ class: 'text-body-2' },
        }));
        const __VLS_95 = __VLS_94({
            ...{ class: 'font-weight-bold' },
            ...{ class: 'text-body-2' },
        }, ...__VLS_functionalComponentArgsRest(__VLS_94));
        /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
        const { default: __VLS_98 } = __VLS_96.slots;
        (notif.title);
        // @ts-ignore
        [];
        var __VLS_96;
        let __VLS_99;
        /** @ts-ignore @type { | typeof __VLS_components.vListItemSubtitle | typeof __VLS_components.VListItemSubtitle | typeof __VLS_components['v-list-item-subtitle']} */
        vListItemSubtitle;
        // @ts-ignore
        const __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
            ...{ class: 'text-caption' },
        }));
        const __VLS_101 = __VLS_100({
            ...{ class: 'text-caption' },
        }, ...__VLS_functionalComponentArgsRest(__VLS_100));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        const { default: __VLS_104 } = __VLS_102.slots;
        (notif.message);
        // @ts-ignore
        [];
        var __VLS_102;
        {
            const { append: __VLS_105 } = __VLS_81.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: 'text-caption' },
                ...{ class: 'text-grey' },
            });
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            (__VLS_ctx.formatTime(notif.createdAt));
            // @ts-ignore
            [formatTime,];
        }
        // @ts-ignore
        [];
        var __VLS_81;
        var __VLS_82;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_75;
}
else {
    let __VLS_106;
    /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
    vCardText;
    // @ts-ignore
    const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
        ...{ class: 'text-center' },
        ...{ class: 'pa-8' },
    }));
    const __VLS_108 = __VLS_107({
        ...{ class: 'text-center' },
        ...{ class: 'pa-8' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_107));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['pa-8']} */ ;
    const { default: __VLS_111 } = __VLS_109.slots;
    let __VLS_112;
    /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
    vIcon;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
        size: "48",
        color: "grey-lighten-1",
    }));
    const __VLS_114 = __VLS_113({
        size: "48",
        color: "grey-lighten-1",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    const { default: __VLS_117 } = __VLS_115.slots;
    // @ts-ignore
    [];
    var __VLS_115;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'text-grey' },
        ...{ class: 'mt-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    // @ts-ignore
    [];
    var __VLS_109;
}
if (__VLS_ctx.notifications.length > 0) {
    let __VLS_118;
    /** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
    vDivider;
    // @ts-ignore
    const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({}));
    const __VLS_120 = __VLS_119({}, ...__VLS_functionalComponentArgsRest(__VLS_119));
}
if (__VLS_ctx.notifications.length > 0) {
    let __VLS_123;
    /** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
    vCardActions;
    // @ts-ignore
    const __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({}));
    const __VLS_125 = __VLS_124({}, ...__VLS_functionalComponentArgsRest(__VLS_124));
    const { default: __VLS_128 } = __VLS_126.slots;
    let __VLS_129;
    /** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
    vSpacer;
    // @ts-ignore
    const __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({}));
    const __VLS_131 = __VLS_130({}, ...__VLS_functionalComponentArgsRest(__VLS_130));
    let __VLS_134;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
        ...{ 'onClick': {} },
        variant: "text",
        size: "small",
        color: "error",
    }));
    const __VLS_136 = __VLS_135({
        ...{ 'onClick': {} },
        variant: "text",
        size: "small",
        color: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_135));
    let __VLS_139;
    const __VLS_140 = ({ click: {} },
        { onClick: (__VLS_ctx.clearHistory) });
    const { default: __VLS_141 } = __VLS_137.slots;
    // @ts-ignore
    [notifications, notifications, clearHistory,];
    var __VLS_137;
    var __VLS_138;
    // @ts-ignore
    [];
    var __VLS_126;
}
// @ts-ignore
[];
var __VLS_35;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
