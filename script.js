// Ашық тұрған вкладкалардың тізімі
const openTabsList = ['home-page'];

// Вкладканы ашу функциясы
function openTab(pageId, title) {
  const tabsBar = document.getElementById('tabs-bar');

  if (!openTabsList.includes(pageId)) {
    openTabsList.push(pageId);

    const tabBtn = document.createElement('div');
    tabBtn.className = 'tab-btn';
    tabBtn.id = 'tab-' + pageId;
    tabBtn.onclick = function() { activateTab(pageId); };

    tabBtn.innerHTML = `
      <span>${title}</span>
      <span class="tab-close" onclick="closeTab(event, '${pageId}')">✖</span>
    `;

    if (tabsBar) {
      tabsBar.appendChild(tabBtn);
    }
  }

  activateTab(pageId);
}

// Вкладканы белсенді (активті) ету
function activateTab(pageId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.page-view').forEach(page => page.classList.remove('active'));

  const activeTabBtn = document.getElementById('tab-' + pageId);
  const activePageView = document.getElementById(pageId);

  if (activeTabBtn) activeTabBtn.classList.add('active');
  if (activePageView) activePageView.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Вкладканы жабу функциясы
function closeTab(event, pageId) {
  event.stopPropagation();

  if (pageId === 'home-page') return;

  const index = openTabsList.indexOf(pageId);
  if (index > -1) {
    openTabsList.splice(index, 1);
  }

  const tabElement = document.getElementById('tab-' + pageId);
  if (tabElement) {
    tabElement.remove();
  }

  activateTab(openTabsList[openTabsList.length - 1]);
}

// ESC батырмасын басқанда соңғы вкладканы жабу
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openTabsList.length > 1) {
    const lastTab = openTabsList[openTabsList.length - 1];
    closeTab(e, lastTab);
  }
});
