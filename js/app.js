/**
 * app.js
 * Main application controller.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const els = {
        templateInput: document.getElementById('templateInput'),
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
        copyMessage: document.getElementById('copyMessage'),
        excelGridInput: document.getElementById('excelGridInput'),
        parserOutputContainer: document.getElementById('parserOutputContainer'),
        parserResultsList: document.getElementById('parserResultsList'),
        btnParserClear: document.getElementById('btnParserClear'),
        patternPeriod: document.getElementById('patternPeriod'),

        // Custom Template Management Elements
        templateSelector: document.getElementById('templateSelector'),
        customTemplatesList: document.getElementById('customTemplatesList'),
        btnAddTemplate: document.getElementById('btnAddTemplate'),
        saveTemplateTarget: document.getElementById('saveTemplateTarget'),
        btnSaveTemplate: document.getElementById('btnSaveTemplate'),

        // Custom name dialog
        templateNameDialog: document.getElementById('templateNameDialog'),
        templateNameInput: document.getElementById('templateNameInput'),
        templateColumnCount: document.getElementById('templateColumnCount'),
        btnColCountMinus: document.getElementById('btnColCountMinus'),
        btnColCountPlus: document.getElementById('btnColCountPlus'),
        btnTemplateNameConfirm: document.getElementById('btnTemplateNameConfirm'),
        btnTemplateNameCancel: document.getElementById('btnTemplateNameCancel'),

        // Custom columns form
        formDefault: document.getElementById('form-default'),
        customColumnsContainer: document.getElementById('customColumnsContainer')
    };

    // Initialize
    let currentTemplateId = 'default';
    let dragScrollState = null;
    initTabs();
    initSaveLabels();
    switchDataForm('default');
    renderCustomTemplates();
    initDragScroll();

    // Event Listeners
    els.btnConvert.addEventListener('click', handleConvert);
    els.btnCopy.addEventListener('click', handleCopy);
    els.btnCloseModal.addEventListener('click', closeModal);
    if (els.btnClear) els.btnClear.addEventListener('click', clearInputs);
    els.outputModal.addEventListener('click', (e) => {
        if (e.target === els.outputModal) closeModal();
    });
    els.btnAddProduct.addEventListener('click', handleAddProduct);

    // Excel Parser Event Listeners
    if (els.excelGridInput) {
        els.excelGridInput.addEventListener('input', runExcelParser);
        els.btnParserClear.addEventListener('click', clearExcelParser);
        els.patternPeriod.addEventListener('input', runExcelParser);
        els.patternPeriod.addEventListener('change', runExcelParser);
    }

    // Smart Paste for Brand Name (Default form)
    els.colBrandName.addEventListener('paste', handleBrandPaste);
    // Smart Paste for Product 1 Code (Default form)
    els.colP1Code.addEventListener('paste', handleProductPaste);

    // Input listener to auto-cache custom template column data as user types
    if (els.customColumnsContainer) {
        els.customColumnsContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('custom-data-textarea')) {
                saveCurrentTemplateData(currentTemplateId);
            }
        });
    }

    // Default placeholder names used in TEMPLATES presets
    const DEFAULT_LABELS = {
        default: {
            brand: { brandName: 'data_1', brandLanding: 'data_2', brandDisc: 'data_3' },
            product: { code: 'data_4', name: 'data_5', disc: 'data_6', price: 'data_7' }
        }
    };

    // Template Presets
    const TEMPLATES = {
        default: `<!-- 브랜드 01부터 오름차순 -->
<div class="swiper-slide">
	<div class="md_brandSet_img">
		<img src="{{이미지경로1}}" alt="">
		<a href="{{data_2}}" class="md_brandPrd_link">BRAND SHOP</a>
	</div>
	<!-- 대표상품 -->
	<ul class="md_prdList">
		<!-- 대표상품1 -->
		<li>
			<a href="/product/{{data_4}}/detail" class="md_prd_link">
				<div class="md_prd_img">
					<img src="{{이미지경로2}}" alt="">
				</div>
				<div class="md_prd_info">
					<span class="brand">{{data_1}}</span>
					<span class="product">{{data_5}}</span>
					<div class="md_prd_price">
						<span class="discount">{{data_6}}</span>
						<span class="current">{{data_7}}</span>
					</div>
				</div>
			</a>
		</li>
	</ul>
</div>`
    };

    /**
     * Replace default placeholder names in a template string with current label values.
     */
    function applyCurrentLabelsToTemplate(templateStr) {
        const labelMap = getLabelMap();
        let result = templateStr;
        const defaults = DEFAULT_LABELS.default;

        // Brand labels
        for (const field of Object.keys(defaults.brand)) {
            const defaultName = defaults.brand[field];
            const currentName = labelMap.brand[field];
            if (currentName && currentName !== defaultName) {
                result = result.split(`{{${defaultName}}}`).join(`{{${currentName}}}`);
            }
        }

        // Product labels
        for (const field of Object.keys(defaults.product)) {
            const defaultName = defaults.product[field];
            const currentName = labelMap.product[field];
            if (currentName && currentName !== defaultName) {
                result = result.split(`{{${defaultName}}}`).join(`{{${currentName}}}`);
            }
        }

        return result;
    }

    /**
     * Switch data form visibility.
     * Default template: show brand/product tabs.
     * Custom templates: show the flat custom-columns form.
     */
    function switchDataForm(templateType) {
        if (templateType === 'default') {
            if (els.formDefault) els.formDefault.style.display = '';
            if (els.customColumnsContainer) els.customColumnsContainer.classList.add('hidden');
        } else {
            if (els.formDefault) els.formDefault.style.display = 'none';
            if (els.customColumnsContainer) {
                els.customColumnsContainer.classList.remove('hidden');
                const customTemplates = StorageManager.getCustomTemplates();
                const tpl = customTemplates.find(t => t.id === templateType);
                renderCustomColumns(tpl ? (tpl.columnCount || 3) : 3);
            }
        }
    }

    /**
     * Save the current custom template's data inputs to storage.
     */
    function saveCurrentTemplateData(templateId) {
        if (!templateId || templateId === 'default') return;
        const container = els.customColumnsContainer;
        if (!container) return;
        const textareas = container.querySelectorAll('.custom-data-textarea');
        const values = Array.from(textareas).map(ta => ta.value);

        const cache = StorageManager.getTemplateDataCache();
        cache[templateId] = values;
        StorageManager.saveTemplateDataCache(cache);
    }

    /**
     * Restore the custom template's data inputs from storage.
     */
    function restoreTemplateData(templateId) {
        if (!templateId || templateId === 'default') return;
        const container = els.customColumnsContainer;
        if (!container) return;
        const textareas = container.querySelectorAll('.custom-data-textarea');
        const cache = StorageManager.getTemplateDataCache();
        const values = cache[templateId];
        if (values && Array.isArray(values)) {
            textareas.forEach((ta, idx) => {
                if (idx < values.length) {
                    ta.value = values[idx] || '';
                }
            });
        }
    }

    /**
     * Get currently selected template type.
     */
    function getSelectedTemplateType() {
        const checked = document.querySelector('input[name="templateType"]:checked');
        return checked ? checked.value : 'default';
    }

    /**
     * Render N generic data_1 … data_N column textareas into customColumnsContainer.
     * Reuses the existing .col-group / .editor-container CSS classes.
     */
    function renderCustomColumns(n) {
        const container = els.customColumnsContainer;
        if (!container) return;
        container.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'editor-container column-inputs';

        for (let i = 1; i <= n; i++) {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-group';
            colDiv.innerHTML = `
                <div class="label-group">
                    <span class="custom-col-label">data_${i}</span>
                </div>
                <textarea class="custom-data-textarea" data-col="${i}"
                          placeholder="data_${i} 열 붙여넣기"></textarea>
            `;
            wrap.appendChild(colDiv);
        }

        container.appendChild(wrap);

        // Smart paste: paste tab-separated rows into first column → distribute
        const firstTA = container.querySelector('.custom-data-textarea');
        if (firstTA) {
            firstTA.addEventListener('paste', handleCustomColumnPaste);
        }
    }

    /**
     * Smart paste for custom template columns.
     * If pasted text is tab-delimited, distribute columns across the data_N textareas.
     */
    function handleCustomColumnPaste(e) {
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData || !clipboardData.includes('\t')) return;

        e.preventDefault();

        const rows = clipboardData.split(/\r?\n/);
        while (rows.length > 0 && rows[rows.length - 1].trim() === '') rows.pop();

        const parsedRows = rows.map(row => row.split('\t'));
        const maxCols = Math.max(...parsedRows.map(r => r.length));

        const container = els.customColumnsContainer;
        if (!container) return;
        const textareas = container.querySelectorAll('.custom-data-textarea');

        for (let c = 0; c < Math.min(maxCols, textareas.length); c++) {
            textareas[c].value = parsedRows.map(row => (row[c] || '').trim()).join('\n');
        }

        // Save data to cache on smart paste
        saveCurrentTemplateData(currentTemplateId);
    }

    // Dynamic Template Event Handling
    if (els.templateSelector) {
        els.templateSelector.addEventListener('change', (e) => {
            if (e.target.name === 'templateType') {
                const selected = e.target.value;

                // Save current template data before switching
                saveCurrentTemplateData(currentTemplateId);

                switchDataForm(selected);

                // Restore custom template data for the newly selected template
                restoreTemplateData(selected);

                // Update currentTemplateId
                currentTemplateId = selected;

                let templateText = '';
                if (selected === 'default') {
                    templateText = TEMPLATES.default;
                } else {
                    const customTemplates = StorageManager.getCustomTemplates();
                    const matched = customTemplates.find(t => t.id === selected);
                    if (matched) {
                        templateText = matched.template;
                    }
                }

                els.templateInput.value = applyCurrentLabelsToTemplate(templateText);

                // Sync save dropdown
                if (els.saveTemplateTarget && selected.startsWith('custom_')) {
                    els.saveTemplateTarget.value = selected;
                }

                // Restore added product template blocks if any
                const productTabs = document.querySelectorAll('.tab-btn[data-tab^="tab-prod"]');
                for (let i = 2; i <= productTabs.length; i++) {
                    addTemplateBlock(i);
                }
            }
        });

        els.templateSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-template')) {
                e.stopPropagation();
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                deleteCustomTemplate(id);
            }
        });
    }

    if (els.btnAddTemplate) {
        els.btnAddTemplate.addEventListener('click', () => {
            // Reset dialog inputs
            if (els.templateColumnCount) els.templateColumnCount.value = 3;
            openTemplateNameDialog();
        });
    }

    // Column count ± buttons
    if (els.btnColCountMinus) {
        els.btnColCountMinus.addEventListener('click', () => {
            const v = parseInt(els.templateColumnCount.value) || 3;
            if (v > 1) els.templateColumnCount.value = v - 1;
        });
    }
    if (els.btnColCountPlus) {
        els.btnColCountPlus.addEventListener('click', () => {
            const v = parseInt(els.templateColumnCount.value) || 3;
            if (v < 20) els.templateColumnCount.value = v + 1;
        });
    }

    // Custom dialog logic
    function openTemplateNameDialog() {
        if (!els.templateNameDialog) return;
        els.templateNameInput.value = '';
        els.templateNameDialog.classList.remove('hidden');
        setTimeout(() => els.templateNameInput.focus(), 50);
    }

    function closeTemplateNameDialog() {
        if (!els.templateNameDialog) return;
        els.templateNameDialog.classList.add('hidden');
        els.templateNameInput.value = '';
    }

    function confirmAddTemplate() {
        const name = els.templateNameInput.value.trim();
        const columnCount = Math.min(20, Math.max(1, parseInt(els.templateColumnCount ? els.templateColumnCount.value : 3) || 3));

        if (!name) {
            els.templateNameInput.focus();
            els.templateNameInput.style.borderColor = '#ff3b30';
            setTimeout(() => { els.templateNameInput.style.borderColor = ''; }, 1200);
            return;
        }
        closeTemplateNameDialog();

        const newId = 'custom_' + Date.now();
        const newTemplate = {
            id: newId,
            name: name,
            template: els.templateInput.value,
            columnCount: columnCount
        };

        const customTemplates = StorageManager.getCustomTemplates();
        customTemplates.push(newTemplate);
        StorageManager.saveCustomTemplates(customTemplates);

        renderCustomTemplates();

        const radio = document.querySelector(`input[name="templateType"][value="${newId}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    if (els.btnTemplateNameConfirm) {
        els.btnTemplateNameConfirm.addEventListener('click', confirmAddTemplate);
    }
    if (els.btnTemplateNameCancel) {
        els.btnTemplateNameCancel.addEventListener('click', closeTemplateNameDialog);
    }
    if (els.templateNameInput) {
        els.templateNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmAddTemplate();
            if (e.key === 'Escape') closeTemplateNameDialog();
        });
    }
    if (els.templateNameDialog) {
        els.templateNameDialog.addEventListener('click', (e) => {
            if (e.target === els.templateNameDialog) closeTemplateNameDialog();
        });
    }

    if (els.btnSaveTemplate) {
        els.btnSaveTemplate.addEventListener('click', () => {
            const targetId = els.saveTemplateTarget.value;
            if (!targetId) return;

            const customTemplates = StorageManager.getCustomTemplates();
            const idx = customTemplates.findIndex(t => t.id === targetId);
            if (idx === -1) return;

            customTemplates[idx].template = els.templateInput.value;
            StorageManager.saveCustomTemplates(customTemplates);

            // Show inline success feedback
            const btn = els.btnSaveTemplate;
            const orig = btn.textContent;
            btn.textContent = '저장 완료!';
            btn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                btn.textContent = orig;
                btn.style.backgroundColor = '';
            }, 1500);
        });
    }

    function renderCustomTemplates() {
        const customTemplates = StorageManager.getCustomTemplates();
        const checkedRadio = document.querySelector('input[name="templateType"]:checked');
        const currentSelectedValue = checkedRadio ? checkedRadio.value : 'default';

        // 1. Render Top Selector
        if (els.customTemplatesList) {
            els.customTemplatesList.innerHTML = '';
            customTemplates.forEach(tpl => {
                const label = document.createElement('label');
                label.className = 'custom-template-label';
                const isChecked = tpl.id === currentSelectedValue;

                label.innerHTML = `
                    <input type="radio" name="templateType" value="${tpl.id}" ${isChecked ? 'checked' : ''}>
                    <span>${escapeHtml(tpl.name)}</span>
                    <span class="btn-remove-template" data-id="${tpl.id}" title="삭제">×</span>
                `;
                els.customTemplatesList.appendChild(label);
            });
        }

        // 2. Render Bottom Dropdown Options
        if (els.saveTemplateTarget && els.btnSaveTemplate) {
            els.saveTemplateTarget.innerHTML = '';
            if (customTemplates.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '추가된 커스텀 템플릿 없음';
                option.disabled = true;
                option.selected = true;
                els.saveTemplateTarget.appendChild(option);
                els.btnSaveTemplate.disabled = true;
            } else {
                customTemplates.forEach(tpl => {
                    const option = document.createElement('option');
                    option.value = tpl.id;
                    option.textContent = tpl.name;
                    els.saveTemplateTarget.appendChild(option);
                });
                els.btnSaveTemplate.disabled = false;

                if (currentSelectedValue.startsWith('custom_')) {
                    els.saveTemplateTarget.value = currentSelectedValue;
                } else {
                    els.saveTemplateTarget.selectedIndex = 0;
                }
            }
        }

        // 3. Refresh drag-scroll after template DOM changes
        refreshDragScroll();
    }

    function deleteCustomTemplate(id) {
        const customTemplates = StorageManager.getCustomTemplates();
        const tpl = customTemplates.find(t => t.id === id);
        if (!tpl) return;

        const updated = customTemplates.filter(t => t.id !== id);
        StorageManager.saveCustomTemplates(updated);

        // Delete from data cache too, to clean up storage
        const cache = StorageManager.getTemplateDataCache();
        if (cache[id]) {
            delete cache[id];
            StorageManager.saveTemplateDataCache(cache);
        }

        const checkedRadio = document.querySelector('input[name="templateType"]:checked');
        if (checkedRadio && checkedRadio.value === id) {
            const defaultRadio = document.querySelector('input[name="templateType"][value="default"]');
            if (defaultRadio) {
                defaultRadio.checked = true;
                defaultRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        renderCustomTemplates();
    }

    /**
     * Initialize Save Label button handlers via event delegation.
     */
    function initSaveLabels() {
        const containers = [els.tabContentsContainer].filter(Boolean);

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
     */
    function getLabelMap() {
        const labelMap = {
            brand: {
                brandName: 'data_1',
                brandLanding: 'data_2',
                brandDisc: 'data_3'
            },
            product: {
                code: 'data_4',
                name: 'data_5',
                disc: 'data_6',
                price: 'data_7'
            }
        };

        const formContainer = document.getElementById('form-default');
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
            const deleteBtn = e.target.closest('.btn-remove-tab');
            const tabBtn = e.target.closest('.tab-btn');

            if (deleteBtn) {
                e.stopPropagation(); // Prevent tab switch
                const parentTab = deleteBtn.closest('.tab-btn');
                if (parentTab) removeProductTab(parentTab);
            } else if (tabBtn) {
                switchTab(tabBtn);
            }
        });
    }

    function switchTab(clickedBtn) {
        const formDefault = document.getElementById('form-default');
        formDefault.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        formDefault.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked
        clickedBtn.classList.add('active');
        const tabId = clickedBtn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }

    function handleAddProduct() {
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

    function removeProductTab(tabBtn) {
        const tabId = tabBtn.getAttribute('data-tab');
        const prodNum = parseInt(tabId.replace('tab-prod', ''));

        // 상품 1은 기본적으로 삭제 안 되도록 차단
        if (prodNum === 1) return;

        if (!confirm('이 상품 탭을 삭제하시겠습니까? 입력된 데이터도 함께 삭제됩니다.')) return;

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

        // 탭이 없으면 기본 paste 동작
        if (!clipboardData.includes('\t')) return;

        e.preventDefault();

        const rawChunks = clipboardData.split('\t');
        const tokens = [];

        rawChunks.forEach(chunk => {
            let processed = chunk;

            const trimmed = processed.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                let content = trimmed.slice(1, -1);
                content = content.replace(/""/g, '"');
                tokens.push(content.trim());
            } else {
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

    function handleConvert() {
        const selectedType = getSelectedTemplateType();

        // Custom template: use simple row-by-row {{data_N}} replacement
        if (selectedType !== 'default') {
            handleCustomConvert(selectedType);
            return;
        }

        // --- Default template path ---
        const template = els.templateInput.value;
        const pattern1 = document.getElementById('imagePattern1').value;
        const pattern2 = document.getElementById('imagePattern2').value;

        const columns = {
            brandName: els.colBrandName.value,
            brandLanding: els.colBrandLanding.value,
            brandDisc: els.colBrandDisc.value,
            products: []
        };

        const productTabs = document.querySelectorAll('#form-default .tab-content[id^="tab-prod"]');
        productTabs.forEach(tab => {
            const codeInput  = tab.querySelector('textarea[id$="Code"]');
            const nameInput  = tab.querySelector('textarea[id$="Name"]');
            const discInput  = tab.querySelector('textarea[id$="Disc"]');
            const priceInput = tab.querySelector('textarea[id$="Price"]');
            if (codeInput && nameInput && discInput && priceInput) {
                columns.products.push({
                    code:  codeInput.value,
                    name:  nameInput.value,
                    disc:  discInput.value,
                    price: priceInput.value
                });
            }
        });

        if (!template.trim()) { alert('HTML 템플릿을 입력해주세요.'); return; }

        try {
            const parsedData = Parser.parse(columns);
            if (parsedData.length === 0) { alert('데이터를 파싱할 수 없습니다.'); return; }

            const labelMap = getLabelMap();
            const resultHtml = TemplateEngine.generate(template, parsedData, pattern1, pattern2, labelMap);

            els.outputResult.value = resultHtml;
            openModal();
            StorageManager.saveSettings(template, pattern1, pattern2);
        } catch (error) {
            console.error(error);
            alert('변환 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Conversion logic for user-created custom templates.
     * Reads data_1…data_N from the custom columns textareas and replaces
     * {{data_1}}, {{data_2}}, … placeholders in the template for each row.
     */
    function handleCustomConvert(templateId) {
        const customTemplates = StorageManager.getCustomTemplates();
        const tpl = customTemplates.find(t => t.id === templateId);
        if (!tpl) { alert('선택한 템플릿을 찾을 수 없습니다.'); return; }

        const template = els.templateInput.value;
        if (!template.trim()) { alert('HTML 템플릿을 입력해주세요.'); return; }

        const container = els.customColumnsContainer;
        if (!container) return;

        const textareas = container.querySelectorAll('.custom-data-textarea');
        if (textareas.length === 0) { alert('데이터를 입력해주세요.'); return; }

        // Parse each column
        const columns = Array.from(textareas).map(ta => Parser.parseExcelColumn(ta.value));
        const maxRows = Math.max(...columns.map(c => c.length));
        if (maxRows === 0) { alert('데이터를 입력해주세요.'); return; }

        const pattern1 = document.getElementById('imagePattern1').value || '';
        const pattern2 = document.getElementById('imagePattern2').value || '';

        // For each row index, replace all {{data_N}} placeholders and image path patterns
        const results = [];
        for (let i = 0; i < maxRows; i++) {
            let block = template;

            // Replace {{data_N}}
            columns.forEach((col, idx) => {
                const placeholder = `{{data_${idx + 1}}}`;
                block = block.split(placeholder).join(col[i] !== undefined ? col[i] : '');
            });

            const rowIdStr = String(i + 1).padStart(2, '0');

            // Format image path 1 (Brand image pattern) with ascending rowIdStr for {U1}
            let path1 = pattern1
                .replace(/{U1}/gi, rowIdStr)
                .replace(/{U}/gi, rowIdStr)
                .replace(/{b}/gi, rowIdStr)
                .replace(/{U2}/gi, '00')
                .replace(/{p}/gi, '00');

            // Format image path 2 (Product image pattern)
            let path2 = pattern2
                .replace(/{U1}/gi, rowIdStr)
                .replace(/{b}/gi, rowIdStr)
                .replace(/{U2}/gi, rowIdStr)
                .replace(/{U}/gi, rowIdStr)
                .replace(/{p}/gi, rowIdStr);

            // Replace image path placeholders in block
            if (pattern1) {
                block = block.replace(/{{이미지경로1}}/g, path1);
                block = block.replace(/{{브랜드이미지경로}}/g, path1);
                block = block.replace(/{{이미지경로}}/g, path1);
            }
            if (pattern2) {
                block = block.replace(/{{이미지경로2}}/g, path2);
                block = block.replace(/{{상품이미지경로}}/g, path2);
            }

            // Replace brand comments and direct {U1} placeholders if present
            block = block.replace(/<!-- 브랜드 \d+부터 오름차순 -->/g, `<!-- 브랜드 ${rowIdStr} -->`);
            block = block.replace(/<!-- 브랜드 01부터 오름차순 -->/g, `<!-- 브랜드 ${rowIdStr} -->`);
            block = block.replace(/{U1}/gi, rowIdStr);

            results.push(block);
        }

        const resultHtml = results.join('\n');

        els.outputResult.value = resultHtml;
        openModal();
        StorageManager.saveSettings(template, pattern1, pattern2);
    }

    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

            // Clear the cache for the current custom template if active
            if (currentTemplateId !== 'default') {
                saveCurrentTemplateData(currentTemplateId);
            }
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

                els.templateInput.value = before + '\n\t' + after;
            }
        }
    }

    function handleBrandPaste(e) {
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData) return;

        // 탭이 없으면 기본 paste 동작
        if (!clipboardData.includes('\t')) return;

        e.preventDefault();

        // 줄 단위로 분리한 후 끝에 붙은 빈 줄만 제거
        // (중간의 빈 줄은 빈 셀 위치를 유지하기 위해 보존)
        const rows = clipboardData.split(/\r?\n/);
        while (rows.length > 0 && rows[rows.length - 1].trim() === '') rows.pop();

        const brandNames = [];
        const brandLandings = [];   // col[1] → data_2
        const brandDiscs = [];      // col[2] → data_3

        rows.forEach(row => {
            const cols = row.split('\t');
            // (cols[n] || '') 로 항상 값을 push → 빈 셀도 행 위치 유지
            brandNames.push((cols[0] || '').trim());
            brandLandings.push((cols[1] || '').trim());
            brandDiscs.push((cols[2] || '').trim());
        });

        els.colBrandName.value    = brandNames.join('\n');
        els.colBrandLanding.value = brandLandings.join('\n'); // data_2
        els.colBrandDisc.value    = brandDiscs.join('\n');    // data_3
    }


    // ==========================================
    // Excel Grid Parser Functions
    // ==========================================

    function runExcelParser() {
        const text = els.excelGridInput.value;
        const period = parseInt(els.patternPeriod.value) || 3;

        if (!text.trim()) {
            els.parserOutputContainer.classList.add('hidden');
            els.parserResultsList.innerHTML = '';
            return;
        }

        const groups = Parser.parseGrid(text, 'pattern', period);

        if (groups.length === 0) {
            els.parserOutputContainer.classList.add('hidden');
            els.parserResultsList.innerHTML = '';
            return;
        }

        els.parserOutputContainer.classList.remove('hidden');
        els.parserResultsList.innerHTML = '';

        groups.forEach((group, index) => {
            const card = document.createElement('div');
            card.className = 'parser-result-card';

            const joinedValues = group.values.join('\n');

            let destButtonsHtml = '';
            if (currentTemplateId === 'default') {
                const labelMap = getLabelMap();
                destButtonsHtml = `
                    <button class="btn-parser-dest" data-target="brandName">${escapeHtml(labelMap.brand.brandName)}</button>
                    <button class="btn-parser-dest" data-target="brandLanding">${escapeHtml(labelMap.brand.brandLanding)}</button>
                    <button class="btn-parser-dest" data-target="brandDisc">${escapeHtml(labelMap.brand.brandDisc)}</button>
                    <button class="btn-parser-dest" data-target="code">${escapeHtml(labelMap.product.code)}</button>
                    <button class="btn-parser-dest" data-target="name">${escapeHtml(labelMap.product.name)}</button>
                    <button class="btn-parser-dest" data-target="disc">${escapeHtml(labelMap.product.disc)}</button>
                    <button class="btn-parser-dest" data-target="price">${escapeHtml(labelMap.product.price)}</button>
                `;
            } else {
                const customTAs = els.customColumnsContainer.querySelectorAll('.custom-data-textarea');
                customTAs.forEach(ta => {
                    const colNum = ta.getAttribute('data-col');
                    destButtonsHtml += `
                        <button class="btn-parser-dest" data-target="custom_${colNum}">data_${colNum}</button>
                    `;
                });
            }

            card.innerHTML = `
                <div class="parser-card-header">
                    <div class="parser-card-title">
                        <span class="parser-card-badge">${group.name}</span>
                        <span class="parser-card-count">(총 ${group.values.length}개)</span>
                    </div>
                    <div class="parser-card-actions">
                        <button class="btn-parser-copy" data-index="${index}">복사</button>
                    </div>
                </div>
                <div class="parser-card-preview">${escapeHtml(joinedValues)}</div>
                <div class="parser-card-destinations">
                    <span class="parser-dest-label">입력 대상:</span>
                    ${destButtonsHtml}
                </div>
            `;

            // Event listener for Copy button
            card.querySelector('.btn-parser-copy').addEventListener('click', () => {
                navigator.clipboard.writeText(joinedValues).then(() => {
                    const btn = card.querySelector('.btn-parser-copy');
                    const origText = btn.textContent;
                    btn.textContent = '복사됨!';
                    btn.style.backgroundColor = '#28a745';
                    btn.style.color = '#fff';
                    btn.style.borderColor = '#28a745';
                    setTimeout(() => {
                        btn.textContent = origText;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }, 1500);
                });
            });

            // Event listener for destination buttons
            card.querySelectorAll('.btn-parser-dest').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetType = e.target.getAttribute('data-target');
                    const success = fillTargetField(targetType, joinedValues);
                    if (success) {
                        const origBg = btn.style.backgroundColor;
                        const origColor = btn.style.color;
                        btn.textContent = '입력 완료!';
                        btn.style.backgroundColor = '#007aff';
                        btn.style.color = '#fff';
                        setTimeout(() => {
                            let restoredText = '';
                            if (targetType.startsWith('custom_')) {
                                restoredText = `data_${targetType.replace('custom_', '')}`;
                            } else {
                                const currentLabels = getLabelMap();
                                if (['brandName', 'brandLanding', 'brandDisc'].includes(targetType)) {
                                    restoredText = currentLabels.brand[targetType];
                                } else {
                                    restoredText = currentLabels.product[targetType];
                                }
                            }
                            btn.textContent = restoredText || targetType;
                            btn.style.backgroundColor = origBg;
                            btn.style.color = origColor;
                        }, 1500);
                    } else {
                        alert('해당 입력 필드를 찾을 수 없습니다. (현재 선택된 템플릿과 탭을 확인하세요)');
                    }
                });
            });

            els.parserResultsList.appendChild(card);
        });
    }

    function clearExcelParser() {
        els.excelGridInput.value = '';
        els.parserOutputContainer.classList.add('hidden');
        els.parserResultsList.innerHTML = '';
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getTargetTextarea(targetType) {
        if (targetType.startsWith('custom_')) {
            const colNum = targetType.replace('custom_', '');
            return els.customColumnsContainer.querySelector(`.custom-data-textarea[data-col="${colNum}"]`);
        }

        // Default template form fields
        if (targetType === 'brandName') return document.getElementById('colBrandName');
        if (targetType === 'brandLanding') return document.getElementById('colBrandLanding');
        if (targetType === 'brandDisc') return document.getElementById('colBrandDisc');

        // Product fields (Default form: active product tab or tab-prod1)
        const activeTabBtn = document.querySelector('#form-default .tab-btn.active');
        let activeTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'tab-prod1';

        // If user is currently on the brand tab but wants to fill a product field, target the first product tab
        if (activeTabId === 'tab-brand') {
            activeTabId = 'tab-prod1';
        }

        const prodNum = activeTabId.replace('tab-prod', '');

        if (targetType === 'code') return document.getElementById(`colP${prodNum}Code`);
        if (targetType === 'name') return document.getElementById(`colP${prodNum}Name`);
        if (targetType === 'disc') return document.getElementById(`colP${prodNum}Disc`);
        if (targetType === 'price') return document.getElementById(`colP${prodNum}Price`);

        return null;
    }

    function fillTargetField(targetType, text) {
        const textarea = getTargetTextarea(targetType);
        if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            // Trigger animation
            textarea.classList.remove('input-flash');
            void textarea.offsetWidth; // Trigger reflow
            textarea.classList.add('input-flash');

            // Auto-switch tabs
            if (['brandName', 'brandLanding', 'brandDisc'].includes(targetType)) {
                const brandTabBtn = document.querySelector('#form-default .tab-btn[data-tab="tab-brand"]');
                if (brandTabBtn && !brandTabBtn.classList.contains('active')) {
                    switchTab(brandTabBtn);
                }
            } else if (['code', 'name', 'disc', 'price'].includes(targetType)) {
                const activeTabBtn = document.querySelector('#form-default .tab-btn.active');
                let activeTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'tab-prod1';
                if (activeTabId === 'tab-brand') {
                    const prod1TabBtn = document.querySelector('#form-default .tab-btn[data-tab="tab-prod1"]');
                    if (prod1TabBtn) switchTab(prod1TabBtn);
                }
            }

            return true;
        }
        return false;
    }



    function initDragScroll() {
        const scrollEl = document.querySelector('.template-list-scroll');
        if (!scrollEl) return;

        // Prevent duplicate listeners
        if (scrollEl._dragScrollInit) return;
        scrollEl._dragScrollInit = true;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let hasDragged = false;
        const DRAG_THRESHOLD = 5; // px before considered a real drag

        dragScrollState = { scrollEl };

        scrollEl.addEventListener('mousedown', (e) => {
            // Only respond to left-click, ignore on buttons/remove icons
            if (e.button !== 0) return;
            if (e.target.closest('.btn-remove-template') || e.target.closest('.btn-add-template')) return;

            isDown = true;
            hasDragged = false;
            startX = e.pageX - scrollEl.offsetLeft;
            scrollLeft = scrollEl.scrollLeft;
        });

        const handleMouseUp = () => {
            if (!isDown) return;
            isDown = false;
            scrollEl.classList.remove('is-dragging');

            // If a real drag happened, block the next click to prevent radio toggling
            if (hasDragged) {
                scrollEl.addEventListener('click', blockClick, { capture: true, once: true });
            }
        };

        const blockClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
        };

        scrollEl.addEventListener('mouseleave', handleMouseUp);
        document.addEventListener('mouseup', handleMouseUp);

        scrollEl.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            const x = e.pageX - scrollEl.offsetLeft;
            const walk = x - startX;

            if (Math.abs(walk) > DRAG_THRESHOLD) {
                if (!hasDragged) {
                    hasDragged = true;
                    scrollEl.classList.add('is-dragging');
                }
                e.preventDefault();
                scrollEl.scrollLeft = scrollLeft - walk;
            }
        });
    }

    function refreshDragScroll() {
        // After DOM updates, the scroll container stays the same element.
        // Just reset scroll position if the content overflows differently.
        const scrollEl = document.querySelector('.template-list-scroll');
        if (!scrollEl) return;

        // Re-initialize if the element was replaced (shouldn't happen, but safety)
        if (!scrollEl._dragScrollInit) {
            initDragScroll();
        }
    }
});
