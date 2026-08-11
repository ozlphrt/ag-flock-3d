/**
 * Reusable Minimalist UI Panel Component for Simulations (Matrix Edition)
 */
class UIPanel {
  constructor(title, options = {}) {
    this.title = title;
    this.options = options;
    this.elements = {};
    this.visible = true;
    this.init();
  }

  init() {
    if (!document.getElementById('ui-panel-styles')) {
      const styles = document.createElement('style');
      styles.id = 'ui-panel-styles';
      styles.textContent = `
        .sim-ui-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 530px;
          max-height: calc(100vh - 90px);
          background: rgba(15, 17, 20, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          color: #f1f5f9;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          user-select: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .sim-ui-panel.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(5px);
        }
        .sim-ui-header {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
        }
        .sim-ui-title {
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #f1f5f9;
        }
        .sim-ui-content {
          padding: 18px;
          overflow-y: auto;
          flex-grow: 1;
        }
        .sim-ui-row {
          margin-bottom: 18px;
        }
        .sim-ui-row:last-child {
          margin-bottom: 0;
        }
        .sim-ui-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #94a3b8;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .sim-ui-value {
          color: #f1f5f9;
          font-weight: 500;
        }
        .sim-ui-control-input {
          width: 100%;
          accent-color: #f1f5f9;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          height: 3px;
          outline: none;
          -webkit-appearance: none;
        }
        .sim-ui-control-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #94a3b8;
          cursor: pointer;
        }
        .sim-ui-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 7px 14px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sim-ui-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .sim-ui-select {
          width: 100%;
          background: #0f1114;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 6px 10px;
          color: #fff;
          font-size: 0.75rem;
          outline: none;
          cursor: pointer;
        }
        
        /* Matrix Grid Editor Styling */
        .matrix-container {
          display: grid;
          grid-template-columns: 80px repeat(6, 1fr);
          gap: 2px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 3px;
          margin-top: 6px;
          font-size: 0.65rem;
          overflow-x: auto;
        }
        .matrix-header-cell {
          text-align: center;
          font-weight: 600;
          color: #94a3b8;
          padding: 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .matrix-cell {
          text-align: center;
          padding: 6px 0;
          background: rgba(15, 17, 20, 0.6);
          color: #e2e8f0;
          cursor: ns-resize;
          position: relative;
          transition: background 0.15s ease;
        }
        .matrix-cell:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .matrix-species-label {
          text-align: left;
          padding-left: 6px;
          font-weight: 500;
          color: #94a3b8;
          cursor: pointer;
        }
        .matrix-cell.inactive {
          opacity: 0.35;
          text-decoration: line-through;
        }
        .matrix-cell-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          pointer-events: none;
          z-index: 0;
        }
        .matrix-cell-val {
          position: relative;
          z-index: 1;
        }

        /* Attraction/Repulsion Matrix Style */
        .pair-matrix-container {
          display: grid;
          grid-template-columns: 80px repeat(8, 1fr);
          gap: 2px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 3px;
          margin-top: 6px;
          font-size: 0.62rem;
          overflow-x: auto;
        }
        .pair-matrix-header {
          text-align: center;
          font-weight: 600;
          color: #94a3b8;
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pair-cell {
          text-align: center;
          padding: 6px 0;
          background: rgba(15, 17, 20, 0.65);
          cursor: ns-resize;
          position: relative;
          transition: background 0.15s ease;
        }
        .pair-cell:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .pair-label-left {
          text-align: left;
          padding-left: 6px;
          font-weight: 500;
          color: #94a3b8;
          display: flex;
          align-items: center;
        }
        .pair-cell-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
          z-index: 0;
        }
      `;
      document.head.appendChild(styles);
    }

    // Panel element (hidden by default)
    this.panel = document.createElement('div');
    this.panel.className = 'sim-ui-panel hidden';
    
    // Header
    const header = document.createElement('div');
    header.className = 'sim-ui-header';
    header.innerHTML = `<span class="sim-ui-title">${this.title}</span>`;
    
    // Content Container
    this.content = document.createElement('div');
    this.content.className = 'sim-ui-content';
    
    this.panel.appendChild(header);
    this.panel.appendChild(this.content);
    document.body.appendChild(this.panel);

    // Create a beautiful premium settings button in the top right
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ui-settings-toggle-btn';
    toggleBtn.innerHTML = '⚙️ Settings';
    Object.assign(toggleBtn.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(15, 17, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      webkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '4px',
      padding: '10px 18px',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      fontSize: '0.72rem',
      fontWeight: '600',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      zIndex: '10000',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
    });

    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.background = 'rgba(255, 255, 255, 0.05)';
      toggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.background = 'rgba(15, 17, 20, 0.85)';
      toggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    });

    toggleBtn.addEventListener('click', () => {
      this.panel.classList.toggle('hidden');
    });

    document.body.appendChild(toggleBtn);

    this.setupDragging(header);
    this.setupKeyboardShortcuts();
  }

  addSlider(key, label, min, max, value, step, onChange) {
    const row = document.createElement('div');
    row.className = 'sim-ui-row';
    
    row.innerHTML = `
      <div class="sim-ui-label">
        <span>${label}</span>
        <span class="sim-ui-value" id="val-${key}">${value}</span>
      </div>
      <input type="range" class="sim-ui-control-input" id="input-${key}" min="${min}" max="${max}" step="${step}" value="${value}">
    `;

    this.content.appendChild(row);

    const input = row.querySelector(`#input-${key}`);
    const valueDisp = row.querySelector(`#val-${key}`);

    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valueDisp.textContent = val;
      onChange(val);
    });

    this.elements[key] = { input, valueDisp };
  }

  addSelect(key, label, options, selected, onChange) {
    const row = document.createElement('div');
    row.className = 'sim-ui-row';
    
    let selectHTML = `<select class="sim-ui-select" id="input-${key}">`;
    options.forEach(opt => {
      const isSelected = opt === selected ? 'selected' : '';
      selectHTML += `<option value="${opt}" ${isSelected}>${opt}</option>`;
    });
    selectHTML += `</select>`;

    row.innerHTML = `
      <div class="sim-ui-label">${label}</div>
      ${selectHTML}
    `;

    this.content.appendChild(row);

    const select = row.querySelector(`#input-${key}`);
    select.addEventListener('change', (e) => {
      onChange(e.target.value);
    });

    this.elements[key] = { select };
  }

  addButton(label, onClick) {
    const row = document.createElement('div');
    row.className = 'sim-ui-row';
    
    row.innerHTML = `<button class="sim-ui-btn">${label}</button>`;
    this.content.appendChild(row);

    const btn = row.querySelector('button');
    btn.addEventListener('click', onClick);
  }

  addMatrixEditor(speciesList, onUpdate) {
    const row = document.createElement('div');
    row.className = 'sim-ui-row';
    row.innerHTML = `<div class="sim-ui-label">Species Swarm Matrix</div>`;
    
    const container = document.createElement('div');
    container.className = 'matrix-container';
    
    // Matrix Headers
    const headers = ['Species', 'Sep', 'Align', 'Coh', 'Spd', 'Size', 'Glow'];
    headers.forEach(h => {
      const cell = document.createElement('div');
      cell.className = 'matrix-header-cell';
      cell.textContent = h;
      container.appendChild(cell);
    });

    speciesList.forEach((sp, sIdx) => {
      const labelCell = document.createElement('div');
      labelCell.className = `matrix-cell matrix-species-label ${sp.active ? '' : 'inactive'}`;
      labelCell.style.borderLeft = `3px solid ${sp.color}`;
      labelCell.textContent = sp.name.split(' ')[0];
      labelCell.onclick = () => {
        sp.active = !sp.active;
        labelCell.classList.toggle('inactive', !sp.active);
        const rowCells = container.querySelectorAll(`[data-species="${sIdx}"]`);
        rowCells.forEach(c => c.classList.toggle('inactive', !sp.active));
        onUpdate(true);
      };
      container.appendChild(labelCell);

      const props = [
        { key: 'separation', min: 0.0, max: 3.0, step: 0.05, format: (v) => v.toFixed(2) },
        { key: 'alignment',  min: 0.0, max: 2.0, step: 0.05, format: (v) => v.toFixed(2) },
        { key: 'cohesion',   min: 0.0, max: 2.0, step: 0.05, format: (v) => v.toFixed(2) },
        { key: 'speed',      min: 0.001,max: 0.15, step: 0.001, format: (v) => v.toFixed(3) },
        { key: 'size',       min: 0.45, max: 2.0, step: 0.05,  format: (v) => v.toFixed(2) },
        { key: 'glow',       min: 0.1,  max:4.0, step: 0.1,  format: (v) => v.toFixed(1) }
      ];

      props.forEach(p => {
        const cell = document.createElement('div');
        cell.className = `matrix-cell ${sp.active ? '' : 'inactive'}`;
        cell.setAttribute('data-species', sIdx);
        cell.setAttribute('data-prop', p.key);
        
        const fill = document.createElement('div');
        fill.className = 'matrix-cell-fill';
        const percent = ((sp[p.key] - p.min) / (p.max - p.min)) * 100;
        fill.style.height = `${percent}%`;
        
        const valDisp = document.createElement('span');
        valDisp.className = 'matrix-cell-val';
        valDisp.textContent = p.format(sp[p.key]);

        const updateValUI = () => {
          valDisp.textContent = p.format(sp[p.key]);
          const newPercent = ((sp[p.key] - p.min) / (p.max - p.min)) * 100;
          fill.style.height = `${newPercent}%`;
          cell.classList.toggle('inactive', !sp.active);
        };
        
        cell.appendChild(fill);
        cell.appendChild(valDisp);
        
        if (!this.swarmUpdateFns) this.swarmUpdateFns = [];
        this.swarmUpdateFns.push(updateValUI);

        let accumulatedDeltaY = 0;
        let startVal = 0;

        const onPointerDown = (e) => {
          if (!sp.active) return;
          startVal = sp[p.key];
          accumulatedDeltaY = 0;
          
          document.addEventListener('pointermove', onPointerMove, { passive: false });
          document.addEventListener('pointerup', onPointerUp, { passive: false });
          document.addEventListener('pointercancel', onPointerUp, { passive: false });
          
          e.preventDefault();
          e.stopPropagation();
        };

        const onPointerMove = (e) => {
          if (e.movementY === undefined) return;
          
          accumulatedDeltaY -= e.movementY;
          const range = p.max - p.min;
          const deltaVal = (accumulatedDeltaY / 150) * range; 
          let newVal = startVal + deltaVal;
          newVal = Math.max(p.min, Math.min(p.max, newVal));
          newVal = Math.round(newVal / p.step) * p.step;
          
          sp[p.key] = newVal;
          updateValUI();
          onUpdate();
          
          e.preventDefault();
        };

        const onPointerUp = (e) => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerUp);
        };

        cell.addEventListener('pointerdown', onPointerDown);
        container.appendChild(cell);
      });
    });

    row.appendChild(container);
    this.content.appendChild(row);
  }

  refreshSwarmMatrix(speciesList) {
    if (this.swarmUpdateFns) {
      this.swarmUpdateFns.forEach(fn => fn());
    }
    // Update label classes
    const labels = this.panel.querySelectorAll('.matrix-species-label');
    labels.forEach((lbl, idx) => {
      if (speciesList && speciesList[idx]) {
        lbl.classList.toggle('inactive', !speciesList[idx].active);
      }
    });
  }

  addPairAttractionMatrix(speciesList, attractionMatrix, onUpdate) {
    const row = document.createElement('div');
    row.className = 'sim-ui-row';
    row.innerHTML = `<div class="sim-ui-label">Pairwise Interactions Matrix (Attract / Repel)</div>`;
    
    const container = document.createElement('div');
    container.className = 'pair-matrix-container';
    
    // Top headers
    const emptyCell = document.createElement('div');
    emptyCell.className = 'pair-matrix-header';
    container.appendChild(emptyCell);

    speciesList.forEach(sp => {
      const colHeader = document.createElement('div');
      colHeader.className = 'pair-matrix-header';
      colHeader.style.color = sp.color;
      colHeader.textContent = sp.name.split(' ')[0][0]; // Initial only
      container.appendChild(colHeader);
    });

    // Populate rows
    speciesList.forEach((rowSp, rIdx) => {
      const rowLabel = document.createElement('div');
      rowLabel.className = 'pair-label-left';
      rowLabel.style.color = rowSp.color;
      rowLabel.textContent = rowSp.name.split(' ')[0];
      container.appendChild(rowLabel);

      speciesList.forEach((colSp, cIdx) => {
        const cell = document.createElement('div');
        cell.className = 'pair-cell';
        
        const valDisp = document.createElement('span');
        valDisp.className = 'matrix-cell-val';
        
        const fill = document.createElement('div');
        fill.className = 'pair-cell-fill';

        const updateCellUI = () => {
          const val = attractionMatrix[rIdx][cIdx];
          valDisp.textContent = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
          
          // Color code: green attraction, red repulsion, carbon neutral
          if (val > 0) {
            fill.style.background = `rgba(56, 189, 248, ${val * 0.15})`; // cyan attraction fill
            valDisp.style.color = '#38bdf8';
          } else if (val < 0) {
            fill.style.background = `rgba(244, 63, 94, ${Math.abs(val) * 0.15})`; // rose repulsion fill
            valDisp.style.color = '#f43f5e';
          } else {
            fill.style.background = 'transparent';
            valDisp.style.color = '#94a3b8';
          }
        };

        updateCellUI();
        if (!this.pairUpdateFns) this.pairUpdateFns = [];
        this.pairUpdateFns.push(updateCellUI);

        cell.appendChild(fill);
        cell.appendChild(valDisp);

        let accumulatedDeltaY = 0;
        let startVal = 0;

        const onPointerDown = (e) => {
          startVal = attractionMatrix[rIdx][cIdx];
          accumulatedDeltaY = 0;
          console.log(`[Drag Start] Cell [${rIdx},${cIdx}] with startVal: ${startVal}`);
          
          document.addEventListener('pointermove', onPointerMove, { passive: false });
          document.addEventListener('pointerup', onPointerUp, { passive: false });
          document.addEventListener('pointercancel', onPointerUp, { passive: false });
          
          e.preventDefault();
          e.stopPropagation();
        };

        const onPointerMove = (e) => {
          if (e.movementY === undefined) return;
          
          accumulatedDeltaY -= e.movementY;
          // Scale from -2.0 to +2.0
          const deltaVal = (accumulatedDeltaY / 120) * 2.0; 
          let newVal = startVal + deltaVal;
          
          console.log(`[Drag Move] accumulatedDeltaY: ${accumulatedDeltaY}, deltaVal: ${deltaVal.toFixed(3)}, raw newVal: ${newVal.toFixed(3)}`);
          
          newVal = Math.max(-2.0, Math.min(2.0, newVal));
          newVal = Math.round(newVal * 10) / 10;
          
          attractionMatrix[rIdx][cIdx] = newVal;
          updateCellUI();
          onUpdate();
          
          e.preventDefault();
        };

        const onPointerUp = (e) => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerUp);
        };

        cell.addEventListener('pointerdown', onPointerDown);
        container.appendChild(cell);
      });
    });

    row.appendChild(container);
    this.content.appendChild(row);
  }

  refreshPairMatrix() {
    if (this.pairUpdateFns) {
      this.pairUpdateFns.forEach(fn => fn());
    }
  }

  setupDragging(header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    header.onmousedown = dragMouseDown.bind(this);

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag.bind(this);
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      this.panel.style.top = (this.panel.offsetTop - pos2) + "px";
      this.panel.style.left = (this.panel.offsetLeft - pos1) + "px";
      this.panel.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'h') {
        this.visible = !this.visible;
        if (this.visible) {
          this.panel.classList.remove('hidden');
        } else {
          this.panel.classList.add('hidden');
        }
      }
    });
  }
}

window.UIPanel = UIPanel;
