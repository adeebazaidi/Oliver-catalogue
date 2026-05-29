import { store } from '../store.js';
import { icons } from '../icons.js';
import { showToast } from './toast.js';
import { router } from '../router.js';
import { hashPassword, PASSWORD_HASH } from '../auth/gate.js';

export function showSettingsModal() {
  const container = document.getElementById('modal-container');
  let currentTab = 'filters';
  let isInitialized = false;

  const render = () => {
    if (!isInitialized) {
      container.innerHTML = `
        <div class="modal-overlay" id="settings-overlay">
          <div class="modal modal-lg" style="display:flex; flex-direction:row; padding:0; overflow:hidden; max-width:850px; height: 600px; border-radius: var(--radius-lg); background: var(--bg-surface); box-shadow: var(--shadow-lg); border: 1px solid var(--border-subtle);">
            
            <!-- Sidebar -->
            <div style="width: 240px; background: var(--bg-subtle); border-right: 1px solid var(--border-subtle); display:flex; flex-direction:column;">
              <div style="padding: var(--space-xl) var(--space-lg) var(--space-md); display:flex; align-items:center; gap:var(--space-sm);">
                <div style="color: var(--text-primary); display:flex;">${icons.settings}</div>
                <h3 style="margin:0; font-size:1.2rem; font-weight: 700; letter-spacing: -0.01em;">Settings</h3>
              </div>
              
              <div id="settings-sidebar-tabs" style="flex:1; padding: 0 var(--space-sm); display:flex; flex-direction:column; gap:4px; overflow-y: auto;">
                <!-- Tabs inserted here -->
              </div>
            </div>

            <!-- Content Area -->
            <div style="flex:1; display:flex; flex-direction:column; background: var(--bg-surface);">
              <div style="padding: var(--space-xl) var(--space-xl) var(--space-md); display:flex; justify-content:space-between; align-items:center;">
                <h2 id="settings-content-title" style="margin:0; font-size:1.4rem; font-weight: 700; letter-spacing: -0.01em;"></h2>
                <button class="btn btn-icon btn-ghost" id="settings-close" style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--bg-subtle);">${icons.x}</button>
              </div>
              
              <div id="settings-content-area" style="flex:1; overflow-y:auto; padding: 0 var(--space-xl) var(--space-xl);">
                <!-- Content inserted here -->
              </div>
            </div>
          </div>
        </div>
      `;

      // Attach static global listeners
      document.getElementById('settings-close').addEventListener('click', () => { container.innerHTML = ''; });
      document.getElementById('settings-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) container.innerHTML = '';
      });

      // Tab switching listener via event delegation
      document.getElementById('settings-sidebar-tabs').addEventListener('click', (e) => {
        const btn = e.target.closest('.settings-tab');
        if (btn) {
          const newTab = btn.dataset.tab;
          if (newTab !== currentTab) {
            currentTab = newTab;
            renderTabUpdates();
          }
        }
      });

      isInitialized = true;
    }

    renderTabUpdates();
  };

  const renderTabUpdates = () => {
    // 1. Update Sidebar Tabs
    const tabsContainer = document.getElementById('settings-sidebar-tabs');
    const tabs = [
      { id: 'filters', icon: icons.filter, label: 'Manage Filters' },
      { id: 'data', icon: icons.database, label: 'Data & Backup' },
      { id: 'appearance', icon: icons.layout, label: 'Appearance' },
      { id: 'defaults', icon: icons.settings, label: 'Defaults' }
    ];
    
    tabsContainer.innerHTML = tabs.map(t => {
      const isActive = currentTab === t.id;
      return `
        <button class="settings-tab ${isActive ? 'active' : ''}" data-tab="${t.id}" style="display:flex; align-items:center; gap:12px; padding: 10px 14px; border:none; background: ${isActive ? 'white' : 'transparent'}; border-radius: var(--radius-md); text-align:left; cursor:pointer; font-weight: ${isActive ? '600' : '500'}; color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'}; box-shadow: ${isActive ? 'var(--shadow-sm)' : 'none'}; transition: all 0.2s;">
          <span style="opacity: ${isActive ? '1' : '0.6'}; display:flex;">${t.icon}</span> ${t.label}
        </button>
      `;
    }).join('');

    // 2. Update Title
    document.getElementById('settings-content-title').textContent = getTabTitle(currentTab);

    // 3. Update Content
    const contentArea = document.getElementById('settings-content-area');
    contentArea.innerHTML = renderTabContent(currentTab);

    // 4. Attach Content Listeners
    attachContentListeners();
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'filters': return 'Manage Filters';
      case 'data': return 'Data & Backup';
      case 'appearance': return 'Appearance';
      case 'defaults': return 'Defaults';
      default: return 'Settings';
    }
  };

  const renderTabContent = (tab) => {
    if (tab === 'filters') {
      return `
        <div style="display:flex; flex-direction:column; gap: var(--space-xl);">
          <p class="text-muted text-sm" style="margin-top: 0;">Organize the dropdown options used throughout your catalogue.</p>
          ${renderFilterSection('Categories', store.getCategories(), 'category')}
          ${renderFilterSection('Materials', store.getMaterials(), 'material')}
          ${renderFilterSection('Buyer Categories', store.getBuyerCategories(), 'buyer')}
        </div>
      `;
    }
    
    if (tab === 'data') {
      return `
        <div style="display:flex; flex-direction:column; gap: var(--space-md);">
          <div class="card" style="padding: var(--space-md); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
            <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
              <div style="padding: 8px; background: var(--bg-subtle); border-radius: var(--radius-md); color: var(--text-primary);">
                ${icons.download}
              </div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 4px 0; font-size: 1.05rem;">Export Data</h4>
                <p class="text-sm text-muted" style="margin: 0 0 8px 0; line-height: 1.4;">Download a complete JSON backup of your catalogue including all products and custom filters. Keep this safe.</p>
                <button class="btn btn-secondary btn-sm" id="btn-export-data">Export JSON</button>
              </div>
            </div>
          </div>
          
          <div class="card" style="padding: var(--space-md); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
            <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
              <div style="padding: 8px; background: var(--bg-subtle); border-radius: var(--radius-md); color: var(--text-primary);">
                ${icons.upload}
              </div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 4px 0; font-size: 1.05rem;">Import Data</h4>
                <p class="text-sm text-muted" style="margin: 0 0 8px 0; line-height: 1.4;">Restore your catalogue from a previously exported JSON backup file. This will merge with your current data.</p>
                <button class="btn btn-secondary btn-sm" id="btn-import-data">Import JSON</button>
                <input type="file" id="import-file-input" accept=".json" style="display:none">
              </div>
            </div>
          </div>
          
          <div class="card" style="padding: var(--space-md); border: 1px solid #fecaca; background: #fef2f2; box-shadow: var(--shadow-xs);">
            <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
              <div style="padding: 8px; background: #fee2e2; border-radius: var(--radius-md); color: #dc2626;">
                ${icons.trash}
              </div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 4px 0; font-size: 1.05rem; color: #991b1b;">Reset App</h4>
                <p class="text-sm" style="margin: 0 0 8px 0; color: #b91c1c; line-height: 1.4;">Clear all local data and reset the application to its default state. This action cannot be undone.</p>
                <button class="btn btn-sm" style="background:#dc2626; color:white; border:none; font-weight: 600;" id="btn-clear-data">Reset Local Data</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'appearance') {
      const currentTheme = localStorage.getItem('theme') || 'light';
      return `
        <div style="display:flex; flex-direction:column; gap: var(--space-lg);">
          <div class="card" style="padding: var(--space-lg); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
            <h4 style="margin:0 0 8px 0; font-size: 1.05rem;">Theme Mode</h4>
            <p class="text-sm text-muted" style="margin: 0 0 16px 0;">Choose how the application looks to you.</p>
            <div style="display:flex; gap:16px;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding: 12px 16px; border: ${currentTheme === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)'}; border-radius: var(--radius-md); background: var(--bg-subtle);">
                <input type="radio" name="theme" value="light" ${currentTheme === 'light' ? 'checked' : ''}> 
                <span style="font-weight: 500;">Light</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding: 12px 16px; border: ${currentTheme === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)'}; border-radius: var(--radius-md); background: var(--bg-subtle);">
                <input type="radio" name="theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''}> 
                <span style="font-weight: 500;">Dark</span>
              </label>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'defaults') {
      return `
        <div style="display:flex; flex-direction:column; gap: var(--space-lg);">
          <div class="card" style="padding: var(--space-lg); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
            <h4 style="margin:0 0 8px 0; font-size: 1.05rem;">Currency Symbol</h4>
            <p class="text-sm text-muted" style="margin: 0 0 16px 0;">Sets the default currency symbol used across the app.</p>
            <div class="form-group" style="max-width:240px; margin: 0;">
              <select class="form-input" id="setting-currency" style="padding: 10px 14px; font-size: 0.95rem; cursor: pointer;">
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="₹">₹ (INR)</option>
              </select>
            </div>
            <p class="text-xs text-muted" style="margin-top:12px; font-style: italic;">* Currently hardcoded to $. Fully dynamic currency formats coming soon.</p>
          </div>
        </div>
      `;
    }

    return '';
  };

  const renderFilterSection = (title, items, type) => {
    return `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0; font-size: 1.1rem; font-weight: 600;">${title}</h3>
          <button class="btn btn-secondary btn-sm btn-add-filter" data-type="${type}" style="padding: 4px 12px;">${icons.plus} Add New</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${items.length === 0 ? `<div class="text-sm text-muted" style="padding:16px; text-align: center; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">No ${title.toLowerCase()} configured.</div>` : ''}
          ${items.map(item => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:10px 16px; margin:0; border:1px solid var(--border-subtle); border-radius:var(--radius-md); box-shadow: var(--shadow-xs);">
              <span style="font-size:0.95rem; font-weight: 500;">${item}</span>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-icon btn-ghost btn-sm btn-edit-filter" data-type="${type}" data-value="${item}" title="Edit" style="color: var(--text-secondary);">${icons.edit}</button>
                <button class="btn btn-icon btn-ghost btn-sm btn-delete-filter" data-type="${type}" data-value="${item}" title="Delete" style="color:#d32f2f;">${icons.trash}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const attachContentListeners = () => {
    // Data Tab Listeners
    if (currentTab === 'data') {
      document.getElementById('btn-export-data').addEventListener('click', () => {
        const data = store.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oliver_mc_inroy_catalogue_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast({ type: 'success', title: 'Data Exported', message: 'Your backup file has been downloaded.' });
      });

      document.getElementById('btn-import-data').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
      });

      document.getElementById('import-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const success = store.importData(text);
          if (success) {
            showToast({ type: 'success', title: 'Data Imported', message: 'Your products have been restored.' });
            router.navigate('#/');
            const container = document.getElementById('modal-container');
            container.innerHTML = '';
          } else {
            showToast({ type: 'error', title: 'Import Failed', message: 'Invalid data format.' });
          }
        } catch (err) {
          showToast({ type: 'error', title: 'Import Failed', message: err.message });
        }
      });

      document.getElementById('btn-clear-data').addEventListener('click', async () => {
        if (confirm("Are you sure you want to permanently delete all local data? This will clear all products, categories, and settings from your browser.")) {
          const pass = prompt("Enter the application password to confirm reset:");
          if (!pass) return;
          const hash = await hashPassword(pass);
          if (hash === PASSWORD_HASH) {
            localStorage.clear();
            location.reload();
          } else {
            showToast({ type: 'error', title: 'Reset Failed', message: 'Incorrect password.' });
          }
        }
      });
    }

    // Filter Tab Listeners
    if (currentTab === 'filters') {
      // Add
      document.querySelectorAll('.btn-add-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.currentTarget.dataset.type;
          const val = prompt(`Enter new ${type} name:`);
          if (val && val.trim()) {
            if (type === 'category') store.addCategory(val);
            if (type === 'material') store.addMaterial(val);
            if (type === 'buyer') store.addBuyerCategory(val);
            renderTabUpdates();
          }
        });
      });

      // Edit
      document.querySelectorAll('.btn-edit-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.currentTarget.dataset.type;
          const oldVal = e.currentTarget.dataset.value;
          const newVal = prompt(`Edit ${type} name:`, oldVal);
          if (newVal && newVal.trim() && newVal !== oldVal) {
            if (type === 'category') store.updateCategory(oldVal, newVal);
            if (type === 'material') store.updateMaterial(oldVal, newVal);
            if (type === 'buyer') store.updateBuyerCategory(oldVal, newVal);
            renderTabUpdates();
          }
        });
      });

      // Delete
      document.querySelectorAll('.btn-delete-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.currentTarget.dataset.type;
          const val = e.currentTarget.dataset.value;
          if (confirm(`Are you sure you want to delete "${val}" from your ${type} list? Products using it will not be changed.`)) {
            if (type === 'category') store.deleteCategory(val);
            if (type === 'material') store.deleteMaterial(val);
            if (type === 'buyer') store.deleteBuyerCategory(val);
            renderTabUpdates();
          }
        });
      });
    }

    // Appearance Tab Listeners
    if (currentTab === 'appearance') {
      document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const theme = e.target.value;
          localStorage.setItem('theme', theme);
          if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          renderTabUpdates(); // To update the border styling on the selected label
        });
      });
    }
  };

  render();
}
