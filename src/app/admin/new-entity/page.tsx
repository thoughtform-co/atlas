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
  name: string;
  subtitle: string;
  type: 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';
  allegiance: 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';
  threatLevel: 'Benign' | 'Cautious' | 'Volatile' | 'Existential';
  domain: string;
  description: string;
  lore: string;
  features: string[];
  phaseState: 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized';
  hallucinationIndex: number;
  manifoldCurvature: 'Stable' | 'Moderate' | 'Severe' | 'Critical';
  coordinates: {
    geometry: number;
    alterity: number;
    dynamics: number;
  };
  glyphs: string;
  mediaUrl?: string;
  mediaMimeType?: string;
}

// Default form values
const defaultFormData: EntityFormData = {
  name: '',
  subtitle: '',
  type: 'Guardian',
  allegiance: 'Unaligned',
  threatLevel: 'Cautious',
  domain: '',
  description: '',
  lore: '',
  features: [],
  phaseState: 'Liminal',
  hallucinationIndex: 0.5,
  manifoldCurvature: 'Moderate',
  coordinates: {
    geometry: 0,
    alterity: 0,
    dynamics: 0,
  },
  glyphs: '◆●∇⊗',
};

export default function NewEntityPage() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, loading, roleLoading } = useAuth();
  const [formData, setFormData] = useState<EntityFormData>(defaultFormData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState<string>('');

  // Redirect non-admins - wait for BOTH auth AND role to load
  useEffect(() => {
    const isFullyLoaded = !loading && !roleLoading;
    if (isFullyLoaded && !isAuthenticated) {
      router.push('/');
    } else if (isFullyLoaded && !isAdmin) {
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
          name: formData.name,
          subtitle: formData.subtitle || null,
          type: formData.type,
          allegiance: formData.allegiance,
          threat_level: formData.threatLevel,
          domain: formData.domain,
          description: formData.description,
          lore: formData.lore || null,
          features: formData.features.length > 0 ? formData.features : null,
          phase_state: formData.phaseState,
          hallucination_index: formData.hallucinationIndex,
          manifold_curvature: getCurvatureValue(formData.manifoldCurvature),
          coord_geometry: formData.coordinates.geometry,
          coord_alterity: formData.coordinates.alterity,
          coord_dynamics: formData.coordinates.dynamics,
          glyphs: formData.glyphs,
          image: formData.mediaUrl || null,
          // Position will be auto-calculated from coordinates
          position_x: formData.coordinates.geometry * 500 + 500,
          position_y: formData.coordinates.alterity * 400 + 400,
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
  if (loading) {
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
          disabled={isSaving || !formData.name}
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

