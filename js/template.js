/**
 * template.js
 * Handles replacing placeholders in the HTML template with parsed data.
 */

const TemplateEngine = {
    /**
     * Generates the final HTML code.
     * @param {string} template - The HTML template string.
     * @param {Array} data - Array of Brand objects parsed from Excel.
     * @param {string} pattern1 - Image path pattern 1 (Brand).
     * @param {string} pattern2 - Image path pattern 2 (Product).
     * @returns {string} The generated HTML.
     */
    generate: function (template, data, pattern1, pattern2) {
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
            // Implicit Loop Detection
            const placeholder = '{{상품명}}';
            const count = (template.match(new RegExp(placeholder, 'g')) || []).length;

            if (count === 1) {
                const match = template.match(/(\s*<li\b[^>]*>[\s\S]*?{{(?:상품명|온라인품번)}}[\s\S]*?<\/li>\s*)/i);

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
                let currentHeader = this.replaceBrandPlaceholders(headerPart, brand, pattern1, pattern2);

                // Process Loop (Product Level)
                let currentLoop = '';
                brand.products.forEach((product, prodIndex) => {
                    let productHtml = this.replaceProductPlaceholders(loopPart, product, brand, pattern1, pattern2);
                    currentLoop += productHtml;
                });

                // Process Footer (Brand Level)
                let currentFooter = this.replaceBrandPlaceholders(footerPart, brand, pattern1, pattern2);

                brandHtml = currentHeader + currentLoop + currentFooter;
            } else {
                // Sequential Mode
                let tempHtml = template;

                // 1. Replace Brand Info (Global)
                tempHtml = this.replaceBrandPlaceholders(tempHtml, brand, pattern1, pattern2);

                // 2. Replace Numbered Products first
                brand.products.forEach((product, i) => {
                    const suffix = i + 1;
                    tempHtml = this.replaceProductPlaceholders(tempHtml, product, brand, pattern1, pattern2, suffix);
                });

                // 3. Replace Generic Placeholders Sequentially
                brand.products.forEach((product) => {
                    tempHtml = this.replaceGenericProductPlaceholdersOnce(tempHtml, product, brand, pattern1, pattern2);
                });

                brandHtml = tempHtml;
            }

            finalOutput += brandHtml + '\n';
        });

        return finalOutput.trim();
    },

    replaceBrandPlaceholders: function (text, brand, pattern1, pattern2) {
        let result = text;

        // Basic Brand Info
        result = result.replace(/{{브랜드명}}/g, brand.name);
        result = result.replace(/{{브랜드랜딩}}/g, brand.landingUrl);
        result = result.replace(/{{최대할인율}}/g, brand.maxDiscount);

        const brandIdStr = String(brand.id).padStart(2, '0');

        // Generate Paths
        // {U1} = Brand ID
        // {U2} = Product ID (Not applicable in Brand context, default to 00)
        // Legacy support: {U} = Brand ID in Brand context

        const replacePatterns = (pattern) => {
            return pattern
                .replace(/{U1}/g, brandIdStr)
                .replace(/{U}/g, brandIdStr) // Legacy
                .replace(/{b}/g, brandIdStr) // Legacy
                .replace(/{U2}/g, '00')
                .replace(/{p}/g, '00');
        };

        let path1 = replacePatterns(pattern1);
        let path2 = replacePatterns(pattern2);

        result = result.replace(/{{이미지경로1}}/g, path1);
        result = result.replace(/{{브랜드이미지경로}}/g, path1);
        result = result.replace(/{{이미지경로}}/g, path1);

        // Replace Brand Comment
        result = result.replace(/<!-- 브랜드 01부터 오름차순 -->/g, `<!-- 브랜드 ${brandIdStr} -->`);

        return result;
    },

    replaceProductPlaceholders: function (text, product, brand, pattern1, pattern2, suffix = '') {
        if (!suffix && !text.includes('{{상품명}}') && !text.includes('{{온라인품번}}')) return text;

        let result = text;
        const s = suffix;

        result = result.replace(new RegExp(`{{상품명${s}}}`, 'g'), product.name);
        result = result.replace(new RegExp(`{{온라인품번${s}}}`, 'g'), product.code);
        result = result.replace(new RegExp(`{{최종가격${s}}}`, 'g'), product.price);
        result = result.replace(new RegExp(`{{최종 가격${s}}}`, 'g'), product.price);
        result = result.replace(new RegExp(`{{할인율${s}}}`, 'g'), product.discount);

        const brandIdStr = String(brand.id).padStart(2, '0');
        const prodIdStr = String(product.id).padStart(2, '0');

        // Generate Paths
        // {U1} = Brand ID
        // {U2} = Product ID
        // Legacy: {U} = Product ID in Product context

        const replacePatterns = (pattern) => {
            return pattern
                .replace(/{U1}/g, brandIdStr)
                .replace(/{b}/g, brandIdStr)
                .replace(/{U2}/g, prodIdStr)
                .replace(/{U}/g, prodIdStr) // Legacy: In product context, U was product ID
                .replace(/{p}/g, prodIdStr);
        };

        let path1 = replacePatterns(pattern1);
        let path2 = replacePatterns(pattern2);

        result = result.replace(new RegExp(`{{이미지경로1${s}}}`, 'g'), path1);
        result = result.replace(new RegExp(`{{브랜드이미지경로${s}}}`, 'g'), path1);

        result = result.replace(new RegExp(`{{이미지경로2${s}}}`, 'g'), path2);
        result = result.replace(new RegExp(`{{상품이미지경로${s}}}`, 'g'), path2);

        if (suffix) {
            const target = `{{이미지경로${s}}}`;
            // Prevent overwriting reserved generic placeholders
            if (target !== '{{이미지경로1}}' && target !== '{{이미지경로2}}') {
                result = result.replace(new RegExp(target, 'g'), path2);
            }
        }

        return result;
    },

    replaceGenericProductPlaceholdersOnce: function (text, product, brand, pattern1, pattern2) {
        let result = text;

        const brandIdStr = String(brand.id).padStart(2, '0');
        const prodIdStr = String(product.id).padStart(2, '0');

        const replacePatterns = (pattern) => {
            return pattern
                .replace(/{U1}/g, brandIdStr)
                .replace(/{b}/g, brandIdStr)
                .replace(/{U2}/g, prodIdStr)
                .replace(/{U}/g, prodIdStr)
                .replace(/{p}/g, prodIdStr);
        };

        let path2 = replacePatterns(pattern2);

        const replaceFirst = (str, search, replacement) => {
            return str.replace(search, replacement);
        };

        result = replaceFirst(result, '{{상품명}}', product.name);
        result = replaceFirst(result, '{{온라인품번}}', product.code);
        result = replaceFirst(result, '{{최종가격}}', product.price);
        result = replaceFirst(result, '{{최종 가격}}', product.price);
        result = replaceFirst(result, '{{할인율}}', product.discount);

        result = replaceFirst(result, '{{이미지경로2}}', path2);
        result = replaceFirst(result, '{{상품이미지경로}}', path2);

        return result;
    }
};
