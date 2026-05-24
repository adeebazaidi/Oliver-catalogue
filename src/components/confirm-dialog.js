// =============================================
// CatalogueGen — Confirm Dialog
// =============================================

export function showConfirm({ title = 'Are you sure?', message = '', confirmText = 'Delete', cancelText = 'Cancel', danger = true } = {}) {
  return new Promise((resolve) => {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay" id="confirm-overlay">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3>${title}</h3>
          </div>
          <div class="modal-body">
            <p style="color: var(--text-secondary); font-size: 0.95rem;">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const close = (result) => {
      container.innerHTML = '';
      resolve(result);
    };

    document.getElementById('confirm-cancel').addEventListener('click', () => close(false));
    document.getElementById('confirm-ok').addEventListener('click', () => close(true));
    document.getElementById('confirm-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close(false);
    });
  });
}
