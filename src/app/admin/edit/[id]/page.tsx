'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EntityCardPreview } from '@/components/admin/EntityCardPreview';
import { ParameterForm } from '@/components/admin/ParameterForm';
import { ArchivistChat } from '@/components/admin/ArchivistChat';
import { EntityFormData } from '@/app/admin/new-entity/page';
import { getMediaPublicUrl } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { fetchDenizenMedia } from '@/lib/media';
import { Database } from '@/lib/database.types';
import styles from '../../new-entity/page.module.css';

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

interface EditEntityPageProps {
  params: Promise<{ id: string }>;
}

export default function EditEntityPage({ params }: EditEntityPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin, isAuthenticated, loading, roleLoading } = useAuth();
  const [formData, setFormData] = useState<EntityFormData>(defaultFormData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisNotes, setAnalysisNotes] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadMediaError, setUploadMediaError] = useState<string | null>(null);
  const [additionalMedia, setAdditionalMedia] = useState<Array<{ id: string; url: string; type: 'image' | 'video'; fileName: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect non-admins (wait for role)
  useEffect(() => {
    if (loading || roleLoading) return;
    if (!isAuthenticated || !isAdmin) {
      router.push('/');
    }
  }, [loading, roleLoading, isAuthenticated, isAdmin, router]);

  // Load existing denizen data
  useEffect(() => {
    if (loading || roleLoading || !isAuthenticated || !isAdmin) return;
    
    const loadDenizen = async () => {
      try {
        const response = await fetch(`/api/admin/denizens/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load entity');
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Entity not found');
        }

        const denizen = result.data;
        
        // Helper to convert storage paths to public URLs
        const resolveUrl = (path: string | undefined | null): string | undefined => {
          if (!path) return undefined;
          if (path.startsWith('http://') || path.startsWith('https://')) return path;
          return getMediaPublicUrl(path) || undefined;
        };
        
        // Get the primary media URL (prefer video/image from media array, then image field)
        const primaryMedia = denizen.media?.[0];
        const rawMediaUrl = primaryMedia?.storagePath || denizen.image;
        
        // Map denizen data to form data
        setFormData({
          name: denizen.name || '',
          subtitle: denizen.subtitle || '',
          type: denizen.type || 'Guardian',
          allegiance: denizen.allegiance || 'Unaligned',
          threatLevel: denizen.threatLevel || 'Cautious',
          domain: denizen.domain || '',
          description: denizen.description || '',
          lore: denizen.lore || '',
          features: denizen.features || [],
          phaseState: denizen.phaseState || 'Liminal',
          hallucinationIndex: denizen.hallucinationIndex ?? 0.5,
          manifoldCurvature: getCurvatureLabel(denizen.manifoldCurvature ?? 0.5),
          coordinates: {
            geometry: denizen.coordinates?.geometry ?? 0,
            alterity: denizen.coordinates?.alterity ?? 0,
            dynamics: denizen.coordinates?.dynamics ?? 0,
          },
          glyphs: denizen.glyphs || '◆●∇⊗',
          mediaUrl: resolveUrl(rawMediaUrl),
          mediaMimeType: primaryMedia?.mimeType || (rawMediaUrl?.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : undefined),
          thumbnailUrl: resolveUrl(denizen.thumbnail),
        });
      } catch (error) {
        console.error('Error loading entity:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load entity');
      } finally {
        setIsLoading(false);
      }
    };

    loadDenizen();
  }, [id, loading, roleLoading, isAuthenticated, isAdmin]);

  // Load additional media for preview
  useEffect(() => {
    if (!id || loading || roleLoading || !isAuthenticated || !isAdmin) return;

    const loadAdditionalMedia = async () => {
      try {
        const media = await fetchDenizenMedia(id);
        // Filter out thumbnails and primary media - only show additional media
        const additional = media
          .filter(m => m.mediaType !== 'thumbnail' && !m.isPrimary)
          .map(m => ({
            id: m.id,
            url: getMediaPublicUrl(m.storagePath) || '',
            type: (m.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
            fileName: m.fileName,
          }));
        setAdditionalMedia(additional);
      } catch (error) {
        console.error('Error loading additional media:', error);
        setAdditionalMedia([]);
      }
    };

    loadAdditionalMedia();
  }, [id, loading, roleLoading, isAuthenticated, isAdmin]);

  // Convert curvature value to label
  const getCurvatureLabel = (value: number): 'Stable' | 'Moderate' | 'Severe' | 'Critical' => {
    if (value <= 0.3) return 'Stable';
    if (value <= 0.6) return 'Moderate';
    if (value <= 0.85) return 'Severe';
    return 'Critical';
  };

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

  // Handle update to database
  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/denizens/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          subtitle: formData.subtitle || null,
          type: formData.type,
          allegiance: formData.allegiance,
          threatLevel: formData.threatLevel,
          domain: formData.domain,
          description: formData.description,
          lore: formData.lore || null,
          features: formData.features.length > 0 ? formData.features : null,
          phaseState: formData.phaseState,
          hallucinationIndex: formData.hallucinationIndex,
          manifoldCurvature: getCurvatureValue(formData.manifoldCurvature),
          coordinates: {
            geometry: formData.coordinates.geometry,
            alterity: formData.coordinates.alterity,
            dynamics: formData.coordinates.dynamics,
          },
          glyphs: formData.glyphs,
          image: formData.mediaUrl || null,
          thumbnail: formData.thumbnailUrl || null,
        }),
      });

      if (response.ok) {
        router.push('/archive');
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update entity');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle additional media upload (for multiple media per entity)
  // WHY: This allows adding extra images/videos after entity creation, similar to DenizenModalV3
  // Sentinel: Null check narrowing - capture supabase and id in const before await
  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const client = supabase;
    const entityId = id;
    if (!client || !entityId || !e.target.files?.length) return;
    
    setIsUploadingMedia(true);
    setUploadMediaError(null);

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${entityId}/${Date.now()}.${fileExt}`;

    try {
      // Upload to storage
      const { error: uploadError } = await client.storage
        .from('denizen-media')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      // Get existing media count to set display_order
      // Sentinel: Null check narrowing - capture result before await
      const existingMedia = await fetchDenizenMedia(entityId);
      const existingMediaCount = existingMedia.filter(m => m.mediaType !== 'thumbnail').length;
      
      // Insert media record
      type DenizenMediaInsert = Database['public']['Tables']['denizen_media']['Insert'];
      const mediaInsert: DenizenMediaInsert = {
        denizen_id: entityId,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        storage_path: fileName,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: existingMediaCount,
        is_primary: false, // Additional media is never primary
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (client as any).from('denizen_media').insert(mediaInsert);
      if (dbError) throw dbError;

      // Reload additional media for preview
      const media = await fetchDenizenMedia(entityId);
      const additional = media
        .filter(m => m.mediaType !== 'thumbnail' && !m.isPrimary)
        .map(m => ({
          id: m.id,
          url: getMediaPublicUrl(m.storagePath) || '',
          type: (m.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
          fileName: m.fileName,
        }));
      setAdditionalMedia(additional);

      // Show success message
      alert('Media added successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadMediaError(errorMessage);
      alert(`Failed to add media: ${errorMessage}`);
    } finally {
      setIsUploadingMedia(false);
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
  if (loading || roleLoading || isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>
          {isLoading ? 'LOADING ENTITY...' : 'INITIALIZING...'}
        </span>
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

  // Load error
  if (loadError) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>ERROR: {loadError}</span>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerPrefix}>//</span>
        <span className={styles.headerTitle}>Edit Entity: {formData.name}</span>
        <div className={styles.headerLine} />
        <button 
          className={styles.saveButton}
          onClick={handleUpdate}
          disabled={isSaving || !formData.name}
        >
          {isSaving ? 'UPDATING...' : 'UPDATE ARCHIVE'}
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
          
          {/* Add Media button for additional media */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleAddMedia}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingMedia}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(236, 227, 214, 0.1)',
                border: '1px solid rgba(236, 227, 214, 0.2)',
                color: 'rgba(236, 227, 214, 0.8)',
                fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                fontSize: '0.5625rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: isUploadingMedia ? 'wait' : 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isUploadingMedia) {
                  e.currentTarget.style.background = 'rgba(236, 227, 214, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploadingMedia) {
                  e.currentTarget.style.background = 'rgba(236, 227, 214, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.2)';
                }
              }}
            >
              {isUploadingMedia ? 'UPLOADING...' : '+ ADD MEDIA'}
            </button>
            {uploadMediaError && (
              <span style={{ 
                fontSize: '0.5rem', 
                color: 'rgba(193, 127, 89, 0.8)',
                fontFamily: 'var(--font-mono, "PT Mono", monospace)',
              }}>
                {uploadMediaError}
              </span>
            )}
            <span style={{ 
              fontSize: '0.5rem', 
              color: 'rgba(236, 227, 214, 0.4)',
              fontFamily: 'var(--font-mono, "PT Mono", monospace)',
            }}>
              Additional media will appear in the modal view
            </span>
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

