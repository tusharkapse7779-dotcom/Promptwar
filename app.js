// 🌆 UrbanPulse AI - Advanced App.js
class UrbanPulseAI {
  constructor() {
    this.reports = [];
    this.map = null;
    this.marker = null;
    this.heatLayer = null;
    this.userLocation = { lat: 19.07, lng: 72.87 };
    this.lastReport = null;
    this.isDark = false;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.initMap();
    this.loadDemoData();
    this.animateStats();
    this.requestAnimationFrame();
  }

  cacheElements() {
    this.elements = {
      themeToggle: document.getElementById('themeToggle'),
      generateBtn: document.getElementById('generateBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
      getLocationBtn: document.getElementById('getLocationBtn'),
      imageInput: document.getElementById('imageInput'),
      preview: document.getElementById('preview'),
      output: document.getElementById('output'),
      reportList: document.getElementById('reportList'),
      map: document.getElementById('map'),
      locationDisplay: document.getElementById('locationDisplay'),
      searchReports: document.getElementById('searchReports'),
      searchToken: document.getElementById('searchToken'),
      statusUpdate: document.getElementById('statusUpdate'),
      updateStatusBtn: document.getElementById('updateStatusBtn'),
      
      // Form fields
      category: document.getElementById('category'),
      state: document.getElementById('state'),
      district: document.getElementById('district'),
      problem: document.getElementById('problem'),
      severity: document.getElementById('severity')
    };
  }

  bindEvents() {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Form events
    this.elements.generateBtn.addEventListener('click', () => this.generateReport());
    this.elements.getLocationBtn.addEventListener('click', () => this.getLocation());
    this.elements.imageInput.addEventListener('change', (e) => this.handleImage(e));
    this.elements.downloadBtn.addEventListener('click', () => this.downloadPDF());
    
    // Admin
    this.elements.updateStatusBtn.addEventListener('click', () => this.updateStatus());
    this.elements.searchReports.addEventListener('input', debounce(() => this.renderReports(), 300));
    
    // Form validation
    ['category', 'state', 'district', 'problem'].forEach(id => {
      this.elements[id].addEventListener('input', () => this.validateForm());
    });
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    this.isDark = !this.isDark;
    this.elements.themeToggle.textContent = this.isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  initMap() {
    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([this.userLocation.lat, this.userLocation.lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMarker();
    this.updateHeatmap();
  }

  async getLocation() {
    this.elements.getLocationBtn.disabled = true;
    this.elements.getLocationBtn.textContent = '📍 Detecting...';
    
    if (!navigator.geolocation) {
      this.showMessage('Geolocation not supported', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
        this.updateMarker();
        this.updateLocationDisplay();
        this.elements.getLocationBtn.textContent = '📍 Location Updated';
        setTimeout(() => {
          this.elements.getLocationBtn.textContent = '📍 Detect Location';
          this.elements.getLocationBtn.disabled = false;
        }, 2000);
      },
      (error) => {
        this.showMessage('Location access denied', 'error');
        this.elements.getLocationBtn.disabled = false;
        this.elements.getLocationBtn.textContent = '📍 Detect Location';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  updateLocationDisplay() {
    this.elements.locationDisplay.innerHTML = `
      <div style="font-size: 0.9rem; color: var(--text-secondary);">
        📍 Lat: ${this.userLocation.lat.toFixed(4)}, 
        Lng: ${this.userLocation.lng.toFixed(4)}
      </div>
    `;
  }

  handleImage(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.elements.preview.src = e.target.result;
        this.elements.preview.classList.add('show');
      };
      reader.readAsDataURL(file);
    }
  }

  validateForm() {
    const valid = this.elements.category.value &&
                  this.elements.state.value &&
                  this.elements.district.value &&
                  this.elements.problem.value;
    
    this.elements.generateBtn.disabled = !valid;
    this.elements.generateBtn.classList.toggle('disabled', !valid);
  }

  generateReport() {
    const report = {
      id: 'TOK' + Date.now().toString(36).toUpperCase(),
      category: this.elements.category.value,
      state: this.elements.state.value,
      district: this.elements.district.value,
      severity: this.elements.severity.value,
      description: this.elements.problem.value,
      lat: this.userLocation.lat,
      lng: this.userLocation.lng,
      status: 'Pending',
      timestamp: new Date().toISOString(),
      image: this.elements.preview.src || null
    };

    this.reports.unshift(report);
    this.lastReport = report;
    
    this.showMessage(`
🚀 Report Generated Successfully!
📄 Token: ${report.id}
📍 Location: ${report.district}, ${report.state}
🔥 Severity: ${report.severity}
    `, 'success');

    this.saveReports();
    this.renderReports();
    this.updateHeatmap();
    this.updateStats();
    this.resetForm();
    
    // Scroll to dashboard
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
  }

  resetForm() {
    this.elements.category.value = '';
    this.elements.state.value = '';
    this.elements.district.value = '';
    this.elements.problem.value = '';
    this.elements.severity.value = 'Low';
    this.elements.imageInput.value = '';
    this.elements.preview.classList.remove('show');
    this.elements.generateBtn.disabled = true;
  }

  renderReports(filter = '') {
    const filteredReports = this.reports.filter(r => 
      r.id.includes(filter) || 
      r.category.toLowerCase().includes(filter.toLowerCase()) ||
      r.district.toLowerCase().includes(filter.toLowerCase())
    );

    this.elements.reportList.innerHTML = filteredReports.map(report => `
      <div class="report-card" data-id="${report.id}">
        <div class="report-header">
          <div class="report-icon">${this.getCategoryIcon(report.category)}</div>
          <div class="report-info">
            <h4>${report.category}</h4>
            <div class="report-meta">
              <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">
                ${report.status}
              </span>
              <span class="severity-badge severity-${report.severity.toLowerCase()}">
                ${report.severity}
              </span>
            </div>
          </div>
        </div>
        <div class="report-details">
          <div>📍 ${report.district}, ${report.state}</div>
          <div>🆔 Token: ${report.id}</div>
          <div class="timestamp">${this.formatDate(report.timestamp)}</div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.report-card').forEach(card => {
      card.addEventListener('click', () => this.showReportDetails(card.dataset.id));
    });
  }

  showReportDetails(id) {
    const report = this.reports.find(r => r.id === id);
    if (!report) return;

    this.map.setView([report.lat, report.lng], 16);
    this.updateMarker(report.lat, report.lng);
    
    this.elements.output.textContent = `
🆔 Report Token: ${report.id}
📋 Category: ${report.category}
📍 Location: ${report.district}, ${report.state}
🔥 Severity: ${report.severity}
📝 Description: ${report.description}
📊 Status: ${report.status}
📅 Reported: ${this.formatDate(report.timestamp)}
    `;
  }

  updateMarker(lat = this.userLocation.lat, lng = this.userLocation.lng) {
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '📍',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.map);
  }

  updateHeatmap() {
    if (this.heatLayer) this.map.removeLayer(this.heatLayer);
    
    const points = this.reports.map(r => [r.lat, r.lng, 1]);
    this.heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17
    }).addTo(this.map);
  }

  updateStatus() {
    const token = this.elements.searchToken.value.trim();
    const status = this.elements.statusUpdate.value;
    
    const report = this.reports.find(r => r.id === token);
    if (!report) {
      this.showMessage('❌ Report not found!', 'error');
      return;
    }

    report.status = status;
    this.saveReports();
    this.renderReports(this.elements.searchReports.value);
    this.updateHeatmap();
    this.updateStats();
    
    this.showMessage(`✅ Status updated to: ${status}`, 'success');
    this.elements.searchToken.value = '';
  }

  downloadPDF() {
    if (!this.lastReport) {
      this.showMessage('Generate a report first!', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
   
