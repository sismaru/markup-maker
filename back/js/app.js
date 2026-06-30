/**
 * app.js
 * Main application controller.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const els = {
        templateInput: document.getElementById('templateInput'),
        // Tabs Container
        tabsContainer: document.getElementById('tabsContainer'),
        tabContentsContainer: document.getElementById('tabContentsContainer'),
        btnAddProduct: document.getElementById('btnAddProduct'),

        // Brand Inputs
        colBrandName: document.getElementById('colBrandName'),
        colBrandLanding: document.getElementById('colBrandLanding'),
        colBrandDisc: document.getElementById('colBrandDisc'),

        // Initial Product 1 Inputs
        colP1Code: document.getElementById('colP1Code'),
        colP1Name: document.getElementById('colP1Name'),
        colP1Disc: document.getElementById('colP1Disc'),
        colP1Price: document.getElementById('colP1Price'),

        btnConvert: document.getElementById('btnConvert'),
        btnHistory: document.getElementById('btnHistory'),
        btnClear: document.getElementById('btnClear'),
        outputModal: document.getElementById('outputModal'),
        outputResult: document.getElementById('outputResult'),
        btnCopy: document.getElementById('btnCopy'),
        btnCloseModal: document.getElementById('btnCloseModal'),
        copyMessage: document.getElementById('copyMessage')
    };

    // State
    // productCount is now derived dynamically from DOM to prevent sync issues

    // Initialize
    // loadLastSettings(); // Disabled by user request: Always load default state
    initTabs();
    initSaveLabels();
    switchDataForm('default'); // Set initial form visibility with inline styles

    // Event Listeners
    els.btnConvert.addEventListener('click', handleConvert);
    els.btnCopy.addEventListener('click', handleCopy);
    els.btnCloseModal.addEventListener('click', closeModal);
    if (els.btnClear) els.btnClear.addEventListener('click', clearInputs);
    els.outputModal.addEventListener('click', (e) => {
        if (e.target === els.outputModal) closeModal();
    });
    els.btnAddProduct.addEventListener('click', handleAddProduct);

    // Smart Paste for Brand Name (Default form)
    els.colBrandName.addEventListener('paste', handleBrandPaste);
    // Smart Paste for Product 1 Code (Default form)
    els.colP1Code.addEventListener('paste', handleProductPaste);

    // Smart Paste for Brand List form
    const blBrandName = document.getElementById('blBrandName');
    if (blBrandName) blBrandName.addEventListener('paste', handleBrandListPaste);

    // Smart Paste for Product List form
    const plBrandName = document.getElementById('plBrandName');
    if (plBrandName) plBrandName.addEventListener('paste', handleProductListPaste);

    // Default placeholder names used in TEMPLATES presets
    const DEFAULT_LABELS = {
        brand: { brandName: '브랜드명', brandLanding: '브랜드랜딩', brandDisc: '최대할인율' },
        product: { code: '온라인품번', name: '상품명', disc: '할인율', price: '최종 가격' }
    };

    // Template Presets
    const TEMPLATES = {
        default: `<!-- 브랜드 01부터 오름차순 -->
<div class="swiper-slide">
	<div class="md_brandSet_img">
		<img src="{{이미지경로1}}" alt="">
		<a href="{{브랜드랜딩}}" class="md_brandPrd_link">BRAND SHOP</a>
	</div>
	<!-- 대표상품 -->
	<ul class="md_prdList">
		<!-- 대표상품1 -->
		<li>
			<a href="/product/{{온라인품번}}/detail" class="md_prd_link">
				<div class="md_prd_img">
					<img src="{{이미지경로2}}" alt="">
				</div>
				<div class="md_prd_info">
					<span class="brand">{{브랜드명}}</span>
					<span class="product">{{상품명}}</span>
					<div class="md_prd_price">
						<span class="discount">{{할인율}}</span>
						<span class="current">{{최종 가격}}</span>
					</div>
				</div>
			</a>
		</li>
	</ul>
</div>`,
        brandList: `<li><a href="{{브랜드랜딩}}"><div class="brand-info"><h1 class="brand-name">{{브랜드명}}</h1><span class="shop-now">SHOP NOW ⇀</span></div><div class="sale-info"><span class="badge">&nbsp;</span><span class="percentage">{{최대할인율}}</span></div></a></li>`,
        productList: `<li>
	<a href="/product/{{온라인품번}}/detail" class="md_prd_link">
		<div class="md_prd_img">
			<img src="{{이미지경로2}}" alt="">
		</div>
		<div class="md_prd_info">
			<span class="brand">{{브랜드명}}</span>
			<span class="product">{{상품명}}</span>
			<div class="md_prd_price">
				<span class="discount">{{할인율}}</span>
				<span class="current">{{최종가격}}</span>
			</div>
		</div>
	</a>
</li>`
    };

    /**
     * Replace default placeholder names in a template string with current label values.
     */
    function applyCurrentLabelsToTemplate(templateStr) {
        const labelMap = getLabelMap();
        let result = templateStr;

        // Brand labels
        for (const field of Object.keys(DEFAULT_LABELS.brand)) {
            const defaultName = DEFAULT_LABELS.brand[field];
            const currentName = labelMap.brand[field];
            if (currentName && currentName !== defaultName) {
                result = result.split(`{{${defaultName}}}`).join(`{{${currentName}}}`);
            }
        }

        // Product labels
        for (const field of Object.keys(DEFAULT_LABELS.product)) {
            const defaultName = DEFAULT_LABELS.product[field];
            const currentName = labelMap.product[field];
            if (currentName && currentName !== defaultName) {
                result = result.split(`{{${defaultName}}}`).join(`{{${currentName}}}`);
            }
        }

        return result;
    }

    /**
     * Switch data form visibility based on selected template type.
     */
    function switchDataForm(templateType) {
        const formDefault = document.getElementById('form-default');
        const formBrandList = document.getElementById('form-brandList');
        const formProductList = document.getElementById('form-productList');

        const forms = [formDefault, formBrandList, formProductList];

        // Hide all forms
        forms.forEach(f => {
            f.style.display = 'none';
        });

        // Show selected form with proper flex layout
        let activeForm;
        if (templateType === 'brandList') {
            activeForm = formBrandList;
        } else if (templateType === 'productList') {
            activeForm = formProductList;
        } else {
            activeForm = formDefault;
        }
        activeForm.style.display = 'flex';
        activeForm.style.flexDirection = 'column';
        activeForm.style.flex = '1';
        activeForm.style.overflow = 'hidden';
    }

    /**
     * Get currently selected template type.
     */
    function getSelectedTemplateType() {
        const checked = document.querySelector('input[name="templateType"]:checked');
        return checked ? checked.value : 'default';
    }

    // Template Radio Handler
    document.querySelectorAll('input[name="templateType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selected = e.target.value;

            // Switch data form
            switchDataForm(selected);

            if (TEMPLATES[selected]) {
                // Apply current label values to the preset template
                els.templateInput.value = applyCurrentLabelsToTemplate(TEMPLATES[selected]);

                // Fix: Restore added products if switching to default
                if (selected === 'default') {
                    const productTabs = document.querySelectorAll('.tab-btn[data-tab^="tab-prod"]');
                    // Default template has Product 1. Add blocks for 2..N
                    for (let i = 2; i <= productTabs.length; i++) {
                        addTemplateBlock(i);
                    }
                }
            }
        });
    });

    // Functions

    /**
     * Initialize Save Label button handlers via event delegation.
     */
    function initSaveLabels() {
        // Containers that need save-label delegation
        const containers = [
            els.tabContentsContainer,
            document.getElementById('form-brandList'),
            document.getElementById('form-productList')
        ];

        containers.forEach(container => {
            if (!container) return;

            // Click handler for save buttons
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-save-label')) {
                    const labelGroup = e.target.closest('.label-group');
                    const labelInput = labelGroup.querySelector('.editable-label');
                    if (labelInput) saveLabel(labelInput);
                }
            });

            // Enter key handler for editable-label inputs
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.classList.contains('editable-label')) {
                    e.preventDefault();
                    saveLabel(e.target);
                }
            });
        });
    }

    /**
     * Save a single label: update placeholder in template and data-prev attribute.
     */
    function saveLabel(labelInput) {
        const newLabel = labelInput.value.trim();
        const prevLabel = labelInput.getAttribute('data-prev');

        if (!newLabel) {
            alert('라벨명을 입력해주세요.');
            labelInput.value = prevLabel;
            return;
        }

        if (newLabel === prevLabel) return; // No change

        // Replace old placeholder with new in template
        const oldPlaceholder = `{{${prevLabel}}}`;
        const newPlaceholder = `{{${newLabel}}}`;

        const template = els.templateInput.value;
        if (template.includes(oldPlaceholder)) {
            els.templateInput.value = template.split(oldPlaceholder).join(newPlaceholder);
        }

        // Update data-prev to new value
        labelInput.setAttribute('data-prev', newLabel);
    }

    /**
     * Build a label map from current editable-label values.
     * Returns: { brand: { brandName, brandLanding, brandDisc }, product: { code, name, disc, price } }
     */
    function getLabelMap() {
        const templateType = getSelectedTemplateType();
        const labelMap = {
            brand: {
                brandName: '브랜드명',
                brandLanding: '브랜드랜딩',
                brandDisc: '최대할인율'
            },
            product: {
                code: '온라인품번',
                name: '상품명',
                disc: '할인율',
                price: '최종 가격'
            }
        };

        // Determine which form container to read labels from
        let formContainer;
        if (templateType === 'brandList') {
            formContainer = document.getElementById('form-brandList');
        } else if (templateType === 'productList') {
            formContainer = document.getElementById('form-productList');
        } else {
            formContainer = document.getElementById('form-default');
        }

        if (!formContainer) return labelMap;

        // Read all editable labels from the active form
        formContainer.querySelectorAll('.editable-label').forEach(input => {
            const field = input.getAttribute('data-field');
            if (field && labelMap.brand.hasOwnProperty(field)) {
                labelMap.brand[field] = input.value.trim() || labelMap.brand[field];
            }
            if (field && labelMap.product.hasOwnProperty(field)) {
                labelMap.product[field] = input.value.trim() || labelMap.product[field];
            }
        });

        return labelMap;
    }

    function initTabs() {
        // Delegate click for tabs
        els.tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                switchTab(e.target);
            } else if (e.target.classList.contains('btn-remove-tab')) {
                // Handle Remove
                e.stopPropagation(); // Prevent tab switch
                const tabBtn = e.target.closest('.tab-btn');
                removeProductTab(tabBtn);
            }
        });
    }

    function switchTab(clickedBtn) {
        const formDefault = document.getElementById('form-default');
        // Only affect tabs within form-default, not Brand List / Product List forms
        formDefault.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        formDefault.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked
        clickedBtn.classList.add('active');
        const tabId = clickedBtn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }

    function handleAddProduct() {
        // Calculate next number based on current count of product tabs
        const currentTabs = document.querySelectorAll('.tab-btn[data-tab^="tab-prod"]');
        const nextNum = currentTabs.length + 1;
        const newTabId = `tab-prod${nextNum}`;

        // 1. Create Tab Button
        const newBtn = document.createElement('button');
        newBtn.className = 'tab-btn';
        newBtn.setAttribute('data-tab', newTabId);
        newBtn.innerHTML = `상품 ${nextNum} <span class="btn-remove-tab">x</span>`;

        // Insert before the Add button
        els.tabsContainer.insertBefore(newBtn, els.btnAddProduct);

        // 2. Create Tab Content
        // Read current product label values from the first product tab
        const currentLabelMap = getLabelMap();
        const codeLabel = currentLabelMap.product.code;
        const nameLabel = currentLabelMap.product.name;
        const discLabel = currentLabelMap.product.disc;
        const priceLabel = currentLabelMap.product.price;

        const newContent = document.createElement('div');
        newContent.id = newTabId;
        newContent.className = 'tab-content';
        newContent.innerHTML = `
            <div class="col-group">
                <div class="label-group">
                    <input type="text" class="editable-label" data-field="code" data-prev="${codeLabel}" value="${codeLabel}">
                    <button class="btn-save-label" title="저장">저장</button>
                </div>
                <textarea id="colP${nextNum}Code" placeholder="품번 열 붙여넣기"></textarea>
            </div>
            <div class="col-group">
                <div class="label-group">
                    <input type="text" class="editable-label" data-field="name" data-prev="${nameLabel}" value="${nameLabel}">
                    <button class="btn-save-label" title="저장">저장</button>
                </div>
                <textarea id="colP${nextNum}Name" placeholder="상품명 열 붙여넣기"></textarea>
            </div>
            <div class="col-group">
                <div class="label-group">
                    <input type="text" class="editable-label" data-field="disc" data-prev="${discLabel}" value="${discLabel}">
                    <button class="btn-save-label" title="저장">저장</button>
                </div>
                <textarea id="colP${nextNum}Disc" placeholder="할인율 열 붙여넣기"></textarea>
            </div>
            <div class="col-group">
                <div class="label-group">
                    <input type="text" class="editable-label" data-field="price" data-prev="${priceLabel}" value="${priceLabel}">
                    <button class="btn-save-label" title="저장">저장</button>
                </div>
                <textarea id="colP${nextNum}Price" placeholder="가격 열 붙여넣기"></textarea>
            </div>
        `;
        els.tabContentsContainer.appendChild(newContent);

        // Attach Paste Listener to new Code Input
        const newCodeInput = newContent.querySelector(`#colP${nextNum}Code`);
        if (newCodeInput) {
            newCodeInput.addEventListener('paste', handleProductPaste);
        }

        // 3. Sync Template
        addTemplateBlock(nextNum);

        // Switch to new tab
        switchTab(newBtn);
    }

    // ... (rest of functions) ...

    function removeProductTab(tabBtn) {
        if (!confirm('이 상품 탭을 삭제하시겠습니까? 입력된 데이터도 함께 삭제됩니다.')) return;

        const tabId = tabBtn.getAttribute('data-tab');
        const prodNum = parseInt(tabId.replace('tab-prod', ''));

        const content = document.getElementById(tabId);

        // Remove elements
        tabBtn.remove();
        content.remove();

        // Sync Template
        removeTemplateBlock(prodNum);

        // Renumber subsequent products
        renumberProducts(prodNum);

        // If active tab was removed, switch to the last available tab
        if (tabBtn.classList.contains('active')) {
            const allTabs = els.tabsContainer.querySelectorAll('.tab-btn');
            if (allTabs.length > 0) {
                switchTab(allTabs[allTabs.length - 1]);
            }
        }
    }

    function handleProductPaste(e) {
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData) return;

        // 탭이 없으면 기본 paste 동작 (해당 textarea에만 입력)
        if (!clipboardData.includes('\t')) return;

        e.preventDefault();

        // New Parsing Logic:
        // 1. Split by Tab
        // 2. Process chunks (Unquote & Trim OR Split by Newline)
        // 3. Flatten and Group by 4

        const rawChunks = clipboardData.split('\t');
        const tokens = [];

        rawChunks.forEach(chunk => {
            let processed = chunk;

            // Check for quotes (Excel artifact for multiline/special chars)
            const trimmed = processed.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                // It's a quoted cell.
                // Remove start/end quotes
                let content = trimmed.slice(1, -1);
                // Unescape double quotes ("" -> ")
                content = content.replace(/""/g, '"');
                // Trim to remove internal newlines (User request: "backspace concept")
                tokens.push(content.trim());
            } else {
                // Not quoted. Might contain row breaks (newlines).
                // Split by newline
                const parts = processed.split(/\r?\n/);
                parts.forEach(p => {
                    if (p.trim()) tokens.push(p.trim());
                });
            }
        });

        const codes = [];
        const names = [];
        const prices = [];
        const discs = [];

        // Distribute by Modulo 4
        // Order: Code, Name, Discount, Price
        tokens.forEach((token, index) => {
            const mod = index % 4;
            if (mod === 0) codes.push(token);
            if (mod === 1) names.push(token);
            if (mod === 2) discs.push(token);
            if (mod === 3) prices.push(token);
        });

        // Find sibling inputs
        const targetInput = e.target;
        const parentTab = targetInput.closest('.tab-content');

        if (parentTab) {
            const codeInput = parentTab.querySelector('textarea[id$="Code"]');
            const nameInput = parentTab.querySelector('textarea[id$="Name"]');
            const discInput = parentTab.querySelector('textarea[id$="Disc"]');
            const priceInput = parentTab.querySelector('textarea[id$="Price"]');

            if (codeInput) codeInput.value = codes.join('\n');
            if (nameInput) nameInput.value = names.join('\n');
            if (priceInput) priceInput.value = prices.join('\n');
            if (discInput) discInput.value = discs.join('\n');
        }
    }

    function renumberProducts(startFrom) {
        const allTabs = document.querySelectorAll('.tab-btn[data-tab^="tab-prod"]');

        allTabs.forEach(tab => {
            const tabId = tab.getAttribute('data-tab');
            const currentNum = parseInt(tabId.replace('tab-prod', ''));

            if (currentNum > startFrom) {
                const newNum = currentNum - 1;

                // 1. Update Tab
                tab.setAttribute('data-tab', `tab-prod${newNum}`);
                tab.innerHTML = `상품 ${newNum} <span class="btn-remove-tab">x</span>`;

                // 2. Update Content ID
                const content = document.getElementById(tabId);
                if (content) {
                    content.id = `tab-prod${newNum}`;

                    // Update Input IDs
                    const inputs = content.querySelectorAll('textarea');
                    inputs.forEach(input => {
                        if (input.id.includes(`P${currentNum}`)) {
                            input.id = input.id.replace(`P${currentNum}`, `P${newNum}`);
                        }
                    });
                }

                // 3. Update Template Comment
                updateTemplateBlockNumber(currentNum, newNum);
            }
        });
    }

    function updateTemplateBlockNumber(oldNum, newNum) {
        let template = els.templateInput.value;
        const oldComment = `<!-- 대표상품${oldNum} -->`;
        const newComment = `<!-- 대표상품${newNum} -->`;

        if (template.includes(oldComment)) {
            els.templateInput.value = template.replace(oldComment, newComment);
        }
    }

    function loadLastSettings() {
        const settings = StorageManager.loadSettings();
        if (settings.template) {
            // Check if it's the old default template (has Product 4)
            if (settings.template.includes('<!-- 대표상품4 -->')) {
                console.log('Detected old default template, reverting to new default.');
            } else {
                els.templateInput.value = settings.template;
            }
        }
        if (settings.pattern1) document.getElementById('imagePattern1').value = settings.pattern1;
        if (settings.pattern2) document.getElementById('imagePattern2').value = settings.pattern2;
    }

    function handleConvert() {
        const template = els.templateInput.value;
        const pattern1 = document.getElementById('imagePattern1').value;
        const pattern2 = document.getElementById('imagePattern2').value;
        const templateType = getSelectedTemplateType();

        let columns;

        if (templateType === 'brandList') {
            // Brand List: only brand columns from form-brandList
            columns = {
                brandName: document.getElementById('blBrandName').value,
                brandLanding: document.getElementById('blBrandLanding').value,
                brandDisc: document.getElementById('blBrandDisc').value,
                products: []
            };
        } else if (templateType === 'productList') {
            // Product List: brand name + product columns from form-productList
            columns = {
                brandName: document.getElementById('plBrandName').value,
                brandLanding: '',
                brandDisc: '',
                products: [{
                    code: document.getElementById('plCode').value,
                    name: document.getElementById('plName').value,
                    disc: document.getElementById('plDisc').value,
                    price: document.getElementById('plPrice').value
                }]
            };
        } else {
            // Default: gather from default form
            columns = {
                brandName: els.colBrandName.value,
                brandLanding: els.colBrandLanding.value,
                brandDisc: els.colBrandDisc.value,
                products: []
            };

            // Find all product content divs
            const productTabs = document.querySelectorAll('#form-default .tab-content[id^="tab-prod"]');

            productTabs.forEach(tab => {
                const codeInput = tab.querySelector('textarea[id$="Code"]');
                const nameInput = tab.querySelector('textarea[id$="Name"]');
                const discInput = tab.querySelector('textarea[id$="Disc"]');
                const priceInput = tab.querySelector('textarea[id$="Price"]');

                if (codeInput && nameInput && discInput && priceInput) {
                    columns.products.push({
                        code: codeInput.value,
                        name: nameInput.value,
                        disc: discInput.value,
                        price: priceInput.value
                    });
                }
            });
        }

        if (!template.trim()) {
            alert('HTML 템플릿을 입력해주세요.');
            return;
        }

        try {
            // 1. Parse Data (Columns)
            const parsedData = Parser.parse(columns);

            if (parsedData.length === 0) {
                alert('데이터를 파싱할 수 없습니다.');
                return;
            }

            // 2. Generate Code (with dynamic label map)
            const labelMap = getLabelMap();
            const resultHtml = TemplateEngine.generate(template, parsedData, pattern1, pattern2, labelMap);

            // 3. Show Result
            els.outputResult.value = resultHtml;
            openModal();

            // 4. Save History & Settings
            StorageManager.saveSettings(template, pattern1, pattern2);

        } catch (error) {
            console.error(error);
            alert('변환 중 오류가 발생했습니다: ' + error.message);
        }
    }

    function handleCopy() {
        els.outputResult.select();
        document.execCommand('copy');

        els.copyMessage.classList.remove('hidden');
        setTimeout(() => {
            els.copyMessage.classList.add('hidden');
        }, 2000);
    }

    function openModal() {
        els.outputModal.classList.remove('hidden');
    }

    function closeModal() {
        els.outputModal.classList.add('hidden');
    }

    function clearInputs() {
        if (confirm('입력한 내용을 모두 지우시겠습니까?')) {
            els.templateInput.value = '';
            // Clear all inputs
            const inputs = document.querySelectorAll('.column-inputs textarea');
            inputs.forEach(input => input.value = '');
        }
    }

    function addTemplateBlock(num) {
        const template = els.templateInput.value;
        const listEndIndex = template.lastIndexOf('</ul>');

        if (listEndIndex === -1) return; // Can't find list to append to

        // Use current label values for placeholders
        const labelMap = getLabelMap();
        const brandNameLabel = labelMap.brand.brandName;
        const prodCodeLabel = labelMap.product.code;
        const prodNameLabel = labelMap.product.name;
        const prodDiscLabel = labelMap.product.disc;
        const prodPriceLabel = labelMap.product.price;

        // Ensure clean indentation
        const newBlock = `
		<!-- 대표상품${num} -->
		<li>
			<a href="/product/{{${prodCodeLabel}}}/detail" class="md_prd_link">
				<div class="md_prd_img">
					<img src="{{이미지경로2}}" alt="">
				</div>
				<div class="md_prd_info">
					<span class="brand">{{${brandNameLabel}}}</span>
					<span class="product">{{${prodNameLabel}}}</span>
					<div class="md_prd_price">
						<span class="discount">{{${prodDiscLabel}}}</span>
						<span class="current">{{${prodPriceLabel}}}</span>
					</div>
				</div>
			</a>
		</li>`;

        // Insert before </ul>
        const beforeEnd = template.slice(0, listEndIndex);
        const afterEnd = template.slice(listEndIndex);

        els.templateInput.value = beforeEnd.trimEnd() + newBlock + '\n\t' + afterEnd;
    }

    function removeTemplateBlock(num) {
        let template = els.templateInput.value;

        const startComment = `<!-- 대표상품${num} -->`;
        const startIndex = template.indexOf(startComment);

        if (startIndex !== -1) {
            const liEnd = '</li>';
            const endIndex = template.indexOf(liEnd, startIndex);

            if (endIndex !== -1) {
                const blockEnd = endIndex + liEnd.length;

                // Remove the block and trailing whitespace up to next tag
                let removeEnd = blockEnd;
                while (removeEnd < template.length && (template[removeEnd] === '\n' || template[removeEnd] === '\r' || template[removeEnd] === '\t' || template[removeEnd] === ' ')) {
                    removeEnd++;
                }

                const before = template.slice(0, startIndex).trimEnd();
                const after = template.slice(removeEnd);

                // Re-add one newline/tab if we are not at the end of the list
                if (after.startsWith('</ul>')) {
                    els.templateInput.value = before + '\n\t' + after;
                } else {
                    els.templateInput.value = before + '\n\t' + after;
                }
            }
        }
    }

    function handleBrandPaste(e) {
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData) return;

        // 탭이 없으면 기본 paste 동작 (해당 textarea에만 입력)
        if (!clipboardData.includes('\t')) return;

        e.preventDefault();

        const rows = clipboardData.split(/\r?\n/).filter(row => row.trim() !== '');

        const brandNames = [];
        const brandDiscs = [];
        const brandLandings = [];

        rows.forEach(row => {
            const cols = row.split('\t');
            // Expected format: Brand Name | Max Discount | Brand Landing
            if (cols.length >= 1) brandNames.push(cols[0].trim());
            if (cols.length >= 2) brandDiscs.push(cols[1].trim());
            if (cols.length >= 3) brandLandings.push(cols[2].trim());
        });

        // Append to existing values or replace? 
        // Usually paste replaces selection or inserts at cursor, but for this bulk operation, 
        // replacing the content or appending to empty is safer. 
        // Let's just set the values, assuming the user wants to fill the columns.
        // If the user wants to append, they can manually do it, but "Smart Paste" usually implies filling the form.
        // However, standard paste behavior inserts at cursor. 
        // Given the "Spreadsheet to Form" nature, replacing content or appending to end is common.
        // Let's go with: If the field is empty, set it. If not, append with newline?
        // Simpler approach for now: Just set the values as if filling the columns from scratch, 
        // but let's respect if there's existing content? 
        // The user request says "automatically enter into the next textarea", implying a bulk fill.
        // Let's overwrite for now as it's the most likely intended behavior for a "paste from excel" feature.

        els.colBrandName.value = brandNames.join('\n');
        els.colBrandDisc.value = brandDiscs.join('\n');
        els.colBrandLanding.value = brandLandings.join('\n');
    }

    /**
     * Smart Paste for Brand List form.
     * Tab-separated columns: 브랜드명 | 최대할인율 | 브랜드랜딩
     */
    function handleBrandListPaste(e) {
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData) return;

        // 탭이 없으면 기본 paste 동작 (해당 textarea에만 입력)
        if (!clipboardData.includes('\t')) return;

        e.preventDefault();

        const rows = clipboardData.split(/\r?\n/).filter(row => row.trim() !== '');

        const brandNames = [];
        const brandDiscs = [];
        const brandLandings = [];

        rows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length >= 1) brandNames.push(cols[0].trim());
            if (cols.length >= 2) brandDiscs.push(cols[1].trim());
            if (cols.length >= 3) brandLandings.push(cols[2].trim());
        });

        document.getElementById('blBrandName').value = brandNames.join('\n');
        document.getElementById('blBrandDisc').value = brandDiscs.join('\n');
        document.getElementById('blBrandLanding').value = brandLandings.join('\n');
    }

    /**
     * Smart Paste for Product List form.
     * Tab-separated columns: 브랜드명 | 온라인품번 | 상품명 | 할인율 | 최종가격
     */
    function handleProductListPaste(e) {
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData) return;

        // 탭이 없으면 기본 paste 동작 (해당 textarea에만 입력)
        if (!clipboardData.includes('\t')) return;

        e.preventDefault();

        const rows = clipboardData.split(/\r?\n/).filter(row => row.trim() !== '');

        const brandNames = [];
        const codes = [];
        const names = [];
        const prices = [];
        const discs = [];

        rows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length >= 1) brandNames.push(cols[0].trim());
            if (cols.length >= 2) codes.push(cols[1].trim());
            if (cols.length >= 3) names.push(cols[2].trim());
            if (cols.length >= 4) discs.push(cols[3].trim());
            if (cols.length >= 5) prices.push(cols[4].trim());
        });

        document.getElementById('plBrandName').value = brandNames.join('\n');
        document.getElementById('plCode').value = codes.join('\n');
        document.getElementById('plName').value = names.join('\n');
        document.getElementById('plDisc').value = discs.join('\n');
        document.getElementById('plPrice').value = prices.join('\n');
    }
});
