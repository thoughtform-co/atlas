'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EntityCardPreview } from '@/components/admin/EntityCardPreview';
import { ParameterForm } from '@/components/admin/ParameterForm';
import { ArchivistChat } from '@/components/admin/ArchivistChat';
import { MediaUploadZone } from '@/components/admin/MediaUploadZone';
import styles from './page.module.css';

// Entity form data type
export interface EntityFormData {
  domain: string;
  entityClass: string;  // Entity class (e.g., "Eigensage", "Nullseer")
  type: 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';
  subtitle: string;
  description: string;
  allegiance: 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';
  abilities: string[];  // Renamed from features
  phaseState: 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized';
  hallucinationIndex: number;
  manifoldCurvature: 'Stable' | 'Moderate' | 'Severe' | 'Critical';
  superposition?: number;  // 0-1 range, controls SuperpositionCanvas animation
  embeddingSignature?: number;  // 0-1 range, controls SpectralCanvas animation
  coordinates: {
    geometry: number;
    alterity: number;
    dynamics: number;
  };
  mediaUrl?: string;
  mediaMimeType?: string;
  thumbnailUrl?: string; // For video thumbnails
  // MidJourney parameters
  midjourneyPrompt?: string;
  midjourneySref?: string;
  midjourneyProfile?: string;
  midjourneyStylization?: number;
  midjourneyStyleWeight?: number;
}

// Default form values
const defaultFormData: EntityFormData = {
  domain: '',
  entityClass: '',
  type: 'Guardian',
  subtitle: '',
  description: '',
  allegiance: 'Unaligned',
  abilities: [],
  phaseState: 'Liminal',
  hallucinationIndex: 0.5,
  manifoldCurvature: 'Moderate',
  superposition: undefined,
  embeddingSignature: undefined,
  coordinates: {
    geometry: 0,
    alterity: 0,
    dynamics: 0,
  },
};

export default function NewEntityPage() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, loading, roleLoading } = useAuth();
  const [formData, setFormData] = useState<EntityFormData>(defaultFormData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState<string>('');

  // Redirect non-admins (wait for role)
  useEffect(() => {
    if (loading || roleLoading) return;
    if (!isAuthenticated || !isAdmin) {
      router.push('/');
    }
  }, [loading, roleLoading, isAuthenticated, isAdmin, router]);

  // Handle form field changes
  const handleFormChange = (updates: Partial<EntityFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle media upload and analysis
  const handleMediaAnalyzed = (analysisResult: Partial<EntityFormData> & { visualNotes?: string }) => {
    const { visualNotes, ...entityData } = analysisResult;
    setFormData(prev => ({ ...prev, ...entityData }));
    if (visualNotes) {
      setAnalysisNotes(visualNotes);
    }
  };

  // Handle save to database
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/denizens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.entityClass || 'Unnamed',
          subtitle: formData.subtitle || null,
          type: formData.type,
          entity_class: formData.entityClass || null,
          allegiance: formData.allegiance,
          domain: formData.domain,
          description: formData.description,
          features: formData.abilities.length > 0 ? formData.abilities : null,
          phase_state: formData.phaseState,
          hallucination_index: formData.hallucinationIndex,
          manifold_curvature: getCurvatureValue(formData.manifoldCurvature),
          coord_geometry: formData.coordinates.geometry,
          coord_alterity: formData.coordinates.alterity,
          coord_dynamics: formData.coordinates.dynamics,
          image: formData.mediaUrl || null,
          thumbnail: formData.thumbnailUrl || null, // Video thumbnail
          midjourney_prompt: formData.midjourneyPrompt || null,
          midjourney_sref: formData.midjourneySref || null,
          midjourney_profile: formData.midjourneyProfile || null,
          midjourney_stylization: formData.midjourneyStylization || null,
          midjourney_style_weight: formData.midjourneyStyleWeight || null,
          // Store metaphysical properties if provided
          ...(formData.superposition !== undefined && { superposition_value: formData.superposition }),
          ...(formData.embeddingSignature !== undefined && { embedding_signature_value: formData.embeddingSignature }),
          // Position centered at (0,0) and spread based on coordinates
          // Coordinates range from -1 to 1, map to pixel positions around center
          position_x: formData.coordinates.geometry * 250,
          position_y: formData.coordinates.alterity * 200,
        }),
      });

      if (response.ok) {
        router.push('/archive');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save entity');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert curvature string to numeric value
  const getCurvatureValue = (curvature: string): number => {
    const map: Record<string, number> = {
      'Stable': 0.2,
      'Moderate': 0.5,
      'Severe': 0.8,
      'Critical': 1.0,
    };
    return map[curvature] ?? 0.5;
  };

  // Loading state
  if (loading || roleLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>INITIALIZING...</span>
      </div>
    );
  }

  // Access denied (will redirect)
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>ACCESS DENIED</span>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerPrefix}>//</span>
        <span className={styles.headerTitle}>Catalog New Entity</span>
        <div className={styles.headerLine} />
        <button 
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSaving || !formData.entityClass || !formData.domain}
        >
          {isSaving ? 'SAVING...' : 'SAVE TO ARCHIVE'}
        </button>
      </div>

      {/* Three-column layout */}
      <div className={styles.threeCol}>
        {/* Left: Card Preview with embedded upload */}
        <div className={styles.cardColumn}>
          <EntityCardPreview
            formData={formData}
            onMediaAnalyzed={handleMediaAnalyzed}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            onClearMedia={() =>
              setFormData(prev => ({ ...prev, mediaUrl: undefined, mediaMimeType: undefined }))
            }
          />
          
          {/* Note about additional media */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem',
            background: 'rgba(236, 227, 214, 0.05)',
            border: '1px solid rgba(236, 227, 214, 0.1)',
            fontSize: '0.5rem',
            color: 'rgba(236, 227, 214, 0.5)',
            fontFamily: 'var(--font-mono, "PT Mono", monospace)',
            letterSpacing: '0.05em',
            lineHeight: '1.4',
          }}>
            <div style={{ marginBottom: '0.25rem', color: 'rgba(236, 227, 214, 0.6)' }}>
              NOTE: Additional media can be added after saving the entity.
            </div>
            <div style={{ fontSize: '0.45rem', color: 'rgba(236, 227, 214, 0.4)' }}>
              Click on the entity card in the Atlas view to open the modal and use the "Add Media" button.
            </div>
          </div>
        </div>

        {/* Middle: Parameter Form */}
        <div className={styles.formColumn}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>// Parameter Configuration</span>
            </div>
            
            {/* Parameter Form */}
            <ParameterForm
              formData={formData}
              onChange={handleFormChange}
            />
          </div>
        </div>

        {/* Right: Archivist Chat */}
        <div className={styles.chatColumn}>
          <ArchivistChat
            formData={formData}
            onApplyField={handleFormChange}
            analysisNotes={analysisNotes}
          />
        </div>
      </div>
    </main>
  );
}

