/**
 * storage.js
 * Manages LocalStorage for history and settings.
 */

const StorageManager = {
    KEYS: {
        HISTORY: 'markup_maker_history',
        LAST_TEMPLATE: 'markup_maker_last_template',
        LAST_PATTERN1: 'markup_maker_last_pattern1',
        LAST_PATTERN2: 'markup_maker_last_pattern2'
    },

    saveSettings: function (template, pattern1, pattern2) {
        localStorage.setItem(this.KEYS.LAST_TEMPLATE, template);
        localStorage.setItem(this.KEYS.LAST_PATTERN1, pattern1);
        localStorage.setItem(this.KEYS.LAST_PATTERN2, pattern2);
    },

    loadSettings: function () {
        return {
            template: localStorage.getItem(this.KEYS.LAST_TEMPLATE) || '',
            pattern1: localStorage.getItem(this.KEYS.LAST_PATTERN1) || '',
            pattern2: localStorage.getItem(this.KEYS.LAST_PATTERN2) || ''
        };
    },

    saveHistory: function (template, data, pattern1, pattern2) {
        let history = this.getHistory();
        const newItem = {
            timestamp: new Date().toISOString(),
            template: template,
            data: data, // We save raw data text
            pattern1: pattern1,
            pattern2: pattern2
        };

        // Add to beginning
        history.unshift(newItem);

        // Keep only last 10
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    },

    getHistory: function () {
        const json = localStorage.getItem(this.KEYS.HISTORY);
        return json ? JSON.parse(json) : [];
    },

    clearHistory: function () {
        localStorage.removeItem(this.KEYS.HISTORY);
    }
};
