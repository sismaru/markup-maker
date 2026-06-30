/**
 * parser.js
 * Parses column-based inputs into structured data.
 */

const Parser = {
    /**
     * Parses separate column arrays into a structured array of Brand objects.
     * @param {Object} columns - Object containing arrays of strings for each column.
     * @returns {Array} Array of Brand objects.
     */
    parse: function (columns) {
        const brands = [];

        // 1. Parse Brand columns
        const brandNames = this.parseExcelColumn(columns.brandName);
        const brandLandings = this.parseExcelColumn(columns.brandLanding);
        const brandDiscs = this.parseExcelColumn(columns.brandDisc);

        // 2. Parse Product columns dynamically
        // columns.products is an array of objects: { code, name, disc, price } (raw strings)
        const parsedProducts = columns.products.map(prod => ({
            codes: this.parseExcelColumn(prod.code),
            names: this.parseExcelColumn(prod.name),
            discs: this.parseExcelColumn(prod.disc),
            prices: this.parseExcelColumn(prod.price)
        }));

        // Determine Row Count based on maximum length of any column
        let maxLen = Math.max(brandNames.length, brandLandings.length, brandDiscs.length);

        parsedProducts.forEach(p => {
            maxLen = Math.max(maxLen, p.codes.length, p.names.length, p.discs.length, p.prices.length);
        });

        const rowCount = maxLen;
        if (rowCount === 0) return [];

        // 3. Loop and Stitch
        for (let i = 0; i < rowCount; i++) {
            const brandId = i + 1;

            // Create Brand Object
            const brand = {
                id: brandId,
                name: brandNames[i] || '',
                landingUrl: brandLandings[i] || '',
                maxDiscount: brandDiscs[i] || '',
                products: []
            };

            // Helper to add product
            const addProduct = (id, code, name, disc, price) => {
                brand.products.push({
                    id: id,
                    code: code || '',
                    name: name || '',
                    discount: disc || '',
                    price: price || ''
                });
            };

            // Add Products (Dynamic Count)
            let validProdCount = 0;
            parsedProducts.forEach((p, index) => {
                // Check validity before adding to increment ID correctly
                if ((p.names[i] && p.names[i].trim()) || (p.codes[i] && p.codes[i].trim())) {
                    validProdCount++;
                    addProduct(validProdCount, p.codes[i], p.names[i], p.discs[i], p.prices[i]);
                }
            });

            brands.push(brand);
        }

        return brands;
    },

    /**
     * Parses a single string of Excel-pasted column data.
     * Handles quoted values with newlines correctly.
     * Interior empty lines are preserved to maintain row alignment
     * (e.g. when a cell in the middle has no value).
     * @param {string} text 
     * @returns {Array<string>}
     */
    parseExcelColumn: function (text) {
        if (!text) return [];

        // Normalize line endings
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 1. Remove all quotes
        const noQuotes = normalized.replace(/"/g, '');

        // 2. Split by newline and trim each line
        const lines = noQuotes.split('\n').map(line => line.replace(/\s+/g, ' ').trim());

        // 3. Trim leading and trailing empty lines only.
        //    Interior empty lines are kept so that empty cells (e.g. a missing
        //    percentage value) stay in the correct position relative to other columns.
        let start = 0;
        let end = lines.length - 1;
        while (start <= end && lines[start] === '') start++;
        while (end >= start && lines[end] === '') end--;

        return lines.slice(start, end + 1);
    },

    /**
     * Parses TSV text correctly, respecting double quotes and newlines.
     * @param {string} text 
     * @returns {Array<Array<string>>} 2D array of grid cells.
     */
    parseTSV: function(text) {
        if (!text) return [];
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentCell += '"';
                        i++; // skip next quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentCell += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === '\t') {
                    currentRow.push(currentCell.trim());
                    currentCell = '';
                } else if (char === '\r') {
                    if (nextChar === '\n') {
                        i++;
                    }
                    currentRow.push(currentCell.trim());
                    rows.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                } else if (char === '\n') {
                    currentRow.push(currentCell.trim());
                    rows.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
        }

        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
        }

        // Filter out empty rows
        return rows.filter(row => row.some(cell => cell !== ''));
    },

    /**
     * Parses a multi-row, multi-column grid from Excel.
     * @param {string} text - Raw tab-separated Excel grid.
     * @param {string} mode - 'label' or 'pattern' (ignored now)
     * @param {number} period - Repeating pattern period (e.g. 3)
     * @returns {Array<Object>} Array of groups: { name, key, values }
     */
    parseGrid: function(text, mode, period) {
        if (!text || !text.trim()) return [];

        const activeRows = this.parseTSV(text);
        if (activeRows.length === 0) return [];

        const groups = [];
        for (let i = 0; i < period; i++) {
            groups.push({
                name: `${i + 1}번째 열 데이터`,
                key: `column_${i}`,
                values: []
            });
        }

        activeRows.forEach((row, rowIndex) => {
            const groupIdx = rowIndex % period;
            row.forEach(cell => {
                if (cell !== undefined && cell !== null && cell !== '') {
                    groups[groupIdx].values.push(cell);
                }
            });
        });

        // Filter out empty groups
        return groups.filter(g => g.values.length > 0);
    }
};

