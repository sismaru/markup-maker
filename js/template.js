/**
 * template.js
 * Handles replacing placeholders in the HTML template with parsed data.
 * Placeholders are now dynamic: driven by user-editable label names.
 */

const TemplateEngine = {
    /**
     * Generates the final HTML code.
     * @param {string} template - The HTML template string.
     * @param {Array} data - Array of Brand objects parsed from Excel.
     * @param {string} pattern1 - Image path pattern 1 (Brand).
     * @param {string} pattern2 - Image path pattern 2 (Product).
     * @param {Object} labelMap - Dynamic label mapping from editable labels.
     * @returns {string} The generated HTML.
     */
    generate: function (template, data, pattern1, pattern2, labelMap) {
        let finalOutput = '';

        // 1. Identify the Loop Block for Products
        const loopStartTag = '<!-- Loop Start -->';
        const loopEndTag = '<!-- Loop End -->';

        let hasLoop = template.includes(loopStartTag) && template.includes(loopEndTag);

        let headerPart = template;
        let loopPart = '';
        let footerPart = '';

        if (hasLoop) {
            // Explicit Loop
            const startIndex = template.indexOf(loopStartTag);
            const endIndex = template.indexOf(loopEndTag);

            headerPart = template.substring(0, startIndex);
            loopPart = template.substring(startIndex + loopStartTag.length, endIndex);
            footerPart = template.substring(endIndex + loopEndTag.length);
        } else {
            // Implicit Loop Detection using dynamic product name label
            const prodNameLabel = labelMap.product.name || 'data_5';
            const placeholder = `{{${prodNameLabel}}}`;
            const count = (template.match(new RegExp(this.escapeRegex(placeholder), 'g')) || []).length;

            if (count === 1) {
                const prodCodeLabel = labelMap.product.code || 'data_4';
                const escapedName = this.escapeRegex(`{{${prodNameLabel}}}`);
                const escapedCode = this.escapeRegex(`{{${prodCodeLabel}}}`);
                const match = template.match(new RegExp(`(\\s*<li\\b[^>]*>[\\s\\S]*?(?:${escapedName}|${escapedCode})[\\s\\S]*?<\\/li>\\s*)`, 'i'));

                if (match) {
                    hasLoop = true;
                    loopPart = match[1];
                    const matchIndex = match.index;

                    headerPart = template.substring(0, matchIndex);
                    footerPart = template.substring(matchIndex + loopPart.length);
                }
            }
        }

        // 2. Iterate through each Brand (Row)
        data.forEach((brand, brandIndex) => {
            let brandHtml = '';

            if (hasLoop) {
                // Process Header (Brand Level)
                let currentHeader = this.replaceBrandPlaceholders(headerPart, brand, pattern1, pattern2, labelMap);

                // Process Loop (Product Level)
                let currentLoop = '';
                brand.products.forEach((product, prodIndex) => {
                    // Apply brand-level replacements first (brand placeholders can appear in loop)
                    let productHtml = this.replaceBrandPlaceholders(loopPart, brand, pattern1, pattern2, labelMap);
                    productHtml = this.replaceProductPlaceholders(productHtml, product, brand, pattern1, pattern2, labelMap);
                    currentLoop += productHtml;
                });

                // Process Footer (Brand Level)
                let currentFooter = this.replaceBrandPlaceholders(footerPart, brand, pattern1, pattern2, labelMap);

                brandHtml = currentHeader + currentLoop + currentFooter;
            } else {
                // Sequential Mode
                let tempHtml = template;

                // 1. Replace Brand Info (Global)
                tempHtml = this.replaceBrandPlaceholders(tempHtml, brand, pattern1, pattern2, labelMap);

                // 2. Replace Numbered Products first
                brand.products.forEach((product, i) => {
                    const suffix = i + 1;
                    tempHtml = this.replaceProductPlaceholders(tempHtml, product, brand, pattern1, pattern2, labelMap, suffix);
                });

                // 3. Replace Generic Placeholders Sequentially
                brand.products.forEach((product) => {
                    tempHtml = this.replaceGenericProductPlaceholdersOnce(tempHtml, product, brand, pattern1, pattern2, labelMap);
                });

                brandHtml = tempHtml;
            }

            finalOutput += brandHtml + '\n';
        });

        return finalOutput.trim();
    },

    replaceBrandPlaceholders: function (text, brand, pattern1, pattern2, labelMap) {
        let result = text;

        // Dynamic Brand Labels
        const brandNameLabel = labelMap.brand.brandName || 'data_1';
        const brandLandingLabel = labelMap.brand.brandLanding || 'data_2';
        const brandDiscLabel = labelMap.brand.brandDisc || 'data_3';

        result = result.replace(new RegExp(this.escapeRegex(`{{${brandNameLabel}}}`), 'g'), brand.name);
        result = result.replace(new RegExp(this.escapeRegex(`{{${brandLandingLabel}}}`), 'g'), brand.landingUrl);
        result = result.replace(new RegExp(this.escapeRegex(`{{${brandDiscLabel}}}`), 'g'), brand.maxDiscount);

        const brandIdStr = String(brand.id).padStart(2, '0');

        const replacePatterns = (pattern) => {
            if (!pattern) return '';
            return pattern
                .replace(/{U1}/gi, brandIdStr)
                .replace(/{U}/gi, brandIdStr) // Legacy
                .replace(/{b}/gi, brandIdStr) // Legacy
                .replace(/{U2}/gi, '00')
                .replace(/{p}/gi, '00');
        };

        let path1 = replacePatterns(pattern1);
        let path2 = replacePatterns(pattern2);

        result = result.replace(/{{이미지경로1}}/g, path1);
        result = result.replace(/{{브랜드이미지경로}}/g, path1);
        result = result.replace(/{{이미지경로}}/g, path1);

        // Replace Brand Comment & Direct {U1}
        result = result.replace(/<!-- 브랜드 \d+부터 오름차순 -->/g, `<!-- 브랜드 ${brandIdStr} -->`);
        result = result.replace(/<!-- 브랜드 01부터 오름차순 -->/g, `<!-- 브랜드 ${brandIdStr} -->`);
        result = result.replace(/{U1}/gi, brandIdStr);

        return result;
    },

    replaceProductPlaceholders: function (text, product, brand, pattern1, pattern2, labelMap, suffix = '') {
        let result = text;
        const s = suffix;

        // Dynamic Product Labels
        const prodNameLabel = labelMap.product.name || 'data_5';
        const prodCodeLabel = labelMap.product.code || 'data_4';
        const prodDiscLabel = labelMap.product.disc || 'data_6';
        const prodPriceLabel = labelMap.product.price || 'data_7';

        if (!suffix && !result.includes(`{{${prodNameLabel}}}`) && !result.includes(`{{${prodCodeLabel}}}`)) return text;

        result = result.replace(new RegExp(this.escapeRegex(`{{${prodNameLabel}${s}}}`), 'g'), product.name);
        result = result.replace(new RegExp(this.escapeRegex(`{{${prodCodeLabel}${s}}}`), 'g'), product.code);
        result = result.replace(new RegExp(this.escapeRegex(`{{${prodPriceLabel}${s}}}`), 'g'), product.price);
        result = result.replace(new RegExp(this.escapeRegex(`{{${prodDiscLabel}${s}}}`), 'g'), product.discount);

        const brandIdStr = String(brand.id).padStart(2, '0');
        const prodIdStr = String(product.id).padStart(2, '0');

        const replacePatterns = (pattern) => {
            if (!pattern) return '';
            return pattern
                .replace(/{U1}/gi, brandIdStr)
                .replace(/{b}/gi, brandIdStr)
                .replace(/{U2}/gi, prodIdStr)
                .replace(/{U}/gi, prodIdStr) // Legacy
                .replace(/{p}/gi, prodIdStr);
        };

        let path1 = replacePatterns(pattern1);
        let path2 = replacePatterns(pattern2);

        result = result.replace(new RegExp(this.escapeRegex(`{{이미지경로1${s}}}`), 'g'), path1);
        result = result.replace(new RegExp(this.escapeRegex(`{{브랜드이미지경로${s}}}`), 'g'), path1);

        result = result.replace(new RegExp(this.escapeRegex(`{{이미지경로2${s}}}`), 'g'), path2);
        result = result.replace(new RegExp(this.escapeRegex(`{{상품이미지경로${s}}}`), 'g'), path2);

        if (suffix) {
            const target = `{{이미지경로${s}}}`;
            if (target !== '{{이미지경로1}}' && target !== '{{이미지경로2}}') {
                result = result.replace(new RegExp(this.escapeRegex(target), 'g'), path2);
            }
        }

        return result;
    },

    replaceGenericProductPlaceholdersOnce: function (text, product, brand, pattern1, pattern2, labelMap) {
        let result = text;

        const brandIdStr = String(brand.id).padStart(2, '0');
        const prodIdStr = String(product.id).padStart(2, '0');

        const replacePatterns = (pattern) => {
            if (!pattern) return '';
            return pattern
                .replace(/{U1}/gi, brandIdStr)
                .replace(/{b}/gi, brandIdStr)
                .replace(/{U2}/gi, prodIdStr)
                .replace(/{U}/gi, prodIdStr)
                .replace(/{p}/gi, prodIdStr);
        };

        let path2 = replacePatterns(pattern2);

        // Dynamic Product Labels
        const prodNameLabel = labelMap.product.name || 'data_5';
        const prodCodeLabel = labelMap.product.code || 'data_4';
        const prodDiscLabel = labelMap.product.disc || 'data_6';
        const prodPriceLabel = labelMap.product.price || 'data_7';

        const replaceFirst = (str, search, replacement) => {
            return str.replace(search, replacement);
        };

        result = replaceFirst(result, `{{${prodNameLabel}}}`, product.name);
        result = replaceFirst(result, `{{${prodCodeLabel}}}`, product.code);
        result = replaceFirst(result, `{{${prodPriceLabel}}}`, product.price);
        result = replaceFirst(result, `{{${prodDiscLabel}}}`, product.discount);

        result = replaceFirst(result, '{{이미지경로2}}', path2);
        result = replaceFirst(result, '{{상품이미지경로}}', path2);

        return result;
    },

    /**
     * Escapes special regex characters in a string.
     */
    escapeRegex: function (str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};
