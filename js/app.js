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

    // Event Listeners
    els.btnConvert.addEventListener('click', handleConvert);
    els.btnCopy.addEventListener('click', handleCopy);
    els.btnCloseModal.addEventListener('click', closeModal);
    els.btnClear.addEventListener('click', clearInputs);
    els.outputModal.addEventListener('click', (e) => {
        if (e.target === els.outputModal) closeModal();
    });
    els.btnAddProduct.addEventListener('click', handleAddProduct);

    // Smart Paste for Brand Name
    els.colBrandName.addEventListener('paste', handleBrandPaste);
    // Smart Paste for Product 1 Code
    els.colP1Code.addEventListener('paste', handleProductPaste);

    // Functions

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
        // Remove active class from all
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

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
        const newContent = document.createElement('div');
        newContent.id = newTabId;
        newContent.className = 'tab-content';
        newContent.innerHTML = `
            <div class="col-group">
                <label>온라인 품번</label>
                <textarea id="colP${nextNum}Code" placeholder="품번 열 붙여넣기"></textarea>
            </div>
            <div class="col-group">
                <label>상품명</label>
                <textarea id="colP${nextNum}Name" placeholder="상품명 열 붙여넣기"></textarea>
            </div>
            <div class="col-group">
                <label>할인율</label>
                <textarea id="colP${nextNum}Disc" placeholder="할인율 열 붙여넣기"></textarea>
            </div>
            <div class="col-group">
                <label>최종가격</label>
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
        e.preventDefault();
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
        if (!clipboardData) return;

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
        // Order: Code, Name, Price, Discount
        tokens.forEach((token, index) => {
            const mod = index % 4;
            if (mod === 0) codes.push(token);
            if (mod === 1) names.push(token);
            if (mod === 2) prices.push(token);
            if (mod === 3) discs.push(token);
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

        // Gather Column Data Dynamically
        const columns = {
            brandName: els.colBrandName.value,
            brandLanding: els.colBrandLanding.value,
            brandDisc: els.colBrandDisc.value,
            products: []
        };

        // Find all product content divs
        const productTabs = document.querySelectorAll('.tab-content[id^="tab-prod"]');

        productTabs.forEach(tab => {
            // Extract ID number from tab ID (tab-prod1 -> 1)
            // Actually we can just query selectors inside the tab
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

            // 2. Generate Code
            const resultHtml = TemplateEngine.generate(template, parsedData, pattern1, pattern2);

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

        // Ensure clean indentation
        const newBlock = `
		<!-- 대표상품${num} -->
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
		</li>`;

        // Insert before </ul>
        // Simple approach: Append new block + newline + tab before </ul>
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
        e.preventDefault();
        const clipboardData = (e.clipboardData || window.clipboardData).getData('text');

        if (!clipboardData) return;

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
});
