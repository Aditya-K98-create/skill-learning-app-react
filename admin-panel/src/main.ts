import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">S</div>
        <span>SkillAdmin</span>
      </div>
      <nav>
        <button id="btn-dash" class="active">Dashboard</button>
        <button id="btn-users">Users</button>
        <button id="btn-settings">Settings</button>
      </nav>
    </aside>
    <main class="content">
      <header>
        <h1 id="page-title">Dashboard</h1>
      </header>
      <div id="view-container">
        </div>
    </main>
  </div>
const viewContainer = document.querySelector<HTMLDivElement>('#view-container')!
const pageTitle = document.querySelector<HTMLHeadingElement>('#page-title')!

const renderDashboard = () => {
  pageTitle.innerText = "Dashboard"
  viewContainer.innerHTML = `
    <div class="stats-grid">
      <div class="card">Total Learners: 120</div>
      <div class="card">System XP: 45,000</div>
    </div>
  `
}

const renderUsers = () => {
  pageTitle.innerText = "Users"
  viewContainer.innerHTML = `<p>Loading learners from Firebase...</p>`
}

// Event Listeners
document.querySelector('#btn-dash')?.addEventListener('click', renderDashboard)
document.querySelector('#btn-users')?.addEventListener('click', renderUsers)

// Initial Load
renderDashboard()