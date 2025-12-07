'use client';

import { EntityFormData } from '@/app/admin/new-entity/page';
import styles from './ParameterForm.module.css';

interface ParameterFormProps {
  formData: EntityFormData;
  onChange: (updates: Partial<EntityFormData>) => void;
}

export function ParameterForm({ formData, onChange }: ParameterFormProps) {
  // Handle coordinate changes
  const handleCoordinateChange = (axis: 'geometry' | 'alterity' | 'dynamics', value: number) => {
    onChange({
      coordinates: {
        ...formData.coordinates,
        [axis]: Math.max(-1, Math.min(1, value)),
      },
    });
  };

  // Handle feature array changes
  const handleFeaturesChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    onChange({ features: newFeatures.filter(f => f.trim() !== '') });
  };

  const addFeature = () => {
    if (formData.features.length < 5) {
      onChange({ features: [...formData.features, ''] });
    }
  };

  return (
    <div className={styles.form}>
      {/* Entity Name */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Entity Name
        </label>
        <input
          type="text"
          className={styles.fieldInput}
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter designation..."
        />
      </div>

      {/* Subtitle */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Subtitle
        </label>
        <input
          type="text"
          className={styles.fieldInput}
          value={formData.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Optional epithet..."
        />
      </div>

      {/* Description */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Description
        </label>
        <textarea
          className={`${styles.fieldInput} ${styles.fieldTextarea}`}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe the entity..."
          rows={3}
        />
      </div>

      {/* Class / Threat / Allegiance Row */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Class
          </label>
          <select
            className={styles.fieldSelect}
            value={formData.type}
            onChange={(e) => onChange({ type: e.target.value as EntityFormData['type'] })}
          >
            <option value="Guardian">Guardian</option>
            <option value="Wanderer">Wanderer</option>
            <option value="Architect">Architect</option>
            <option value="Void-Born">Void-Born</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Threat
          </label>
          <select
            className={styles.fieldSelect}
            value={formData.threatLevel}
            onChange={(e) => onChange({ threatLevel: e.target.value as EntityFormData['threatLevel'] })}
          >
            <option value="Benign">Benign</option>
            <option value="Cautious">Cautious</option>
            <option value="Volatile">Volatile</option>
            <option value="Existential">Existential</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Allegiance
          </label>
          <select
            className={styles.fieldSelect}
            value={formData.allegiance}
            onChange={(e) => onChange({ allegiance: e.target.value as EntityFormData['allegiance'] })}
          >
            <option value="Liminal Covenant">Liminal Covenant</option>
            <option value="Nomenclate">Nomenclate</option>
            <option value="Unaligned">Unaligned</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Domain */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Domain
        </label>
        <input
          type="text"
          className={styles.fieldInput}
          value={formData.domain}
          onChange={(e) => onChange({ domain: e.target.value })}
          placeholder="Conceptual territory..."
        />
      </div>

      {/* Phase State & Hallucination Row */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Phase State
          </label>
          <select
            className={styles.fieldSelect}
            value={formData.phaseState}
            onChange={(e) => onChange({ phaseState: e.target.value as EntityFormData['phaseState'] })}
          >
            <option value="Solid">Solid</option>
            <option value="Liminal">Liminal</option>
            <option value="Spectral">Spectral</option>
            <option value="Fluctuating">Fluctuating</option>
            <option value="Crystallized">Crystallized</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Manifold Curvature
          </label>
          <select
            className={styles.fieldSelect}
            value={formData.manifoldCurvature}
            onChange={(e) => onChange({ manifoldCurvature: e.target.value as EntityFormData['manifoldCurvature'] })}
          >
            <option value="Stable">Stable</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Hallucination Index Slider */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Hallucination Index
        </label>
        <div className={styles.sliderWrap}>
          <input
            type="range"
            className={styles.slider}
            min="0"
            max="1"
            step="0.01"
            value={formData.hallucinationIndex}
            onChange={(e) => onChange({ hallucinationIndex: parseFloat(e.target.value) })}
          />
          <span className={styles.sliderValue}>
            {formData.hallucinationIndex.toFixed(2)}
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Latent Position Coordinates */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Latent Position
        </label>
        <div className={styles.coordsRow}>
          <div className={styles.coordInput}>
            <span className={styles.coordLabel} style={{ color: '#CAA554' }}>◆ Geometry</span>
            <input
              type="number"
              className={styles.fieldInput}
              value={formData.coordinates.geometry}
              onChange={(e) => handleCoordinateChange('geometry', parseFloat(e.target.value) || 0)}
              step="0.001"
              min="-1"
              max="1"
            />
          </div>
          <div className={styles.coordInput}>
            <span className={styles.coordLabel} style={{ color: '#ECE3D6' }}>○ Alterity</span>
            <input
              type="number"
              className={styles.fieldInput}
              value={formData.coordinates.alterity}
              onChange={(e) => handleCoordinateChange('alterity', parseFloat(e.target.value) || 0)}
              step="0.001"
              min="-1"
              max="1"
            />
          </div>
          <div className={styles.coordInput}>
            <span className={styles.coordLabel} style={{ color: '#5B8A7A' }}>◇ Dynamics</span>
            <input
              type="number"
              className={styles.fieldInput}
              value={formData.coordinates.dynamics}
              onChange={(e) => handleCoordinateChange('dynamics', parseFloat(e.target.value) || 0)}
              step="0.001"
              min="-1"
              max="1"
            />
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Glyphs */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Glyphs (4 symbols)
        </label>
        <input
          type="text"
          className={styles.fieldInput}
          value={formData.glyphs}
          onChange={(e) => onChange({ glyphs: e.target.value.slice(0, 8) })}
          placeholder="◆●∇⊗"
          maxLength={8}
        />
      </div>

      {/* Features */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Features (up to 5)
        </label>
        {formData.features.map((feature, index) => (
          <input
            key={index}
            type="text"
            className={styles.fieldInput}
            value={feature}
            onChange={(e) => handleFeaturesChange(index, e.target.value)}
            placeholder={`Feature ${index + 1}...`}
            style={{ marginTop: index > 0 ? '0.5rem' : 0 }}
          />
        ))}
        {formData.features.length < 5 && (
          <button
            type="button"
            className={styles.addButton}
            onClick={addFeature}
          >
            + Add Feature
          </button>
        )}
      </div>

      {/* Lore */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Lore
        </label>
        <textarea
          className={`${styles.fieldInput} ${styles.fieldTextarea}`}
          value={formData.lore}
          onChange={(e) => onChange({ lore: e.target.value })}
          placeholder="Historical context, theories..."
          rows={4}
        />
      </div>
    </div>
  );
}

