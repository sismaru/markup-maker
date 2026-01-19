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
     * @param {string} text 
     * @returns {Array<string>}
     */
    parseExcelColumn: function (text) {
        if (!text) return [];

        // Normalize line endings
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 1. Remove all quotes
        const noQuotes = normalized.replace(/"/g, '');

        // 2. Split by newline
        const lines = noQuotes.split('\n');

        // 3. Process lines
        const result = lines
            .map(line => line.replace(/\s+/g, ' ').trim()) // Collapse spaces & trim
            .filter(line => line.length > 0); // Remove empty lines

        return result;
    }
};
