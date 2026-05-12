import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useSnackbarStore = defineStore('snackbar', () => {
    const isVisible = ref(false);
    const message = ref('');
    const color = ref('success');
    function show(text, msgColor = 'success') {
        message.value = text;
        color.value = msgColor;
        isVisible.value = true;
    }
    function hide() {
        isVisible.value = false;
    }
    return { isVisible, message, color, show, hide };
});
