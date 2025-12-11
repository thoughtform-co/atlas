'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EntityCardPreview } from '@/components/admin/EntityCardPreview';
import { ParameterForm } from '@/components/admin/ParameterForm';
import { ArchivistChat } from '@/components/admin/ArchivistChat';
import { EntityFormData } from '@/app/admin/new-entity/page';
import { getMediaPublicUrl, deleteDenizenMedia } from '@/lib/media';
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
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
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
  const handleMediaAnalyzed = async (analysisResult: Partial<EntityFormData> & { visualNotes?: string }) => {
    const { visualNotes, ...entityData } = analysisResult;
    setFormData(prev => ({ ...prev, ...entityData }));
    if (visualNotes) {
      setAnalysisNotes(visualNotes);
    }

    // If thumbnail was uploaded, save it immediately to database so it appears in ConstellationView
    // WHY: Thumbnails should update in the constellation view immediately when media is replaced,
    // not just when the entity is saved
    if (entityData.thumbnailUrl || entityData.mediaUrl) {
      try {
        const updatePayload: { thumbnail?: string; image?: string } = {};
        
        if (entityData.thumbnailUrl) {
          updatePayload.thumbnail = entityData.thumbnailUrl;
          console.log('[EditPage] Updating thumbnail:', entityData.thumbnailUrl);
        }
        
        if (entityData.mediaUrl) {
          updatePayload.image = entityData.mediaUrl;
          console.log('[EditPage] Updating image:', entityData.mediaUrl);
        }

        const response = await fetch(`/api/admin/denizens/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // #region agent log
          if (typeof window !== 'undefined') {
            const logData = {location:'edit/[id]/page.tsx:202',message:'Database update failed',data:{error:errorData,payload:updatePayload},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'};
            console.log('[DEBUG]', logData);
            fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
          }
          // #endregion
          console.warn('[EditPage] Failed to update thumbnail/image immediately:', errorData);
        } else {
          const result = await response.json();
          // #region agent log
          if (typeof window !== 'undefined') {
            const logData = {location:'edit/[id]/page.tsx:207',message:'Database update success',data:{savedThumbnail:result.data?.thumbnail,savedImage:result.data?.image,payload:updatePayload},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'};
            console.log('[DEBUG]', logData);
            fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
          }
          // #endregion
          console.log('[EditPage] Thumbnail/image updated in database:', result.data?.thumbnail, result.data?.image);
          
          // Revalidate the home page so ConstellationView shows the updated thumbnail
          // WHY: The home page is server-rendered, so we need to invalidate its cache
          try {
            // #region agent log
            if (typeof window !== 'undefined') {
              const logData = {location:'edit/[id]/page.tsx:212',message:'Calling revalidate API',data:{thumbnailUrl:entityData.thumbnailUrl,imageUrl:entityData.mediaUrl,denizenId:id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'};
              console.log('[DEBUG]', logData);
              fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
            }
            // #endregion
            const revalidateResponse = await fetch('/api/revalidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: '/' }),
            });
            // #region agent log
            if (typeof window !== 'undefined') {
              const logData = {location:'edit/[id]/page.tsx:220',message:'Revalidate API response',data:{ok:revalidateResponse.ok,status:revalidateResponse.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'};
              console.log('[DEBUG]', logData);
              fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
            }
            // #endregion
            if (revalidateResponse.ok) {
              const revalidateResult = await revalidateResponse.json();
              // #region agent log
              if (typeof window !== 'undefined') {
                const logData = {location:'edit/[id]/page.tsx:225',message:'Revalidate API success',data:revalidateResult,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'};
                console.log('[DEBUG]', logData);
                fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
              }
              // #endregion
              console.log('[EditPage] Home page cache revalidated');
            } else {
              const errorData = await revalidateResponse.json();
              // #region agent log
              if (typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit/[id]/page.tsx:232',message:'Revalidate API failed',data:errorData,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
              }
              // #endregion
              console.warn('[EditPage] Failed to revalidate home page cache');
            }
          } catch (revalidateError) {
            // #region agent log
            if (typeof window !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit/[id]/page.tsx:238',message:'Revalidate API exception',data:{error:revalidateError instanceof Error ? revalidateError.message : String(revalidateError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
            }
            // #endregion
            console.warn('[EditPage] Error revalidating cache:', revalidateError);
            // Don't throw - cache revalidation is nice-to-have, not critical
          }
        }
      } catch (error) {
        console.error('[EditPage] Error updating thumbnail/image:', error);
        // Don't throw - this is a background update, main upload already succeeded
      }
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

  // Handle additional media deletion
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    setDeletingMediaId(mediaId);
    try {
      const success = await deleteDenizenMedia(mediaId);
      if (success) {
        // Reload additional media list
        const media = await fetchDenizenMedia(id);
        const additional = media
          .filter(m => m.mediaType !== 'thumbnail' && !m.isPrimary)
          .map(m => ({
            id: m.id,
            url: getMediaPublicUrl(m.storagePath) || '',
            type: (m.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
            fileName: m.fileName,
          }));
        setAdditionalMedia(additional);
      } else {
        alert('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Error deleting media');
    } finally {
      setDeletingMediaId(null);
    }
  };

  // Handle additional media replace (delete old, trigger upload)
  const handleReplaceMedia = async (mediaId: string) => {
    if (!confirm('Replace this media? The old file will be deleted.')) return;
    
    // Delete the old media first
    await handleDeleteMedia(mediaId);
    
    // Trigger file input for new upload
    fileInputRef.current?.click();
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
            skipAnalysis={true}
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
          </div>

          {/* Additional Media Preview */}
          {additionalMedia.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.75rem',
              }}>
                {additionalMedia.map((media) => (
                  <div
                    key={media.id}
                    style={{
                      aspectRatio: '4/5',
                      border: '1px solid rgba(236, 227, 214, 0.1)',
                      background: 'rgba(236, 227, 214, 0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '2px',
                    }}
                  >
                    {media.type === 'video' ? (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        style={{ opacity: 0.8 }}
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt={media.fileName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: 0.8,
                        }}
                      />
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(5, 4, 3, 0.8), transparent)',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.4rem',
                      color: 'rgba(236, 227, 214, 0.6)',
                      fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {media.fileName}
                    </div>
                    {/* Delete and Replace buttons */}
                    <div style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.25rem',
                      display: 'flex',
                      gap: '0.25rem',
                    }}>
                      <button
                        onClick={() => handleReplaceMedia(media.id)}
                        disabled={deletingMediaId === media.id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.4rem',
                          background: 'rgba(236, 227, 214, 0.1)',
                          border: '1px solid rgba(236, 227, 214, 0.2)',
                          color: 'rgba(236, 227, 214, 0.8)',
                          cursor: deletingMediaId === media.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                          opacity: deletingMediaId === media.id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (deletingMediaId !== media.id) {
                            e.currentTarget.style.background = 'rgba(236, 227, 214, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(236, 227, 214, 0.1)';
                        }}
                      >
                        REPLACE
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(media.id)}
                        disabled={deletingMediaId === media.id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.4rem',
                          background: 'rgba(193, 127, 89, 0.2)',
                          border: '1px solid rgba(193, 127, 89, 0.4)',
                          color: 'rgba(236, 227, 214, 0.8)',
                          cursor: deletingMediaId === media.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono, "PT Mono", monospace)',
                          opacity: deletingMediaId === media.id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (deletingMediaId !== media.id) {
                            e.currentTarget.style.background = 'rgba(193, 127, 89, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(193, 127, 89, 0.2)';
                        }}
                      >
                        {deletingMediaId === media.id ? '...' : 'DELETE'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

