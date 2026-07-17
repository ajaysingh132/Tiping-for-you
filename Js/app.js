(function() {
    // ---- DOM REFS ----
    const screen1 = document.getElementById('screen1');
    const screen2 = document.getElementById('screen2');
    const screen3 = document.getElementById('screen3');
    const categorySelect = document.getElementById('categorySelect');
    const typeSelect = document.getElementById('typeSelect');
    const langSelect = document.getElementById('langSelect');
    const goToFormBtn = document.getElementById('goToFormBtn');
    const backToScreen1 = document.getElementById('backToScreen1');
    const backToScreen2 = document.getElementById('backToScreen2');
    const dynamicForm = document.getElementById('dynamicForm');
    const generateDocBtn = document.getElementById('generateDocBtn');
    const docPreview = document.getElementById('docPreview');
    const printBtn = document.getElementById('printBtn');
    const downloadDocBtn = document.getElementById('downloadDocBtn');
    const newDocBtn = document.getElementById('newDocBtn');
    const docTypeDisplay = document.getElementById('docTypeDisplay');
    const docCatDisplay = document.getElementById('docCatDisplay');

    // ---- STATE ----
    let manifest = { categories: [] };
    let currentTemplateData = null; // Stores the loaded JSON template

    // ---- 1. LOAD MANIFEST ----
    async function loadManifest() {
        try {
            const res = await fetch('templates/manifest.json');
            if (!res.ok) throw new Error('Manifest not found');
            manifest = await res.json();
            populateCategories();
        } catch (e) {
            console.error('Error loading manifest:', e);
            categorySelect.innerHTML = '<option value="">❌ Manifest लोड नहीं हुआ (Live Server चलाएँ?)</option>';
        }
    }

    // ---- 2. POPULATE CATEGORIES ----
    function populateCategories() {
        categorySelect.innerHTML = '';
        manifest.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.label;
            categorySelect.appendChild(opt);
        });
        // Populate initial types
        categorySelect.dispatchEvent(new Event('change'));
    }

    // ---- 3. POPULATE TYPES (Based on Category) ----
    categorySelect.addEventListener('change', function() {
        const catId = this.value;
        const category = manifest.categories.find(c => c.id === catId);
        typeSelect.innerHTML = '<option value="">-- दस्तावेज़ चुनें --</option>';
        if (category && category.templates) {
            category.templates.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.label;
                typeSelect.appendChild(opt);
            });
        }
    });

    // ---- 4. GO TO FORM (Load Selected Template JSON) ----
    goToFormBtn.addEventListener('click', async function() {
        const catId = categorySelect.value;
        const typeId = typeSelect.value;
        if (!catId || !typeId) {
            alert('कृपया श्रेणी और दस्तावेज़ प्रकार दोनों चुनें।');
            return;
        }

        const category = manifest.categories.find(c => c.id === catId);
        const templateInfo = category.templates.find(t => t.id === typeId);
        const filePath = `templates/${catId}/${typeId}.json`;

        try {
            const res = await fetch(filePath);
            if (!res.ok) throw new Error('Template JSON not found');
            currentTemplateData = await res.json();
            
            // Update labels
            docTypeDisplay.textContent = templateInfo.label;
            docCatDisplay.textContent = category.label;

            // Build Form
            buildForm(currentTemplateData.fields);
            showScreen('screen2');
        } catch (e) {
            alert(`टेम्पलेट लोड नहीं हुआ: ${filePath}\nकृपया Live Server चलाएँ।`);
            console.error(e);
        }
    });

    // ---- 5. BUILD SMART FORM ----
    function buildForm(fields) {
        let html = '';
        fields.forEach(f => {
            const required = f.required ? '<span class="required">*</span>' : '';
            const input = f.type === 'textarea' 
                ? `<textarea id="field_${f.id}" placeholder="${f.label} दर्ज करें..."></textarea>` 
                : `<input type="${f.type || 'text'}" id="field_${f.id}" placeholder="${f.label} दर्ज करें...">`;
            html += `<label>${f.label} ${required}</label>${input}`;
        });
        dynamicForm.innerHTML = html;
    }

    // ---- 6. CORE TEMPLATE ENGINE ----
    function generateDocument() {
        if (!currentTemplateData) return 'कोई टेम्पलेट लोड नहीं है।';

        const fields = currentTemplateData.fields || [];
        const data = {};
        fields.forEach(f => {
            const el = document.getElementById(`field_${f.id}`);
            data[f.id] = el ? el.value.trim() : '__________';
        });

        // Add auto-generated fields
        const date = new Date().toLocaleDateString('hi-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
        data.date = date;

        let content = currentTemplateData.content;

        // Replace all placeholders like {{name}}, {{subject}}
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, data[key] || '__________');
        });

        // Fallback for any unreplaced placeholders
        content = content.replace(/{{[^}]+}}/g, '__________');
        
        return content.trim();
    }

    // ---- 7. GENERATE BUTTON ----
    generateDocBtn.addEventListener('click', function() {
        const content = generateDocument();
        docPreview.innerHTML = `<pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.9; margin:0;">${content}</pre>`;
        showScreen('screen3');
    });

    // ---- 8. NAVIGATION ----
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    backToScreen1.addEventListener('click', () => showScreen('screen1'));
    backToScreen2.addEventListener('click', () => showScreen('screen2'));

    newDocBtn.addEventListener('click', () => {
        showScreen('screen1');
        docPreview.innerHTML = `<div class="placeholder-text"><i class="fas fa-file-alt" style="font-size:40px; display:block; color:#ddd;"></i> जनरेट किया गया दस्तावेज़ यहाँ दिखेगा...</div>`;
    });

    // ---- 9. EXPORT: PRINT & DOCX ----
    printBtn.addEventListener('click', () => window.print());

    downloadDocBtn.addEventListener('click', function() {
        const content = docPreview.innerText;
        if (!content || content.includes('जनरेट किया गया') || content.includes('तैयार हो रहा')) {
            return alert('कृपया पहले दस्तावेज़ जनरेट करें।');
        }
        const style = `<style>body { font-family: 'Times New Roman', serif; margin: 1.5in; font-size: 16pt; line-height: 1.8; }</style>`;
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset="utf-8">${style}</head>
            <body><pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 16pt;">${content}</pre></body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `GBSBFORYOU_${docTypeDisplay.textContent.replace(/\s/g, '_')}.doc`;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    // ---- 10. INIT ----
    loadManifest();
})();
