(function() {
  'use strict';



  const sevaMessages = {
    5: 'Selected commitment: <b>5 hours per month</b>. Suggested seva: occasional research support, social sharing, translation review or event help.',
    10: 'Selected commitment: <b>10 hours per month</b>. Suggested seva: one defined weekly task such as content drafting, archive tagging, youth-session support or outreach.',
    20: 'Selected commitment: <b>20 hours per month</b>. Suggested seva: active program ownership for a small workstream, including delivery and follow-up.',
    40: 'Selected commitment: <b>40 hours per month</b>. Suggested seva: core volunteer role with recurring responsibility, coordination and monthly reporting.'
  };

  let selectedHours = 5;
  let events = [];
  let filtered = [];
  let selectedEventId = null;
  let activePeriod = 'all';
  let visibleLimit = 30;

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__gpaToastTimer);
    window.__gpaToastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  function openConfigured(url, message, params) {
    if (!url) {
      if (GPA_CONFIG.contactEmail) {
        window.location.href = 'mailto:' + GPA_CONFIG.contactEmail + '?subject=' + encodeURIComponent('GPA enquiry');
      } else {
        toast(message || 'This link will be activated before public launch.');
      }
      return;
    }
    try {
      const target = new URL(url, window.location.href);
      if (params) Object.entries(params).forEach(([k,v]) => target.searchParams.set(k, v));
      window.open(target.toString(), '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function initLinks() {
    if (GPA_CONFIG.contactEmail) {
      const label = document.getElementById('contactEmailLabel');
      label.textContent = GPA_CONFIG.contactEmail;
      label.parentElement.parentElement.style.cursor = 'pointer';
      label.parentElement.parentElement.addEventListener('click', () => window.location.href = 'mailto:' + GPA_CONFIG.contactEmail);
    }
    document.getElementById('registerWithCommitment').addEventListener('click', () => openConfigured(GPA_CONFIG.volunteerFormUrl, 'Volunteer registration will be activated before public launch.', { seva_hours: selectedHours }));
    document.getElementById('donateButton').addEventListener('click', () => openConfigured(GPA_CONFIG.donationUrl, 'Donation link will be activated before public launch.'));
    document.getElementById('createProfile').addEventListener('click', () => openConfigured(GPA_CONFIG.profileFormUrl || GPA_CONFIG.volunteerFormUrl, 'GPA Sahyogi profile sharing will be activated before public launch.'));
    document.getElementById('contactButton').addEventListener('click', () => openConfigured(GPA_CONFIG.contactFormUrl, 'GPA inquiry form will be activated before public launch.'));
    document.getElementById('whatsappButton').addEventListener('click', () => openConfigured(GPA_CONFIG.whatsappUrl, 'GPA updates channel will be activated before public launch.'));
  }

  function initSeva() {
    document.querySelectorAll('.hour-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hour-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedHours = Number(btn.dataset.hours);
        document.getElementById('commitmentResult').innerHTML = sevaMessages[selectedHours];
      });
    });
  }

  function initPrograms() {
    document.querySelectorAll('.program-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const name = tab.dataset.program;
        document.querySelectorAll('.program-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.program-category').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.querySelector('[data-panel="' + name + '"]').classList.add('active');
      });
    });
  }

async function loadEvents() {
  try {
    const response = await fetch('./data/timeline.json', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load timeline.json');
    }

    const data = await response.json();

    console.log('Timeline loaded from JSON:', data);

    return data;
  }
  catch (e) {
    console.error('Timeline JSON failed:', e);

    const embedded = JSON.parse(
      document.getElementById('gpaTimelineData').textContent || '[]'
    );

    return embedded;
  }
}

  function clean(s) { return String(s || '').toLowerCase(); }
  function periodBounds(period) {
    if (period === 'all') return null;
    const parts = period.split('-').map(Number);
    return { start: parts[0], end: parts[1] };
  }
  function applyFilters() {
    const q = clean(document.getElementById('timelineSearch').value).trim();
    const cat = document.getElementById('timelineCategory').value;
    const bounds = periodBounds(activePeriod);
    filtered = events.filter(ev => {
      if (cat !== 'all' && ev.category !== cat) return false;
      if (bounds && (ev.year < bounds.start || ev.year > bounds.end)) return false;
      if (q) {
        const hay = clean([ev.year, ev.date, ev.place, ev.category, ev.title, ev.text].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    visibleLimit = 30;
    if (!filtered.some(e => e.id === selectedEventId)) selectedEventId = filtered[0] ? filtered[0].id : null;
    renderTimeline();
  }

  function populateCategories() {
    const select = document.getElementById('timelineCategory');
    const cats = [...new Set(events.map(e => e.category).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  }

  function renderStats(minYear, maxYear) {
    const places = new Set(filtered.map(e => e.place).filter(Boolean));
    const cats = new Set(filtered.map(e => e.category).filter(Boolean));
    document.getElementById('statEvents').textContent = filtered.length;
    document.getElementById('statYears').textContent = filtered.length ? String(maxYear - minYear + 1) : '0';
    document.getElementById('statPlaces').textContent = places.size;
    document.getElementById('statCategories').textContent = cats.size;
    document.getElementById('minYearLabel').textContent = filtered.length ? minYear : '—';
    document.getElementById('maxYearLabel').textContent = filtered.length ? maxYear : '—';
  }

  function renderRail(minYear, maxYear) {
    const rail = document.getElementById('timelineRail');
    rail.innerHTML = '';
    if (!filtered.length) return;
    const span = Math.max(1, maxYear - minYear);
    filtered.forEach((ev, i) => {
      const marker = document.createElement('button');
      marker.className = 'marker' + (ev.id === selectedEventId ? ' selected' : '');
      marker.type = 'button';
      marker.title = ev.year + ' — ' + ev.title;
      marker.setAttribute('aria-label', marker.title);
      const left = 5 + ((ev.year - minYear) / span) * 90;
      marker.style.left = left + '%';
      marker.style.top = (28 + ((i * 17) % 54)) + 'px';
      marker.addEventListener('click', () => { selectedEventId = ev.id; renderTimeline(false); });
      rail.appendChild(marker);
    });
  }

  function renderSelected() {
    const box = document.getElementById('selectedEvent');
    const ev = filtered.find(e => e.id === selectedEventId) || filtered[0];
    if (!ev) {
      box.innerHTML = '<div><h3>No events found</h3><p class="small">Try removing a filter or search term.</p></div>';
      return;
    }
    selectedEventId = ev.id;
    box.innerHTML = `
      <div>
        <div class="selected-year">${escapeHtml(ev.year)}</div>
        <div class="small">${escapeHtml(ev.date || '')}</div>
      </div>
      <div>
        <h3>${escapeHtml(ev.title)}</h3>
        <div class="selected-meta">
          ${ev.place ? '<span class="pill">' + escapeHtml(ev.place) + '</span>' : ''}
          ${ev.category ? '<span class="pill">' + escapeHtml(ev.category) + '</span>' : ''}
        </div>
        <p>${escapeHtml(ev.text)}</p>
      </div>`;
  }

  function renderList() {
    const list = document.getElementById('eventList');
    list.innerHTML = '';
    filtered.slice(0, visibleLimit).forEach(ev => {
      const row = document.createElement('button');
      row.className = 'event-row';
      row.type = 'button';
      row.innerHTML = '<b>' + escapeHtml(ev.year + ' · ' + ev.title) + '</b><span>' + escapeHtml([ev.date, ev.place, ev.category].filter(Boolean).join(' · ') || ev.text) + '</span>';
      row.addEventListener('click', () => {
        selectedEventId = ev.id;
        renderTimeline(false);
        document.getElementById('selectedEvent').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      list.appendChild(row);
    });
    const btn = document.getElementById('showMoreEvents');
    btn.style.display = filtered.length > visibleLimit ? 'inline-flex' : 'none';
  }

  function renderTimeline(fullRail = true) {
    const years = filtered.map(e => e.year);
    const minYear = years.length ? Math.min(...years) : 0;
    const maxYear = years.length ? Math.max(...years) : 0;
    renderStats(minYear, maxYear);
    if (fullRail) renderRail(minYear, maxYear); else renderRail(minYear, maxYear);
    renderSelected();
    renderList();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
  }

  async function initTimeline() {
    events = (await loadEvents()).sort((a,b) => (a.year - b.year) || (a.id - b.id));
    populateCategories();
    filtered = [...events];
    selectedEventId = filtered[0] ? filtered[0].id : null;
    document.getElementById('timelineSearch').addEventListener('input', applyFilters);
    document.getElementById('timelineCategory').addEventListener('change', applyFilters);
    document.getElementById('resetTimeline').addEventListener('click', () => {
      document.getElementById('timelineSearch').value = '';
      document.getElementById('timelineCategory').value = 'all';
      activePeriod = 'all';
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.period === 'all'));
      applyFilters();
    });
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activePeriod = chip.dataset.period;
        applyFilters();
      });
    });
    document.getElementById('showMoreEvents').addEventListener('click', () => { visibleLimit += 30; renderList(); });
    renderTimeline();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLinks();
    initSeva();
    initPrograms();
    initTimeline();
  });
})();