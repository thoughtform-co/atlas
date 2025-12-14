'use client';

import { useState, useEffect } from 'react';
import { EntityFormData } from '@/app/admin/new-entity/page';
import { fetchEntityClasses, fetchEntityTypes } from '@/lib/data';
import { parseMidjourneyPrompt } from '@/lib/midjourney-parser';
import { Domain } from '@/lib/types';
import { EntityClassDropdown } from './EntityClassDropdown';
import { EntityTypeDropdown } from './EntityTypeDropdown';
import { DomainDropdown } from './DomainDropdown';
import { PhaseStateDropdown } from './PhaseStateDropdown';
import { ManifoldCurvatureDropdown } from './ManifoldCurvatureDropdown';
import styles from './ParameterForm.module.css';

interface ParameterFormProps {
  formData: EntityFormData;
  onChange: (updates: Partial<EntityFormData>) => void;
}

export function ParameterForm({ formData, onChange }: ParameterFormProps) {
  const [entityClasses, setEntityClasses] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>(['Guardian', 'Wanderer', 'Architect', 'Void-Born', 'Hybrid']);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainSref, setNewDomainSref] = useState('');
  const [isMidjourneyOpen, setIsMidjourneyOpen] = useState(false);
  const [midjourneyInput, setMidjourneyInput] = useState(formData.midjourneyPrompt || '');
  const [isAddingEntityClass, setIsAddingEntityClass] = useState(false);
  const [newEntityClassName, setNewEntityClassName] = useState('');
  const [editingEntityClass, setEditingEntityClass] = useState<string | null>(null);
  const [editedEntityClassName, setEditedEntityClassName] = useState('');
  const [hoveredEntityClass, setHoveredEntityClass] = useState<string | null>(null);
  const [isEntityClassDropdownOpen, setIsEntityClassDropdownOpen] = useState(false);
  const [editingClassInDropdown, setEditingClassInDropdown] = useState<string | null>(null);

  // Fetch existing entity classes for dropdown
  useEffect(() => {
    fetchEntityClasses().then(classes => {
      setEntityClasses(classes);
    });
  }, []);

  // Fetch existing entity types for dropdown
  useEffect(() => {
    fetchEntityTypes().then(types => {
      setEntityTypes(types);
    });
  }, []);

  // Fetch existing domains for dropdown
  useEffect(() => {
    fetch('/api/domains')
      .then(res => res.json())
      .then(data => {
        if (data.domains) {
          setDomains(data.domains);
        }
      })
      .catch(err => console.error('Failed to fetch domains:', err));
  }, []);

  // Refresh entity classes after adding/editing
  const refreshEntityClasses = async () => {
    const classes = await fetchEntityClasses();
    setEntityClasses(classes);
  };

  // Handle adding a new domain
  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return;
    
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDomainName.trim(),
          srefCode: newDomainSref.trim() || null,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDomains(prev => [...prev, data.domain].sort((a, b) => a.name.localeCompare(b.name)));
        onChange({ domain: data.domain.name });
        setNewDomainName('');
        setNewDomainSref('');
        setIsAddingDomain(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create domain');
      }
    } catch (err) {
      console.error('Failed to add domain:', err);
      alert('Failed to create domain');
    }
  };

  // Handle adding a new entity class
  // Note: The class is saved to the database when the entity is saved (via entity_class field)
  // This function just updates the local state for the dropdown
  const handleAddEntityClass = (className: string) => {
    if (!className.trim()) return;
    
    const trimmedName = className.trim();
    
    // Update form data immediately
    onChange({ entityClass: trimmedName });
    
    // Add to local state if not already present (for dropdown options)
    if (!entityClasses.includes(trimmedName)) {
      setEntityClasses(prev => [...prev, trimmedName].sort());
    }
    
    // Close add dialog if open
    setIsAddingEntityClass(false);
    setNewEntityClassName('');
    
    // Note: The class will be saved to the database when the entity is saved
    // Entity classes are stored in the entity_class column of denizens table
    // They're not in a separate table, so they're created when entities are created
  };

  // Handle editing an entity class (updates all denizens with that class)
  const handleEditEntityClass = async (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName.trim() === '' || newName.trim() === '') return;
    if (oldName === newName) {
      setEditingEntityClass(null);
      setEditedEntityClassName('');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/entity-classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: oldName.trim(),
          newName: newName.trim(),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local state
        setEntityClasses(prev => {
          const updated = prev.filter(c => c !== oldName);
          if (!updated.includes(newName.trim())) {
            updated.push(newName.trim());
          }
          return updated.sort();
        });
        
        // Update form data if the current entity uses this class
        if (formData.entityClass === oldName) {
          onChange({ entityClass: newName.trim() });
        }
        
        setEditingEntityClass(null);
        setEditedEntityClassName('');
        
        // Refresh classes to ensure consistency
        await refreshEntityClasses();
        
        alert(data.message || `Updated ${data.updated || 0} entities`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update entity class');
      }
    } catch (err) {
      console.error('Failed to edit entity class:', err);
      alert('Failed to update entity class');
    }
  };

  // Handle coordinate changes
  const handleCoordinateChange = (axis: 'geometry' | 'alterity' | 'dynamics', value: number) => {
    onChange({
      coordinates: {
        ...formData.coordinates,
        [axis]: Math.max(-1, Math.min(1, value)),
      },
    });
  };

  // Handle abilities array changes (renamed from features)
  const handleAbilitiesChange = (index: number, value: string) => {
    const newAbilities = [...formData.abilities];
    newAbilities[index] = value;
    onChange({ abilities: newAbilities.filter(a => a.trim() !== '') });
  };

  const addAbility = () => {
    if (formData.abilities.length < 5) {
      onChange({ abilities: [...formData.abilities, ''] });
    }
  };

  // Handle MidJourney prompt parsing
  const handleMidjourneyChange = (value: string) => {
    setMidjourneyInput(value);
    // Don't auto-parse on every change, only when Extract button is clicked
  };

  // Extract MidJourney parameters and update form
  const handleExtractMidjourney = () => {
    const parsed = parseMidjourneyPrompt(midjourneyInput);
    onChange({
      midjourneyPrompt: midjourneyInput,
      midjourneySref: parsed.sref,
      midjourneyProfile: parsed.profile,
      midjourneyStylization: parsed.stylization,
      midjourneyStyleWeight: parsed.styleWeight,
    });
  };

  // Parse current MidJourney prompt for display
  const parsedMidjourney = formData.midjourneyPrompt 
    ? parseMidjourneyPrompt(formData.midjourneyPrompt)
    : null;

  return (
    <div className={styles.form}>
      {/* Domain - Moved to top */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Domain
        </label>
        {!isAddingDomain ? (
          <DomainDropdown
            value={formData.domain}
            options={domains}
            onChange={(value) => onChange({ domain: value })}
            onAddNew={() => {
              setIsAddingDomain(true);
              // Pre-fill SREF from current entity's MidJourney params
              if (formData.midjourneySref) {
                setNewDomainSref(formData.midjourneySref);
              }
            }}
            placeholder="Select domain..."
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(202, 165, 84, 0.05)',
            border: '1px solid rgba(202, 165, 84, 0.2)',
            borderRadius: '2px',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'rgba(236, 227, 214, 0.5)', marginBottom: '0.25rem' }}>
              NEW DOMAIN
            </div>
            <input
              type="text"
              className={styles.fieldInput}
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="Domain name (e.g., The Gradient Throne)"
              autoFocus
            />
            <input
              type="text"
              className={styles.fieldInput}
              value={newDomainSref}
              onChange={(e) => setNewDomainSref(e.target.value)}
              placeholder="SREF code (e.g., 1942457994)"
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleAddDomain}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(202, 165, 84, 0.2)',
                  border: '1px solid rgba(202, 165, 84, 0.4)',
                  color: '#CAA554',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Create Domain
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingDomain(false);
                  setNewDomainName('');
                  setNewDomainSref('');
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(236, 227, 214, 0.2)',
                  color: 'rgba(236, 227, 214, 0.5)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Class (Entity Class) - Custom dropdown with edit functionality */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Class
        </label>
        {!isAddingEntityClass && editingEntityClass === null ? (
          <EntityClassDropdown
            value={formData.entityClass}
            options={entityClasses}
            onChange={(value) => onChange({ entityClass: value })}
            onAddNew={() => setIsAddingEntityClass(true)}
            onEdit={(className) => {
              setEditingEntityClass(className);
              setEditedEntityClassName(className);
            }}
            onEnterNewClass={(className) => {
              handleAddEntityClass(className);
            }}
            placeholder="Select class or type new..."
          />
        ) : isAddingEntityClass ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(202, 165, 84, 0.05)',
            border: '1px solid rgba(202, 165, 84, 0.2)',
            borderRadius: '2px',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'rgba(236, 227, 214, 0.5)', marginBottom: '0.25rem' }}>
              NEW CLASS
            </div>
            <input
              type="text"
              className={styles.fieldInput}
              value={newEntityClassName}
              onChange={(e) => setNewEntityClassName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newEntityClassName.trim()) {
                  handleAddEntityClass(newEntityClassName.trim());
                } else if (e.key === 'Escape') {
                  setIsAddingEntityClass(false);
                  setNewEntityClassName('');
                }
              }}
              placeholder="Class name (e.g., Eigensage, Nullseer)"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (newEntityClassName.trim()) {
                    handleAddEntityClass(newEntityClassName.trim());
                  }
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(202, 165, 84, 0.2)',
                  border: '1px solid rgba(202, 165, 84, 0.4)',
                  color: '#CAA554',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Create Class
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingEntityClass(false);
                  setNewEntityClassName('');
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(236, 227, 214, 0.2)',
                  color: 'rgba(236, 227, 214, 0.5)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(202, 165, 84, 0.05)',
            border: '1px solid rgba(202, 165, 84, 0.2)',
            borderRadius: '2px',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'rgba(236, 227, 214, 0.5)', marginBottom: '0.25rem' }}>
              EDIT CLASS: {editingEntityClass}
            </div>
            <input
              type="text"
              className={styles.fieldInput}
              value={editedEntityClassName}
              onChange={(e) => setEditedEntityClassName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editedEntityClassName.trim() && editingEntityClass) {
                  handleEditEntityClass(editingEntityClass, editedEntityClassName.trim());
                } else if (e.key === 'Escape') {
                  setEditingEntityClass(null);
                  setEditedEntityClassName('');
                }
              }}
              placeholder="Class name"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (editingEntityClass && editedEntityClassName.trim()) {
                    handleEditEntityClass(editingEntityClass, editedEntityClassName.trim());
                  }
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(202, 165, 84, 0.2)',
                  border: '1px solid rgba(202, 165, 84, 0.4)',
                  color: '#CAA554',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingEntityClass(null);
                  setEditedEntityClassName('');
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(236, 227, 214, 0.2)',
                  color: 'rgba(236, 227, 214, 0.5)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Type */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Type
        </label>
        <EntityTypeDropdown
          value={formData.type}
          options={entityTypes}
          onChange={(value) => onChange({ type: value as EntityFormData['type'] })}
          onAddNew={(newType) => {
            // Add to local options
            if (!entityTypes.includes(newType)) {
              setEntityTypes(prev => [...prev, newType].sort());
            }
          }}
          placeholder="Select type or type new..."
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
          Description <span style={{ color: 'rgba(236, 227, 214, 0.3)', fontSize: '0.5rem', fontWeight: 'normal' }}>(max 200 characters)</span>
        </label>
        <textarea
          className={`${styles.fieldInput} ${styles.fieldTextarea}`}
          value={formData.description}
          onChange={(e) => {
            const value = e.target.value.slice(0, 200);
            onChange({ description: value });
          }}
          placeholder="Describe the entity..."
          rows={3}
          maxLength={200}
        />
        {formData.description.length >= 200 && (
          <div style={{ fontSize: '0.4rem', color: 'rgba(236, 227, 214, 0.3)', marginTop: '0.25rem' }}>
            Character limit reached (200)
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Abilities (renamed from Features) */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <span className={styles.fieldPrefix}>▸</span>
          Abilities (up to 5)
        </label>
        {formData.abilities.map((ability, index) => (
          <input
            key={index}
            type="text"
            className={styles.fieldInput}
            value={ability}
            onChange={(e) => handleAbilitiesChange(index, e.target.value)}
            placeholder={`Ability ${index + 1}...`}
            style={{ marginTop: index > 0 ? '0.5rem' : 0 }}
          />
        ))}
        {formData.abilities.length < 5 && (
          <button
            type="button"
            className={styles.addButton}
            onClick={addAbility}
          >
            + Add Ability
          </button>
        )}
      </div>

      <div className={styles.divider} />

      {/* Parameter Cluster Section - with soft yellow border */}
      <div className={styles.parameterCluster}>
        {/* Phase State & Manifold Curvature Row */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldPrefix}>▸</span>
              Phase State
            </label>
            <PhaseStateDropdown
              value={formData.phaseState}
              onChange={(value) => onChange({ phaseState: value as EntityFormData['phaseState'] })}
              placeholder="Select phase state..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldPrefix}>▸</span>
              Manifold Curvature
            </label>
            <ManifoldCurvatureDropdown
              value={formData.manifoldCurvature}
              onChange={(value) => onChange({ manifoldCurvature: value as EntityFormData['manifoldCurvature'] })}
              placeholder="Select curvature..."
            />
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

        {/* Superposition */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Superposition
          </label>
          <div className={styles.sliderWrap}>
            <input
              type="range"
              className={styles.slider}
              min="-1"
              max="1"
              step="0.01"
              value={formData.superposition ?? formData.coordinates.alterity}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                onChange({ 
                  superposition: value,
                  coordinates: {
                    ...formData.coordinates,
                    alterity: value, // Sync with coordinates for animation
                  }
                });
              }}
            />
            <span className={styles.sliderValue}>
              {(formData.superposition ?? formData.coordinates.alterity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Embedding Signature */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className={styles.fieldPrefix}>▸</span>
            Embedding Signature
          </label>
          <div className={styles.sliderWrap}>
            <input
              type="range"
              className={styles.slider}
              min="-1"
              max="1"
              step="0.01"
              value={formData.embeddingSignature ?? formData.coordinates.dynamics}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                onChange({ 
                  embeddingSignature: value,
                  coordinates: {
                    ...formData.coordinates,
                    dynamics: value, // Sync with coordinates for animation
                  }
                });
              }}
            />
            <span className={styles.sliderValue}>
              {(formData.embeddingSignature ?? formData.coordinates.dynamics).toFixed(2)}
            </span>
          </div>
        </div>

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
      </div>

      <div className={styles.divider} />

      {/* MidJourney Parameters - Collapsible Section */}
      <div className={styles.fieldGroup}>
        <button
          type="button"
          onClick={() => setIsMidjourneyOpen(!isMidjourneyOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            padding: '0.5rem 0',
            cursor: 'pointer',
            color: 'rgba(236, 227, 214, 0.7)',
            fontFamily: 'var(--font-mono, "PT Mono", monospace)',
            fontSize: '0.5625rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(236, 227, 214, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(236, 227, 214, 0.7)';
          }}
        >
          <span>
            <span className={styles.fieldPrefix}>▸</span> MidJourney Parameters
          </span>
          <span style={{ fontSize: '0.5rem' }}>
            {isMidjourneyOpen ? '▼' : '▶'}
          </span>
        </button>

        {isMidjourneyOpen && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                value={midjourneyInput}
                onChange={(e) => {
                  setMidjourneyInput(e.target.value);
                  handleMidjourneyChange(e.target.value);
                }}
                placeholder="Paste full MidJourney prompt here..."
                rows={4}
                style={{ fontFamily: 'var(--font-mono, "PT Mono", monospace)', fontSize: '0.75rem', width: '100%' }}
              />
              <button
                type="button"
                onClick={handleExtractMidjourney}
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.5rem 1rem',
                  background: 'rgba(202, 165, 84, 0.1)',
                  border: '1px solid rgba(202, 165, 84, 0.3)',
                  color: '#CAA554',
                  fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                  fontSize: '0.625rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(202, 165, 84, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(202, 165, 84, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.3)';
                }}
              >
                Extract
              </button>
            </div>

            {/* Display parsed components - only show after extraction */}
            {formData.midjourneyPrompt && parsedMidjourney && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(236, 227, 214, 0.05)',
                border: '1px solid rgba(236, 227, 214, 0.1)',
                borderRadius: '2px',
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                color: 'rgba(236, 227, 214, 0.5)',
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'rgba(236, 227, 214, 0.7)', fontSize: '0.625rem' }}>
                  Parsed Components:
                </div>
                {parsedMidjourney.sref && (
                  <div style={{ fontSize: '0.625rem' }}>--sref: {parsedMidjourney.sref}</div>
                )}
                {parsedMidjourney.profile && (
                  <div style={{ fontSize: '0.625rem' }}>--profile: {parsedMidjourney.profile}</div>
                )}
                {parsedMidjourney.stylization !== undefined && (
                  <div style={{ fontSize: '0.625rem' }}>--s: {parsedMidjourney.stylization}</div>
                )}
                {parsedMidjourney.styleWeight !== undefined && (
                  <div style={{ fontSize: '0.625rem' }}>--sw: {parsedMidjourney.styleWeight}</div>
                )}
                {!parsedMidjourney.sref && !parsedMidjourney.profile && 
                 parsedMidjourney.stylization === undefined && 
                 parsedMidjourney.styleWeight === undefined && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.625rem' }}>No parameters detected</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

